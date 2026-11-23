// Emberfall — sound.js: tiny synthesized sounds. One job: WebAudio beeps.
// No audio files, no network: every sound is an oscillator shaped in code.
// Sounds only start after a user gesture (the browser's rule), and every call
// is guarded so a game without audio still plays.

let ctx = null;

function audio() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur, type, gain, when = 0) {
  const ac = audio();
  if (!ac) return;
  try {
    if (ac.state === 'suspended') void ac.resume();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ac.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(ac.currentTime + when);
    osc.stop(ac.currentTime + when + dur);
  } catch {
    // Silence is fine; the game must never break for sound.
  }
}

/** A soft click when a card is selected. */
export function playSelectSound() {
  tone(660, 0.07, 'sine', 0.08);
}

/** A two-note snap when a card is played. */
export function playCardSound() {
  tone(440, 0.09, 'triangle', 0.12);
  tone(660, 0.12, 'triangle', 0.1, 0.07);
}

/** A low thud when damage lands. */
export function playHitSound() {
  tone(140, 0.16, 'sawtooth', 0.1);
}

/** A rising arpeggio for victory. */
export function playWinSound() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.11));
}

/** A falling line for defeat. */
export function playLoseSound() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.24, 'triangle', 0.1, i * 0.12));
}
