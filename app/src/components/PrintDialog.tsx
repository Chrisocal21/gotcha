import { useEffect, useRef, useState } from "react";
import type { Card } from "../lib/api";
import { useEscape } from "../lib/hooks";
import { CAPTURE_WIDTH, FACE_LABEL, PRINT_SIZES, printFileName, renderPrint, type PrintFace, type PrintSize } from "../lib/printCard";
import { CardBack, CardFront, CardStats } from "./GameCard";
import { IconClose } from "./glyphs";
import { Button, IconButton, Segmented } from "./ui";

function Face({ card, face }: { card: Card; face: PrintFace }) {
  if (face === "stats") return <CardStats card={card} />;
  if (face === "back") return <CardBack />;
  return <CardFront card={card} />;
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export default function PrintDialog({ card, onClose }: { card: Card; onClose: () => void }) {
  const [size, setSize] = useState<PrintSize>(PRINT_SIZES[0]);
  const [face, setFace] = useState<PrintFace>("front");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const capture = useRef<HTMLDivElement>(null);
  useEscape(onClose);

  // Lets the art settle before the first capture.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = img.onerror = () => setReady(true);
    img.src = card.artUrl;
  }, [card.artUrl]);

  async function download() {
    const el = capture.current?.firstElementChild as HTMLElement | null;
    if (!el) return;
    setBusy(true);
    setError(null);
    try {
      await document.fonts?.ready;
      save(await renderPrint(el, size), printFileName(card.name, size, face));
    } catch {
      setError("Couldn't make the image. Try a smaller size.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fade-in fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-[rgb(12_20_17_/_0.6)] p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Download for print"
      onClick={onClose}
    >
      <div className="rise-in w-full max-w-[640px] rounded-[28px] bg-paper p-5 shadow-lift sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[22px] font-extrabold tracking-tight">Download for print</h2>
          <IconButton label="Close" onClick={onClose} className="-mr-2">
            <IconClose size={22} strokeWidth={1.8} />
          </IconButton>
        </div>

        <div className="mt-4 grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
          <div className="mx-auto w-[180px]">
            <Face card={card} face={face} />
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-ink-3">Side</div>
            <div className="mt-1.5">
              <Segmented
                size="sm"
                value={face}
                onChange={setFace}
                options={(Object.keys(FACE_LABEL) as PrintFace[]).map((f) => ({ value: f, label: FACE_LABEL[f] }))}
              />
            </div>
            <div className="mt-4 text-[12.5px] font-semibold text-ink-3">Size</div>
            <div className="mt-1.5 grid gap-1.5">
              {PRINT_SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSize(s)}
                  aria-pressed={size.id === s.id}
                  className={`flex items-baseline justify-between gap-3 rounded-xl border px-3.5 py-2 text-left transition ${
                    size.id === s.id ? "border-canopy bg-paper-2 ring-2 ring-canopy/25" : "border-line hover:bg-paper-2"
                  }`}
                >
                  <span className="text-[14.5px] font-bold">{s.label}</span>
                  <span className="text-right text-[12.5px] text-ink-3">{s.detail}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-[13.5px] font-semibold text-[#c0392b]">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-[340px] text-[12.5px] leading-snug text-ink-3">PNG at 300 dpi. Print at 100% or "actual size" so the card comes out the right size.</p>
          <Button disabled={busy || !ready} onClick={download}>
            {busy ? "Making image..." : "Download PNG"}
          </Button>
        </div>
      </div>

      {/* The card laid out at full size, off screen, so the download is sharp. */}
      <div ref={capture} aria-hidden style={{ position: "fixed", left: -10000, top: 0, width: CAPTURE_WIDTH, pointerEvents: "none" }}>
        <Face card={card} face={face} />
      </div>
    </div>
  );
}
