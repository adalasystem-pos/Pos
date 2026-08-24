/**
 * Web Audio API based notification chime for restaurant POS.
 * Non-blocking, zero external asset dependencies, works offline and inside Android WebViews.
 */
export function playOrderNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Primary bell tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain1.gain.setValueAtTime(0.35, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Harmonic bell tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.3); // D6

    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.8);

    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 1.1);
  } catch (err) {
    // Audio Context might be locked before user interaction, safely ignore
    console.warn('Audio notification notice:', err);
  }
}
