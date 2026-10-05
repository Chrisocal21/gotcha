// Small color helpers for custom colors: reading hex codes people type or pick, and growing one color
// into the three-tone gradients the app uses for the catch button, the glow and the card back.

export type Triple = [string, string, string];
export type Kind = "action" | "bg" | "back";

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

// "#f60", "f60", "ff6600" and "#FF6600" all read as "#ff6600".
export function normalizeHex(text: string): string | null {
  const t = text.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(t)) return "#" + t.split("").map((c) => c + c).join("");
  if (/^[0-9a-f]{6}$/.test(t)) return "#" + t;
  return null;
}

// One to three codes, separated by spaces, commas or semicolons. Null if any of them isn't a color.
export function parseColorList(text: string, max = 3): string[] | null {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  if (parts.length === 0 || parts.length > max) return null;
  const out = parts.map(normalizeHex);
  return out.every((c): c is string => c != null) ? out : null;
}

// A saved custom color value: one to three hex codes joined by commas.
export const isSpec = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-f]{6}(,#[0-9a-f]{6}){0,2}$/.test(v);

const toRgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");

function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = toRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function fromHsl(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
  return toHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export function mix(a: string, b: string, t = 0.5): string {
  const [ar, ag, ab] = toRgb(a);
  const [br, bg, bb] = toRgb(b);
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

// Three codes are used as given. Two blend through the middle. One grows into three tones.
export function tripleFor(kind: Kind, colors: string[]): Triple {
  if (colors.length >= 3) return [colors[0], colors[1], colors[2]];
  if (colors.length === 2) return [colors[0], mix(colors[0], colors[1]), colors[1]];
  const c = colors[0];
  const [h, s, l] = toHsl(c);
  if (kind === "action") return [fromHsl(h + 4, s, clamp(l + 0.2, 0, 0.92)), c, fromHsl(h - 8, s, clamp(l - 0.14, 0.12, 1))];
  if (kind === "back") return [fromHsl(h, s, clamp(l + 0.08, 0, 0.9)), c, fromHsl(h, s, clamp(l - 0.2, 0.04, 1))];
  return [c, fromHsl(h + 45, s, l), fromHsl(h - 45, s, l)];
}

// Black or white text, whichever reads better on a color.
export function readableOn(hex: string) {
  const [r, g, b] = toRgb(hex).map((v) => v / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#10201a" : "#ffffff";
}
