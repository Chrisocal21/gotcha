// Personal style: the app's colors, corners and fonts. Cards are never affected, so a card
// looks the same to everyone (important once cards can be traded).

export type Pattern = "none" | "dots" | "stripes" | "checks";
export type Corners = "sharp" | "soft" | "bubble";
export type FontKey =
  | "default"
  | "clean"
  | "inter"
  | "poppins"
  | "nunito"
  | "quicksand"
  | "space"
  | "playful"
  | "editorial"
  | "lora"
  | "merriweather"
  | "oswald"
  | "caveat"
  | "pacifico"
  | "techy"
  | "jetbrains";

export interface Style {
  accent: string;
  action: string;
  bg: string;
  pattern: Pattern;
  corners: Corners;
  font: FontKey;
  back: string;
}

export const DEFAULT_STYLE: Style = { accent: "#0f5e47", action: "sun", bg: "meadow", pattern: "none", corners: "soft", font: "default", back: "forest" };

type Triple = [string, string, string];

export const ACCENTS: { name: string; value: string }[] = [
  { name: "Canopy", value: "#0f5e47" },
  { name: "Ocean", value: "#1a5fb4" },
  { name: "Berry", value: "#b02a5b" },
  { name: "Ember", value: "#c2410c" },
  { name: "Violet", value: "#6d3fc4" },
  { name: "Graphite", value: "#3a4450" },
];

export const ACTIONS: Record<string, { name: string; colors: Triple }> = {
  sun: { name: "Sun", colors: ["#ffd04d", "#ffa526", "#ff7a1a"] },
  bubblegum: { name: "Bubblegum", colors: ["#ffc2e0", "#ff7fbd", "#ff4aa2"] },
  mint: { name: "Mint", colors: ["#c4f7dd", "#66e3a9", "#24bb7e"] },
  sky: { name: "Sky", colors: ["#c6e7ff", "#74bdff", "#3592f2"] },
  grape: { name: "Grape", colors: ["#e6d0ff", "#bc8cff", "#9250e6"] },
};

export const BACKGROUNDS: Record<string, { name: string; colors: Triple }> = {
  meadow: { name: "Meadow", colors: ["#c4e4d1", "#ffdca0", "#c1dbef"] },
  ocean: { name: "Ocean", colors: ["#a9d6f5", "#b9e8f0", "#c7d3f7"] },
  sunset: { name: "Sunset", colors: ["#ffc9a8", "#ffb3c7", "#ffe2a0"] },
  lavender: { name: "Lavender", colors: ["#d8c8f5", "#f5c8e6", "#c4d6f8"] },
  forest: { name: "Forest", colors: ["#a6d3b5", "#cfe3a5", "#9fd0c4"] },
  mono: { name: "Mono", colors: ["#d4d4d4", "#e6e6e6", "#cacaca"] },
};

export const BACKS: Record<string, { name: string; colors: Triple }> = {
  forest: { name: "Forest", colors: ["#18805f", "#0f5e47", "#08392b"] },
  navy: { name: "Navy", colors: ["#2a4f9e", "#16327a", "#0b1c4a"] },
  plum: { name: "Plum", colors: ["#8a3fa0", "#5e2275", "#35113f"] },
  charcoal: { name: "Charcoal", colors: ["#4b5560", "#2b323a", "#14181d"] },
  crimson: { name: "Crimson", colors: ["#c23a4a", "#8f1f33", "#4d0d1b"] },
  sunset: { name: "Sunset", colors: ["#ff9a4d", "#d9531e", "#7a2a0c"] },
};

export const CORNERS: Record<Corners, { name: string; panel: string; btn: string }> = {
  sharp: { name: "Sharp", panel: "10px", btn: "10px" },
  soft: { name: "Soft", panel: "24px", btn: "9999px" },
  bubble: { name: "Bubble", panel: "36px", btn: "9999px" },
};

const BRICOLAGE = '"Bricolage Grotesque Variable", ui-sans-serif, system-ui, sans-serif';
const FIGTREE = '"Figtree Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const stack = (family: string, fallback: string) => `"${family}", ${fallback}`;
const SANS = "ui-sans-serif, system-ui, sans-serif";
const SERIF = "Georgia, serif";
const MONO = "ui-monospace, Menlo, monospace";

// "all" restyles every word in the app; "headings" only the big titles and numbers.
export const FONTS: Record<FontKey, { name: string; display: string; sans: string; scope: "all" | "headings" }> = {
  default: { name: "Bricolage Grotesque", display: BRICOLAGE, sans: FIGTREE, scope: "headings" },
  clean: { name: "Figtree", display: FIGTREE, sans: FIGTREE, scope: "all" },
  inter: { name: "Inter", display: stack("Inter Variable", SANS), sans: stack("Inter Variable", SANS), scope: "all" },
  poppins: { name: "Poppins", display: stack("Poppins", SANS), sans: stack("Poppins", SANS), scope: "all" },
  nunito: { name: "Nunito", display: stack("Nunito Variable", SANS), sans: stack("Nunito Variable", SANS), scope: "all" },
  quicksand: { name: "Quicksand", display: stack("Quicksand Variable", SANS), sans: stack("Quicksand Variable", SANS), scope: "all" },
  space: { name: "Space Grotesk", display: stack("Space Grotesk Variable", SANS), sans: stack("Space Grotesk Variable", SANS), scope: "all" },
  playful: { name: "Fredoka", display: stack("Fredoka Variable", SANS), sans: stack("Fredoka Variable", SANS), scope: "all" },
  editorial: { name: "Playfair Display", display: stack("Playfair Display Variable", SERIF), sans: FIGTREE, scope: "headings" },
  lora: { name: "Lora", display: stack("Lora Variable", SERIF), sans: FIGTREE, scope: "headings" },
  merriweather: { name: "Merriweather", display: stack("Merriweather Variable", SERIF), sans: FIGTREE, scope: "headings" },
  oswald: { name: "Oswald", display: stack("Oswald Variable", SANS), sans: FIGTREE, scope: "headings" },
  caveat: { name: "Caveat", display: stack("Caveat Variable", "cursive"), sans: FIGTREE, scope: "headings" },
  pacifico: { name: "Pacifico", display: stack("Pacifico", "cursive"), sans: FIGTREE, scope: "headings" },
  techy: { name: "DM Mono", display: '"DM Mono", ui-monospace, Menlo, monospace', sans: FIGTREE, scope: "headings" },
  jetbrains: { name: "JetBrains Mono", display: stack("JetBrains Mono Variable", MONO), sans: stack("JetBrains Mono Variable", MONO), scope: "all" },
};
export const PATTERNS: { value: Pattern; label: string }[] = [
  { value: "none", label: "None" },
  { value: "dots", label: "Dots" },
  { value: "stripes", label: "Stripes" },
  { value: "checks", label: "Checks" },
];

const KEY = "gotcha.style";
const VARS_KEY = "gotcha.stylevars";
const HEX = /^#[0-9a-fA-F]{6}$/;

export function sanitize(input: unknown): Style {
  const s = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const pick = <T extends string>(v: unknown, ok: readonly string[], fallback: T) => (typeof v === "string" && ok.includes(v) ? (v as T) : fallback);
  return {
    accent: typeof s.accent === "string" && HEX.test(s.accent) ? s.accent.toLowerCase() : DEFAULT_STYLE.accent,
    action: pick(s.action, Object.keys(ACTIONS), DEFAULT_STYLE.action),
    bg: pick(s.bg, Object.keys(BACKGROUNDS), DEFAULT_STYLE.bg),
    pattern: pick(s.pattern, PATTERNS.map((p) => p.value), DEFAULT_STYLE.pattern),
    corners: pick(s.corners, Object.keys(CORNERS), DEFAULT_STYLE.corners),
    font: pick(s.font, Object.keys(FONTS), DEFAULT_STYLE.font),
    back: pick(s.back, Object.keys(BACKS), DEFAULT_STYLE.back),
  };
}

export function getStyle(): Style {
  try {
    const raw = localStorage.getItem(KEY);
    return sanitize(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_STYLE };
  }
}

// Black or white text, whichever reads better on the chosen accent color.
function onAccent(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#10201a" : "#ffffff";
}

export function cssVars(style: Style): { vars: Record<string, string>; pattern: Pattern } {
  const [a1, a2, a3] = ACTIONS[style.action].colors;
  const [g1, g2, g3] = BACKGROUNDS[style.bg].colors;
  const [b1, b2, b3] = BACKS[style.back].colors;
  const font = FONTS[style.font];
  return {
    pattern: style.pattern,
    vars: {
      "--accent": style.accent,
      "--on-accent": onAccent(style.accent),
      "--action-1": a1,
      "--action-2": a2,
      "--action-3": a3,
      "--bg-a": g1,
      "--bg-b": g2,
      "--bg-c": g3,
      "--back-1": b1,
      "--back-2": b2,
      "--back-3": b3,
      "--r-panel": CORNERS[style.corners].panel,
      "--r-btn": CORNERS[style.corners].btn,
      "--font-display": font.display,
      "--font-sans": font.sans,
    },
  };
}

export function applyStyle(style: Style) {
  const root = document.documentElement;
  const { vars, pattern } = cssVars(style);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  if (pattern === "none") root.removeAttribute("data-pattern");
  else root.setAttribute("data-pattern", pattern);
  try {
    // The page reads this before the first paint so a saved style never flashes the default.
    localStorage.setItem(VARS_KEY, JSON.stringify({ vars, pattern }));
  } catch {
    // Storage unavailable: the style simply won't persist.
  }
}

export function saveStyle(style: Style) {
  try {
    localStorage.setItem(KEY, JSON.stringify(style));
  } catch {
    // Same as above.
  }
  applyStyle(style);
}

const PREFIX = "gotcha-style:";

export const toCode = (style: Style) => PREFIX + btoa(JSON.stringify(style));

export function fromCode(code: string): Style | null {
  const text = code.trim();
  if (!text.startsWith(PREFIX)) return null;
  try {
    return sanitize(JSON.parse(atob(text.slice(PREFIX.length))));
  } catch {
    return null;
  }
}
