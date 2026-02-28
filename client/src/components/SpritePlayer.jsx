export default function SpritePlayer({ state = "idle", side = "A" }) {
  // Requires user-provided sprite sheets in /public/sprites/
  // Files expected:
  // - /public/sprites/A_idle.png, A_pull.png, A_win.png, A_lose.png
  // - /public/sprites/B_idle.png, B_pull.png, B_win.png, B_lose.png
  // Each sheet should be a horizontal strip of frames.

  return <div className={`spritePlayer ${side} ${state}`} />;
}
