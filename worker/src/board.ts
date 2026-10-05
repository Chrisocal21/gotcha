// Leaderboard: who shows up, under what name, and how they're ranked.
//
// Safety first: nobody is listed until they pick a screen name or approve a real name, and every
// name is checked here. The board shows a name, a level of play and totals, nothing else.

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

export interface BoardEntry {
  rank: number;
  name: string;
  kind: "screen" | "real";
  score: number;
  cards: number;
  species: number;
  founder: boolean;
  you: boolean;
}

// Score is the catch side of XP: 100 per card, a rarity bonus, and 500 per species. Daily task XP is
// worked out on each phone and isn't counted, so nobody can inflate the board from their own device.
const SCORE_SQL = `
  WITH board AS (
    SELECT p.user_id, p.board_name AS name, p.board_kind AS kind,
      COUNT(c.id) AS cards,
      EXISTS (SELECT 1 FROM cards f WHERE f.user_id = p.user_id AND f.series = 'founders' AND f.is_sample = 0) AS founder,
      COUNT(DISTINCT lower(trim(c.species))) AS species,
      COUNT(c.id) * 100
        + COALESCE(SUM(CASE c.rarity WHEN 'Uncommon' THEN 50 WHEN 'Rare' THEN 150 WHEN 'Epic' THEN 400 WHEN 'Legendary' THEN 1000 ELSE 0 END), 0)
        + CASE WHEN ?1 THEN COUNT(DISTINCT lower(trim(c.species))) * 500 ELSE 0 END AS score
    FROM profiles p
    JOIN cards c ON c.user_id = p.user_id AND c.is_sample = 0 AND c.created_at >= ?2
    WHERE p.board_name IS NOT NULL
    GROUP BY p.user_id
  )`;

export type Scope = "all" | "week";

export async function loadBoard(db: D1Database, user: string, scope: Scope) {
  const weekly = scope === "week";
  const since = weekly ? new Date(Date.now() - 7 * 86_400_000).toISOString() : "";
  const species = weekly ? 0 : 1;

  const { results } = await db
    .prepare(`${SCORE_SQL} SELECT * FROM board ORDER BY score DESC, cards DESC, name ASC LIMIT ${BOARD_LIMIT}`)
    .bind(species, since)
    .all<{ user_id: string; name: string; kind: "screen" | "real"; cards: number; species: number; score: number; founder: number }>();

  const entries: BoardEntry[] = results.map((r, i) => ({
    rank: i + 1,
    name: r.name,
    kind: r.kind,
    score: r.score,
    cards: r.cards,
    species: r.species,
    founder: !!r.founder,
    you: r.user_id === user,
  }));

  const mine = await db
    .prepare(
      `${SCORE_SQL} SELECT b.*, (SELECT COUNT(*) FROM board o WHERE o.score > b.score OR (o.score = b.score AND o.cards > b.cards)) + 1 AS rank,
        (SELECT COUNT(*) FROM board) AS total
       FROM board b WHERE b.user_id = ?3`,
    )
    .bind(species, since, user)
    .first<{ name: string; kind: "screen" | "real"; cards: number; species: number; score: number; rank: number; total: number; founder: number }>();

  const joined = await db
    .prepare("SELECT board_name, board_kind FROM profiles WHERE user_id = ?")
    .bind(user)
    .first<{ board_name: string | null; board_kind: "screen" | "real" | null }>();

  return {
    scope,
    entries,
    me: joined?.board_name
      ? {
          name: joined.board_name,
          kind: joined.board_kind,
          rank: mine?.rank ?? null,
          score: mine?.score ?? 0,
          cards: mine?.cards ?? 0,
          species: mine?.species ?? 0,
          founder: !!mine?.founder,
        }
      : null,
    total: mine?.total ?? entries.length,
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
