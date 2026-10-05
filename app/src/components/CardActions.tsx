import { useEffect, useRef, useState } from "react";
import { getProfile, saveShowcase, type Card } from "../lib/api";
import { renderShareImage, sendShare, SHARE_CAPTURE_WIDTH } from "../lib/shareCard";
import { CLERK_KEY } from "./AuthGate";
import { CardFront } from "./GameCard";
import { Button } from "./ui";

const SHOWCASE_MAX = 3;

/*
  What you can do with a card besides look at it: send it as a picture, show it on your public page,
  or print it. Sharing draws the card off screen, so it looks the same however big it is on screen.
*/
export default function CardActions({ card, onPrint }: { card: Card; onPrint: () => void }) {
  const [capturing, setCapturing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [ids, setIds] = useState<string[] | null>(null);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CLERK_KEY) return;
    let live = true;
    getProfile()
      .then((p) => live && setIds(p?.showcase ?? []))
      .catch(() => live && setIds([]));
    return () => {
      live = false;
    };
  }, []);

  // Once the off-screen copy is on the page, draw it and share.
  useEffect(() => {
    if (!capturing) return;
    let live = true;
    (async () => {
      try {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = card.artUrl;
        });
        await document.fonts?.ready;
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const el = host.current?.firstElementChild as HTMLElement | null;
        if (!el || !live) return;
        const result = await sendShare(await renderShareImage(el, card), card);
        if (live) setNote(result === "saved" ? "Saved the picture." : null);
      } catch {
        if (live) setNote("Couldn't make the picture. Try again.");
      } finally {
        if (live) setCapturing(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [capturing, card]);

  const inShowcase = !!ids?.includes(card.id);
  async function toggleShowcase() {
    if (!ids) return;
    if (!inShowcase && ids.length >= SHOWCASE_MAX) {
      setNote(`Your showcase holds ${SHOWCASE_MAX} cards. Remove one first.`);
      return;
    }
    const next = inShowcase ? ids.filter((i) => i !== card.id) : [...ids, card.id];
    try {
      setIds(await saveShowcase(next));
      setNote(inShowcase ? "Removed from your showcase." : "Added to your showcase. Others see it on your page.");
    } catch {
      setNote("Couldn't update your showcase.");
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" onClick={() => (setNote(null), setCapturing(true))} disabled={capturing}>
          {capturing ? "Making picture" : "Share"}
        </Button>
        {CLERK_KEY && (
          <Button variant="secondary" size="sm" onClick={toggleShowcase} disabled={!ids || card.isSample}>
            {inShowcase ? "In your showcase" : "Add to showcase"}
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={onPrint}>
          Print
        </Button>
      </div>
      {note && <p className="fade-in mt-2.5 text-center text-[12.5px] font-medium text-canopy">{note}</p>}
      {capturing && (
        <div ref={host} aria-hidden style={{ position: "fixed", left: -10000, top: 0, width: SHARE_CAPTURE_WIDTH, pointerEvents: "none" }}>
          <CardFront card={card} />
        </div>
      )}
    </div>
  );
}
