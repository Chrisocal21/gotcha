import { useState, type CSSProperties } from "react";
import type { Status } from "../lib/api";
import { countdown, plural } from "../lib/format";
import { useNow } from "../lib/hooks";
import { saveProfile } from "../lib/api";
import { useTapCounter } from "../lib/eggs";
import { CLERK_KEY } from "../components/AuthGate";
import { getExplorerName, setExplorerName } from "../lib/prefs";
import { CLASS_NAMES, CLASS_ORDER, isSecret, MEDAL_TIERS, nextRank, XP, type DayLog, type MedalDef, type MedalState, type Progress } from "../lib/progress";
import { ODDS, TIERS, tierClass } from "../lib/tiers";
import { CardFront } from "../components/GameCard";
import { ClassEmblem, LevelBadge, MedalPin, SectionTitle, StampRow, TaskRow, XpBar, xpText } from "../components/game";
import { Button, Panel, Segmented } from "../components/ui";
import Leaderboard from "../components/Leaderboard";

type Tab = "overview" | "badges" | "journal" | "board";

const TABS: { value: Tab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "badges", label: "Badges" },
  { value: "journal", label: "Journal" },
  { value: "board", label: "Leaderboard" },
];

// Remembered for the session, so coming back from a card keeps your tab.
let lastTab: Tab = "overview";

export default function ExplorerScreen({
  progress,
  status,
  onOpenCard,
}: {
  progress: Progress | null;
  status: Status | null;
  onOpenCard: (id: string) => void;
}) {
  const [tab, setTabState] = useState<Tab>(lastTab);
  const setTab = (t: Tab) => {
    lastTab = t;
    setTabState(t);
  };

  if (!progress) {
    return (
      <div className="page max-w-[1080px]">
        <div className="skeleton h-[240px] rounded-[30px]" />
        <div className="skeleton mt-6 h-[420px] rounded-(--r-panel)" />
      </div>
    );
  }
  return (
    <div className="page max-w-[1080px]">
      <Hero p={progress} streak={status?.streak ?? progress.currentStreak} />
      <div className="mt-6 flex justify-center lg:justify-start">
        <Segmented value={tab} onChange={setTab} options={TABS} />
      </div>
      {tab === "overview" && (
        <div className="fade-in mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2 lg:items-start">
          <FieldTasks p={progress} status={status} />
          <div className="min-w-0 space-y-5">
            <RoadAhead p={progress} />
            <NextBadges p={progress} onSeeAll={() => setTab("badges")} />
            <ClassStrip p={progress} />
            <RarityMix p={progress} />
          </div>
        </div>
      )}
      {tab === "badges" && <Badges p={progress} />}
      {tab === "journal" && <Journal days={progress.days} onOpenCard={onOpenCard} />}
      {tab === "board" && <Leaderboard />}
    </div>
  );
}

function Hero({ p, streak }: { p: Progress; streak: number }) {
  const [name, setName] = useState(getExplorerName);
  const [editing, setEditing] = useState(false);
  const tapLevel = useTapCounter("e-level", 10);

  function save(value: string) {
    setExplorerName(value);
    setName(value.trim().slice(0, 24));
    if (CLERK_KEY) saveProfile({ displayName: value.trim().slice(0, 24) }).catch(() => {});
    setEditing(false);
  }

  return (
    <section className="hero">
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 lg:flex-1">
          <div className="flex items-center gap-4 lg:gap-6">
            <span onClick={tapLevel}>
              <LevelBadge level={p.level} ratio={p.ratio} label className="hero__badge" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold text-white/75">
                Level {p.level} · {p.rank}
              </div>
            {editing ? (
              <input
                autoFocus
                defaultValue={name}
                maxLength={24}
                aria-label="Explorer name"
                placeholder="Your name"
                onBlur={(e) => save(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") save(e.currentTarget.value);
                  if (e.key === "Escape") setEditing(false);
                }}
                className="mt-1 w-full max-w-[340px] rounded-xl border border-white/30 bg-white/10 px-3 py-0.5 font-display text-[28px] font-extrabold tracking-tight text-white outline-none placeholder:text-white/40 sm:text-[40px]"
              />
            ) : (
              <button onClick={() => setEditing(true)} className="group mt-0.5 flex max-w-full flex-col items-start text-left" title="Change your explorer name">
                <h1 className="max-w-full truncate font-display text-[30px] leading-[1.08] font-extrabold tracking-tight sm:text-[42px]">{name || "Explorer"}</h1>
                <span className="text-[12.5px] font-semibold text-white/60 underline-offset-4 group-hover:text-white group-hover:underline">
                  {name ? "Edit name" : "Add your name"}
                </span>
              </button>
            )}
            </div>
          </div>
            <div className="mt-5 w-full lg:max-w-[460px]">
              <XpBar ratio={p.ratio} tone="dark" className="!h-2.5" />
              <div className="mt-2 flex flex-wrap justify-between gap-x-4 text-[13px] text-white/75">
                <span>
                  {p.need ? (
                    <>
                      <b className="font-bold text-white tabular">{p.into.toLocaleString("en-US")}</b> / {p.need.toLocaleString("en-US")} XP to level {p.level + 1}
                    </>
                  ) : (
                    "Top level reached"
                  )}
                </span>
                <span className="tabular">{xpText(p.xp)} total</span>
              </div>
            </div>
        </div>
        <div className="grid w-full grid-cols-4 gap-2 sm:gap-2.5 lg:w-[420px]">
          <HeroStat value={p.cards} label={p.cards === 1 ? "Card" : "Cards"} />
          <HeroStat value={p.species} label="Species" />
          <HeroStat value={streak} label="Streak" />
          <HeroStat value={p.medals.filter((m) => m.tier > 0).length} label="Badges" />
        </div>
      </div>
    </section>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="hero__stat">
      <div className="font-display text-[24px] leading-none font-extrabold tracking-tight tabular sm:text-[28px]">{value.toLocaleString("en-US")}</div>
      <div className="mt-1.5 text-[11.5px] font-semibold text-white/70 sm:text-[12px]">{label}</div>
    </div>
  );
}

function FieldTasks({ p, status }: { p: Progress; status: Status | null }) {
  const now = useNow();
  const done = p.today.tasks.filter((t) => t.done).length;
  return (
    <Panel className="p-5 sm:p-6">
      <SectionTitle
        title="Field tasks"
        sub={status ? `New tasks in ${countdown(status.resetsAt, now)}` : "Three new tasks every day"}
        action={
          <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${p.today.stamp ? "bg-xp-soft text-xp-ink" : "bg-paper-3 text-ink-2"}`}>
            {p.today.stamp ? "Stamped" : `${done} of 3`}
          </span>
        }
      />
      <ul className="mt-3">
        {p.today.tasks.map((t) => (
          <TaskRow key={t.def.id} t={t} />
        ))}
      </ul>
      <div className="mt-3 rounded-2xl bg-paper-2 p-4">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-semibold">This week</span>
          <span className="text-ink-3">All three tasks: +{XP.stamp} XP</span>
        </div>
        <StampRow week={p.week} className="mt-3" />
      </div>
    </Panel>
  );
}

// The long view: every step still ahead, so the road never seems to end.
function RoadAhead({ p }: { p: Progress }) {
  const steps = p.medals.reduce((s, m) => s + m.def.goals.length, 0);
  const done = p.medals.reduce((s, m) => s + (m.def.secret ? Number(m.tier > 0) : Math.min(m.tier, m.def.goals.length)), 0);
  const mystery = p.medals.filter(isSecret);
  const rank = nextRank(p.level);
  const rows: [string, string][] = [
    ["Badge steps", `${done.toLocaleString("en-US")} of ${steps.toLocaleString("en-US")}`],
    ["Mystery badges", `${mystery.filter((m) => m.tier > 0).length} of ${mystery.length} found`],
    ["Next rank", rank ? `${rank[1]} at level ${rank[0]}` : "You made it to the top"],
  ];
  return (
    <Panel className="p-5 sm:p-6">
      <SectionTitle title="The road ahead" sub="There's always another step" />
      <dl className="mt-3 divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 py-2.5 text-[14px]">
            <dt className="text-ink-2">{k}</dt>
            <dd className="font-bold tabular">{v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

// The badges you're closest to reaching next, so there's always something in sight.
function NextBadges({ p, onSeeAll }: { p: Progress; onSeeAll: () => void }) {
  const next = p.medals
    .filter((m): m is MedalState & { goal: number } => m.goal != null && !isSecret(m))
    .map((m) => ({ m, ratio: (m.value - m.floor) / (m.goal - m.floor) }))
    .sort((a, b) => b.ratio - a.ratio || a.m.goal - a.m.value - (b.m.goal - b.m.value))
    .slice(0, 3);
  return (
    <Panel className="p-5 sm:p-6">
      <SectionTitle
        title="Next badges"
        sub="The ones you're closest to"
        action={
          <button onClick={onSeeAll} className="text-[13px] font-semibold text-canopy hover:underline">
            All {p.medals.length}
          </button>
        }
      />
      <ul className="mt-4 space-y-4">
        {next.map(({ m, ratio }) => (
          <li key={m.def.id} className="flex items-center gap-3.5">
            <MedalPin m={m} size={46} showProgress={false} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[14.5px] font-bold">{m.def.name}</span>
                <span className="shrink-0 text-[12.5px] text-ink-3 tabular">
                  {m.value} / {m.goal}
                </span>
              </div>
              <span className="medal__bar !mt-2 !w-full" style={{ "--p": Math.min(1, ratio) } as CSSProperties}>
                <i />
              </span>
              <div className="mt-1.5 text-[12px] text-ink-3">
                {MEDAL_TIERS[m.tier + 1]} at {m.goal} {m.def.unit}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ClassStrip({ p }: { p: Progress }) {
  const shown = CLASS_ORDER.filter((k) => k !== "other");
  const found = shown.filter((k) => p.classes[k].cards > 0).length;
  return (
    <Panel className="p-5 sm:p-6">
      <SectionTitle title="Animal classes" sub={`${found} of 8 found`} />
      <div className="mt-4 grid grid-cols-4 gap-y-4">
        {shown.map((k) => {
          const c = p.classes[k];
          return (
            <div key={k} className={`flex flex-col items-center text-center ${c.cards ? "" : "opacity-45"}`} title={CLASS_NAMES[k].many}>
              <ClassEmblem cls={k} size={38} className={c.cards ? "" : "grayscale"} />
              <div className="mt-1.5 text-[12px] font-semibold">{CLASS_NAMES[k].many}</div>
              <div className="text-[11.5px] text-ink-3 tabular">{c.cards ? plural(c.cards, "card") : "None yet"}</div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// One bar for how your cards split across rarities, with where the odds say they'd land.
function RarityMix({ p }: { p: Progress }) {
  const total = Math.max(1, p.cards);
  const rarePlus = p.tiers.Rare + p.tiers.Epic + p.tiers.Legendary;
  return (
    <Panel className="p-5 sm:p-6">
      <SectionTitle title="Your luck" sub={`Rare or better: ${Math.round((rarePlus / total) * 100)}% of your cards, the odds say 20%`} />
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-paper-3">
        {TIERS.map((t) =>
          p.tiers[t] ? <span key={t} className={`${tierClass(t)} block h-full bg-(--tier)`} style={{ width: `${(p.tiers[t] / total) * 100}%` }} /> : null,
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {TIERS.map((t) => (
          <span key={t} className={`flex items-center gap-1.5 text-[12.5px] ${tierClass(t)}`} title={`Odds: ${ODDS[t]}%`}>
            <span className="tier-dot !size-[7px]" />
            <span className="text-ink-2">{t}</span>
            <b className="font-semibold tabular">{p.tiers[t]}</b>
          </span>
        ))}
      </div>
    </Panel>
  );
}

type BadgeGroup = "all" | MedalDef["group"];

const BADGE_GROUPS: { value: BadgeGroup; label: string }[] = [
  { value: "all", label: "All" },
  { value: "progress", label: "Milestones" },
  { value: "habit", label: "Habits" },
  { value: "class", label: "Animals" },
  { value: "collection", label: "Collections" },
  { value: "mystery", label: "Mystery" },
];

function Badges({ p }: { p: Progress }) {
  const [group, setGroup] = useState<BadgeGroup>("all");
  const earned = p.medals.filter((m) => m.tier > 0).length;
  const mystery = p.medals.filter(isSecret);
  const found = mystery.filter((m) => m.tier > 0).length;
  const shown = p.medals
    .filter((m) => group === "all" || m.def.group === group)
    // Earned first, then the ones you're closest to, with undiscovered mystery badges last.
    .sort((a, b) => Number(isSecret(a) && a.tier === 0) - Number(isSecret(b) && b.tier === 0) || b.tier - a.tier || progressOf(b) - progressOf(a));
  return (
    <Panel className="fade-in mt-5 p-5 sm:p-6">
      <SectionTitle
        title="Badges"
        sub={`${earned} of ${p.medals.length} earned. Most go bronze, silver, gold, platinum, diamond, then mythic. ${found} of ${mystery.length} mystery badges found.`}
      />
      <div className="no-scrollbar -mx-1 mt-4 overflow-x-auto px-1">
        <Segmented size="sm" value={group} onChange={setGroup} options={BADGE_GROUPS} />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-4">
        {shown.map((m) => (
          <MedalPin key={m.def.id} m={m} />
        ))}
      </div>
    </Panel>
  );
}

const progressOf = (m: MedalState) => (m.goal == null ? 1 : (m.value - m.floor) / (m.goal - m.floor));
const dayLabel = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });

function Journal({ days, onOpenCard }: { days: DayLog[]; onOpenCard: (id: string) => void }) {
  const [all, setAll] = useState(false);
  const shown = all ? days : days.slice(0, 6);
  return (
    <Panel className="fade-in mt-5 p-5 sm:p-6">
      <SectionTitle title="Journal" sub="Every day you went out catching" />
      {days.length === 0 ? (
        <p className="mt-4 text-[14.5px] text-ink-2">Your first catch starts the journal.</p>
      ) : (
        <ol className="mt-5 space-y-6">
          {shown.map((d) => (
            <li key={d.day} className="journal-day">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="font-display text-[16.5px] font-bold">{dayLabel(d.day)}</div>
                <div className="flex items-center gap-2 text-[12.5px] text-ink-3">
                  <span>{plural(d.caught.length, "catch", "catches")}</span>
                  <span aria-hidden>·</span>
                  <span className="font-semibold text-xp-ink tabular">+{xpText(d.xp)}</span>
                  {d.stamp && <span className="rounded-full bg-xp-soft px-2 py-0.5 font-bold text-xp-ink">Stamped</span>}
                </div>
              </div>
              <div className="no-scrollbar -mx-1 mt-3 flex gap-2.5 overflow-x-auto px-1 pt-1.5 pb-1">
                {d.caught.map(({ card, isNew }) => (
                  <button
                    key={card.id}
                    onClick={() => onOpenCard(card.id)}
                    aria-label={`${card.name}, ${card.rarity} ${card.species}`}
                    className="relative w-[92px] shrink-0 rounded-[8px] text-left transition hover:-translate-y-1"
                  >
                    <CardFront card={card} size="thumb" />
                    {isNew && <span className="journal-new">New</span>}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
      {days.length > 6 && (
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" size="sm" onClick={() => setAll((v) => !v)}>
            {all ? "Show fewer days" : `Show all ${days.length} days`}
          </Button>
        </div>
      )}
    </Panel>
  );
}
