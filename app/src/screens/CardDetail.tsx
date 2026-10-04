import { useEffect, useState } from "react";
import { scoreOf, TRAIT_KEYS, TRAIT_LABELS, type Card } from "../lib/api";
import { classClass, classLabel } from "../lib/classes";
import { formatCaught, pad3 } from "../lib/format";
import { useEscape, useSwipe } from "../lib/hooks";
import { boostLabel, tierClass } from "../lib/tiers";
import { CardFront } from "../components/GameCard";
import { IconClose } from "../components/icons";
import { IconButton, Label, Panel } from "../components/ui";
import CardZoom from "./CardZoom";

// Boosted stats run up to 200 (100 times the Legendary boost), so bars use that scale.
const STAT_MAX = 200;

export default function CardDetail({
  card,
  prev,
  next,
  index,
  total,
  onMove,
  onClose,
}: {
  card: Card;
  prev: string | null;
  next: string | null;
  index: number;
  total: number;
  onMove: (id: string) => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(false);
  useEscape(() => (zoom ? setZoom(false) : onClose()));
  const score = scoreOf(card.stats);
  const natural = scoreOf(card.traits);

  const goPrev = () => prev && onMove(prev);
  const goNext = () => next && onMove(next);
  const swipe = useSwipe(goNext, goPrev);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (zoom) return; // the enlarged card handles its own keys
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      className="fade-in fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-[rgb(12_20_17_/_0.5)] backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={card.name}
      onClick={onClose}
    >
      {zoom && <CardZoom card={card} prev={prev} next={next} index={index} total={total} onMove={onMove} onClose={() => setZoom(false)} />}
      <div
        className={`rise-in relative min-h-full bg-sand lg:mx-auto lg:my-10 lg:min-h-0 lg:max-w-[1040px] lg:rounded-[32px] lg:shadow-lift ${tierClass(card.rarity)} ${classClass(card.animalClass, card.isStatue)}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-safe flex items-center justify-between px-4 lg:px-8 lg:pt-6">
          <span className="font-mono text-[12.5px] tracking-[0.1em] text-ink-3">No. {pad3(card.number)}</span>
          <IconButton label="Close" onClick={onClose} className="-mr-2">
            <IconClose />
          </IconButton>
        </div>

        <div className="grid gap-8 px-4 pt-2 pb-12 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-10 lg:px-8 lg:pb-8">
          <div {...swipe} className="lg:sticky lg:top-6 lg:self-start">
            <div className="relative mx-auto w-[min(86vw,400px)]">
              <div key={card.id} className="fade-in cursor-zoom-in" onClick={() => setZoom(true)}>
                <CardFront card={card} tilt />
              </div>
              <NavArrow dir="prev" disabled={!prev} onClick={goPrev} />
              <NavArrow dir="next" disabled={!next} onClick={goNext} />
            </div>
            <p className="mt-4 text-center text-[12.5px] text-ink-3">Tap to enlarge. Swipe or use arrow keys for the next card.</p>
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="font-display text-[34px] leading-none font-extrabold tracking-tight">{card.name}</h2>
              <p className="mt-2 text-[15px] text-ink-2">
                {classLabel(card.animalClass, card.isStatue)} Â· {card.species}
              </p>
            </div>

            <Panel className="p-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2.5 text-[15px] font-semibold">
                  <span className="tier-dot" />
                  {card.rarity}
                </span>
                <span className="text-[13px] text-ink-3">{boostLabel(card.rarity)}</span>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <div className="tier-ink font-display text-[52px] leading-none font-extrabold tracking-tight tabular">{score}</div>
                  <Label className="mt-2">Score</Label>
                </div>
                {score > natural && (
                  <div className="text-right text-[13px] leading-relaxed text-ink-3">
                    {natural} natural
                    <br />+{score - natural} from rarity
                  </div>
                )}
              </div>
              <div className="mt-6 space-y-3.5">
                {TRAIT_KEYS.map((k) => (
                  <TraitRow
                    key={k}
                    label={TRAIT_LABELS[k]}
                    base={card.traits[k]}
                    value={card.stats[k]}
                    note={card.facts?.trait_notes?.[k]}
                  />
                ))}
              </div>
            </Panel>

            <FieldGuide card={card} />

            <Panel className="p-5">
              <Label>Special</Label>
              <div className="mt-2 font-display text-[22px] leading-tight font-bold">{card.special.name}</div>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{card.special.description}</p>
            </Panel>

            <Panel className="p-5">
              <p className="font-display text-[19px] leading-snug font-semibold">{card.description}</p>
              <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-[14px]">
                <dt className="text-ink-3">Species</dt>
                <dd className="text-right">
                  {card.species}
                  {card.isStatue ? " (statue)" : ""}
                </dd>
                <dt className="text-ink-3">Caught</dt>
                <dd className="text-right">{formatCaught(card.createdAt)}</dd>
                <dt className="text-ink-3">Card</dt>
                <dd className="text-right">
                  No. {pad3(card.number)}
                  {card.isSample ? ", sample" : ""}
                </dd>
              </dl>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavArrow({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      aria-label={dir === "prev" ? "Previous card" : "Next card"}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-paper text-ink shadow-soft transition hover:scale-105 disabled:opacity-0 lg:grid ${
        dir === "prev" ? "-left-16" : "-right-16"
      }`}
    >
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}

function TraitRow({ label, base, value, note }: { label: string; base: number; value: number; note?: string }) {
  const pct = (n: number) => `${(n / STAT_MAX) * 100}%`;
  return (
    <div>
      <div className="grid grid-cols-[72px_1fr_40px] items-center gap-3">
        <span className="text-[13.5px] text-ink-2">{label}</span>
        <div className="statbar">
          <div className="statbar__base" style={{ width: pct(base) }} />
          {value > base && <div className="statbar__boost" style={{ left: pct(base), width: pct(value - base) }} />}
        </div>
        <span className="text-right font-display text-[17px] font-bold tabular">{value}</span>
      </div>
      {note && <p className="mt-1.5 pl-[84px] text-[12.5px] leading-snug text-ink-3">{note}</p>}
    </div>
  );
}

// Real-world facts about the animal, tied back to how the game scored it.
function FieldGuide({ card }: { card: Card }) {
  const f = card.facts;
  if (!f) {
    return (
      <Panel className="p-5">
        <Label>Field guide</Label>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
          This card was made before facts were recorded. New catches include a full field guide.
        </p>
      </Panel>
    );
  }
  const rows: [string, string][] = [
    ["Scientific name", f.scientific_name],
    ["Type", f.variety],
    ["Habitat", f.habitat],
    ["Diet", f.diet],
    ["Lifespan", f.lifespan],
    ["Size", f.size],
    ["Status", f.conservation_status],
  ];
  return (
    <Panel className="p-5">
      <Label>Field guide</Label>
      <div className="mt-2 font-display text-[22px] leading-tight font-bold">{f.common_name || card.species}</div>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-[14px]">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-ink-3">{k}</dt>
              <dd className={`text-right ${k === "Scientific name" ? "italic" : ""}`}>{v}</dd>
            </div>
          ))}
      </dl>
      {f.fun_facts?.length > 0 && (
        <ul className="mt-5 space-y-2.5 border-t border-line pt-4">
          {f.fun_facts.map((fact) => (
            <li key={fact} className="flex gap-3 text-[14.5px] leading-relaxed text-ink-2">
              <span className="tier-dot mt-[7px]" />
              {fact}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

