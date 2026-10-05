import type { CSSProperties, ReactNode } from "react";
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



export function TaskRow({ t }: { t: TaskState }) {
  return (
    <li className={`task ${t.done ? "is-done" : ""}`}>
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
