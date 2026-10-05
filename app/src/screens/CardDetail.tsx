import { useEffect, useState } from "react";
import { scoreOf, TRAIT_KEYS, TRAIT_LABELS, type Card } from "../lib/api";
import { classClass } from "../lib/classes";
import { formatCaught, pad3, plural } from "../lib/format";
import { useEscape, useSwipe } from "../lib/hooks";
import { CLASS_NAMES, classKeyOf, isWild, type Progress } from "../lib/progress";
import { seriesName } from "../lib/series";
import { boostLabel, ODDS, tierClass } from "../lib/tiers";
import { CardFront } from "../components/GameCard";
import { ClassEmblem, SectionTitle, xpText } from "../components/game";
import CardActions from "../components/CardActions";
import { IconClose, IconNext, IconPrev, IconWild } from "../components/glyphs";
import PrintDialog from "../components/PrintDialog";
import { IconButton, Label, Panel } from "../components/ui";
import CardZoom from "./CardZoom";

// Boosted stats run up to 200 (100 times the Legendary boost), so bars use that scale.
const STAT_MAX = 200;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function CardDetail({
  card,
  progress,
  prev,
  next,
  index,
  total,
  onMove,
  onClose,
}: {
  card: Card;
  progress: Progress | null;
  prev: string | null;
  next: string | null;
  index: number;
  total: number;
  onMove: (id: string) => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(false);
  const [printing, setPrinting] = useState(false);
  useEscape(() => (printing ? undefined : zoom ? setZoom(false) : onClose()));
  const score = scoreOf(card.stats);
  const natural = scoreOf(card.traits);
  const cls = classKeyOf(card);

  const goPrev = () => prev && onMove(prev);
  const goNext = () => next && onMove(next);
  const swipe = useSwipe(goNext, goPrev);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (zoom || printing) return; // the enlarged card and the print dialog handle their own keys
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
      {printing && <PrintDialog card={card} onClose={() => setPrinting(false)} />}
      {zoom && <CardZoom card={card} prev={prev} next={next} index={index} total={total} onMove={onMove} onClose={() => setZoom(false)} />}
      <div
        className={`rise-in relative min-h-full bg-sand lg:mx-auto lg:my-10 lg:min-h-0 lg:max-w-[1080px] lg:rounded-[32px] lg:shadow-lift ${tierClass(card.rarity)} ${classClass(card.animalClass, card.isStatue)}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-safe flex items-center justify-between px-4 lg:px-8 lg:pt-6">
          <span className="font-mono text-[12.5px] tracking-[0.1em] text-ink-3">
            No. {pad3(card.number)}
            {index >= 0 && total > 1 ? ` · ${index + 1} of ${total}` : ""}
          </span>
          <IconButton label="Close" onClick={onClose} className="-mr-2">
            <IconClose size={22} strokeWidth={1.8} />
          </IconButton>
        </div>

        <div className="grid gap-8 px-4 pt-2 pb-12 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-10 lg:px-8 lg:pb-8">
          <div {...swipe} className="lg:sticky lg:top-6 lg:self-start">
            <div className="relative mx-auto w-[min(86vw,420px)]">
              <div key={card.id} className="fade-in cursor-zoom-in" onClick={() => setZoom(true)}>
                <CardFront card={card} tilt />
              </div>
            </div>
            <div className="mx-auto mt-4 flex w-[min(86vw,420px)] items-center justify-between gap-3">
              <NavArrow dir="prev" disabled={!prev} onClick={goPrev} />
              <p className="text-center text-[12.5px] leading-snug text-ink-3">
                {window.matchMedia("(pointer: coarse)").matches ? "Tap" : "Click"} the card to hold it and turn it over
              </p>
              <NavArrow dir="next" disabled={!next} onClick={goNext} />
            </div>
            <CardActions card={card} onPrint={() => setPrinting(true)} />
          </div>

          <div className="min-w-0 space-y-4">
            <header>
              <h2 className="font-display text-[34px] leading-none font-extrabold tracking-tight lg:text-[40px]">{card.name}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-2 rounded-full bg-paper py-1 pr-3.5 pl-1 text-[14px] font-semibold shadow-soft">
                  <ClassEmblem cls={cls} size={26} />
                  {card.species}
                </span>
                <span className="flex items-center gap-2 rounded-full bg-paper px-3.5 py-1.5 text-[14px] font-semibold shadow-soft">
                  <span className="tier-dot" />
                  {card.rarity}
                </span>
                {isWild(card) && (
                  <span className="flex items-center gap-1.5 rounded-full bg-canopy-soft px-3 py-1.5 text-[13.5px] font-semibold text-canopy shadow-soft">
                    <IconWild size={15} strokeWidth={2.4} />
                    Wild species
                  </span>
                )}
                <span className="text-[13.5px] text-ink-3">Caught {formatCaught(card.createdAt)}</span>
              </div>
            </header>

            <Panel className="p-5 sm:p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="tier-ink font-display text-[54px] leading-none font-extrabold tracking-tight tabular">{score}</div>
                  <Label className="mt-2">Score</Label>
                </div>
                <div className="text-right text-[13px] leading-relaxed text-ink-3">
                  <div className="font-semibold text-ink-2">{boostLabel(card.rarity)}</div>
                  {score > natural ? (
                    <>
                      {natural} natural, +{score - natural} from rarity
                    </>
                  ) : (
                    `About ${ODDS[card.rarity]} in 100 catches are ${card.rarity}`
                  )}
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {TRAIT_KEYS.map((k) => (
                  <TraitRow key={k} label={TRAIT_LABELS[k]} base={card.traits[k]} value={card.stats[k]} note={card.facts?.trait_notes?.[k]} />
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-paper-2 p-4">
                <div className="flex items-center gap-2 font-display text-[18px] font-bold">
                  <span className="size-2.5 rounded-full bg-(--cls)" />
                  {card.special.name}
                </div>
                <p className="mt-1 text-[14.5px] leading-relaxed text-ink-2">{card.special.description}</p>
              </div>
            </Panel>

            <FieldGuide card={card} />
            <CatchRecord card={card} progress={progress} onMove={onMove} />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavArrow({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  const Icon = dir === "prev" ? IconPrev : IconNext;
  return (
    <button
      aria-label={dir === "prev" ? "Previous card" : "Next card"}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-paper text-ink shadow-soft transition hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
    >
      <Icon size={20} />
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
      <Panel className="p-5 sm:p-6">
        <SectionTitle title="Field guide" />
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">This card was made before facts were recorded. New catches include a full field guide.</p>
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
    <Panel className="p-5 sm:p-6">
      <SectionTitle title="Field guide" sub={capitalize(f.common_name || card.species)} />
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

// The card as a memory: when it was caught, what it meant for the journal, what it earned.
function CatchRecord({ card, progress, onMove }: { card: Card; progress: Progress | null; onMove: (id: string) => void }) {
  const lines = progress?.ledger.get(card.id) ?? [];
  const earned = lines.reduce((s, l) => s + l.xp, 0);
  const entry = progress?.journal.find((s) => s.key === card.species.trim().toLowerCase());
  const firstOfKind = entry?.first.id === card.id;
  const cls = classKeyOf(card);
  const mates = (progress?.together.get(card.id) ?? []).filter((c) => c.id !== card.id);
  return (
    <Panel className="p-5 sm:p-6">
      <SectionTitle title="Catch record" />
      <blockquote className="mt-3 border-l-[3px] border-(--cls) pl-4 font-display text-[18px] leading-snug font-semibold">{card.description}</blockquote>
      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-[14px]">
        <dt className="text-ink-3">Caught</dt>
        <dd className="text-right">{formatCaught(card.createdAt)}</dd>
        <dt className="text-ink-3">Card</dt>
        <dd className="text-right">
          No. {pad3(card.number)}, {card.isSample ? "sample card" : seriesName(card.series)}
        </dd>
        {entry && (
          <>
            <dt className="text-ink-3">Species</dt>
            <dd className="text-right">
              {firstOfKind ? "Your first one" : `Caught ${plural(entry.count, "time")}`}
              {card.isStatue ? " (statue)" : ""}
            </dd>
          </>
        )}
        <dt className="text-ink-3">Class</dt>
        <dd className="text-right">{CLASS_NAMES[cls].one}</dd>
        {mates.length > 0 && (
          <>
            <dt className="text-ink-3">Caught with</dt>
            <dd className="flex flex-wrap justify-end gap-1.5">
              {mates.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onMove(m.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full bg-paper-2 px-2.5 py-0.5 text-[13px] font-semibold transition hover:bg-paper-3 ${tierClass(m.rarity)}`}
                >
                  <span className="tier-dot !size-[7px]" />
                  {m.name}
                </button>
              ))}
            </dd>
          </>
        )}
      </dl>
      {earned > 0 && (
        <div className="mt-5 rounded-2xl bg-xp-soft/70 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[13.5px] font-semibold text-xp-ink">Earned on the day</span>
            <span className="font-display text-[20px] font-extrabold text-xp-ink tabular">+{xpText(earned)}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {lines.map((l) => (
              <span key={`${l.kind}-${l.label}`} className="rounded-full bg-paper px-2.5 py-1 text-[12px] font-semibold text-ink-2">
                {l.kind === "task" ? `Task: ${l.label}` : l.label} +{l.xp}
              </span>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
