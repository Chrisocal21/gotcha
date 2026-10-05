// Background designs: whole-page looks borrowed from the web's golden age. Each one is plain CSS
// (layered gradients, no image files), so it costs nothing to load. `dark` skins switch the app's
// panels and text to their dark versions so everything stays readable on top.

export interface Skin {
  name: string;
  era: string; // a few words for the tile
  dark: boolean;
  bg: string; // CSS background value, top layer first
  size: string; // matching background-size list
}

type Layer = [string, string?];

// How many comma-separated backgrounds a layer holds (commas inside brackets don't count).
function count(bg: string): number {
  let depth = 0;
  let n = 1;
  for (const ch of bg) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) n++;
  }
  return n;
}

// Layers are written top to bottom as [background, size]. The last one is the base color. A layer may
// hold several gradients that share one size.
function skin(name: string, era: string, dark: boolean, layers: Layer[]): Skin {
  return {
    name,
    era,
    dark,
    bg: layers.map(([b]) => b).join(", "),
    size: layers.map(([b, sz]) => Array(count(b)).fill(sz ?? "auto").join(", ")).join(", "),
  };
}

export const SKINS: Record<string, Skin> = {
  winamp: skin("Winamp", "Player skin, 1998", true, [
    ["repeating-linear-gradient(0deg, rgb(0 0 0 / 0.3) 0 1px, transparent 1px 3px)"],
    ["radial-gradient(rgb(70 255 130 / 0.2) 1px, transparent 1.5px)", "6px 6px"],
    ["radial-gradient(900px 420px at 50% -8%, rgb(60 255 140 / 0.24), transparent 70%)"],
    ["linear-gradient(180deg, #343a46 0%, #1c1f27 55%, #12141a 100%)"],
  ]),
  aim: skin("Buddy List", "Instant messenger, 1999", false, [
    ["linear-gradient(180deg, #ffd400 0 5px, transparent 5px)", "100% 100%"],
    ["radial-gradient(800px 520px at 18% 0%, rgb(255 255 255 / 0.85), transparent 70%)"],
    ["linear-gradient(180deg, #a3cdff 0%, #5b97ec 55%, #3a74d4 100%)"],
  ]),
  win95: skin("Teal 95", "Desktop, 1995", false, [
    ["repeating-conic-gradient(rgb(0 0 0 / 0.07) 0 25%, transparent 0 50%)", "4px 4px"],
    ["linear-gradient(#86cbcb, #86cbcb)"],
  ]),
  bliss: skin("Rolling Hills", "Desktop, 2001", false, [
    ["radial-gradient(130% 55% at 28% 112%, #66bf3d 0 62%, transparent 63%)"],
    ["radial-gradient(110% 46% at 92% 118%, #3d9a29 0 62%, transparent 63%)"],
    ["radial-gradient(60% 16% at 24% 22%, rgb(255 255 255 / 0.9), transparent 72%)"],
    ["radial-gradient(48% 13% at 72% 12%, rgb(255 255 255 / 0.8), transparent 72%)"],
    ["linear-gradient(180deg, #3b86e8 0%, #9fcdfb 72%)"],
  ]),
  glitter: skin("Glitter Page", "Profile page, 2005", false, [
    ["radial-gradient(rgb(255 255 255 / 0.95) 1px, transparent 1.8px)", "37px 41px"],
    ["radial-gradient(rgb(255 240 130 / 0.9) 1.3px, transparent 2px)", "61px 57px"],
    ["radial-gradient(rgb(255 255 255 / 0.8) 1px, transparent 1.6px)", "89px 83px"],
    ["linear-gradient(135deg, #ff86cf 0%, #c875ff 55%, #8196ff 100%)"],
  ]),
  geocities: skin("Starfield", "Home page, 1997", true, [
    ["radial-gradient(1.4px 1.4px at 22px 30px, #fff 50%, transparent 60%), radial-gradient(1px 1px at 96px 74px, #cfe 50%, transparent 60%), radial-gradient(1.2px 1.2px at 60px 118px, #fff 50%, transparent 60%)", "150px 150px"],
    ["radial-gradient(1px 1px at 40px 20px, #fff 50%, transparent 60%), radial-gradient(1.3px 1.3px at 130px 90px, #ffe 50%, transparent 60%)", "211px 173px"],
    ["linear-gradient(180deg, #050a2e 0%, #17093f 100%)"],
  ]),
  matrix: skin("Digital Rain", "Green screen", true, [
    ["linear-gradient(180deg, transparent 55%, rgb(0 255 100 / 0.2))"],
    ["repeating-linear-gradient(90deg, rgb(0 255 90 / 0.1) 0 2px, transparent 2px 15px)"],
    ["repeating-linear-gradient(0deg, rgb(0 0 0 / 0.35) 0 1px, transparent 1px 4px)"],
    ["linear-gradient(#020b06, #020b06)"],
  ]),
  vapor: skin("Vaporwave", "Aesthetic, 2013", true, [
    ["radial-gradient(circle at 50% 36%, #ffd36b 0 80px, #ff5fa8 81px 142px, transparent 143px)"],
    ["linear-gradient(180deg, #2b0c63 0 54%, transparent 54%)"],
    ["repeating-linear-gradient(90deg, rgb(255 90 225 / 0.4) 0 1px, transparent 1px 52px)"],
    ["repeating-linear-gradient(0deg, rgb(255 90 225 / 0.4) 0 1px, transparent 1px 52px)"],
    ["linear-gradient(180deg, #2b0c63, #14073a)"],
  ]),
  amber: skin("Amber Terminal", "Mainframe, 1983", true, [
    ["repeating-linear-gradient(0deg, rgb(0 0 0 / 0.38) 0 1px, transparent 1px 3px)"],
    ["radial-gradient(ellipse at 50% 40%, rgb(255 176 0 / 0.16), transparent 70%)"],
    ["linear-gradient(#150d00, #150d00)"],
  ]),
  blueprint: skin("Blueprint", "Drafting table", true, [
    ["linear-gradient(rgb(255 255 255 / 0.2) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.2) 1px, transparent 1px)", "120px 120px"],
    ["linear-gradient(rgb(255 255 255 / 0.09) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.09) 1px, transparent 1px)", "24px 24px"],
    ["linear-gradient(#143f86, #143f86)"],
  ]),
  graph: skin("Graph Paper", "Math class", false, [
    ["linear-gradient(rgb(70 140 105 / 0.28) 1px, transparent 1px), linear-gradient(90deg, rgb(70 140 105 / 0.28) 1px, transparent 1px)", "80px 80px"],
    ["linear-gradient(rgb(70 140 105 / 0.13) 1px, transparent 1px), linear-gradient(90deg, rgb(70 140 105 / 0.13) 1px, transparent 1px)", "16px 16px"],
    ["linear-gradient(#f8f4e4, #f8f4e4)"],
  ]),
  notebook: skin("Notebook", "Spiral bound", false, [
    ["linear-gradient(90deg, transparent 72px, rgb(228 84 84 / 0.4) 72px 74px, transparent 74px)"],
    ["repeating-linear-gradient(180deg, transparent 0 31px, rgb(76 132 222 / 0.3) 31px 32px)"],
    ["linear-gradient(#fffdf3, #fffdf3)"],
  ]),
  stripes70: skin("Sunset Stripes", "Seventies", false, [
    ["linear-gradient(115deg, transparent 0 58%, #ffb62e 58% 66%, #ff6e2b 66% 74%, #d63a2b 74% 82%, #8b2c4b 82% 90%, transparent 90%)"],
    ["linear-gradient(#fcefcf, #fcefcf)"],
  ]),
  memphis: skin("Confetti", "Eighties", false, [
    ["radial-gradient(circle at 22px 22px, #ff4fa3 0 6px, transparent 7px)", "130px 130px"],
    ["radial-gradient(circle at 88px 76px, #1fc0c4 0 4px, transparent 5px)", "130px 130px"],
    ["linear-gradient(135deg, transparent 45%, #ffd23f 45% 55%, transparent 55%)", "96px 96px"],
    ["repeating-linear-gradient(60deg, rgb(120 90 255 / 0.18) 0 2px, transparent 2px 22px)"],
    ["linear-gradient(#fff6e2, #fff6e2)"],
  ]),
  aurora: skin("Aurora", "Northern lights", true, [
    ["radial-gradient(700px 420px at 15% 20%, rgb(60 255 170 / 0.3), transparent 70%)"],
    ["radial-gradient(800px 460px at 80% 10%, rgb(90 150 255 / 0.32), transparent 70%)"],
    ["radial-gradient(700px 500px at 55% 95%, rgb(180 90 255 / 0.28), transparent 70%)"],
    ["linear-gradient(#07111f, #0a1426)"],
  ]),
  platinum: skin("Platinum", "Classic Mac, 1999", false, [
    ["repeating-linear-gradient(0deg, rgb(0 0 0 / 0.055) 0 1px, transparent 1px 3px)"],
    ["linear-gradient(180deg, #e6e7ec, #cfd1d9)"],
  ]),
  cork: skin("Cork Board", "Bulletin board", false, [
    ["radial-gradient(rgb(90 50 20 / 0.35) 1px, transparent 1.6px)", "9px 11px"],
    ["radial-gradient(rgb(255 235 190 / 0.35) 1px, transparent 1.6px)", "13px 7px"],
    ["linear-gradient(#cf9d62, #bd8850)"],
  ]),

  // ---- Game consoles and handhelds ----
  nes: skin("Gray Console", "8-bit living room", false, [
    ["linear-gradient(180deg, transparent 0 60%, #2c2c2c 60% 69%, #d42a2a 69% 73%, transparent 73%)"],
    ["repeating-linear-gradient(90deg, rgb(0 0 0 / 0.05) 0 2px, transparent 2px 8px)"],
    ["linear-gradient(#d9d6cd, #d9d6cd)"],
  ]),
  snes: skin("Four Buttons", "16-bit pad", false, [
    ["radial-gradient(circle at 86% 52%, #e04a3f 0 16px, transparent 17px), radial-gradient(circle at 76% 62%, #f0c437 0 16px, transparent 17px), radial-gradient(circle at 76% 42%, #3a7bd5 0 16px, transparent 17px), radial-gradient(circle at 66% 52%, #3fae5a 0 16px, transparent 17px)", "100% 100%"],
    ["repeating-linear-gradient(45deg, rgb(120 110 150 / 0.1) 0 3px, transparent 3px 14px)"],
    ["linear-gradient(135deg, #d8d4e2, #b9b3cc)"],
  ]),
  genesis: skin("Black Box 16", "Blast-era black", true, [
    ["radial-gradient(ellipse 90% 40% at 50% 112%, rgb(40 110 255 / 0.55), transparent 70%)"],
    ["repeating-linear-gradient(0deg, rgb(255 255 255 / 0.035) 0 1px, transparent 1px 4px)"],
    ["linear-gradient(#06080f, #0a0d1a)"],
  ]),
  psx: skin("Gray Disc", "32-bit shapes", false, [
    ["radial-gradient(circle at 15px 15px, #3fae5a 0 5px, transparent 6px), radial-gradient(circle at 55px 15px, #e04a3f 0 5px, transparent 6px), radial-gradient(circle at 15px 55px, #3a7bd5 0 5px, transparent 6px), radial-gradient(circle at 55px 55px, #e07ab5 0 5px, transparent 6px)", "170px 170px"],
    ["linear-gradient(180deg, #c3c6cc, #a7abb3)"],
  ]),
  n64: skin("Four Colors", "64-bit party", true, [
    ["radial-gradient(700px 380px at 50% 0%, rgb(120 130 160 / 0.28), transparent 70%)"],
    ["linear-gradient(180deg, transparent 0 6px, #323644 6px)"],
    ["linear-gradient(90deg, #e8402d 0 25%, #2f6fe0 25% 50%, #f5c518 50% 75%, #2aa84a 75%)"],
  ]),
  dreamcast: skin("Orange Swirl", "Spiral console", false, [
    ["radial-gradient(circle at 88% 14%, #ff7a1a 0 80px, transparent 81px), radial-gradient(circle at 88% 14%, transparent 0 110px, rgb(255 122 26 / 0.35) 111px 118px, transparent 119px), radial-gradient(circle at 88% 14%, transparent 0 150px, rgb(255 122 26 / 0.2) 151px 156px, transparent 157px)"],
    ["linear-gradient(#f6f8fc, #e3e8f2)"],
  ]),
  gameboy: skin("Pocket Handheld", "Green LCD, 1989", false, [
    ["repeating-linear-gradient(0deg, rgb(15 56 15 / 0.14) 0 2px, transparent 2px 4px), repeating-linear-gradient(90deg, rgb(15 56 15 / 0.1) 0 2px, transparent 2px 4px)"],
    ["linear-gradient(#a9c93a, #a9c93a)"],
  ]),
  nightboy: skin("Night Handheld", "Dark LCD", true, [
    ["repeating-linear-gradient(0deg, rgb(155 188 15 / 0.1) 0 2px, transparent 2px 4px), repeating-linear-gradient(90deg, rgb(155 188 15 / 0.07) 0 2px, transparent 2px 4px)"],
    ["linear-gradient(#0f2a10, #0f2a10)"],
  ]),
  handheld: skin("Indigo Handheld", "Color handheld", true, [
    ["linear-gradient(120deg, transparent 0 40%, rgb(255 255 255 / 0.08) 40% 46%, transparent 46%)"],
    ["radial-gradient(rgb(255 255 255 / 0.12) 1px, transparent 1.5px)", "8px 8px"],
    ["linear-gradient(160deg, #5a3fc0, #2c1d78)"],
  ]),
  virtual: skin("Red Vision", "Red-on-black", true, [
    ["repeating-linear-gradient(0deg, rgb(255 20 20 / 0.22) 0 1px, transparent 1px 5px)"],
    ["radial-gradient(ellipse at 50% 40%, rgb(255 30 30 / 0.18), transparent 70%)"],
    ["linear-gradient(#150000, #150000)"],
  ]),
  atari: skin("Wood Grain", "Joystick era", false, [
    ["repeating-linear-gradient(90deg, rgb(70 40 15 / 0.2) 0 2px, transparent 2px 11px), repeating-linear-gradient(90deg, rgb(255 230 190 / 0.12) 0 1px, transparent 1px 7px)"],
    ["linear-gradient(180deg, #2a2a2a 0 6%, transparent 6%)"],
    ["linear-gradient(#b98a55, #a77a48)"],
  ]),
  arcade: skin("Arcade Neon", "Cabinet glow", true, [
    ["radial-gradient(1.5px 1.5px at 30px 40px, #fff, transparent), radial-gradient(1.5px 1.5px at 120px 90px, #7df, transparent)", "170px 140px"],
    ["radial-gradient(600px 360px at 12% 18%, rgb(255 60 200 / 0.3), transparent 70%)"],
    ["radial-gradient(700px 400px at 90% 90%, rgb(50 220 255 / 0.28), transparent 70%)"],
    ["repeating-linear-gradient(0deg, rgb(255 255 255 / 0.035) 0 2px, transparent 2px 4px)"],
    ["linear-gradient(#0b0720, #0b0720)"],
  ]),
  blocks: skin("Block Puzzle", "Falling shapes", true, [
    ["linear-gradient(90deg, rgb(0 229 255 / 0.22) 0 25%, rgb(255 212 0 / 0.22) 25% 50%, rgb(255 61 110 / 0.22) 50% 75%, rgb(123 92 255 / 0.22) 75%)", "160px 40px"],
    ["linear-gradient(rgb(255 255 255 / 0.08) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.08) 1px, transparent 1px)", "20px 20px"],
    ["linear-gradient(#090e29, #090e29)"],
  ]),
  plumber: skin("Plumber World", "Sky and bricks", false, [
    ["radial-gradient(ellipse 70px 26px at 20% 22%, #fff 0 60%, transparent 62%), radial-gradient(ellipse 90px 30px at 70% 12%, #fff 0 60%, transparent 62%), radial-gradient(ellipse 60px 22px at 90% 34%, #fff 0 60%, transparent 62%)"],
    ["linear-gradient(180deg, #5c94fc 0 88%, transparent 88%)"],
    ["repeating-linear-gradient(90deg, rgb(0 0 0 / 0.3) 0 3px, transparent 3px 36px)"],
    ["linear-gradient(#c84c0c, #c84c0c)"],
  ]),

  // ---- Computers and the early web ----
  c64: skin("Blue Home Computer", "Boot screen", true, [
    ["repeating-linear-gradient(0deg, rgb(0 0 0 / 0.14) 0 1px, transparent 1px 3px)"],
    ["linear-gradient(#4a45d8, #3b36c4)"],
  ]),
  dos: skin("Command Prompt", "Black screen", true, [
    ["repeating-linear-gradient(0deg, rgb(255 255 255 / 0.03) 0 1px, transparent 1px 3px)"],
    ["radial-gradient(ellipse at 50% 50%, rgb(170 170 170 / 0.08), transparent 70%)"],
    ["linear-gradient(#000, #000)"],
  ]),
  beige: skin("Beige Box", "Tower PC", false, [
    ["repeating-linear-gradient(0deg, rgb(0 0 0 / 0.045) 0 1px, transparent 1px 4px)"],
    ["linear-gradient(180deg, #e4dcc3, #d3caad)"],
  ]),
  aero: skin("Aero Glass", "Bubbles and sky, 2007", false, [
    ["radial-gradient(circle at 18% 70%, rgb(255 255 255 / 0.5) 0 38px, transparent 40px), radial-gradient(circle at 78% 38%, rgb(255 255 255 / 0.4) 0 56px, transparent 58px), radial-gradient(circle at 60% 82%, rgb(255 255 255 / 0.35) 0 30px, transparent 32px)"],
    ["radial-gradient(120% 40% at 30% 112%, #6cc24a 0 60%, transparent 61%)"],
    ["linear-gradient(180deg, #19b6e8 0%, #8fe3f2 60%, #d6fbe9 100%)"],
  ]),
  y2k: skin("Y2K Chrome", "Silver millennium", false, [
    ["radial-gradient(2px 2px at 40px 50px, #fff, transparent), radial-gradient(1.5px 1.5px at 130px 120px, #fff, transparent)", "180px 160px"],
    ["linear-gradient(115deg, rgb(255 255 255 / 0.55) 0 8%, transparent 8% 30%, rgb(255 255 255 / 0.4) 30% 34%, transparent 34%)"],
    ["linear-gradient(135deg, #dfe6f2, #a9b7d6 55%, #cbd6ee)"],
  ]),

  // ---- TV, toys and pop culture ----
  vhs: skin("Test Pattern", "Tape and tube", true, [
    ["repeating-linear-gradient(0deg, rgb(255 255 255 / 0.05) 0 1px, transparent 1px 4px)"],
    ["linear-gradient(180deg, transparent 0 14%, #0a0a14 14%)"],
    ["linear-gradient(90deg, #c4c4c4 0 14.28%, #c4c400 14.28% 28.56%, #00c4c4 28.56% 42.84%, #00c400 42.84% 57.12%, #c400c4 57.12% 71.4%, #c40000 71.4% 85.68%, #0000c4 85.68%)"],
    ["linear-gradient(#0a0a14, #0a0a14)"],
  ]),
  pixelpet: skin("Pixel Pet", "Egg toy", false, [
    ["radial-gradient(circle at 18px 18px, #fff 0 5px, transparent 6px)", "36px 36px"],
    ["radial-gradient(circle at 18px 18px, rgb(255 255 255 / 0.5) 0 11px, transparent 12px)", "72px 72px"],
    ["linear-gradient(135deg, #ffb6dc, #b8c8ff)"],
  ]),
  lava: skin("Lava Lamp", "Seventies glow", true, [
    ["radial-gradient(180px 150px at 25% 70%, rgb(255 120 40 / 0.6), transparent 70%)"],
    ["radial-gradient(150px 200px at 70% 35%, rgb(255 60 120 / 0.55), transparent 70%)"],
    ["radial-gradient(120px 120px at 50% 90%, rgb(255 190 60 / 0.45), transparent 70%)"],
    ["linear-gradient(#2a0a3a, #130522)"],
  ]),
  folder: skin("Trapper Folder", "School supplies", false, [
    ["repeating-linear-gradient(45deg, rgb(255 110 199 / 0.45) 0 14px, transparent 14px 44px)"],
    ["repeating-linear-gradient(-45deg, rgb(120 90 255 / 0.4) 0 12px, transparent 12px 50px)"],
    ["linear-gradient(#30d2c8, #20b0b8)"],
  ]),
  carpet: skin("Rink Carpet", "Arcade and bowling", true, [
    ["radial-gradient(circle at 20px 20px, #ff4fa3 0 5px, transparent 6px), radial-gradient(circle at 70px 60px, #22d3d8 0 4px, transparent 5px)", "110px 100px"],
    ["linear-gradient(135deg, transparent 46%, #ffd23f 46% 54%, transparent 54%)", "90px 90px"],
    ["linear-gradient(60deg, transparent 46%, #7b5cff 46% 52%, transparent 52%)", "130px 130px"],
    ["linear-gradient(#1a1033, #1a1033)"],
  ]),
};

export const SKIN_KEYS = Object.keys(SKINS);

// How the picker groups them, in this order. Any design not listed here still shows up, under "More".
export const SKIN_GROUPS: { name: string; keys: string[] }[] = [
  { name: "Game consoles", keys: ["nes", "snes", "genesis", "psx", "n64", "dreamcast", "gameboy", "nightboy", "handheld", "virtual", "atari", "arcade", "blocks", "plumber"] },
  { name: "Computers and the web", keys: ["winamp", "aim", "win95", "bliss", "geocities", "c64", "dos", "beige", "platinum", "amber", "matrix", "aero", "y2k", "glitter"] },
  { name: "TV, toys and pop", keys: ["vhs", "pixelpet", "lava", "folder", "carpet", "vapor", "memphis", "stripes70"] },
  { name: "Paper and craft", keys: ["graph", "notebook", "blueprint", "cork"] },
  { name: "Glow", keys: ["aurora"] },
];
