import { useEffect, useMemo, useRef, useState } from "react";
import ScoreBoard from "./ScoreBoard.jsx";
import Rope from "./Rope.jsx";
import WinnerModal from "./WinnerModal.jsx";
import useTapJuice from "../hooks/useTapJuice.js";

export default function GameRoom({ connected, socket, state }) {
  const containerRef = useRef(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const { shakeKey, tensionKey, effects, onTap, setCustomAudio, setDefaultCustomAudioUrl } =
    useTapJuice({
    enabled: true,
    soundEnabled
  });

  useEffect(() => {
    // If you place ghopghop.mp3 in the client public root, it will be served at /ghopghop.mp3
    setDefaultCustomAudioUrl("/ghopghop.mp3");
  }, [setDefaultCustomAudioUrl]);

  const onPickTapClip = (file) => {
    if (!file) return;
    if (!file.type.startsWith("audio/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (result) setCustomAudio(result);
    };
    reader.readAsDataURL(file);
  };

  const canTap = Boolean(state && state.status === "playing");

  const statusText = useMemo(() => {
    if (!state) return "Loading...";
    if (state.status === "waiting") return "Waiting for opponent...";
    if (state.status === "countdown") return `Starting in ${state.countdown}`;
    if (state.status === "playing") return "Tap to pull!";
    if (state.status === "finished") return "Match finished";
    return "";
  }, [state]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e) => {
      e.preventDefault();
      if (!canTap) return;
      socket.emit("tap");

      const rect = el.getBoundingClientRect();
      const point = e.touches?.[0] || e;
      onTap({
        clientX: point.clientX,
        clientY: point.clientY,
        bounds: rect,
        yourSeat: state?.yourSeat
      });
    };

    el.addEventListener("pointerdown", handler, { passive: false });
    return () => el.removeEventListener("pointerdown", handler);
  }, [canTap, onTap, socket, state?.yourSeat]);

  if (!state) {
    return (
      <div className="screen center">
        <div className="card">Loading room...</div>
      </div>
    );
  }

  const winnerName = state.winner ? state.players[state.winner]?.name : null;
  const slapSide =
    state.status === "finished" && state.winner
      ? state.winner === "A"
        ? "B"
        : "A"
      : null;

  return (
    <div className="screen" ref={containerRef}>
      <div className="topbar">
        <div className="pill">{connected ? "Online" : "Offline"}</div>
        <div className="pill">Room: {state.roomId}</div>
        <button
          className="pill pillButton"
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          aria-pressed={soundEnabled}
          title="Toggle sound"
        >
          Sound: {soundEnabled ? "On" : "Off"}
        </button>
        <label className="pill pillButton" title="Upload a sound clip (plays once per 10 taps)">
          Clip
          <input
            className="hiddenFile"
            type="file"
            accept="audio/*"
            onChange={(e) => onPickTapClip(e.target.files?.[0])}
          />
        </label>
      </div>

      <div className="centerArea">
        <div className="status">{statusText}</div>
        <Rope
          offset={state.offset}
          winTaps={state.winTaps}
          yourSeat={state.yourSeat}
          shakeKey={shakeKey}
          tensionKey={tensionKey}
          effects={effects}
          avatars={{ A: state.players?.A?.avatar, B: state.players?.B?.avatar }}
          slapSide={slapSide}
        />
        <ScoreBoard players={state.players} />
        <div className="tapHint">
          {canTap ? "Tap anywhere" : "Wait..."}
        </div>
      </div>

      <WinnerModal
        open={state.status === "finished"}
        winner={state.winner}
        winnerName={winnerName}
        onRestart={() => socket.emit("restart")}
      />
    </div>
  );
}
  