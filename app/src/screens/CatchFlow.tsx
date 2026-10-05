import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { scoreOf, type Card, type CatchResult, type Status } from "../lib/api";
import { countdown, pad3, plural } from "../lib/format";
import { prefersReducedMotion, useCountUp } from "../lib/hooks";
import { computeProgress, rewardsFor, tierLabel, type RewardLine, type Rewards as RewardsData } from "../lib/progress";
import { saveOriginal, shouldAutoSave } from "../lib/savePhoto";
import { haptic, sfx } from "../lib/sfx";
import { CHARGE_MS, REVEAL_HAPTIC, tierClass, tierRank, type Tier } from "../lib/tiers";
import { CardBack, CardFront } from "../components/GameCard";
import { LevelBadge, MedalPin } from "../components/game";
import { IconNext } from "../components/glyphs";
import LiveCard from "../components/LiveCard";
import { Button, Chip } from "../components/ui";

type Phase = "developing" | "gotcha" | "enter" | "charging" | "flip" | "revealed" | "rejected" | "capped" | "error";

const STEPS = ["Looking closely", "Identifying your catch", "Reading its strengths", "Rolling for rarity", "Painting your card", "Adding the finishing touches"];

// Even a fast response gets a short build-up, so every catch has its moment.
const MIN_DEVELOP_MS = 3800;
const GOTCHA_MS = 1700;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function preload(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

/*
  One photo can hold several animals, and each becomes its own card. They're revealed one at a time,
  like opening a pack, and the rewards for all of them come after the last.
*/
export default function CatchFlow({
  photoUrl,
  original,
  request,
  before,
  status,
  onAgain,
  onCollection,
  onOpenCard,
  onExplorer,
}: {
  photoUrl: string;
  original: Blob;
  request: Promise<CatchResult>;
  before: Card[] | null;
  status: Status | null;
  onAgain: () => void;
  onCollection: () => void;
  onOpenCard: (id: string) => void;
  onExplorer: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const [phase, setPhase] = useState<Phase>("developing");
  const [result, setResult] = useState<CatchResult | null>(null);
  const [step, setStep] = useState(0);
  const [idx, setIdx] = useState(0); // which card is on stage
  const [dealt, setDealt] = useState(false); // the GOTCHA moment is over and cards are being revealed

  const caught = result?.status === "caught" ? result : null;
  const cards = useMemo(() => (caught ? (caught.cards?.length ? caught.cards : [caught.card]) : []), [caught]);
  const newIds = useMemo(() => new Set(caught?.newSpeciesIds ?? (caught?.newSpecies ? [caught.card.id] : [])), [caught]);
  const card = cards[idx];
  const many = cards.length > 1;
  const last = idx === cards.length - 1;

  useEffect(() => {
    if (phase !== "developing") return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2600);
    return () => clearInterval(t);
  }, [phase]);

  // The answer arrives: a friendly no, or GOTCHA.
  useEffect(() => {
    let alive = true;
    const pace = (ms: number) => wait(prefersReducedMotion() ? 0 : ms);
    (async () => {
      const [r] = await Promise.all([request, pace(MIN_DEVELOP_MS)]);
      if (!alive) return;
      setResult(r);
      if (r.status !== "caught") {
        if (r.status === "rejected") sfx.reject();
        setPhase(r.status);
        return;
      }
      const all = r.cards?.length ? r.cards : [r.card];
      all.forEach((c) => preload(c.artUrl));
      setPhase("gotcha");
      sfx.gotcha();
      haptic(all.length > 1 ? [18, 50, 18, 50, 34] : [18, 60, 34]);
      await pace(GOTCHA_MS + (all.length > 1 ? 500 : 0));
      if (!alive) return;
      setDealt(true);
    })();
    return () => {
      alive = false;
    };
  }, [request]);

  // Reveal the card on stage: it arrives, charges in its rarity color, then flips.
  useEffect(() => {
    if (!dealt || !card) return;
    let alive = true;
    const pace = (ms: number) => wait(prefersReducedMotion() ? 0 : ms);
    const tier = card.rarity;
    (async () => {
      setPhase("enter");
      await pace(700);
      if (!alive) return;
      setPhase("charging");
      sfx.charge(tier, CHARGE_MS[tier]);
      haptic(10);
      await Promise.all([pace(CHARGE_MS[tier]), Promise.race([preload(card.artUrl), wait(6000)])]);
      if (!alive) return;
      setPhase("flip");
      sfx.reveal(tier);
      haptic(REVEAL_HAPTIC[tier]);
      await pace(900);
      if (!alive) return;
      setPhase("revealed");
      if (idx === 0 && shouldAutoSave()) saveOriginal(original, card.name, "download").then(() => setSaved(true));
    })();
    return () => {
      alive = false;
    };
  }, [dealt, idx]);

  const flipped = phase === "flip" || phase === "revealed";
  const finished = phase === "revealed" && last;
  const score = useCountUp(card ? scoreOf(card.stats) : 0, flipped);
  const left = caught ? caught.cap - caught.used : 0;

  // What the catch earned, for every card in it: the collection before and after, compared.
  const rewards = useMemo(() => {
    if (!caught || !before || cards.some((c) => before.some((b) => b.id === c.id))) return null;
    return rewardsFor(
      computeProgress(before),
      computeProgress([...cards, ...before]),
      cards.map((c) => c.id),
    );
  }, [caught, cards, before]);

  const showDeveloping = phase === "developing" || phase === "gotcha" || (caught != null && !dealt);
  // The stage only takes the rarity color once the card starts charging, so nothing gives it away early.
  const tinted = card && (phase === "charging" || flipped);

  return (
    <div className={`reveal-backdrop fixed inset-0 z-50 overflow-hidden text-white ${tinted ? tierClass(card.rarity) : ""}`}>
      {showDeveloping && <Developing photoUrl={photoUrl} step={step} found={phase === "gotcha" ? cards : undefined} />}

      {caught && card && !showDeveloping && (
        <>
          <img src={photoUrl} alt="" className="fade-in absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-3xl saturate-150" />
          <div className={`reveal-layout pt-safe pb-safe ${finished ? "is-revealed" : ""}`}>
            <div className="reveal-main">
              <div className="flex h-[96px] shrink-0 flex-col items-center justify-end gap-2 pb-3 lg:h-[104px]">
                {many && (
                  <span className="rounded-full bg-white/12 px-3 py-1 text-[12.5px] font-semibold text-white/85 tabular">
                    Animal {idx + 1} of {cards.length}
                  </span>
                )}
                {flipped ? (
                  <div key={card.id} className="tier-banner text-[44px] lg:text-[56px]">
                    {card.rarity}
                  </div>
                ) : (
                  <div className="fade-in text-[13px] font-semibold tracking-[0.06em] text-white/70">{phase === "charging" ? "Revealing" : "Caught"}</div>
                )}
              </div>

              <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-5 lg:flex-none">
                <div key={card.id} className={`stage reveal-card ${tierClass(card.rarity)} is-${phase}`}>
                  <div className="aura" />
                  <div className="rays" />
                  {phase === "revealed" && <Motes tier={card.rarity} />}
                  <div className="card-enter">
                    <div className="shake">
                      <LiveCard active burst={phase === "flip" ? 1 + tierRank(card.rarity) * 0.35 : 0}>
                        <div
                          className={`flip ${flipped ? "" : "is-back"} ${phase === "revealed" ? "is-done cursor-pointer" : ""}`}
                          role={phase === "revealed" ? "button" : undefined}
                          aria-label={phase === "revealed" ? "Open card details" : undefined}
                          tabIndex={phase === "revealed" ? 0 : -1}
                          onClick={() => phase === "revealed" && onOpenCard(card.id)}
                          onKeyDown={(e) => phase === "revealed" && e.key === "Enter" && onOpenCard(card.id)}
                        >
                          <div className="flip__face">
                            <CardFront card={card} score={score} />
                          </div>
                          {phase !== "revealed" && (
                            <div className="flip__face flip__back">
                              <CardBack />
                            </div>
                          )}
                        </div>
                      </LiveCard>
                    </div>
                  </div>
                  {phase === "flip" && <Particles tier={card.rarity} />}
                </div>

                {/* Between cards: one more to reveal. */}
                {phase === "revealed" && !last && (
                  <div className="fade-up flex flex-col items-center gap-2.5">
                    {newIds.has(card.id) && <Chip tone="sun">New species</Chip>}
                    <Button variant="sun" className="min-w-[220px]" onClick={() => setIdx((i) => i + 1)}>
                      Next animal
                      <IconNext size={18} />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="reveal-side">
              {finished && (
                <>
                  {rewards && <Rewards r={rewards} newSpecies={newIds.size > 0} count={cards.length} onExplorer={onExplorer} />}
                  {many && (
                    <div className="fade-up mt-4" style={{ animationDelay: "0.2s" }}>
                      <div className="mb-2 text-[12.5px] font-semibold text-white/60">Caught together</div>
                      <div className="flex gap-2.5">
                        {cards.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => onOpenCard(c.id)}
                            aria-label={`${c.name}, ${c.rarity} ${c.species}`}
                            className="w-[64px] rounded-[6px] transition hover:-translate-y-1"
                          >
                            <CardFront card={c} size="thumb" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="fade-up mt-4 flex flex-wrap justify-center gap-2 lg:justify-start" style={{ animationDelay: "0.25s" }}>
                    {newIds.size > 0 && !rewards && <Chip tone="sun">New species</Chip>}
                    <Chip tone="glass">
                      {many
                        ? `No. ${pad3(cards[0].number)} to ${pad3(cards[cards.length - 1].number)} in your collection`
                        : `No. ${pad3(card.number)} in your collection`}
                    </Chip>
                    <button
                      onClick={async () => {
                        if ((await saveOriginal(original, cards[0].name)) === "saved") setSaved(true);
                      }}
                      className="inline-flex h-7 items-center rounded-full border border-white/20 px-3 text-[12.5px] font-semibold text-white/85 transition hover:bg-white/10"
                    >
                      {saved ? "Photo saved" : "Save original photo"}
                    </button>
                  </div>
                  {(caught.skipped ?? 0) > 0 && (
                    <p className="mt-3 text-center text-[13px] text-white/70 lg:text-left">
                      {plural(caught.skipped!, "more animal was", "more animals were")} in the photo, but that was the last of today's catches.
                    </p>
                  )}
                  {(caught.missed ?? 0) > 0 && (
                    <p className="mt-3 text-center text-[13px] text-white/70 lg:text-left">
                      {plural(caught.missed!, "animal", "animals")} couldn't be painted this time, so {caught.missed! > 1 ? "they didn't" : "it didn't"} use a catch.
                    </p>
                  )}
                  {/* On a phone the buttons stay pinned to the bottom while a long tally scrolls. */}
                  <div className="reveal-actions fade-up" style={{ animationDelay: "0.35s" }}>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="glass" onClick={onCollection}>
                        Collection
                      </Button>
                      <Button variant="sun" onClick={onAgain}>
                        {left > 0 ? "Keep catching" : "Done"}
                      </Button>
                    </div>
                    <p className="mt-3 text-center text-[12.5px] text-white/55 lg:text-left">
                      {left > 0 ? `${plural(left, "catch", "catches")} left today` : "That was your last catch today"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          {phase === "flip" && tierRank(card.rarity) >= 3 && <div className="tier-flash" />}
        </>
      )}

      {result && result.status === "rejected" && (
        <Outcome
          photoUrl={photoUrl}
          title="No animal spotted"
          body={result.message}
          note="This one didn't use a catch"
          actions={
            <Button variant="sun" onClick={onAgain}>
              Try again
            </Button>
          }
        />
      )}
      {result && result.status === "capped" && (
        <Outcome
          photoUrl={photoUrl}
          title="That's all for today"
          body={`You've made all ${result.cap} catches today. New catches in ${countdown(result.resetsAt)}.`}
          actions={
            <>
              <Button variant="sun" onClick={onCollection}>
                See your collection
              </Button>
              <Button variant="glass" onClick={onAgain}>
                Back to camera
              </Button>
            </>
          }
        />
      )}
      {result && result.status === "error" && (
        <Outcome
          photoUrl={photoUrl}
          title="Something went wrong"
          body={result.message}
          note={status ? "No catch was used" : undefined}
          actions={
            <Button variant="sun" onClick={onAgain}>
              Try again
            </Button>
          }
        />
      )}
    </div>
  );
}

// The frozen photo while the cards are made. When the catch lands, GOTCHA stamps onto it.
function Developing({ photoUrl, step, found }: { photoUrl: string; step: number; found?: Card[] }) {
  const caught = found != null && found.length > 0;
  return (
    <div className="pt-safe pb-safe mx-auto flex h-full max-w-[960px] flex-col px-4 lg:py-8">
      {/* The frame takes the photo's own shape, portrait from a phone or landscape from a webcam. */}
      <div className="flex min-h-0 flex-1 items-center justify-center pt-4">
        <div className={`develop-frame relative overflow-hidden rounded-[28px] bg-black shadow-lift ${caught ? "is-caught" : ""}`}>
          <img src={photoUrl} alt="" className="developing-photo block max-h-[calc(100dvh-210px)] max-w-full" />
          {!caught && <div className="scan" />}
          <div className={`reticle ${caught ? "is-locked" : "is-locking"}`}>
            <span />
            <span />
            <span />
            <span />
          </div>
          {caught && <GotchaStamp count={found.length} />}
        </div>
      </div>
      <div className="flex h-[150px] shrink-0 flex-col items-center justify-center text-center" aria-live="polite">
        {caught ? (
          <div key="caught" className="fade-up">
            <div className="text-[13px] font-semibold text-white/60">{found.length > 1 ? `${found.length} animals in one photo` : "Identified"}</div>
            {found.map((c) => (
              <div key={c.id} className={`mt-1 font-display leading-tight font-extrabold tracking-tight ${found.length > 1 ? "text-[22px]" : "text-[28px]"}`}>
                {capitalize(c.species)}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div key={step} className="fade-up font-display text-[24px] font-bold tracking-tight">
              {STEPS[step]}
            </div>
            <div className="develop-steps mt-4" aria-hidden>
              {STEPS.map((s, i) => (
                <span key={s} className={i < step ? "is-done" : i === step ? "is-now" : ""} />
              ))}
            </div>
            <div className="mt-3 text-[13px] text-white/55">Usually 10 to 30 seconds</div>
          </>
        )}
      </div>
    </div>
  );
}

const CONFETTI = ["#8e979f", "#2fa866", "#2f7de1", "#8b4de0", "#e8a317", "#ffffff", "#ff7a1a"];

function GotchaStamp({ count }: { count: number }) {
  const bits = useMemo(() => {
    const n = 26 + (count - 1) * 10;
    return Array.from({ length: n }, (_, i) => ({
        "--a": `${(360 / n) * i + Math.random() * 10}deg`,
        "--d": `${150 + Math.random() * 170}px`,
        "--c": CONFETTI[i % CONFETTI.length],
        "--r": `${Math.random() * 720 - 360}deg`,
        animationDelay: `${120 + Math.random() * 140}ms`,
      }));
  }, [count]);
  return (
    <div className="gotcha" role="status" aria-label={count > 1 ? `Gotcha, ${count} animals` : "Gotcha"}>
      <div className="gotcha__burst" />
      {!prefersReducedMotion() && bits.map((style, i) => <span key={i} className="confetti" style={style as CSSProperties} />)}
      <div className="gotcha__word">
        Gotcha!
        {count > 1 && <span className="gotcha__count">×{count}</span>}
      </div>
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString("en-US");

// What the catch earned, tallied line by line, then the XP bar fills (and levels up if it should).
function Rewards({ r: raw, newSpecies, count, onExplorer }: { r: RewardsData; newSpecies: boolean; count: number; onExplorer: () => void }) {
  const r = useMemo(() => compact(raw), [raw]);
  const reduced = prefersReducedMotion();
  const [shown, setShown] = useState(reduced ? r.lines.length : 0);
  const [stage, setStage] = useState<"before" | "fill" | "reset" | "after">(reduced ? "after" : "before");
  const total = useCountUp(r.total, shown >= r.lines.length, 700);

  useEffect(() => {
    if (reduced) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    r.lines.forEach((_, i) =>
      at(250 + i * 170, () => {
        setShown(i + 1);
        sfx.tick();
      }),
    );
    const done = 250 + r.lines.length * 170 + 250;
    at(done, () => setStage("fill"));
    if (r.levelUp) {
      at(done + 1150, () => {
        setStage("reset");
        sfx.levelUp();
        haptic([20, 40, 20, 40, 60]);
      });
      at(done + 1230, () => setStage("after"));
    }
    if (r.medals.length) at(done + (r.levelUp ? 1900 : 1100), () => sfx.badge());
    return () => timers.forEach(clearTimeout);
  }, [r, reduced]);

  const ratio = stage === "before" ? r.before.ratio : stage === "fill" ? (r.levelUp ? 1 : r.after.ratio) : stage === "reset" ? 0 : r.after.ratio;
  const leveled = stage === "reset" || stage === "after";
  const level = leveled ? r.after : r.before;

  return (
    <div className="rewards fade-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[13px] font-semibold text-white/60">{count > 1 ? `Rewards for ${count} animals` : "Catch rewards"}</div>
          <div className="mt-1 font-display text-[34px] leading-none font-extrabold tracking-tight text-[#6ff0cf] tabular lg:text-[40px]">
            +{fmt(total)} <span className="text-[0.55em] text-white/70">XP</span>
          </div>
        </div>
        {newSpecies && <Chip tone="sun">New species</Chip>}
      </div>

      {/* Every line on a computer. Phones get the short version. */}
      <ul className="mt-4 hidden space-y-1 lg:block">
        {r.lines.map((l, i) => (
          <RewardRow key={`${l.kind}-${l.label}`} line={l} visible={i < shown} />
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-1.5 lg:hidden">
        {r.lines
          .filter((l) => l.kind !== "catch")
          .map((l, i) => (
            <span key={l.label} className={`reward-tag ${i < shown ? "is-in" : ""}`}>
              {l.kind === "task" ? "Task done" : l.label}
              {l.count > 1 ? ` ×${l.count}` : ""} +{fmt(l.xp)}
            </span>
          ))}
      </div>

      <button onClick={onExplorer} className="mt-5 flex w-full items-center gap-3 text-left" aria-label="Open your explorer page">
        <LevelBadge level={level.level} ratio={ratio} size={46} className={leveled && r.levelUp ? "level-pop" : ""} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2 text-[13px]">
            <span className="font-bold">
              Level {level.level} · {level.rank}
            </span>
            <span className="text-white/60 tabular">{level.need ? `${fmt(Math.round(ratio * level.need))} / ${fmt(level.need)}` : "Top level"}</span>
          </div>
          <span className={`xpbar xpbar--dark mt-2 ${stage === "reset" ? "no-anim" : ""}`} style={{ "--p": Math.max(0.02, ratio) } as CSSProperties}>
            <i />
          </span>
        </div>
      </button>

      {r.levelUp && leveled && (
        <div className="level-up mt-4">
          <span className="font-display text-[18px] font-extrabold">Level up!</span>
          <span className="text-[13px] text-white/80">
            You're now level {r.after.level}
            {r.after.rank !== r.before.rank ? `, rank ${r.after.rank}` : ""}.
          </span>
        </div>
      )}

      {r.medals.length > 0 && (
        <div className="medal-earned fade-up mt-4" style={{ animationDelay: r.levelUp ? "1.9s" : "1.1s" }}>
          {r.medals.length === 1 ? (
            <div className="flex items-center gap-3">
              <MedalPin m={r.medals[0]} size={44} showProgress={false} />
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-white/60">New badge</div>
                <div className="text-[14px] font-bold">
                  {r.medals[0].def.name} · {tierLabel(r.medals[0])}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex shrink-0 -space-x-2.5">
                {r.medals.slice(0, 4).map((m) => (
                  <MedalPin key={m.def.id} m={m} size={40} showProgress={false} />
                ))}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-white/60">{r.medals.length} new badges</div>
                <div className="text-[13.5px] leading-snug font-bold">{r.medals.map((m) => m.def.name).join(", ")}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// The tally reads best short: the day's field tasks share one line.
function compact(r: RewardsData): RewardsData {
  const tasks = r.lines.filter((l) => l.kind === "task");
  if (tasks.length < 2) return r;
  const merged: RewardLine = { kind: "task", label: "Field tasks", xp: tasks.reduce((s, l) => s + l.xp, 0), count: tasks.length };
  const lines = r.lines.filter((l) => l.kind !== "task");
  const at = r.lines.findIndex((l) => l.kind === "task");
  lines.splice(at, 0, merged);
  return { ...r, lines };
}

function RewardRow({ line, visible }: { line: RewardLine; visible: boolean }) {
  const label = line.kind === "task" && line.count === 1 ? `Field task: ${line.label}` : line.label;
  return (
    <li className={`reward-line ${visible ? "is-in" : ""} reward-line--${line.kind}`}>
      <span className="truncate">
        {label}
        {line.count > 1 && <span className="text-white/50"> ×{line.count}</span>}
      </span>
      <b className="tabular">+{fmt(line.xp)}</b>
    </li>
  );
}

// Slow glowing specks that drift up around the finished card.
function Motes({ tier }: { tier: Tier }) {
  const count = 6 + tierRank(tier) * 4;
  const motes = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        "--x": `${-15 + Math.random() * 130}%`,
        "--s": `${3 + Math.random() * 5}px`,
        "--rise": `${180 + Math.random() * 220}px`,
        "--drift": `${-30 + Math.random() * 60}px`,
        animationDuration: `${5 + Math.random() * 5}s`,
        animationDelay: `${-Math.random() * 8}s`,
      })),
    [count],
  );
  if (prefersReducedMotion()) return null;
  return (
    <>
      {motes.map((style, i) => (
        <span key={i} className="mote" style={style as CSSProperties} />
      ))}
    </>
  );
}

function Particles({ tier }: { tier: Tier }) {
  const count = 8 + tierRank(tier) * 6;
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        "--a": `${(360 / count) * i + Math.random() * 14}deg`,
        "--d": `${130 + Math.random() * 120}px`,
        "--s": `${4 + Math.random() * 6}px`,
        animationDelay: `${Math.random() * 120}ms`,
      })),
    [count],
  );
  return (
    <>
      {parts.map((style, i) => (
        <span key={i} className="particle" style={style as CSSProperties} />
      ))}
    </>
  );
}

function Outcome({
  photoUrl,
  title,
  body,
  note,
  actions,
}: {
  photoUrl: string;
  title: string;
  body: string;
  note?: string;
  actions: ReactNode;
}) {
  return (
    <div className="pt-safe pb-safe mx-auto flex h-full max-w-[480px] flex-col px-5 lg:justify-center lg:py-16">
      <div className="fade-up flex flex-1 flex-col items-center justify-center text-center lg:flex-none">
        <div className="mb-8 aspect-[4/5] w-40 overflow-hidden rounded-[24px] bg-white/5 ring-1 ring-white/10">
          <img src={photoUrl} alt="" className="h-full w-full object-cover opacity-50 grayscale" />
        </div>
        <h2 className="font-display text-[32px] font-extrabold tracking-tight">{title}</h2>
        <p className="mt-3 max-w-[320px] text-[15px] leading-relaxed text-white/70">{body}</p>
        {note && (
          <Chip tone="glass" className="mt-6">
            {note}
          </Chip>
        )}
      </div>
      <div className="grid shrink-0 gap-2 lg:mt-10">{actions}</div>
    </div>
  );
}
