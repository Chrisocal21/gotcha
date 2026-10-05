import { useEffect, useState } from "react";
import { MEDALS } from "../lib/badges";
import { sfx } from "../lib/sfx";
import { glyphFor } from "./glyphs";

// A small pop-up when a mystery badge is found by poking around.
export default function EggToast() {
  const [found, setFound] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onEgg = (e: Event) => {
      setFound((e as CustomEvent<string>).detail);
      sfx.badge();
      clearTimeout(timer);
      timer = setTimeout(() => setFound(null), 4200);
    };
    window.addEventListener("gotcha:egg", onEgg);
    return () => {
      window.removeEventListener("gotcha:egg", onEgg);
      clearTimeout(timer);
    };
  }, []);

  const def = found ? MEDALS.find((m) => m.id === `secret-${found}`) : null;
  if (!def) return null;
  const G = glyphFor(def.glyph);
  return (
    <div role="status" className="fade-in fixed top-20 left-1/2 z-[90] flex w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3 shadow-lift">
      <span className="grid size-11 shrink-0 place-items-center rounded-full text-white" style={{ background: def.color }}>
        <G size={22} />
      </span>
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-ink-3">Mystery badge found</div>
        <div className="truncate font-display text-[16px] font-bold">{def.name}</div>
      </div>
    </div>
  );
}
