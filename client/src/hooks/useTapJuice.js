import { useCallback, useEffect, useRef, useState } from "react";

function nowMs() {
  return performance && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

export default function useTapJuice({ enabled = true, soundEnabled = true } = {}) {
  const [shakeKey, setShakeKey] = useState(0);
  const [tensionKey, setTensionKey] = useState(0);
  const [effects, setEffects] = useState([]);
  const [customAudio, setCustomAudio] = useState(null);
  const [defaultCustomAudioUrl, setDefaultCustomAudioUrl] = useState(null);

  const soundRef = useRef(null);
  const customSoundRef = useRef(null);
  const lastSoundAtRef = useRef(0);
  const localTapCountRef = useRef(0);
  const lastCustomAtRef = useRef(0);

  useEffect(() => {
    // Create lazily; some browsers block audio until user gesture.
    soundRef.current = new Audio("/tap.mp3");
    soundRef.current.volume = 0.4;
    customSoundRef.current = null;
    return () => {
      try {
        soundRef.current?.pause();
        customSoundRef.current?.pause();
      } catch {
        // ignore
      }
      soundRef.current = null;
      customSoundRef.current = null;
    };
  }, []);

  useEffect(() => {
    const src = customAudio || defaultCustomAudioUrl;
    if (!src) {
      customSoundRef.current = null;
      return;
    }
    try {
      customSoundRef.current = new Audio(src);
      customSoundRef.current.volume = 0.7;
    } catch {
      customSoundRef.current = null;
    }
  }, [customAudio, defaultCustomAudioUrl]);

  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    const a = soundRef.current;
    if (!a) return;

    // Throttle so it doesn't become noisy on very fast tapping.
    const t = nowMs();
    if (t - lastSoundAtRef.current < 35) return;
    lastSoundAtRef.current = t;

    try {
      a.currentTime = 0;
      void a.play();
    } catch {
      // ignore autoplay restrictions
    }
  }, [soundEnabled]);

  const maybePlayCustomEveryNTaps = useCallback(
    (n = 10) => {
      if (!soundEnabled) return;
      const a = customSoundRef.current;
      if (!a) return;
      if (!Number.isFinite(n) || n <= 0) return;

      localTapCountRef.current += 1;
      if (localTapCountRef.current % n !== 0) return;

      // Don't overlap the clip too aggressively.
      const t = nowMs();
      if (t - lastCustomAtRef.current < 250) return;
      lastCustomAtRef.current = t;

      try {
        a.currentTime = 0;
        void a.play();
      } catch {
        // ignore autoplay restrictions
      }
    },
    [soundEnabled]
  );

  const vibrate = useCallback(() => {
    if (!navigator.vibrate) return;
    try {
      navigator.vibrate(10);
    } catch {
      // ignore
    }
  }, []);

  const spawnParticles = useCallback((xPct, yPct, side) => {
    const baseId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const createdAt = Date.now();

    const dust = {
      id: `dust_${baseId}`,
      kind: "dust",
      side,
      xPct,
      yPct,
      createdAt
    };
    const sweat = {
      id: `sweat_${baseId}`,
      kind: "sweat",
      side,
      xPct,
      yPct: Math.max(0, yPct - 10),
      createdAt
    };

    setEffects((prev) => [...prev, dust, sweat]);

    window.setTimeout(() => {
      setEffects((prev) => prev.filter((e) => e.id !== dust.id && e.id !== sweat.id));
    }, 520);
  }, []);

  const onTap = useCallback(
    ({ clientX, clientY, bounds, yourSeat }) => {
      if (!enabled) return;
      setShakeKey((k) => k + 1);
      setTensionKey((k) => k + 1);

      const xPct = bounds?.width ? ((clientX - bounds.left) / bounds.width) * 100 : 50;
      const yPct = bounds?.height ? ((clientY - bounds.top) / bounds.height) * 100 : 50;

      // Dust near your feet; sweat near your head. We approximate by side.
      const side = yourSeat || null;
      spawnParticles(
        side === "A" ? 22 : side === "B" ? 78 : xPct,
        70,
        side
      );

      playSound();
      maybePlayCustomEveryNTaps(10);
      vibrate();
    },
    [enabled, maybePlayCustomEveryNTaps, playSound, spawnParticles, vibrate]
  );

  return {
    shakeKey,
    tensionKey,
    effects,
    customAudio,
    setCustomAudio,
    defaultCustomAudioUrl,
    setDefaultCustomAudioUrl,
    onTap
  };
}
