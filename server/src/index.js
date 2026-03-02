import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const CLIENT_ORIGIN_RAW = process.env.CLIENT_ORIGIN || "*";
const CLIENT_ORIGIN = CLIENT_ORIGIN_RAW.includes(",")
  ? CLIENT_ORIGIN_RAW.split(",").map((s) => s.trim()).filter(Boolean)
  : CLIENT_ORIGIN_RAW;

const app = express();
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: CLIENT_ORIGIN !== "*"
  })
);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    port: PORT,
    clientOrigin: CLIENT_ORIGIN_RAW
  });
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
    credentials: CLIENT_ORIGIN !== "*"
  }
});

const WIN_TAPS = process.env.WIN_TAPS ? Number(process.env.WIN_TAPS) : 20;
const WIN_THRESHOLD = process.env.WIN_THRESHOLD
  ? Number(process.env.WIN_THRESHOLD)
  : 0.80;
const TAP_COOLDOWN_MS = process.env.TAP_COOLDOWN_MS
  ? Number(process.env.TAP_COOLDOWN_MS)
  : 60;

/**
 * Authoritative room state:
 * - offset: positive means playerA is winning, negative means playerB is winning
 * - winner: "A" | "B" | null
 */
const rooms = new Map();

function makeRoomState(roomId) {
  return {
    roomId,
    players: {
      A: { socketId: null, name: null, avatar: null, taps: 0, lastTapAt: 0 },
      B: { socketId: null, name: null, avatar: null, taps: 0, lastTapAt: 0 }
    },
    offset: 0,
    status: "waiting", // waiting | countdown | playing | finished
    countdown: null,
    winner: null
  };
}

function emitStateToRoom(roomId, state) {
  io.to(roomId).emit("state", publicState(state, null));
  if (state.players.A.socketId) {
    io.to(state.players.A.socketId).emit("state", publicState(state, "A"));
  }
  if (state.players.B.socketId) {
    io.to(state.players.B.socketId).emit("state", publicState(state, "B"));
  }
}

function publicState(state, seat) {
  return {
    roomId: state.roomId,
    status: state.status,
    countdown: state.countdown,
    winner: state.winner,
    winTaps: WIN_TAPS,
    winThreshold: WIN_THRESHOLD,
    offset: state.offset,
    yourSeat: seat, // tell client which player they are
    players: {
      A: {
        taps: state.players.A.taps,
        connected: Boolean(state.players.A.socketId),
        name: state.players.A.name,
        avatar: state.players.A.avatar
      },
      B: {
        taps: state.players.B.taps,
        connected: Boolean(state.players.B.socketId),
        name: state.players.B.name,
        avatar: state.players.B.avatar
      }
    }
  };
}

function normalizeAvatar(avatar) {
  if (!avatar) return null;
  const s = String(avatar);
  // allow data URLs only (simple & no storage)
  if (!s.startsWith("data:image/")) return null;
  // basic size guard (~180kb chars)
  if (s.length > 180_000) return null;
  return s;
}

function normalizeName(name) {
  const n = String(name || "").trim();
  if (!n) return null;
  return n.slice(0, 18);
}

function generateRoomId() {
  return Math.random().toString(16).slice(2, 6).toUpperCase();
}

function normalizeRoomId(roomId) {
  return String(roomId || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 4);
}

function assignSeat(state, socketId) {
  if (!state.players.A.socketId) {
    state.players.A.socketId = socketId;
    return "A";
  }
  if (!state.players.B.socketId) {
    state.players.B.socketId = socketId;
    return "B";
  }
  return null;
}

function bothPlayersConnected(state) {
  return Boolean(state.players.A.socketId && state.players.B.socketId);
}

function resetMatch(state) {
  state.players.A.taps = 0;
  state.players.B.taps = 0;
  state.players.A.lastTapAt = 0;
  state.players.B.lastTapAt = 0;
  state.offset = 0;
  state.winner = null;
  state.status = bothPlayersConnected(state) ? "countdown" : "waiting";
  state.countdown = state.status === "countdown" ? 3 : null;
}

function startCountdown(roomId, state, seat) {
  if (!bothPlayersConnected(state)) return;
  state.status = "countdown";
  state.countdown = 3;
  emitStateToRoom(roomId, state);

  const interval = setInterval(() => {
    const current = rooms.get(roomId);
    if (!current) {
      clearInterval(interval);
      return;
    }
    if (current.status !== "countdown") {
      clearInterval(interval);
      return;
    }
    current.countdown -= 1;
    if (current.countdown <= 0) {
      current.countdown = null;
      current.status = "playing";
      emitStateToRoom(roomId, current);
      clearInterval(interval);
      return;
    }
    emitStateToRoom(roomId, current);
  }, 1000);
}

function getSeatBySocket(state, socketId) {
  if (state.players.A.socketId === socketId) return "A";
  if (state.players.B.socketId === socketId) return "B";
  return null;
}

function maybeFinish(state) {
  const thresholdSteps = Math.max(1, Math.ceil(WIN_TAPS * WIN_THRESHOLD));
  if (state.offset <= -thresholdSteps) {
    state.status = "finished";
    state.winner = "A";
    return true;
  }
  if (state.offset >= thresholdSteps) {
    state.status = "finished";
    state.winner = "B";
    return true;
  }
  return false;
}

io.on("connection", (socket) => {
  // eslint-disable-next-line no-console
  console.log("socket_connected", {
    id: socket.id,
    origin: socket.handshake.headers?.origin
  });

  socket.on("create_room", (payload) => {
    // eslint-disable-next-line no-console
    console.log("create_room", {
      socketId: socket.id,
      hasExistingRoom: Boolean(socket.data.roomId),
      nameLen: String(payload?.name || "").length,
      avatarLen: payload?.avatar ? String(payload.avatar).length : 0
    });
    const existingRoomId = socket.data.roomId;
    if (existingRoomId) {
      socket.emit("error_message", "You are already in a room");
      return;
    }

    let roomId = normalizeRoomId(generateRoomId());
    while (rooms.has(roomId)) roomId = normalizeRoomId(generateRoomId());

    const state = makeRoomState(roomId);
    rooms.set(roomId, state);

    const seat = assignSeat(state, socket.id);
    state.players[seat].name = normalizeName(payload?.name) || "Player A";
    state.players[seat].avatar = normalizeAvatar(payload?.avatar);

    // eslint-disable-next-line no-console
    console.log("room_created", { roomId, seat, socketId: socket.id });
    socket.data.roomId = roomId;
    socket.data.seat = seat;
    socket.join(roomId);

    socket.emit("room_created", { roomId });
    emitStateToRoom(roomId, state);
  });

  socket.on("join_room", (payload) => {
    // eslint-disable-next-line no-console
    console.log("join_room", {
      socketId: socket.id,
      hasExistingRoom: Boolean(socket.data.roomId),
      roomId: payload?.roomId,
      nameLen: String(payload?.name || "").length,
      avatarLen: payload?.avatar ? String(payload.avatar).length : 0
    });
    const existingRoomId = socket.data.roomId;
    if (existingRoomId) {
      socket.emit("error_message", "You are already in a room");
      return;
    }

    const roomId = normalizeRoomId(payload?.roomId);
    if (!roomId) {
      socket.emit("error_message", "Enter a room id");
      return;
    }

    const state = rooms.get(roomId);
    if (!state) {
      socket.emit("error_message", "Room not found");
      return;
    }

    const seat = assignSeat(state, socket.id);
    if (!seat) {
      socket.emit("error_message", "Room is full");
      return;
    }

    state.players[seat].name =
      normalizeName(payload?.name) || (seat === "A" ? "Player A" : "Player B");
    const avatar = normalizeAvatar(payload?.avatar);
    if (avatar) state.players[seat].avatar = avatar;

    socket.data.roomId = roomId;
    socket.data.seat = seat;
    socket.join(roomId);

    emitStateToRoom(roomId, state);

    if (bothPlayersConnected(state)) {
      startCountdown(roomId, state, seat);
    }
  });

  socket.on("tap", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const state = rooms.get(roomId);
    if (!state) return;
    if (state.status !== "playing") return;

    const seat = getSeatBySocket(state, socket.id);
    if (!seat) return;

    const player = state.players[seat];
    const now = Date.now();
    if (now - player.lastTapAt < TAP_COOLDOWN_MS) return;
    player.lastTapAt = now;

    player.taps += 1;
    // A is on LEFT side - when A taps, pull rope LEFT (offset -= 1)
    // B is on RIGHT side - when B taps, pull rope RIGHT (offset += 1)
    state.offset += seat === "A" ? -1 : 1;

    if (maybeFinish(state)) {
      // eslint-disable-next-line no-console
      console.log("match_finished", { roomId, winner: state.winner, offset: state.offset });
      emitStateToRoom(roomId, state);
      return;
    }

    emitStateToRoom(roomId, state);
  });

  socket.on("restart", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const state = rooms.get(roomId);
    if (!state) return;

    resetMatch(state);
    // eslint-disable-next-line no-console
    console.log("match_restart", { roomId });
    emitStateToRoom(roomId, state);

    if (state.status === "countdown") {
      startCountdown(roomId, state);
    }
  });

  socket.on("disconnect", () => {
    // eslint-disable-next-line no-console
    console.log("socket_disconnected", { id: socket.id, roomId: socket.data.roomId });
    const roomId = socket.data.roomId;
    const seat = socket.data.seat;
    if (!roomId || !seat) return;
    const state = rooms.get(roomId);
    if (!state) return;

    if (state.players.A.socketId === socket.id) state.players.A.socketId = null;
    if (state.players.B.socketId === socket.id) state.players.B.socketId = null;

    state.status = bothPlayersConnected(state) ? state.status : "waiting";
    if (state.status === "waiting") state.countdown = null;

    emitStateToRoom(roomId, state);

    const a = state.players.A.socketId;
    const b = state.players.B.socketId;
    if (!a && !b) rooms.delete(roomId);
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../../client/dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});

httpServer.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    // eslint-disable-next-line no-console
    console.error(
      `Port ${PORT} is already in use. Close the other process using it, or set PORT to a different value (e.g. PORT=${PORT + 1}).`
    );
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
