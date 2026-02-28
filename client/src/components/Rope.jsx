import { motion } from "framer-motion";
import Player from "./Player.jsx";
import TapEffects from "./TapEffects.jsx";

export default function Rope({
  offset,
  winTaps,
  yourSeat,
  shakeKey,
  tensionKey,
  effects,
  useSprites = false,
  avatars,
  slapSide
}) {
  const max = winTaps;
  const clamped = Math.max(-max, Math.min(max, offset));
  const pct = (clamped / max) * 40;

  // Determine which side the current player is on
  const isLeftPlayer = yourSeat === "A";
  const isRightPlayer = yourSeat === "B";

  return (
    <motion.div
      className="arena"
      animate={shakeKey ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.22 }}
      key={`shake_${shakeKey || 0}`}
    >
      <div className="boundary left" />
      <div className="boundary right" />

      <motion.div
        className="ropeWrap"
        animate={tensionKey ? { scaleX: [1, 1.06, 1] } : { scaleX: 1 }}
        transition={{ duration: 0.18 }}
        key={`tension_${tensionKey || 0}`}
      >
        <motion.div
          className="rope"
          animate={{ x: `${pct}%` }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        />
        <motion.div
          className="knot"
          animate={{ x: `${pct}%` }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        />
      </motion.div>

      <TapEffects effects={effects} />

      <div className="players">
        <motion.div
          className="playerSlot left"
          animate={{
            x: `${pct}%`,
            rotate: isLeftPlayer && tensionKey ? [-2, -10, -2] : 0,
            y: isLeftPlayer && tensionKey ? [0, -2, 0] : 0
          }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <Player
            side="A"
            useSprites={useSprites}
            avatar={avatars?.A}
            slapped={slapSide === "A"}
            slapFrom="right"
          />
          {isLeftPlayer && <div className="youLabel">YOU</div>}
        </motion.div>
        <motion.div
          className="playerSlot right"
          animate={{
            x: `${pct}%`,
            rotate: isRightPlayer && tensionKey ? [2, 10, 2] : 0,
            y: isRightPlayer && tensionKey ? [0, -2, 0] : 0
          }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <Player
            side="B"
            useSprites={useSprites}
            avatar={avatars?.B}
            slapped={slapSide === "B"}
            slapFrom="left"
          />
          {isRightPlayer && <div className="youLabel">YOU</div>}
        </motion.div>
      </div>
    </motion.div>
  );
}
