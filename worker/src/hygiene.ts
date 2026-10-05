// Keeping the game safe and affordable: photo moderation, the global catch limit and kill switch,
// feedback and reports from players, and a private look at how testing is going.

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export interface HygieneEnv {
  DB: D1Database;
  OPENAI_API_KEY?: string;
  CATCHING_PAUSED?: string; // "1" stops every catch, the quickest way to stop spending
  GLOBAL_DAILY_CAP?: string; // most catches across everyone in a UTC day, 0 or empty for no limit
}

// ---------- Moderation ----------

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

// OpenAI's moderation check is free. A flagged photo stops here, before any paid vision call. If the
// check itself fails, the catch carries on rather than blocking everyone over an outage.
export async function photoIsUnsafe(env: HygieneEnv, photo: Uint8Array, mime: string): Promise<boolean> {
  if (!env.OPENAI_API_KEY) return false;
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: [{ type: "image_url", image_url: { url: `data:${mime};base64,${toBase64(photo)}` } }],
      }),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { results?: { flagged?: boolean }[] };
    return body.results?.[0]?.flagged === true;
  } catch (e) {
    console.error("moderation failed", e);
    return false;
  }
}

// ---------- Global limits ----------

export type Pause = { message: string } | null;

export async function catchingPaused(env: HygieneEnv): Promise<Pause> {
  if (env.CATCHING_PAUSED === "1") return { message: "Catching is resting for a bit. Your cards are safe. Try again soon." };
  const cap = Number(env.GLOBAL_DAILY_CAP);
  if (cap > 0) {
    const since = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
    const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM cards WHERE created_at >= ? AND is_sample = 0").bind(since).first<{ n: number }>();
    if ((row?.n ?? 0) >= cap) return { message: "Everyone has been busy today. Gotcha is full for now, so try again tomorrow." };
  }
  return null;
}

// ---------- Feedback and reports ----------

const KINDS = ["feedback", "bug", "idea"];
const FEEDBACK_PER_DAY = 10;

export async function addFeedback(db: D1Database, user: string, body: { kind?: unknown; message?: unknown; info?: unknown } | null) {
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 1200) : "";
  if (message.length < 3) return json({ error: "Write a few words first." }, 400);
  const kind = KINDS.includes(body?.kind as string) ? (body!.kind as string) : "feedback";
  const info = typeof body?.info === "string" ? body.info.slice(0, 600) : "";
  const now = new Date().toISOString();
  const sent = await db
    .prepare("SELECT COUNT(*) AS n FROM feedback WHERE user_id = ? AND created_at >= ?")
    .bind(user, `${now.slice(0, 10)}T00:00:00.000Z`)
    .first<{ n: number }>();
  if ((sent?.n ?? 0) >= FEEDBACK_PER_DAY) return json({ error: "That's plenty for today. Thank you!" }, 429);
  await db.prepare("INSERT INTO feedback (user_id, kind, message, app_info, created_at) VALUES (?,?,?,?,?)").bind(user, kind, message, info, now).run();
  return json({ ok: true });
}

const REPORT_REASONS = ["name", "card", "other"];
const HIDE_AT = 3; // different people reporting a name takes it off the boards until it's reviewed

export async function addReport(db: D1Database, user: string, body: { name?: unknown; reason?: unknown } | null) {
  const name = typeof body?.name === "string" ? body.name : "";
  const reason = REPORT_REASONS.includes(body?.reason as string) ? (body!.reason as string) : "other";
  const target = await db.prepare("SELECT user_id, board_name FROM profiles WHERE lower(board_name) = lower(?)").bind(name).first<{ user_id: string; board_name: string }>();
  if (!target) return json({ error: "No explorer has that name." }, 404);
  if (target.user_id === user) return json({ error: "That's you." }, 400);
  await db
    .prepare("INSERT OR REPLACE INTO reports (reporter_id, target_user_id, target_name, reason, created_at) VALUES (?,?,?,?,?)")
    .bind(user, target.user_id, target.board_name, reason, new Date().toISOString())
    .run();
  const count = await db.prepare("SELECT COUNT(*) AS n FROM reports WHERE target_user_id = ?").bind(target.user_id).first<{ n: number }>();
  if ((count?.n ?? 0) >= HIDE_AT) {
    await db.prepare("UPDATE profiles SET board_name = NULL, board_kind = NULL, board_at = NULL, showcase = NULL WHERE user_id = ?").bind(target.user_id).run();
  }
  return json({ ok: true });
}

// ---------- Private stats, for the developer account only ----------

export async function adminStats(db: D1Database) {
  const day = (offset: number) => new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);
  const since = `${day(13)}T00:00:00.000Z`;
  const one = <T>(sql: string, ...args: unknown[]) => db.prepare(sql).bind(...args).first<T>();

  const [players, onBoard, cards, wild, perDay, active1, active7, retained, feedback, reports, crews] = await Promise.all([
    one<{ n: number }>("SELECT COUNT(DISTINCT user_id) AS n FROM cards WHERE is_sample = 0"),
    one<{ n: number }>("SELECT COUNT(*) AS n FROM profiles WHERE board_name IS NOT NULL"),
    one<{ n: number }>("SELECT COUNT(*) AS n FROM cards WHERE is_sample = 0"),
    one<{ n: number }>("SELECT COUNT(*) AS n FROM cards WHERE is_sample = 0 AND wild = 1"),
    db.prepare("SELECT substr(created_at,1,10) AS day, COUNT(*) AS catches, COUNT(DISTINCT user_id) AS players FROM cards WHERE is_sample = 0 AND created_at >= ? GROUP BY day ORDER BY day").bind(since).all<{ day: string; catches: number; players: number }>(),
    one<{ n: number }>("SELECT COUNT(DISTINCT user_id) AS n FROM cards WHERE is_sample = 0 AND created_at >= ?", `${day(0)}T00:00:00.000Z`),
    one<{ n: number }>("SELECT COUNT(DISTINCT user_id) AS n FROM cards WHERE is_sample = 0 AND created_at >= ?", `${day(6)}T00:00:00.000Z`),
    // Players whose first catch was at least a week ago, and how many of those caught again in the last 7 days.
    one<{ eligible: number; back: number }>(
      `WITH firsts AS (SELECT user_id, MIN(created_at) AS first FROM cards WHERE is_sample = 0 GROUP BY user_id)
       SELECT COUNT(*) AS eligible,
         COALESCE(SUM(EXISTS (SELECT 1 FROM cards c WHERE c.user_id = firsts.user_id AND c.is_sample = 0 AND c.created_at >= ?)), 0) AS back
       FROM firsts WHERE first < ?`,
      `${day(6)}T00:00:00.000Z`,
      `${day(7)}T00:00:00.000Z`,
    ),
    db.prepare("SELECT id, kind, message, app_info, created_at FROM feedback ORDER BY id DESC LIMIT 30").all(),
    db.prepare("SELECT target_name, reason, COUNT(*) AS reports, MAX(created_at) AS last FROM reports GROUP BY target_user_id ORDER BY last DESC LIMIT 20").all(),
    one<{ n: number }>("SELECT COUNT(*) AS n FROM crews"),
  ]);

  return json({
    players: players?.n ?? 0,
    onBoard: onBoard?.n ?? 0,
    crews: crews?.n ?? 0,
    cards: cards?.n ?? 0,
    wildShare: cards?.n ? Math.round(((wild?.n ?? 0) / cards.n) * 100) : 0,
    activeToday: active1?.n ?? 0,
    activeWeek: active7?.n ?? 0,
    weekRetention: retained?.eligible ? Math.round(((retained.back ?? 0) / retained.eligible) * 100) : null,
    retentionBase: retained?.eligible ?? 0,
    perDay: perDay.results,
    feedback: feedback.results,
    reports: reports.results,
  });
}
