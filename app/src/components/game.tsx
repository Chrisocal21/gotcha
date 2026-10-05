import type { CSSProperties, ReactNode } from "react";
import { CHALLENGE_XP } from "../../../shared/challenges";
import { shiftDay } from "../../../shared/tz";
import { isSecret, tierLabel, type ClassKey, type MedalState, type Progress, type TaskState } from "../lib/progress";
import { ClassGlyph, glyphFor, IconCheck, IconCreator, IconFounder, IconHowTo } from "./glyphs";

const fmt = (n: number) => n.toLocaleString("en-US");
export const xpText = (n: number) => `${fmt(n)} XP`;

// The explorer's level: a numbered medallion inside a ring that fills with XP.
// Without a size, the stylesheet sets --size (so it can change with the screen width).
export function LevelBadge({
  level,
  ratio,
  size,
  label = (size ?? 0) >= 64,
  className = "",
}: {
  level: number;
  ratio: number;
  size?: number;
  label?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`lvl ${className}`}
      style={{ ...(size ? { "--size": `${size}px` } : {}), "--p": ratio } as CSSProperties}
      role="img"
      aria-label={`Level ${level}`}
    >
      <span className="lvl__core">
        {label && <span className="lvl__lv">Level</span>}
        <span className="lvl__num" data-wide={level >= 100 ? "" : undefined}>{level}</span>
      </span>
    </span>
  );
}

// The official Founders mark, worn by anyone who holds a Founders Edition card.
export function FounderTag({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`founder-tag ${compact ? "tag--compact" : ""} ${className}`} title="Founders Edition: here from the start">
      <IconFounder size={compact ? 9 : 12} strokeWidth={2.4} fill="currentColor" />
      Founder
    </span>
  );
}

// For the person who made Gotcha. Set only by the server.
export function CreatorTag({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`creator-tag ${compact ? "tag--compact" : ""} ${className}`} title="Made Gotcha">
      <IconCreator size={compact ? 9 : 12} strokeWidth={2.4} />
      Creator
    </span>
  );
}

export function XpBar({ ratio, className = "", tone = "light" }: { ratio: number; className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={`xpbar ${tone === "dark" ? "xpbar--dark" : ""} ${className}`} style={{ "--p": Math.max(0.02, ratio) } as CSSProperties}>
      <i />
    </span>
  );
}

const SEGMENTS = 12;
const GAP = 5; // degrees between pieces
const TIER_COLOR = ["#8b948e", "#c8814a", "#b8c2cd", "#e3ac1f", "#8fb4ec", "#4fc3f7", "#c040ff"];

function arc(i: number, r: number) {
  const span = 360 / SEGMENTS;
  const a0 = ((i * span + GAP / 2 - 90) * Math.PI) / 180;
  const a1 = (((i + 1) * span - GAP / 2 - 90) * Math.PI) / 180;
  const p = (a: number) => `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
  return `M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`;
}

// Starts empty. Each piece of the ring fills as progress grows toward the next tier; a full ring is a finished tier.
function Ring({ m, ratio }: { m: MedalState; ratio: number }) {
  const done = m.goal == null || isSecret(m);
  const filled = done ? (m.tier > 0 ? SEGMENTS : 0) : ratio > 0 ? Math.max(1, Math.floor(ratio * SEGMENTS)) : 0;
  const color = TIER_COLOR[done ? m.tier : Math.min(m.tier + 1, 6)];
  return (
    <svg className="medal__ring" viewBox="0 0 100 100" aria-hidden>
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <path
          key={i}
          d={arc(i, 46.5)}
          strokeWidth={7}
          stroke={i < filled ? color : "var(--color-line-strong)"}
          opacity={i < filled ? 1 : 0.55}
        />
      ))}
    </svg>
  );
}
// A badge, drawn as an enamel pin. Its metal shows the tier reached.
export function MedalPin({ m, size = 72, showProgress = true }: { m: MedalState; size?: number; showProgress?: boolean }) {
  const hidden = isSecret(m) && m.tier === 0;
  const G = hidden ? IconHowTo : glyphFor(m.def.glyph);
  const span = m.goal != null ? m.goal - m.floor : 1;
  const ratio = m.goal != null ? Math.min(1, (m.value - m.floor) / span) : 1;
  return (
    <div className={`medal metal-${m.tier}`} style={{ "--enamel": m.def.color } as CSSProperties}>
      <div className="medal__pin" style={{ width: size, height: size }}>
        <Ring m={m} ratio={ratio} />
        <div className="medal__enamel">
          <G size={Math.round(size * 0.4)} strokeWidth={2.1} />
        </div>
      </div>
      {showProgress && (
        <div className="medal__text">
          <div className="medal__name">{hidden ? "Mystery badge" : m.def.name}</div>
          <div className="medal__tier">{hidden ? m.def.secret!.hint : m.tier > 0 ? tierLabel(m) : m.def.blurb}</div>
          {hidden ? null : isSecret(m) ? (
            <div className="medal__count">{m.def.blurb}</div>
          ) : m.goal != null ? (
            <div className="medal__count tabular">
              {fmt(m.value)} / {fmt(m.goal)} {m.def.unit}
            </div>
          ) : (
            <div className="medal__count">All tiers done</div>
          )}
        </div>
      )}
    </div>
  );
}



// The three daily rings: catch, wild, and the one that changes.
export const RING_COLORS = ["#10a991", "#58b947", "#ff9f1c"];

// A ring that fills as progress grows, with anything you like in the middle.
export function ProgressRing({
  ratio,
  size = 44,
  stroke = 5,
  color = "var(--color-xp)",
  className = "",
  children,
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  color?: string;
  className?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className={`relative inline-grid shrink-0 place-items-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          className="ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, ratio)))}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">{children}</span>
    </span>
  );
}

// Three rings inside each other, one per daily task. Closing all three earns the day's stamp.
export function DayRings({ tasks, size = 92 }: { tasks: TaskState[]; size?: number }) {
  const stroke = 8;
  const gap = 3;
  const done = tasks.filter((t) => t.done).length;
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${done} of ${tasks.length} daily rings closed`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        {tasks.map((t, i) => {
          const r = (size - stroke) / 2 - i * (stroke + gap);
          const c = 2 * Math.PI * r;
          return (
            <g key={t.def.id}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={RING_COLORS[i]} strokeOpacity={0.16} strokeWidth={stroke} />
              <circle
                className="ring-arc"
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={RING_COLORS[i]}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - t.progress / t.def.goal)}
              />
            </g>
          );
        })}
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-[17px] leading-none font-extrabold tabular">
        {done === tasks.length ? <IconCheck size={22} strokeWidth={3} className="text-xp-ink" /> : `${done}/${tasks.length}`}
      </span>
    </span>
  );
}

// This week's challenge: one goal for everyone, a fresh one every Monday.
export function ChallengeCard({
  c,
  now,
  onBoard,
  className = "",
}: {
  c: Progress["challenge"];
  now: number;
  onBoard?: () => void;
  className?: string;
}) {
  const ends = new Date(`${shiftDay(c.week, 7)}T00:00:00`).getTime(); // the coming Monday, at local midnight
  const left = Math.max(0, ends - now);
  const days = Math.floor(left / 86_400_000);
  const hours = Math.floor((left % 86_400_000) / 3_600_000);
  return (
    <div className={`rounded-2xl bg-paper-2 p-4 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-semibold text-ink-3">This week's challenge</span>
        <span className="text-[12px] text-ink-3 tabular">{c.done ? "Done" : days > 0 ? `${days}d ${hours}h left` : `${hours}h left`}</span>
      </div>
      <div className="mt-1 font-display text-[18px] leading-tight font-bold">{c.def.title}</div>
      <div className="text-[13.5px] text-ink-2">{c.def.blurb}</div>
      <div className="mt-3 flex items-center gap-3">
        <span className={`task__bar !h-2 ${c.done ? "is-complete" : ""}`} style={{ "--p": Math.min(1, c.value / c.def.goal) } as CSSProperties}>
          <i />
        </span>
        <span className="shrink-0 text-[12.5px] font-bold tabular">
          {Math.min(c.value, c.def.goal)}/{c.def.goal}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[12.5px]">
        <span className="font-semibold text-xp-ink">+{fmt(CHALLENGE_XP)} XP</span>
        {onBoard && (
          <button onClick={onBoard} className="font-semibold text-canopy hover:underline">
            See the board
          </button>
        )}
      </div>
    </div>
  );
}

export function TaskRow({ t, ring }: { t: TaskState; ring?: number }) {
  return (
    <li className={`task ${t.done ? "is-done" : ""}`} style={ring != null ? ({ "--ring": RING_COLORS[ring] } as CSSProperties) : undefined}>
      <span className="task__check" aria-hidden>
        {t.done && <IconCheck size={14} strokeWidth={3} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="task__title">{t.def.title}</div>
        {t.def.goal > 1 && !t.done && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="task__bar" style={{ "--p": t.progress / t.def.goal } as CSSProperties}>
              <i />
            </span>
            <span className="text-[11.5px] font-semibold text-ink-3 tabular">
              {t.progress}/{t.def.goal}
            </span>
          </div>
        )}
      </div>
      <span className="task__xp">+{fmt(t.def.xp)}</span>
    </li>
  );
}

// The last seven days: a stamp for each day with every field task done.
export function StampRow({ week, className = "" }: { week: Progress["week"]; className?: string }) {
  const label = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "narrow", timeZone: "UTC" });
  return (
    <div className={`flex justify-between gap-1.5 ${className}`}>
      {week.map((d, i) => (
        <div key={d.day} className="flex flex-col items-center gap-1.5">
          <span
            className={`stamp ${d.stamp ? "is-stamped" : d.caught ? "is-partial" : ""} ${i === week.length - 1 ? "is-today" : ""}`}
            title={d.stamp ? "All field tasks done" : d.caught ? `${d.caught} caught` : "No catches"}
          >
            {d.stamp && <IconCheck size={13} strokeWidth={3} />}
          </span>
          <span className="text-[11px] font-semibold text-ink-3">{label(d.day)}</span>
        </div>
      ))}
    </div>
  );
}

// An animal class mark: the class glyph on its class color.
export function ClassEmblem({ cls, size = 28, className = "" }: { cls: ClassKey; size?: number; className?: string }) {
  return (
    <span className={`emblem cls-${cls} ${className}`} style={{ width: size, height: size }} aria-hidden>
      <ClassGlyph cls={cls} size={Math.round(size * 0.58)} strokeWidth={2.2} />
    </span>
  );
}

export function SectionTitle({ title, sub, action, className = "" }: { title: string; sub?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-end justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h2 className="font-display text-[20px] leading-tight font-bold tracking-tight">{title}</h2>
        {sub && <div className="mt-0.5 text-[13px] text-ink-3">{sub}</div>}
      </div>
      {action}
    </div>
  );
}
