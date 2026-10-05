import { useEffect, useMemo, useRef } from "react";
import { shiftDay, weekStart } from "../../../shared/tz";
import { scoreOf } from "../lib/api";
import { CLASS_NAMES, classKeyOf, isWild, todayKey, type ClassKey, type DayLog, type Progress } from "../lib/progress";
import { tierRank } from "../lib/tiers";
import { CardFront } from "./GameCard";
import { ClassEmblem, SectionTitle, xpText } from "./game";
import { Panel } from "./ui";

const WEEKS = 18;

// Every day you went out, as a calendar of squares. Darker means more catches, so a streak shows as a trail.
export function Heatmap({ p }: { p: Progress }) {
  const today = todayKey();
  const { weeks, months, byDay } = useMemo(() => {
    const byDay = new Map(p.days.map((d) => [d.day, d]));
    const start = shiftDay(weekStart(today), -(WEEKS - 1) * 7);
    const weeks: string[][] = [];
    for (let w = 0; w < WEEKS; w++) weeks.push(Array.from({ length: 7 }, (_, i) => shiftDay(start, w * 7 + i)));
    // Label a month above the first week it appears in.
    let last = "";
    const months = weeks.map((wk) => {
      const m = wk[0].slice(0, 7);
      const label = m !== last ? new Date(`${wk[0]}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }) : "";
      last = m;
      return label;
    });
    return { weeks, months, byDay };
  }, [p.days, today]);

  // On a narrow screen the trail scrolls sideways. Open it at the newest week.
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const level = (n: number) => (n === 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : n <= 9 ? 3 : 4);
  const wildDays = p.days.filter((d) => d.caught.some((x) => isWild(x.card))).length;

  return (
    <Panel className="fade-in mt-5 p-5 sm:p-6">
      <SectionTitle title="Your trail" sub={`${p.days.length} days out so far, ${wildDays} with a wild find`} />
      <div ref={scroller} className="mt-3 overflow-x-auto py-1 pr-1">
        <div className="max-w-[560px] min-w-[420px]">
          <div className="heat-months" style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}>
            {months.map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </div>
          <div className="heat" style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }} role="img" aria-label="Calendar of the days you caught animals">
            {weeks.flatMap((wk) =>
              wk.map((day) => {
                const d = byDay.get(day);
                const n = d?.caught.length ?? 0;
                const future = day > today;
                return (
                  <i
                    key={day}
                    className={`heat__cell heat--${level(n)} ${day === today ? "is-today" : ""} ${future ? "is-future" : ""}`}
                    title={future ? undefined : `${new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}: ${n === 0 ? "no catches" : `${n} catch${n === 1 ? "" : "es"}`}`}
                  />
                );
              }),
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11.5px] text-ink-3">
        Less
        {[0, 1, 2, 3, 4].map((l) => (
          <i key={l} className={`heat__cell heat--${l} !size-3`} />
        ))}
        More
      </div>
    </Panel>
  );
}

// A look back at the month: how many outings, what you found, and your best pull.
export function MonthRecap({ p, onOpenCard }: { p: Progress; onOpenCard: (id: string) => void }) {
  const month = useMemo(() => {
    const now = todayKey().slice(0, 7);
    return p.days.some((d) => d.day.startsWith(now)) ? now : (p.days[0]?.day.slice(0, 7) ?? now);
  }, [p.days]);
  const days: DayLog[] = p.days.filter((d) => d.day.startsWith(month));
  if (days.length === 0) return null;

  const caught = days.flatMap((d) => d.caught);
  const best = caught.reduce((a, b) => ((tierRank(b.card.rarity) - tierRank(a.card.rarity) || scoreOf(b.card.stats) - scoreOf(a.card.stats)) > 0 ? b : a));
  const counts = new Map<string, number>();
  for (const x of caught) counts.set(classKeyOf(x.card), (counts.get(classKeyOf(x.card)) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const name = new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const tiles: [string, string][] = [
    ["Catches", caught.length.toLocaleString("en-US")],
    ["New species", String(caught.filter((x) => x.isNew).length)],
    ["Wild finds", String(caught.filter((x) => isWild(x.card)).length)],
    ["Days out", String(days.length)],
  ];
  return (
    <Panel className="fade-in mt-5 p-5 sm:p-6">
      <SectionTitle title={`${name} so far`} sub={`${xpText(days.reduce((s, d) => s + d.xp, 0))} earned`} />
      <div className="mt-4 flex items-stretch gap-4">
        <button onClick={() => onOpenCard(best.card.id)} className="w-[96px] shrink-0 transition hover:-translate-y-1" aria-label={`Best pull: ${best.card.name}`}>
          <CardFront card={best.card} size="thumb" />
          <span className="mt-1.5 block text-center text-[11.5px] font-semibold text-ink-3">Best pull</span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-2 gap-2">
            {tiles.map(([k, v]) => (
              <div key={k} className="rounded-xl bg-paper-2 px-3 py-2.5">
                <div className="font-display text-[22px] leading-none font-extrabold tabular">{v}</div>
                <div className="mt-1 text-[11.5px] font-semibold text-ink-3">{k}</div>
              </div>
            ))}
          </div>
          {top && (
            <div className="mt-2.5 flex items-center gap-2 text-[13px] text-ink-2">
              <ClassEmblem cls={top[0] as ClassKey} size={24} />
              Mostly {CLASS_NAMES[top[0] as ClassKey].many.toLowerCase()} this month
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
