// Days, weeks and time zones, shared by the app and the Worker so both always agree on what "today" is.
// A day is a plain "YYYY-MM-DD" in the explorer's own time zone, so the daily limit, the streak, the
// field tasks and the leaderboards all roll over at their local midnight.

// Any time zone name the runtime knows, otherwise UTC.
export function validTz(tz: unknown): string {
  if (typeof tz !== "string" || tz.length > 64) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

export const deviceTz = () => validTz(Intl.DateTimeFormat().resolvedOptions().timeZone);

export function localDay(tz: string, at: Date | number = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

const DAY_MS = 86_400_000;
const toMs = (day: string) => Date.parse(`${day}T00:00:00Z`);

export const shiftDay = (day: string, days: number) => new Date(toMs(day) + days * DAY_MS).toISOString().slice(0, 10);
export const daysBetween = (from: string, to: string) => Math.round((toMs(to) - toMs(from)) / DAY_MS);

// How far ahead of UTC a time zone is at a moment, in milliseconds.
function offsetMs(tz: string, at: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second")) - Math.floor(at / 1000) * 1000;
}

// The moment the next local day begins, as an ISO time.
export function nextMidnight(tz: string, now: number = Date.now()): string {
  const tomorrow = shiftDay(localDay(tz, now), 1);
  let at = toMs(tomorrow) - offsetMs(tz, toMs(tomorrow));
  at = toMs(tomorrow) - offsetMs(tz, at); // once more, for days when the clocks change
  return new Date(at).toISOString();
}

// The Monday of the week a day falls in. Weeks run Monday to Sunday.
export function weekStart(day: string): string {
  const dow = new Date(toMs(day)).getUTCDay(); // 0 is Sunday
  return shiftDay(day, -((dow + 6) % 7));
}

// Consecutive days with a catch, counting back from today (or from yesterday, so the streak survives until
// the day is over). `daysDesc` is every day with a catch, newest first.
export function streakEndingAt(daysDesc: string[], today: string): number {
  if (daysDesc.length === 0) return 0;
  if (daysDesc[0] !== today && daysDesc[0] !== shiftDay(today, -1)) return 0;
  let streak = 1;
  for (let i = 1; i < daysDesc.length; i++) {
    if (daysBetween(daysDesc[i], daysDesc[i - 1]) !== 1) break;
    streak++;
  }
  return streak;
}

// The longest run of consecutive days in a list (any order).
export function longestStreak(days: string[]): number {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    run = i > 0 && daysBetween(sorted[i - 1], sorted[i]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}
