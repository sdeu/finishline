import confetti from 'canvas-confetti';

export function celebrate() {
  try {
    void confetti({ particleCount: 160, spread: 90, origin: { y: 0.65 }, disableForReducedMotion: true });
  } catch {
    /* no canvas available */
  }
}
