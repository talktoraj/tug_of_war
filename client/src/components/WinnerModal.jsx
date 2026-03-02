import WinnerBackground from "./WinnerBackground.jsx";

export default function WinnerModal({ open, winner, winnerName, onRestart }) {
  if (!open) return null;

  const displayName = winnerName || `Player ${winner}`;

  return (
    <WinnerBackground
      winnerName={displayName}
      onRestart={onRestart}
    />
  );
}
