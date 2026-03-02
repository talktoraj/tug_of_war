import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import Background from "./components/Background.jsx";
import Lobby from "./components/Lobby.jsx";
import GameRoom from "./components/GameRoom.jsx";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5174");

export default function App() {
  const socket = useMemo(
    () =>
      io(SERVER_URL, {
        autoConnect: true,
        transports: ["websocket", "polling"],
        withCredentials: false
      }),
    []
  );
  const [connected, setConnected] = useState(socket.connected);
  const [phase, setPhase] = useState("lobby");
  const [roomState, setRoomState] = useState(null);
  const [createdRoomId, setCreatedRoomId] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("Socket SERVER_URL:", SERVER_URL);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onState = (state) => {
      setRoomState(state);
      if (state?.yourSeat === "A" || state?.yourSeat === "B") {
        setPhase("game");
      }
    };
    const onError = (msg) => {
      // eslint-disable-next-line no-console
      console.log("socket_error_message", msg);
      alert(msg);
    };
    const onRoomCreated = ({ roomId }) => {
      setCreatedRoomId(roomId);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("state", onState);
    socket.on("error_message", onError);
    socket.on("room_created", onRoomCreated);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("state", onState);
      socket.off("error_message", onError);
      socket.off("room_created", onRoomCreated);
    };
  }, [socket]);

  return (
    <div className="app">
      <Background />
      {phase === "lobby" ? (
        <Lobby
          connected={connected}
          createdRoomId={createdRoomId}
          onCreateRoom={(name, avatar) => {
            // eslint-disable-next-line no-console
            console.log("emit_create_room", {
              nameLen: String(name || "").length,
              avatarLen: avatar ? String(avatar).length : 0
            });
            socket.emit("create_room", { name, avatar });
          }}
          onJoinRoom={(roomId, name, avatar) => {
            // eslint-disable-next-line no-console
            console.log("emit_join_room", {
              roomId,
              nameLen: String(name || "").length,
              avatarLen: avatar ? String(avatar).length : 0
            });
            socket.emit("join_room", { roomId, name, avatar });
          }}
        />
      ) : (
        <GameRoom
          connected={connected}
          socket={socket}
          state={roomState}
        />
      )}
    </div>
  );
}
