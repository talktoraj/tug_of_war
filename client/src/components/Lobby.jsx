import { useState } from "react";

export default function Lobby({ connected, createdRoomId, onCreateRoom, onJoinRoom }) {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(null);

  const onPickAvatar = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    // keep it small so we can send via socket payload
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setAvatar(result);
    };
    reader.readAsDataURL(file);
  };

  const copyRoomId = async () => {
    if (!createdRoomId) return;
    try {
      await navigator.clipboard.writeText(createdRoomId);
    } catch {
      // ignore
    }
  };

  return (
    <div className="screen center">
      <div className="card">
        <h1 className="title">Tug Tap</h1>
        <p className="muted">
          {connected ? "Connected" : "Connecting..."}
        </p>
        <div className="stack">
          <input
            className="input"
            placeholder="Your name (e.g. Ankur)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoCorrect="off"
            spellCheck={false}
          />
          <div className="avatarRow">
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => onPickAvatar(e.target.files?.[0])}
            />
            {avatar ? <img className="avatarPreview" src={avatar} alt="avatar" /> : null}
          </div>
          <button
            className="primary"
            onClick={() => onCreateRoom(name, avatar)}
            disabled={!connected}
          >
            Create Room
          </button>

          {createdRoomId ? (
            <div className="roomCode" onClick={copyRoomId} title="Click to copy">
              <div className="roomCodeTop">
                <div className="roomCodeLabel">Your Room ID</div>
                <button className="copyBtn" type="button" onClick={copyRoomId}>
                  Copy
                </button>
              </div>
              <div className="roomCodeValue">{createdRoomId}</div>
            </div>
          ) : null}

          <div className="divider" />

          <input
            className="input"
            placeholder="Enter Room ID"
            value={roomId}
            maxLength={4}
            onChange={(e) => setRoomId(e.target.value.toUpperCase().slice(0, 4))}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            className="primary"
            onClick={() => onJoinRoom(roomId, name, avatar)}
            disabled={!connected}
          >
            Join Room
          </button>
        </div>
        <p className="hint">Tap anywhere during the match to pull.</p>
      </div>
    </div>
  );
}
