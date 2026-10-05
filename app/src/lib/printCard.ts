import { toCanvas } from "html-to-image";

/*
  Card downloads for printing. The card on screen is drawn to a canvas at 300 dpi, placed on the
  chosen paper size, and saved as a PNG that carries its dpi, so printers use the right size.
*/

export const DPI = 300;
const CAPTURE_WIDTH = 600; // CSS pixels the card is laid out at before it's scaled up

export interface PrintSize {
  id: string;
  label: string;
  detail: string;
  paper: [number, number]; // inches
  card: number; // printed card width in inches
}

const MM = 1 / 25.4;

export const PRINT_SIZES: PrintSize[] = [
  { id: "card", label: "Trading card", detail: "2.5 × 3.5 in, true card size", paper: [2.5, 3.5], card: 2.5 },
  { id: "photo", label: "Photo print", detail: "4 × 6 in", paper: [4, 6], card: 3.7 },
  { id: "large", label: "Large print", detail: "5 × 7 in", paper: [5, 7], card: 5 },
  { id: "letter", label: "Letter page", detail: "8.5 × 11 in, card 6.5 in wide", paper: [8.5, 11], card: 6.5 },
  { id: "a4", label: "A4 page", detail: "210 × 297 mm, card 160 mm wide", paper: [210 * MM, 297 * MM], card: 160 * MM },
  { id: "poster", label: "Poster", detail: "10 × 14 in", paper: [10, 14], card: 10 },
];

export type PrintFace = "front" | "stats" | "back";

export const FACE_LABEL: Record<PrintFace, string> = { front: "Card", stats: "Stats side", back: "Card back" };

const px = (inches: number) => Math.round(inches * DPI);

// Draws the element (a card laid out at CAPTURE_WIDTH) onto paper of the chosen size.
export async function renderPrint(el: HTMLElement, size: PrintSize): Promise<Blob> {
  const cardPx = px(size.card);
  const art = await toCanvas(el, { pixelRatio: cardPx / CAPTURE_WIDTH, cacheBust: false });

  const page = document.createElement("canvas");
  page.width = px(size.paper[0]);
  page.height = px(size.paper[1]);
  const ctx = page.getContext("2d")!;
  const trueSize = size.id === "card";
  if (!trueSize) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, page.width, page.height);
  }
  ctx.drawImage(art, Math.round((page.width - art.width) / 2), Math.round((page.height - art.height) / 2));

  const blob = await new Promise<Blob | null>((resolve) => page.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not make the image");
  return withDpi(blob, DPI);
}

// ---------- PNG dpi ----------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Adds a pHYs chunk right after the header so the file reports its print resolution.
export async function withDpi(png: Blob, dpi: number): Promise<Blob> {
  const bytes = new Uint8Array(await png.arrayBuffer());
  const perMeter = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21); // length(4) + type(4) + data(9) + crc(4)
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  view.setUint32(8, perMeter);
  view.setUint32(12, perMeter);
  chunk[16] = 1; // pixels per metre
  view.setUint32(17, crc32(chunk.subarray(4, 17)));

  const ihdrEnd = 8 + 4 + 4 + 13 + 4; // signature + IHDR chunk
  const out = new Uint8Array(bytes.length + chunk.length);
  out.set(bytes.subarray(0, ihdrEnd), 0);
  out.set(chunk, ihdrEnd);
  out.set(bytes.subarray(ihdrEnd), ihdrEnd + chunk.length);
  return new Blob([out], { type: "image/png" });
}

export const printFileName = (name: string, size: PrintSize, face: PrintFace) =>
  `gotcha-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "card"}-${size.id}${face === "front" ? "" : `-${face}`}.png`;

export { CAPTURE_WIDTH };
