/**
 * Web Audio API Synthesizer for Connection Celebration.
 *
 * Implements a bright two-note synthesized melodic chime (rising B5 -> E6)
 * with fast exponential decay. Written natively using the Web Audio API (AudioContext)
 * without external audio sample files, guaranteeing zero latency and zero asset overhead.
 *
 * Automatically handles browser user-gesture restrictions, gracefully skips audio
 * when muted or unsupported, and respects the user's `prefers-reduced-motion` preference.
 */

const CHIME_NOTES = [
  { frequency: 987.77, start: 0, duration: 0.1 }, // B5
  { frequency: 1318.51, start: 0.09, duration: 0.36 }, // E6
];

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export async function playConnectionChime(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx) return false;

  let ctx: AudioContext;
  try {
    ctx = new AudioCtx();
  } catch {
    return false;
  }

  // A context created without a direct gesture starts suspended on Safari / Chrome.
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // Audio playback blocked by browser autoplay policy
    }
  }

  if (ctx.state !== "running") {
    try {
      ctx.close();
    } catch {
      // Cleanup ignored
    }
    return false;
  }

  try {
    const now = ctx.currentTime;
    CHIME_NOTES.forEach(({ frequency, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(frequency, now + start);

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.2, now + start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    });
  } catch {
    return false;
  }

  // Release the AudioContext resource after notes complete
  const tail = CHIME_NOTES[CHIME_NOTES.length - 1];
  window.setTimeout(() => {
    ctx.close().catch(() => {});
  }, Math.ceil((tail.start + tail.duration + 0.2) * 1000));

  return true;
}
