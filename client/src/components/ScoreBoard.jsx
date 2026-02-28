export default function ScoreBoard({ players }) {
  return (
    <div className="scoreboard">
      <div className="score">
        <div className="label">{players.A.name || "Player A"}</div>
        <div className="value">{players.A.taps}</div>
      </div>
      <div className="score">
        <div className="label">{players.B.name || "Player B"}</div>
        <div className="value">{players.B.taps}</div>
      </div>
    </div>
  );
}
