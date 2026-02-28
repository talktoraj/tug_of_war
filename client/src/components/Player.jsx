import SpritePlayer from "./SpritePlayer.jsx";

export default function Player({
  side,
  useSprites = false,
  spriteState = "idle",
  avatar,
  slapped = false,
  slapFrom = "left"
}) {
  if (useSprites) {
    return <SpritePlayer side={side} state={spriteState} />;
  }

  return (
    <div className={`player ${side === "A" ? "p1" : "p2"} ${slapped ? "slapped" : ""}`}>
      <div className="head">{avatar ? <img className="avatarHead" src={avatar} alt="" /> : null}</div>
      <div className={`slapHand ${slapFrom === "right" ? "left" : "right"}`} />
      <div className="slapImpact" />
      <div className="body" />
      <div className="arm left" />
      <div className="arm right" />
    </div>
  );
}
