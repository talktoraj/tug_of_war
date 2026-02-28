export default function WinnerModal({ open, winner, winnerName, onRestart }) {
  if (!open) return null;

  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h2 className="modalTitle">
          {winner ? `${winnerName || `Player ${winner}`} jeet gya bhsdiwala chal ab party de` : "Winner"}
        </h2>
        <button className="primary" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
}
