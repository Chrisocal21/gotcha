// Leaderboard: who shows up, under what name, and how they're ranked.
//
// Safety first: nobody is listed until they pick a screen name or approve a real name, and every
// name is checked here. The board shows a name, a level of play and totals, nothing else.

import { challengeFor, type ChallengeDef } from "../../shared/challenges";
import { longestStreak, streakEndingAt, weekStart } from "../../shared/tz";

export const NAME_MIN = 3;
export const NAME_MAX = 20;
const BOARD_LIMIT = 50;

// Plain letters, digits, and a few separators. No links, emails or look-alike tricks.
const NAME_SHAPE = /^[\p{L}\p{N}][\p{L}\p{N} ._'-]*$/u;

// Checked after folding look-alikes (0 to o, 1 to i, $ to s...) and dropping separators.
const BLOCKED = [
  "fuck", "shit", "bitch", "cunt", "pussy", "whore", "slut", "bastard", "asshole",
  "nigg", "fagg", "retard", "rapist", "nazi", "hitler", "porn", "nsfw",
  "suicide", "molest", "pedo", "admin", "moderator", "gotcha", "support",
];

const FOLD: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", $: "s", "!": "i" };

function fold(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[0134578@$!]/g, (c) => FOLD[c])
    .replace(/[^a-z]/g, "");
}

export type NameCheck = { ok: true; name: string } | { ok: false; message: string };

export function checkName(raw: unknown): NameCheck {
  if (typeof raw !== "string") return { ok: false, message: "Pick a name" };
  const name = raw.normalize("NFC").replace(/\s+/g, " ").trim();
  if (name.length < NAME_MIN) return { ok: false, message: `Use at least ${NAME_MIN} characters` };
  if (name.length > NAME_MAX) return { ok: false, message: `Use ${NAME_MAX} characters or fewer` };
  if (!NAME_SHAPE.test(name)) return { ok: false, message: "Use letters, numbers, spaces, and . _ ' - only" };
  const folded = fold(name);
  if (BLOCKED.some((w) => folded.includes(w))) return { ok: false, message: "That name isn't allowed. Try another." };
  return { ok: true, name };
}

export type Scope = "all" | "week";
export type Metric = "score" | "streak" | "species" | "wild" | "rare" | "challenge";
export const METRICS: Metric[] = ["score", "streak", "species", "wild", "rare", "challenge"];

export interface BoardEntry {
  rank: number;
  name: string;
  kind: "screen" | "real";
  value: number; // what this board ranks by
  score: number;
  cards: number;
  species: number;
  wild: number; // different wild species
  rare: number; // Rare or better cards
  bestStreak: number;
  founder: boolean;
  creator: boolean;
  you: boolean;
}

// What a board shows for each person, from their cards in the window. Only the cards table is read, never
// anything the app reports about itself, so nobody can inflate a board from their own device.
// Score is the catch side of XP: 100 per card, a rarity bonus, and 500 per species (all time only). Daily
// task XP is worked out on each phone and isn't counted.
function aggregateSql(chal: string, crew: boolean) {
  return `
    SELECT p.user_id, p.role AS role, p.board_name AS name, p.board_kind AS kind,
      COUNT(c.id) AS cards,
      COUNT(DISTINCT lower(trim(c.species))) AS species,
      COUNT(DISTINCT CASE WHEN c.wild = 1 THEN lower(trim(c.species)) END) AS wild,
      COALESCE(SUM(CASE WHEN c.rarity IN ('Rare','Epic','Legendary') THEN 1 ELSE 0 END), 0) AS rare,
      COALESCE(SUM(CASE WHEN c.rarity = 'Legendary' THEN 1 ELSE 0 END), 0) AS legendary,
      COUNT(c.id) * 100
        + COALESCE(SUM(CASE c.rarity WHEN 'Uncommon' THEN 50 WHEN 'Rare' THEN 150 WHEN 'Epic' THEN 400 WHEN 'Legendary' THEN 1000 ELSE 0 END), 0) AS catch_score,
      ${chal} AS chal,
      EXISTS (SELECT 1 FROM cards f WHERE f.user_id = p.user_id AND f.series = 'founders' AND f.is_sample = 0) AS founder
    FROM profiles p
    LEFT JOIN cards c ON c.user_id = p.user_id AND c.is_sample = 0 AND c.local_day >= ?1
    WHERE p.board_name IS NOT NULL ${crew ? "AND p.user_id IN (SELECT user_id FROM crew_members WHERE crew_id = ?2)" : ""}
    GROUP BY p.user_id`;
}

// The challenge's number, as a SQL expression. It's built from the fixed list in shared/challenges.ts and
// only ever uses a class name from that list, never anything a person typed.
function challengeSql(def: ChallengeDef): string {
  switch (def.kind) {
    case "cards":
      return "COUNT(c.id)";
    case "species":
      return "COUNT(DISTINCT lower(trim(c.species)))";
    case "wild":
      return "COALESCE(SUM(c.wild), 0)";
    case "wildSpecies":
      return "COUNT(DISTINCT CASE WHEN c.wild = 1 THEN lower(trim(c.species)) END)";
    case "wildDays":
      return "COUNT(DISTINCT CASE WHEN c.wild = 1 THEN c.local_day END)";
    case "days":
      return "COUNT(DISTINCT c.local_day)";
    case "classes":
      return "COUNT(DISTINCT CASE WHEN c.is_statue = 0 THEN c.animal_class END)";
    case "class":
      return `COALESCE(SUM(CASE WHEN c.is_statue = 0 AND c.animal_class = '${def.cls!.replace(/[^a-z]/g, "")}' THEN 1 ELSE 0 END), 0)`;
    case "statue":
      return "COALESCE(SUM(c.is_statue), 0)";
    case "rare":
      return "COALESCE(SUM(CASE WHEN c.rarity IN ('Rare','Epic','Legendary') THEN 1 ELSE 0 END), 0)";
  }
}

interface Row {
  user_id: string;
  role: string | null;
  name: string;
  kind: "screen" | "real";
  cards: number;
  species: number;
  wild: number;
  rare: number;
  legendary: number;
  catch_score: number;
  chal: number;
  founder: number;
}

// Every day each member caught something (all time), for the streak boards.
async function daysByUser(db: D1Database, crew: string | null): Promise<Map<string, string[]>> {
  const { results } = await db
    .prepare(
      `SELECT c.user_id, c.local_day AS day FROM cards c
       JOIN profiles p ON p.user_id = c.user_id AND p.board_name IS NOT NULL
       ${crew ? "AND p.user_id IN (SELECT user_id FROM crew_members WHERE crew_id = ?1)" : ""}
       WHERE c.is_sample = 0 GROUP BY c.user_id, c.local_day`,
    )
    .bind(...(crew ? [crew] : []))
    .all<{ user_id: string; day: string }>();
  const map = new Map<string, string[]>();
  for (const r of results) map.set(r.user_id, [...(map.get(r.user_id) ?? []), r.day]);
  return map;
}

export async function loadBoard(
  db: D1Database,
  user: string,
  opts: { scope: Scope; metric: Metric; today: string; crew?: string | null },
) {
  const { scope, metric, today } = opts;
  const crew = opts.crew ?? null;
  const week = weekStart(today);
  const challenge = challengeFor(week);
  // The challenge is always about this week, whatever the tab says.
  const since = scope === "week" || metric === "challenge" ? week : "";

  const { results } = await db
    .prepare(aggregateSql(challengeSql(challenge), !!crew))
    .bind(...(crew ? [since, crew] : [since]))
    .all<Row>();

  const days = metric === "streak" ? await daysByUser(db, crew) : new Map<string, string[]>();

  // Each person's number for this board, and a tie-breaker so the order is stable and fair.
  const scored = results.map((r) => {
    const streakDays = days.get(r.user_id) ?? [];
    const best = longestStreak(streakDays);
    const current = streakEndingAt([...new Set(streakDays)].sort().reverse(), today);
    const score = r.catch_score + (scope === "all" && metric === "score" ? r.species * 500 : 0);
    const [value, tie] =
      metric === "score"
        ? [score, r.cards]
        : metric === "streak"
          ? [scope === "week" ? current : best, best]
          : metric === "species"
            ? [r.species, r.cards]
            : metric === "wild"
              ? [r.wild, r.cards]
              : metric === "rare"
                ? [r.rare, r.legendary]
                : [r.chal, r.cards];
    return { r, value, tie, score, best };
  });
  scored.sort((a, b) => b.value - a.value || b.tie - a.tie || a.r.name.localeCompare(b.r.name));

  // Outside a crew only people with something to show are ranked. In a crew everyone is listed, so friends
  // who haven't caught anything yet still appear.
  const ranked = crew ? scored : scored.filter((s) => s.value > 0);
  const entries: BoardEntry[] = ranked.map((s, i) => ({
    rank: i + 1,
    name: s.r.name,
    kind: s.r.kind,
    value: s.value,
    score: s.score,
    cards: s.r.cards,
    species: s.r.species,
    wild: s.r.wild,
    rare: s.r.rare,
    bestStreak: s.best,
    founder: !!s.r.founder,
    creator: s.r.role === "creator",
    you: s.r.user_id === user,
  }));

  const mineIndex = ranked.findIndex((s) => s.r.user_id === user);
  const joined = await db
    .prepare("SELECT board_name, board_kind, role FROM profiles WHERE user_id = ?")
    .bind(user)
    .first<{ board_name: string | null; board_kind: "screen" | "real" | null; role: string | null }>();
  const mineRow = scored.find((s) => s.r.user_id === user);

  return {
    scope,
    metric,
    challenge: { ...challenge, week },
    entries: entries.slice(0, BOARD_LIMIT),
    me: joined?.board_name
      ? {
          name: joined.board_name,
          kind: joined.board_kind,
          rank: mineIndex >= 0 ? mineIndex + 1 : null,
          value: mineRow?.value ?? 0,
          score: mineRow?.score ?? 0,
          cards: mineRow?.r.cards ?? 0,
          species: mineRow?.r.species ?? 0,
          wild: mineRow?.r.wild ?? 0,
          rare: mineRow?.r.rare ?? 0,
          bestStreak: mineRow?.best ?? 0,
          founder: !!mineRow?.r.founder,
          creator: joined.role === "creator",
        }
      : null,
    total: ranked.length,
  };
}

// Someone's public page: only what they chose to put on the board, never photos or email.
export async function loadPlayer(db: D1Database, name: string, today: string) {
  const profile = await db
    .prepare("SELECT user_id, board_name, board_kind, board_at, role, showcase FROM profiles WHERE lower(board_name) = lower(?)")
    .bind(name)
    .first<{ user_id: string; board_name: string; board_kind: "screen" | "real"; board_at: string; role: string | null; showcase: string | null }>();
  if (!profile) return null;

  const stats = await db
    .prepare(
      `SELECT COUNT(*) AS cards, COUNT(DISTINCT lower(trim(species))) AS species,
        COUNT(DISTINCT CASE WHEN wild = 1 THEN lower(trim(species)) END) AS wild,
        COALESCE(SUM(CASE WHEN rarity IN ('Rare','Epic','Legendary') THEN 1 ELSE 0 END), 0) AS rare,
        COALESCE(SUM(CASE WHEN rarity = 'Legendary' THEN 1 ELSE 0 END), 0) AS legendary,
        EXISTS (SELECT 1 FROM cards f WHERE f.user_id = ?1 AND f.series = 'founders' AND f.is_sample = 0) AS founder
       FROM cards WHERE user_id = ?1 AND is_sample = 0`,
    )
    .bind(profile.user_id)
    .first<{ cards: number; species: number; wild: number; rare: number; legendary: number; founder: number }>();

  const { results: dayRows } = await db
    .prepare("SELECT DISTINCT local_day AS day FROM cards WHERE user_id = ? AND is_sample = 0")
    .bind(profile.user_id)
    .all<{ day: string }>();
  const days = dayRows.map((d) => d.day);

  return {
    name: profile.board_name,
    kind: profile.board_kind,
    since: profile.board_at,
    creator: profile.role === "creator",
    founder: !!stats?.founder,
    stats: {
      cards: stats?.cards ?? 0,
      species: stats?.species ?? 0,
      wild: stats?.wild ?? 0,
      rare: stats?.rare ?? 0,
      legendary: stats?.legendary ?? 0,
      currentStreak: streakEndingAt([...new Set(days)].sort().reverse(), today),
      bestStreak: longestStreak(days),
      activeDays: new Set(days).size,
    },
    showcaseIds: profile.showcase ? (JSON.parse(profile.showcase) as string[]) : [],
    userId: profile.user_id,
  };
}

export async function joinBoard(db: D1Database, user: string, body: { kind?: unknown; name?: unknown } | null) {
  const kind = body?.kind === "real" ? "real" : body?.kind === "screen" ? "screen" : null;
  if (!kind) return { status: 400, error: "Choose a screen name or your name" };
  const checked = checkName(body?.name);
  if (!checked.ok) return { status: 400, error: checked.message };

  const taken = await db
    .prepare("SELECT user_id FROM profiles WHERE lower(board_name) = lower(?) AND user_id != ?")
    .bind(checked.name, user)
    .first();
  if (taken) return { status: 409, error: "Someone is already using that name" };

  const now = new Date().toISOString();
  try {
    await db
      .prepare(
        `INSERT INTO profiles (user_id, display_name, created_at, updated_at, board_name, board_kind, board_at) VALUES (?1, '', ?2, ?2, ?3, ?4, ?2)
         ON CONFLICT (user_id) DO UPDATE SET board_name = excluded.board_name, board_kind = excluded.board_kind, board_at = excluded.board_at, updated_at = excluded.updated_at`,
      )
      .bind(user, now, checked.name, kind)
      .run();
  } catch {
    // Two people claiming the same name at once: the unique index lets only one win.
    return { status: 409, error: "Someone is already using that name" };
  }
  return { status: 200, name: checked.name, kind };
}

export async function leaveBoard(db: D1Database, user: string) {
  await db
    .prepare("UPDATE profiles SET board_name = NULL, board_kind = NULL, board_at = NULL, updated_at = ? WHERE user_id = ?")
    .bind(new Date().toISOString(), user)
    .run();
}
