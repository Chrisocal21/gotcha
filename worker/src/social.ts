// The social side: crews (small private groups), the player showcase and public profiles.
// Everyone here already has a board name, so nothing new about a person is ever shown.

import { checkName, loadPlayer } from "./board";
import { rowToCard } from "./cards";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const MAX_CREWS = 5; // crews one person can be in
const MAX_MEMBERS = 30; // people in one crew
export const SHOWCASE_MAX = 3;

// No 0/O or 1/I, so a code read out loud or typed from a screenshot isn't mistaken.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function newCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

const cleanCode = (raw: unknown) => (typeof raw === "string" ? raw.toUpperCase().replace(/[^A-Z0-9]/g, "") : "");

async function boardName(db: D1Database, user: string): Promise<string | null> {
  const row = await db.prepare("SELECT board_name FROM profiles WHERE user_id = ?").bind(user).first<{ board_name: string | null }>();
  return row?.board_name ?? null;
}

export async function listCrews(db: D1Database, user: string) {
  const { results } = await db
    .prepare(
      `SELECT c.id, c.name, c.code, c.owner, (SELECT COUNT(*) FROM crew_members m WHERE m.crew_id = c.id) AS members
       FROM crews c JOIN crew_members me ON me.crew_id = c.id AND me.user_id = ?
       ORDER BY me.joined_at ASC`,
    )
    .bind(user)
    .all<{ id: string; name: string; code: string; owner: string; members: number }>();
  return json({ crews: results.map((c) => ({ id: c.id, name: c.name, code: c.code, members: c.members, owner: c.owner === user })) });
}

async function joinedCount(db: D1Database, user: string) {
  const row = await db.prepare("SELECT COUNT(*) AS n FROM crew_members WHERE user_id = ?").bind(user).first<{ n: number }>();
  return row?.n ?? 0;
}

export async function createCrew(db: D1Database, user: string, body: { name?: unknown } | null) {
  if (!(await boardName(db, user))) return json({ error: "Join the leaderboard first, so your crew sees your name." }, 403);
  const checked = checkName(body?.name);
  if (!checked.ok) return json({ error: checked.message }, 400);
  if ((await joinedCount(db, user)) >= MAX_CREWS) return json({ error: `You can be in ${MAX_CREWS} crews at most.` }, 400);

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    try {
      await db.batch([
        db.prepare("INSERT INTO crews (id, name, code, owner, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, checked.name, code, user, now),
        db.prepare("INSERT INTO crew_members (crew_id, user_id, joined_at) VALUES (?, ?, ?)").bind(id, user, now),
      ]);
      return json({ crew: { id, name: checked.name, code, members: 1, owner: true } });
    } catch {
      // A code collision (very rare): try another.
    }
  }
  return json({ error: "Could not make a crew. Try again." }, 500);
}

export async function joinCrew(db: D1Database, user: string, body: { code?: unknown } | null) {
  if (!(await boardName(db, user))) return json({ error: "Join the leaderboard first, so your crew sees your name." }, 403);
  const code = cleanCode(body?.code);
  if (code.length !== 6) return json({ error: "Crew codes have 6 letters and numbers." }, 400);
  const crew = await db.prepare("SELECT id, name, owner FROM crews WHERE code = ?").bind(code).first<{ id: string; name: string; owner: string }>();
  if (!crew) return json({ error: "No crew has that code." }, 404);

  const already = await db.prepare("SELECT 1 FROM crew_members WHERE crew_id = ? AND user_id = ?").bind(crew.id, user).first();
  if (!already) {
    if ((await joinedCount(db, user)) >= MAX_CREWS) return json({ error: `You can be in ${MAX_CREWS} crews at most.` }, 400);
    const size = await db.prepare("SELECT COUNT(*) AS n FROM crew_members WHERE crew_id = ?").bind(crew.id).first<{ n: number }>();
    if ((size?.n ?? 0) >= MAX_MEMBERS) return json({ error: "That crew is full." }, 400);
    await db.prepare("INSERT INTO crew_members (crew_id, user_id, joined_at) VALUES (?, ?, ?)").bind(crew.id, user, new Date().toISOString()).run();
  }
  const size = await db.prepare("SELECT COUNT(*) AS n FROM crew_members WHERE crew_id = ?").bind(crew.id).first<{ n: number }>();
  return json({ crew: { id: crew.id, name: crew.name, code, members: size?.n ?? 1, owner: crew.owner === user } });
}

// Leaving a crew. If the owner leaves, the longest-standing member takes over; the last one out closes it.
export async function leaveCrew(db: D1Database, user: string, id: string) {
  const crew = await db.prepare("SELECT owner FROM crews WHERE id = ?").bind(id).first<{ owner: string }>();
  const member = await db.prepare("SELECT 1 FROM crew_members WHERE crew_id = ? AND user_id = ?").bind(id, user).first();
  if (!crew || !member) return json({ error: "Not found" }, 404);
  await db.prepare("DELETE FROM crew_members WHERE crew_id = ? AND user_id = ?").bind(id, user).run();
  const next = await db.prepare("SELECT user_id FROM crew_members WHERE crew_id = ? ORDER BY joined_at ASC LIMIT 1").bind(id).first<{ user_id: string }>();
  if (!next) await db.prepare("DELETE FROM crews WHERE id = ?").bind(id).run();
  else if (crew.owner === user) await db.prepare("UPDATE crews SET owner = ? WHERE id = ?").bind(next.user_id, id).run();
  return json({ ok: true });
}

// A crew board only opens for its members.
export async function isCrewMember(db: D1Database, user: string, crew: string): Promise<boolean> {
  return !!(await db.prepare("SELECT 1 FROM crew_members WHERE crew_id = ? AND user_id = ?").bind(crew, user).first());
}

export async function crewName(db: D1Database, id: string): Promise<string | null> {
  return (await db.prepare("SELECT name FROM crews WHERE id = ?").bind(id).first<{ name: string }>())?.name ?? null;
}

// The cards a player chose to show, in order. Only their own, real (not sample) cards can be chosen.
export async function setShowcase(db: D1Database, user: string, body: { ids?: unknown } | null) {
  const ids = Array.isArray(body?.ids) ? [...new Set(body!.ids.filter((x): x is string => typeof x === "string"))].slice(0, SHOWCASE_MAX) : null;
  if (!ids) return json({ error: "ids is required" }, 400);
  let owned: string[] = [];
  if (ids.length) {
    const marks = ids.map(() => "?").join(",");
    const { results } = await db
      .prepare(`SELECT id FROM cards WHERE user_id = ? AND is_sample = 0 AND id IN (${marks})`)
      .bind(user, ...ids)
      .all<{ id: string }>();
    const have = new Set(results.map((r) => r.id));
    owned = ids.filter((i) => have.has(i));
  }
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO profiles (user_id, display_name, created_at, updated_at, showcase) VALUES (?1, '', ?2, ?2, ?3)
       ON CONFLICT (user_id) DO UPDATE SET showcase = ?3, updated_at = ?2`,
    )
    .bind(user, now, JSON.stringify(owned))
    .run();
  return json({ ids: owned });
}

export async function getMyShowcase(db: D1Database, user: string): Promise<string[]> {
  const row = await db.prepare("SELECT showcase FROM profiles WHERE user_id = ?").bind(user).first<{ showcase: string | null }>();
  try {
    return row?.showcase ? (JSON.parse(row.showcase) as string[]) : [];
  } catch {
    return [];
  }
}

export async function playerPage(db: D1Database, name: string, today: string) {
  const player = await loadPlayer(db, name, today);
  if (!player) return json({ error: "No explorer has that name." }, 404);
  const cards = [];
  for (const id of player.showcaseIds.slice(0, SHOWCASE_MAX)) {
    const row = await db
      .prepare(
        `SELECT c.*, (SELECT COUNT(*) FROM cards x WHERE x.user_id = c.user_id
           AND (x.created_at < c.created_at OR (x.created_at = c.created_at AND x.id <= c.id))) AS number
         FROM cards c WHERE c.id = ? AND c.user_id = ? AND c.is_sample = 0`,
      )
      .bind(id, player.userId)
      .first();
    if (row) cards.push(rowToCard(row));
  }
  const { userId: _omit, showcaseIds: _ids, ...open } = player;
  return json({ player: { ...open, showcase: cards } });
}
