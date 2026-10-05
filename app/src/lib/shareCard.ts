import { toCanvas } from "html-to-image";
import type { Card } from "./api";

/*
  A card as a picture to send to someone: the card on a Gotcha background, sized like a phone post
  (4 by 5). It draws the card the same way the print download does, then hands it to the phone's
  share sheet, or saves a file where there isn't one.
*/

export const SHARE_CAPTURE_WIDTH = 600; // CSS pixels the card is laid out at before it's scaled
const W = 1080;
const H = 1350;
const CARD_PX = 720;

export async function renderShareImage(el: HTMLElement, card: Card): Promise<Blob> {
  const art = await toCanvas(el, { pixelRatio: CARD_PX / SHARE_CAPTURE_WIDTH, cacheBust: false });

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#1f8f6a");
  bg.addColorStop(0.5, "#0f5e47");
  bg.addColorStop(1, "#073528");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H * 0.46, 40, W / 2, H * 0.46, 620);
  glow.addColorStop(0, "rgba(255,255,255,0.22)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const display = '"Bricolage Grotesque Variable", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = `800 64px ${display}`;
  ctx.fillText("Gotcha!", W / 2, 118);

  const x = Math.round((W - art.width) / 2);
  const y = 170;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  ctx.drawImage(art, x, y);
  ctx.restore();

  const bottom = y + art.height;
  ctx.fillStyle = "#fff";
  ctx.font = `800 46px ${display}`;
  ctx.fillText(`${card.name}, ${card.rarity}`, W / 2, bottom + 92);
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = `600 30px ${display}`;
  ctx.fillText(`${card.species}${card.wild ? " · a wild find" : ""}`, W / 2, bottom + 142);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not make the image");
  return blob;
}

const fileName = (card: Card) => `gotcha-${card.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "card"}.png`;

// Opens the share sheet with the picture, or downloads it. Says what happened.
export async function sendShare(blob: Blob, card: Card): Promise<"shared" | "saved" | "cancelled"> {
  const file = new File([blob], fileName(card), { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: `I caught ${card.name}, a ${card.rarity} ${card.species}, on Gotcha!` });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "saved";
}
