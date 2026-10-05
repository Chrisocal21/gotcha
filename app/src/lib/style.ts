import { isSpec, readableOn, tripleFor, type Kind, type Triple } from "./colors";
import { SKINS } from "./skins";

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
  | "jetbrains"
  | "comic"
  | "baloo"
  | "comfortaa"
  | "patrick"
  | "chewy"
  | "bangers"
  | "righteous"
  | "marker"
  | "lobster"
  | "pixel";

export interface Style {
  accent: string; // any hex color
  action: string; // a preset name, or custom hex codes joined by commas
  bg: string; // glow colors: a preset name, or custom hex codes joined by commas
  skin: string; // background design ("none" or a key from skins.ts)
  pattern: Pattern;
  corners: Corners;
  font: FontKey; // headings: titles, big numbers and your name
  body: FontKey; // everything else
  back: string; // a preset name, or custom hex codes joined by commas
}

export const DEFAULT_STYLE: Style = { accent: "#0f5e47", action: "sun", bg: "meadow", skin: "none", pattern: "none", corners: "soft", font: "default", body: "clean", back: "forest" };

export const ACCENTS: { name: string; value: string }[] = [
  { name: "Canopy", value: "#0f5e47" },
  { name: "Ocean", value: "#1a5fb4" },
  { name: "Berry", value: "#b02a5b" },
  { name: "Ember", value: "#c2410c" },
  { name: "Violet", value: "#6d3fc4" },
  { name: "Graphite", value: "#3a4450" },
  { name: "Teal", value: "#0f766e" },
  { name: "Sky", value: "#0369a1" },
  { name: "Indigo", value: "#4338ca" },
  { name: "Magenta", value: "#a21caf" },
  { name: "Rose", value: "#e11d48" },
  { name: "Crimson", value: "#9f1239" },
  { name: "Gold", value: "#b7791f" },
  { name: "Lime", value: "#4d7c0f" },
  { name: "Cocoa", value: "#6b4423" },
  { name: "Midnight", value: "#1e293b" },
];

type Preset = { name: string; colors: Triple };

export const ACTIONS: Record<string, Preset> = {
  sun: { name: "Sun", colors: ["#ffd04d", "#ffa526", "#ff7a1a"] },
  bubblegum: { name: "Bubblegum", colors: ["#ffc2e0", "#ff7fbd", "#ff4aa2"] },
  mint: { name: "Mint", colors: ["#c4f7dd", "#66e3a9", "#24bb7e"] },
  sky: { name: "Sky", colors: ["#c6e7ff", "#74bdff", "#3592f2"] },
  grape: { name: "Grape", colors: ["#e6d0ff", "#bc8cff", "#9250e6"] },
  cherry: { name: "Cherry", colors: ["#ffb3b8", "#ff5d6c", "#e0263f"] },
  lemon: { name: "Lemon", colors: ["#fff7a8", "#ffe14d", "#f5b800"] },
  lime: { name: "Lime", colors: ["#e4ffa6", "#a6ec3d", "#5fbf12"] },
  aqua: { name: "Aqua", colors: ["#b8fff3", "#4de8d3", "#10b5ae"] },
  coral: { name: "Coral", colors: ["#ffd0b8", "#ff9272", "#f0583c"] },
  neon: { name: "Neon", colors: ["#fff06b", "#7dff6b", "#18d6c4"] },
  ice: { name: "Ice", colors: ["#f2f9ff", "#bcd9f5", "#86aee0"] },
};

export const BACKGROUNDS: Record<string, Preset> = {
  meadow: { name: "Meadow", colors: ["#c4e4d1", "#ffdca0", "#c1dbef"] },
  ocean: { name: "Ocean", colors: ["#a9d6f5", "#b9e8f0", "#c7d3f7"] },
  sunset: { name: "Sunset", colors: ["#ffc9a8", "#ffb3c7", "#ffe2a0"] },
  lavender: { name: "Lavender", colors: ["#d8c8f5", "#f5c8e6", "#c4d6f8"] },
  forest: { name: "Forest", colors: ["#a6d3b5", "#cfe3a5", "#9fd0c4"] },
  mono: { name: "Mono", colors: ["#d4d4d4", "#e6e6e6", "#cacaca"] },
  cotton: { name: "Cotton Candy", colors: ["#ffc6e3", "#c9d9ff", "#e3c8ff"] },
  lemonade: { name: "Lemonade", colors: ["#fff1a8", "#ffd6a8", "#c8f0b8"] },
  glacier: { name: "Glacier", colors: ["#cfeaf7", "#e1f4f2", "#d4def7"] },
  peach: { name: "Peach", colors: ["#ffd9c2", "#ffe9b8", "#ffc4cf"] },
  jungle: { name: "Jungle", colors: ["#9ed8a8", "#e2ee9a", "#7cc9b8"] },
  dusk: { name: "Dusk", colors: ["#9a8be8", "#e79ac8", "#ffb98c"] },
};

export const BACKS: Record<string, Preset> = {
  forest: { name: "Forest", colors: ["#18805f", "#0f5e47", "#08392b"] },
  navy: { name: "Navy", colors: ["#2a4f9e", "#16327a", "#0b1c4a"] },
  plum: { name: "Plum", colors: ["#8a3fa0", "#5e2275", "#35113f"] },
  charcoal: { name: "Charcoal", colors: ["#4b5560", "#2b323a", "#14181d"] },
  crimson: { name: "Crimson", colors: ["#c23a4a", "#8f1f33", "#4d0d1b"] },
  sunset: { name: "Sunset", colors: ["#ff9a4d", "#d9531e", "#7a2a0c"] },
  ocean: { name: "Deep Sea", colors: ["#1f9bb5", "#12667e", "#093847"] },
  gold: { name: "Gold", colors: ["#e7b84a", "#b98516", "#6b4a07"] },
  rose: { name: "Rose", colors: ["#e0679a", "#b02c63", "#661436"] },
  slate: { name: "Slate", colors: ["#6b7a93", "#43506a", "#1f2738"] },
  moss: { name: "Moss", colors: ["#8aa23a", "#5b7120", "#2e3c0d"] },
  royal: { name: "Royal", colors: ["#7a52e6", "#4b2bb0", "#241260"] },
};

const PRESETS: Record<Kind, Record<string, Preset>> = { action: ACTIONS, bg: BACKGROUNDS, back: BACKS };

// The three tones for a catch button, glow or card back, whether it's a preset or custom codes.
export function tripleOf(kind: Kind, value: string): Triple {
  const preset = PRESETS[kind][value];
  if (preset) return preset.colors;
  if (isSpec(value)) return tripleFor(kind, value.split(","));
  return PRESETS[kind][DEFAULT_STYLE[kind]].colors;
}

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
export type FontGroup = "Clean" | "Serif" | "Fun" | "Mono";
export const FONT_GROUPS: FontGroup[] = ["Clean", "Fun", "Serif", "Mono"];

type FontDef = { name: string; display: string; sans: string; scope: "all" | "headings"; group: FontGroup };
const font = (name: string, group: FontGroup, scope: "all" | "headings", display: string, sans = display): FontDef => ({ name, group, scope, display, sans });
const COMIC = '"Comic Sans MS", "Comic Sans", "Comic Neue", cursive';

export const FONTS: Record<FontKey, FontDef> = {
  default: font("Bricolage Grotesque", "Clean", "headings", BRICOLAGE, FIGTREE),
  clean: font("Figtree", "Clean", "all", FIGTREE),
  inter: font("Inter", "Clean", "all", stack("Inter Variable", SANS)),
  poppins: font("Poppins", "Clean", "all", stack("Poppins", SANS)),
  nunito: font("Nunito", "Clean", "all", stack("Nunito Variable", SANS)),
  quicksand: font("Quicksand", "Clean", "all", stack("Quicksand Variable", SANS)),
  space: font("Space Grotesk", "Clean", "all", stack("Space Grotesk Variable", SANS)),
  oswald: font("Oswald", "Clean", "headings", stack("Oswald Variable", SANS), FIGTREE),
  comic: font("Comic Sans", "Fun", "all", COMIC),
  playful: font("Fredoka", "Fun", "all", stack("Fredoka Variable", SANS)),
  baloo: font("Baloo 2", "Fun", "all", stack("Baloo 2 Variable", SANS)),
  comfortaa: font("Comfortaa", "Fun", "all", stack("Comfortaa Variable", SANS)),
  patrick: font("Patrick Hand", "Fun", "all", stack("Patrick Hand", "cursive")),
  chewy: font("Chewy", "Fun", "headings", stack("Chewy", "cursive"), FIGTREE),
  bangers: font("Bangers", "Fun", "headings", stack("Bangers", "cursive"), FIGTREE),
  righteous: font("Righteous", "Fun", "headings", stack("Righteous", "cursive"), FIGTREE),
  caveat: font("Caveat", "Fun", "headings", stack("Caveat Variable", "cursive"), FIGTREE),
  marker: font("Permanent Marker", "Fun", "headings", stack("Permanent Marker", "cursive"), FIGTREE),
  lobster: font("Lobster", "Fun", "headings", stack("Lobster", "cursive"), FIGTREE),
  pacifico: font("Pacifico", "Fun", "headings", stack("Pacifico", "cursive"), FIGTREE),
  pixel: font("Press Start 2P", "Fun", "headings", stack("Press Start 2P", "monospace"), FIGTREE),
  editorial: font("Playfair Display", "Serif", "headings", stack("Playfair Display Variable", SERIF), FIGTREE),
  lora: font("Lora", "Serif", "headings", stack("Lora Variable", SERIF), FIGTREE),
  merriweather: font("Merriweather", "Serif", "headings", stack("Merriweather Variable", SERIF), FIGTREE),
  techy: font("DM Mono", "Mono", "headings", '"DM Mono", ui-monospace, Menlo, monospace', FIGTREE),
  jetbrains: font("JetBrains Mono", "Mono", "all", stack("JetBrains Mono Variable", MONO)),
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
  const color = (kind: Kind, v: unknown) => (typeof v === "string" && (v in PRESETS[kind] || isSpec(v.toLowerCase())) ? v.toLowerCase() : DEFAULT_STYLE[kind]);
  return {
    accent: typeof s.accent === "string" && HEX.test(s.accent) ? s.accent.toLowerCase() : DEFAULT_STYLE.accent,
    action: color("action", s.action),
    bg: color("bg", s.bg),
    skin: pick(s.skin, ["none", ...Object.keys(SKINS)], DEFAULT_STYLE.skin),
    pattern: pick(s.pattern, PATTERNS.map((p) => p.value), DEFAULT_STYLE.pattern),
    corners: pick(s.corners, Object.keys(CORNERS), DEFAULT_STYLE.corners),
    font: pick(s.font, Object.keys(FONTS), DEFAULT_STYLE.font),
    body: pick(s.body, Object.keys(FONTS).filter((k) => FONTS[k as FontKey].scope === "all"), FONTS[pick(s.font, Object.keys(FONTS), DEFAULT_STYLE.font) as FontKey].scope === "all" ? pick(s.font, Object.keys(FONTS), DEFAULT_STYLE.font) : DEFAULT_STYLE.body),
    back: color("back", s.back),
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

export function cssVars(style: Style): { vars: Record<string, string>; pattern: Pattern; dark: boolean } {
  const [a1, a2, a3] = tripleOf("action", style.action);
  const [g1, g2, g3] = tripleOf("bg", style.bg);
  const [b1, b2, b3] = tripleOf("back", style.back);
  const font = FONTS[style.font];
  const skin = SKINS[style.skin];
  return {
    pattern: style.pattern,
    dark: !!skin?.dark,
    vars: {
      "--accent": style.accent,
      "--on-accent": readableOn(style.accent),
      // Empty values clear the variable, so choosing None brings the glow back.
      "--skin-bg": skin?.bg ?? "",
      "--skin-size": skin?.size ?? "",
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
      "--font-sans": FONTS[style.body].sans,
    },
  };
}

export function applyStyle(style: Style) {
  const root = document.documentElement;
  const { vars, pattern, dark } = cssVars(style);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  if (pattern === "none") root.removeAttribute("data-pattern");
  else root.setAttribute("data-pattern", pattern);
  if (dark) root.setAttribute("data-skin-dark", "1");
  else root.removeAttribute("data-skin-dark");
  try {
    // The page reads this before the first paint so a saved style never flashes the default.
    localStorage.setItem(VARS_KEY, JSON.stringify({ vars, pattern, dark }));
  } catch {
    // Storage unavailable: the style simply won't persist.
  }
}

const AT_KEY = "gotcha.style.at";

// When the saved look last changed on this device, so the newest copy wins when devices sync.
export function getStyleAt(): number {
  try {
    return Number(localStorage.getItem(AT_KEY)) || 0;
  } catch {
    return 0;
  }
}

// Called with every change made on this device, so it can be copied to the account.
let onChange: ((style: Style, at: number) => void) | null = null;
export const setStyleListener = (fn: typeof onChange) => {
  onChange = fn;
};

function store(style: Style, at: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify(style));
    localStorage.setItem(AT_KEY, String(at));
  } catch {
    // Same as above.
  }
  applyStyle(style);
}

export function saveStyle(style: Style) {
  const at = Date.now();
  store(style, at);
  onChange?.(style, at);
}

// A look that arrived from the account: shown and kept here, without sending it straight back.
export function applyRemoteStyle(input: unknown, at: number) {
  const style = sanitize(input);
  store(style, at);
  window.dispatchEvent(new CustomEvent("gotcha:style"));
}

export const hasSavedStyle = () => {
  try {
    return localStorage.getItem(KEY) != null;
  } catch {
    return false;
  }
};

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
