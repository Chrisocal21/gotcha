import { useRef, type CSSProperties, type PointerEvent } from "react";
import { scoreOf, TRAIT_KEYS, type Card, type TraitKey } from "../lib/api";
import { classClass, classLabel } from "../lib/classes";
import { pad3 } from "../lib/format";
import { classKeyOf } from "../lib/progress";
import { BOOST, ODDS, tierClass, tierRank } from "../lib/tiers";
import { ClassGlyph } from "./glyphs";
import Logo from "./Logo";

export type CardFace = Pick<
  Card,
  | "number"
  | "name"
  | "species"
  | "isStatue"
  | "isSample"
  | "animalClass"
  | "rarity"
  | "stats"
  | "artUrl"
  | "special"
  | "description"
  | "createdAt"
>;

// Printed on the card, so it reads as a keepsake of the day it was caught.
const caughtOn = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function ClassPill({ card }: { card: CardFace }) {
  return (
    <span className="gcard__class">
      <ClassGlyph cls={classKeyOf(card)} strokeWidth={2.6} />
      {classLabel(card.animalClass, card.isStatue)}
    </span>
  );
}

const SHORT: Record<TraitKey, string> = { power: "PWR", speed: "SPD", defense: "DEF", agility: "AGI", senses: "SNS" };

// Kept between the header and the ability box so they never sit on text.
const SPARKS = [
  { top: "24%", left: "14%", delay: "0s" },
  { top: "30%", left: "80%", delay: "0.7s" },
  { top: "46%", left: "9%", delay: "1.4s" },
  { top: "38%", left: "62%", delay: "0.35s" },
  { top: "22%", left: "50%", delay: "1.9s" },
  { top: "52%", left: "86%", delay: "1.1s" },
];

export function CardFront({
  card,
  size = "full",
  tilt = false,
  score,
  className = "",
}: {
  card: CardFace;
  size?: "full" | "thumb";
  tilt?: boolean;
  score?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rank = tierRank(card.rarity);
  const fullArt = rank >= 3;
  const top = TRAIT_KEYS.reduce((a, b) => (card.stats[b] > card.stats[a] ? b : a));

  function move(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    clearTimeout(settle.current);
    el.classList.remove("is-settling");
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    el.style.setProperty("--rx", `${(0.5 - y) * 26}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 32}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
    el.style.setProperty("--hx", `${x * 100}%`);
    el.style.setProperty("--hy", `${y * 100}%`);
    el.classList.add("is-tilting");
  }

  function rest() {
    const el = ref.current;
    if (!el || !el.classList.contains("is-tilting")) return;
    el.classList.replace("is-tilting", "is-settling");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    settle.current = setTimeout(() => el.classList.remove("is-settling"), 650);
  }

  const tiltHandlers = tilt
    ? {
        onPointerMove: move,
        onPointerDown: move,
        onPointerLeave: rest,
        onPointerUp: rest,
        onPointerCancel: rest,
        style: { touchAction: "pan-y" },
      }
    : {};

  return (
    <div className={`card-box ${className}`}>
      <div
        ref={ref}
        className={`gcard ${size === "thumb" ? "gcard--thumb" : ""} ${fullArt ? "gcard--fullart" : "gcard--framed"} ${tierClass(card.rarity)} ${classClass(card.animalClass, card.isStatue)}`}
        {...tiltHandlers}
      >
        <div className="gcard__body">
          <div className="gcard__art">
            <img src={card.artUrl} alt="" draggable={false} loading={size === "thumb" ? "lazy" : "eager"} decoding="async" />
            {fullArt && <div className="gcard__holo" />}
            {rank === 4 &&
              SPARKS.map((s, i) => (
                <span key={i} className="gcard__spark" style={{ top: s.top, left: s.left, animationDelay: s.delay }} />
              ))}
          </div>

          <div className="gcard__head">
            <div className="gcard__name">{card.name}</div>
            <div className="gcard__score">
              <span className="gcard__score-label">Score</span>
              <span className="gcard__score-num">{score ?? scoreOf(card.stats)}</span>
            </div>
          </div>
          <div className="gcard__sub">
            <ClassPill card={card} />
            <span className="gcard__species">{card.species}</span>
          </div>

          <div className="gcard__spacer" />

          <div className="gcard__meta">
            <span className="gcard__pips" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={`gcard__pip ${i <= rank ? "is-on" : ""}`} />
              ))}
            </span>
            <span>{card.rarity}</span>
          </div>
          <div className="gcard__ability">
            <div className="gcard__ability-name">{card.special.name}</div>
            <div className="gcard__ability-text">{card.special.description}</div>
          </div>
          <div className="gcard__stats">
            {TRAIT_KEYS.map((k) => (
              <div key={k} className={`gcard__stat ${k === top ? "is-top" : ""}`}>
                <b>{card.stats[k]}</b>
                <span>{SHORT[k]}</span>
              </div>
            ))}
          </div>
          <div className="gcard__flavor">{card.description}</div>
          <div className="gcard__foot">
            <span>
              No. {pad3(card.number)} · {caughtOn(card.createdAt)}
            </span>
            <span>{card.isSample ? "Sample card" : "Series one"}</span>
          </div>

          <div className="gcard__glare" />
        </div>
      </div>
    </div>
  );
}

const STAT_MAX = 200;
const STAT_NAMES: Record<TraitKey, string> = { power: "POWER", speed: "SPEED", defense: "DEFENSE", agility: "AGILITY", senses: "SENSES" };

// The flip side of a card: only game numbers (score, rarity, boost, stats, ability). Real-world facts live elsewhere.
export function CardStats({ card, className = "" }: { card: Card; className?: string }) {
  const natural = scoreOf(card.traits);
  const score = scoreOf(card.stats);
  const rank = tierRank(card.rarity);
  const pct = (n: number) => `${(n / STAT_MAX) * 100}%`;
  return (
    <div className={`card-box ${className}`}>
      <div className={`gcard gcard--framed ${tierClass(card.rarity)} ${classClass(card.animalClass, card.isStatue)}`}>
        <div className="gcard__body">
          <div className="gstats">
            <div className="gstats__top">
              <span className="gstats__label">Game stats</span>
              <span className="gcard__pips" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className={`gcard__pip ${i <= rank ? "is-on" : ""}`} />
                ))}
              </span>
            </div>
            <div className="gstats__name">{card.name}</div>

            <div className="gstats__hero">
              <div>
                <div className="gstats__score">{score}</div>
                <div className="gstats__label">Score</div>
              </div>
              <div className="gstats__rarity">
                <b>{card.rarity}</b>
                <span>{BOOST[card.rarity] === 0 ? "No stat boost" : `+${Math.round(BOOST[card.rarity] * 100)}% stat boost`}</span>
                <span>About {ODDS[card.rarity]} in 100 catches</span>
              </div>
            </div>

            <div className="gstats__rows">
              {TRAIT_KEYS.map((k) => (
                <div key={k} className="gstats__row">
                  <span className="gstats__label">{STAT_NAMES[k]}</span>
                  <div className="gstats__bar">
                    <i className="gstats__base" style={{ width: pct(card.traits[k]) }} />
                    {card.stats[k] > card.traits[k] && (
                      <i className="gstats__boost" style={{ left: pct(card.traits[k]), width: pct(card.stats[k] - card.traits[k]) }} />
                    )}
                  </div>
                  <b>{card.stats[k]}</b>
                </div>
              ))}
            </div>
            {score > natural && <div className="gstats__note">{natural} natural + {score - natural} from rarity</div>}

            <div className="gcard__ability">
              <div className="gcard__ability-name">{card.special.name}</div>
              <div className="gstats__ability-text">{card.special.description}</div>
            </div>

            <div className="gcard__foot">
              <span>No. {pad3(card.number)}</span>
              <ClassPill card={card} />
            </div>
          </div>
          <div className="gcard__glare" />
        </div>
      </div>
    </div>
  );
}

// The back of every card: the catch button's spectrum ring and sun core, on your chosen card-back color.
export function CardBack({ className = "" }: { className?: string }) {
  return (
    <div className={`card-box ${className}`}>
      <div className="gback">
        <div className="gback__inner">
          <div className="gback__ring">
            <span className="gback__core" />
          </div>
          <Logo />
          <span className="gback__series">Series one</span>
        </div>
      </div>
    </div>
  );
}

// Three sample cards fanned out, for first-run screens. --w sets the width of one card.
export function CardFan({ cards, width = 180, className = "" }: { cards: CardFace[]; width?: number; className?: string }) {
  return (
    <div className={`fan ${className}`} style={{ "--w": `${width}px` } as CSSProperties} aria-hidden>
      {cards.slice(0, 3).map((c, i) => (
        <div key={c.name} className={`fan__card fan__card--${i}`}>
          <CardFront card={c} size="thumb" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return <div className="skeleton aspect-[5/7] w-full rounded-[14px]" />;
}
