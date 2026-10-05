import { getHaptics } from "./prefs";
import { tierRank, type Tier } from "./tiers";

// Synthesized sound effects. No audio files: everything is built with the Web Audio API.

const KEY = "gotcha.sound";
let ctx: AudioContext | null = null;

export function isSoundOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Storage can be unavailable (private mode). Sound simply stays at the default.
  }
}

function audio(): AudioContext | null {
  if (!isSoundOn()) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, at: number, dur: number, gain: number, type: OscillatorType = "sine", slideTo?: number) {
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(amp).connect(c.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

function bell(c: AudioContext, freq: number, at: number, gain: number) {
  tone(c, freq, at, 1.1, gain);
  tone(c, freq * 2, at, 0.6, gain * 0.3);
  tone(c, freq * 3.01, at, 0.3, gain * 0.1);
}

function noise(c: AudioContext, at: number, dur: number, gain: number, highpass = 1800) {
  const length = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = highpass;
  const amp = c.createGain();
  amp.gain.value = gain;
  src.connect(filter).connect(amp).connect(c.destination);
  src.start(at);
}

const NOTES = [523.25, 659.25, 783.99, 1046.5, 1318.5];

export const sfx = {
  shutter() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    noise(c, t, 0.05, 0.22);
    tone(c, 150, t, 0.09, 0.16, "sine", 60);
  },
  charge(tier: Tier, ms: number) {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    const rise = 1 + (tierRank(tier) + 1) * 0.5;
    tone(c, 160, t, ms / 1000, 0.05, "triangle", 160 * rise);
    if (tierRank(tier) >= 3) tone(c, 240, t, ms / 1000, 0.03, "sine", 240 * rise);
  },
  reveal(tier: Tier) {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    const steps = tierRank(tier) + 1;
    noise(c, t, 0.25, 0.05, 4000);
    NOTES.slice(0, steps).forEach((f, i) => bell(c, f, t + i * 0.085, 0.09));
    if (tier === "Legendary") {
      for (let i = 0; i < 6; i++) tone(c, 2093 + i * 180, t + 0.45 + i * 0.06, 0.25, 0.02, "triangle");
    }
  },
  flip() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    noise(c, t, 0.06, 0.05, 3200);
    tone(c, 620, t, 0.09, 0.035, "sine", 340);
  },
  swipe() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    noise(c, t, 0.14, 0.04, 1400);
  },
  reject() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 392, t, 0.22, 0.07);
    tone(c, 311.1, t + 0.14, 0.32, 0.07);
  },
  // "Got-cha!": a quick pickup note into a bright landing chord.
  gotcha() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    noise(c, t, 0.08, 0.08, 2600);
    tone(c, 783.99, t, 0.1, 0.07, "triangle");
    bell(c, 1046.5, t + 0.1, 0.09);
    bell(c, 1318.5, t + 0.1, 0.05);
    bell(c, 1567.98, t + 0.1, 0.035);
    tone(c, 2093, t + 0.26, 0.3, 0.018, "triangle");
  },
  // A soft tick as each reward line lands.
  tick() {
    const c = audio();
    if (!c) return;
    tone(c, 1760, c.currentTime, 0.06, 0.025, "triangle");
  },
  levelUp() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => bell(c, f, t + i * 0.07, 0.07));
    for (let i = 0; i < 5; i++) tone(c, 2349 + i * 220, t + 0.4 + i * 0.05, 0.22, 0.015, "triangle");
  },
  badge() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    bell(c, 1318.5, t, 0.06);
    bell(c, 1975.5, t + 0.09, 0.05);
  },
};

export function haptic(pattern: number | number[]) {
  if (!getHaptics()) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Vibration is unsupported on many devices. Nothing to do.
  }
}
