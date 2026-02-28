import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import Background from "./components/Background.jsx";
import Lobby from "./components/Lobby.jsx";
import GameRoom from "./components/GameRoom.jsx";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5174";

export default function App() {
  const socket = useMemo(() => io(SERVER_URL, { autoConnect: true }), []);
  const [connected, setConnected] = useState(socket.connected);
  const [phase, setPhase] = useState("lobby");
  const [roomState, setRoomState] = useState(null);
  const [createdRoomId, setCreatedRoomId] = useState(null);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onState = (state) => {
      setRoomState(state);
      setPhase("game");
    };
    const onError = (msg) => {
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
          onCreateRoom={(name, avatar) => socket.emit("create_room", { name, avatar })}
          onJoinRoom={(roomId, name, avatar) => socket.emit("join_room", { roomId, name, avatar })}
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
