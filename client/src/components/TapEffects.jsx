export default function TapEffects({ effects }) {
  if (!effects || effects.length === 0) return null;

  return (
    <div className="tapEffects" aria-hidden="true">
      {effects.map((e) => (
        <div
          key={e.id}
          className={`fx ${e.kind} ${e.side === "A" ? "left" : e.side === "B" ? "right" : ""}`}
          style={{ left: `${e.xPct}%`, top: `${e.yPct}%` }}
        />
      ))}
    </div>
  );
}
