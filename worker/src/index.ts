import { authenticate, isDeveloper, type AuthEnv } from "./auth";
import { joinBoard, leaveBoard, loadBoard, METRICS } from "./board";
import { crewName, createCrew, getMyShowcase, isCrewMember, joinCrew, leaveCrew, listCrews, playerPage, setShowcase } from "./social";
import { CARD_WITH_NUMBER, rowToCard } from "./cards";
import { addFeedback, addReport, adminStats, catchingPaused, photoIsUnsafe, type HygieneEnv } from "./hygiene";
import { analyzePhoto, illustrate, sampleDescription, type AiEnv, type ArtMode } from "./ai";
import { localDay, nextMidnight, streakEndingAt, validTz } from "../../shared/tz";
import { isWildSpecies } from "../../shared/wild";
import {
  applyBoost,
  clampTraits,
  layoutFor,
  rollRarity,
  ANIMAL_CLASSES,
  BOOST,
  CURRENT_SERIES,
  ODDS,
  TIERS,
  type Tier,
} from "./rules";

interface Env extends AiEnv, AuthEnv, HygieneEnv {
  DB: D1Database;
  ART: R2Bucket;
  DAILY_CAP: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// The day, the limit and the streak all follow the explorer's own midnight. The app sends its time zone with
// every request; anything unrecognised falls back to UTC.
async function caughtToday(env: Env, user: string, day: string): Promise<number> {
  const row = await env.DB.prepare("SELECT count FROM daily_counts WHERE user_id = ? AND day = ?")
    .bind(user, day)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

async function streakFor(env: Env, user: string, today: string): Promise<number> {
  const { results } = await env.DB.prepare(
    "SELECT DISTINCT local_day AS day FROM cards WHERE user_id = ? AND is_sample = 0 ORDER BY day DESC LIMIT 400",
  )
    .bind(user)
    .all<{ day: string }>();
  return streakEndingAt(results.map((r) => r.day), today);
}

async function readPhoto(req: Request) {
  const form = await req.formData();
  const file = form.get("photo") as unknown as File | string | null;
  if (!file || typeof file === "string") throw new Error("Missing photo");
  const mode: ArtMode = form.get("mode") === "text" ? "text" : "reference";
  return { photo: new Uint8Array(await file.arrayBuffer()), mime: file.type || "image/jpeg", mode };
}

async function handleStatus(env: Env, user: string, tz: string) {
  const cap = Number(env.DAILY_CAP);
  const today = localDay(tz);
  const used = await caughtToday(env, user, today);
  const latest = await env.DB.prepare(
    `SELECT art_key, rarity, local_day, (SELECT COUNT(*) FROM cards WHERE user_id = ?1) AS total
     FROM cards WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(user)
    .first<{ art_key: string; rarity: Tier; local_day: string | null; total: number }>();
  return json({
    user,
    used,
    cap,
    left: Math.max(0, cap - used),
    mock: !env.OPENAI_API_KEY,
    resetsAt: nextMidnight(tz),
    day: today,
    tz,
    streak: await streakFor(env, user, today),
    creator: await isDeveloper(env, user),
    caughtToday: latest ? latest.local_day === today : false,
    totalCards: latest?.total ?? 0,
    latest: latest ? { artUrl: `/api/art/${latest.art_key}`, rarity: latest.rarity } : null,
    odds: ODDS,
    boost: BOOST,
  });
}

async function handleCollection(env: Env, user: string, tz: string) {
  const { results } = await env.DB.prepare(
    `SELECT *, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS number
     FROM cards WHERE user_id = ? ORDER BY created_at DESC, id ASC`,
  )
    .bind(user)
    .all();
  const cards = results.map(rowToCard);
  const tiers = Object.fromEntries(TIERS.map((t) => [t, 0])) as Record<Tier, number>;
  for (const c of cards) tiers[c.rarity as Tier]++;
  return json({
    cards,
    species: new Set(cards.map((c) => String(c.species).toLowerCase())).size,
    tiers,
    streak: await streakFor(env, user, localDay(tz)),
  });
}

async function handleCatch(req: Request, env: Env, user: string, tz: string) {
  const cap = Number(env.DAILY_CAP);
  const today = localDay(tz);
  const used = await caughtToday(env, user, today);
  if (used >= cap) return json({ status: "capped", used, cap, resetsAt: nextMidnight(tz) }, 429);

  // Stopped by the kill switch or the everyone-today limit before anything is spent.
  const paused = await catchingPaused(env);
  if (paused) return json({ status: "rejected", title: "Catching is resting", message: paused.message, used, cap }, 503);

  // The photo lives only in this request's memory and is never stored.
  const { photo, mime, mode } = await readPhoto(req);
  if (await photoIsUnsafe(env, photo, mime)) {
    return json({ status: "rejected", title: "Can't use that photo", message: "That photo can't be turned into a card. Try a different one.", used, cap });
  }
  const vision = await analyzePhoto(env, photo, mime);
  if (vision.verdict === "rejected" || vision.animals.length === 0) {
    return json({ status: "rejected", message: vision.rejection_reason, used, cap });
  }

  // Every animal in the photo becomes its own card and uses one of today's catches. If there isn't room
  // for all of them, the most prominent come first.
  const finds = vision.animals.slice(0, cap - used);
  const skipped = vision.animals.length - finds.length;

  // All of them are painted at once. One that fails is left out (and doesn't use a catch).
  const painted = await Promise.allSettled(
    finds.map(async (find) => {
      const rarity = rollRarity();
      const art = await illustrate(env, find, photo, mime, mode, layoutFor(rarity), vision.animals.length);
      return { find, rarity, art };
    }),
  );
  const made = painted.flatMap((p) => (p.status === "fulfilled" ? [p.value] : []));
  if (made.length === 0) throw (painted[0] as PromiseRejectedResult).reason;

  const known = await env.DB.prepare("SELECT DISTINCT lower(species) AS species FROM cards WHERE user_id = ?")
    .bind(user)
    .all<{ species: string }>();
  const seen = new Set(known.results.map((r) => r.species));

  // Cards from one photo share an id root and a created time, which is how the app knows they were caught together.
  const root = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const cards = made.map(({ find, rarity, art }, i) => {
    const id = made.length > 1 ? `${root}-${i}` : root;
    const traits = clampTraits(find.traits);
    const species = find.species.toLowerCase();
    const isNew = !seen.has(species);
    seen.add(species);
    return { id, find, rarity, art, traits, stats: applyBoost(traits, rarity), isNew, artKey: `${id}.${art.mime === "image/png" ? "png" : "svg"}` };
  });

  await Promise.all(cards.map((c) => env.ART.put(c.artKey, c.art.bytes, { httpMetadata: { contentType: c.art.mime } })));
  await env.DB.batch([
    ...cards.map((c) =>
      env.DB.prepare(
        `INSERT INTO cards (id, user_id, name, species, is_statue, is_sample, animal_class, rarity, description, traits,
          stats, special_name, special_description, art_key, created_at, facts, series, local_day, wild) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(
        c.id,
        user,
        c.find.name,
        c.find.species,
        c.find.kind === "statue" ? 1 : 0,
        env.OPENAI_API_KEY ? 0 : 1,
        (ANIMAL_CLASSES as readonly string[]).includes(c.find.animal_class) ? c.find.animal_class : "other",
        c.rarity,
        c.find.card_description,
        JSON.stringify(c.traits),
        JSON.stringify(c.stats),
        c.find.special.name,
        c.find.special.description,
        c.artKey,
        createdAt,
        JSON.stringify(c.find.facts ?? {}),
        CURRENT_SERIES,
        today,
        isWildSpecies(c.find.facts?.conservation_status, c.find.kind === "statue", !env.OPENAI_API_KEY) ? 1 : 0,
      ),
    ),
    env.DB.prepare(
      `INSERT INTO daily_counts (user_id, day, count) VALUES (?, ?, ?)
       ON CONFLICT (user_id, day) DO UPDATE SET count = count + excluded.count`,
    ).bind(user, today, cards.length),
  ]);

  const saved = [];
  for (const c of cards) saved.push(rowToCard(await env.DB.prepare(CARD_WITH_NUMBER).bind(c.id, user).first()));
  return json({
    status: "caught",
    card: saved[0],
    cards: saved,
    newSpecies: cards[0].isNew,
    newSpeciesIds: cards.filter((c) => c.isNew).map((c) => c.id),
    used: used + cards.length,
    cap,
    skipped, // animals in the photo with no catches left for them
    missed: finds.length - cards.length, // animals that couldn't be painted
  });
}

async function paintSample(env: Env, user: string, id: string) {
  if (!env.OPENAI_API_KEY) return json({ error: "Connect an OpenAI key first." }, 400);
  const row = await env.DB.prepare(CARD_WITH_NUMBER).bind(id, user).first<any>();
  if (!row) return json({ error: "Not found" }, 404);
  if (!row.is_sample || !String(row.art_key).endsWith(".svg")) return json({ card: rowToCard(row) });

  const subject = {
    kind: row.is_statue ? ("statue" as const) : ("animal" as const),
    species: row.species,
    position: "",
    visual_description: sampleDescription(row.species) ?? `A typical ${row.species}, shown clearly and in full.`,
  };
  const art = await illustrate(env, subject, new Uint8Array(), "image/jpeg", "text", layoutFor(row.rarity));
  const artKey = `${row.id}-${Date.now()}.png`;
  await env.ART.put(artKey, art.bytes, { httpMetadata: { contentType: art.mime } });
  await env.DB.prepare("UPDATE cards SET art_key = ? WHERE id = ? AND user_id = ?").bind(artKey, row.id, user).run();
  await env.ART.delete(row.art_key);
  const updated = await env.DB.prepare(CARD_WITH_NUMBER).bind(row.id, user).first();
  return json({ card: rowToCard(updated) });
}

async function handleGetProfile(env: Env, user: string) {
  const row = await env.DB.prepare("SELECT display_name, style, style_at FROM profiles WHERE user_id = ?")
    .bind(user)
    .first<{ display_name: string; style: string | null; style_at: number | null }>();
  if (!row) return json({ profile: null });
  const showcase = await getMyShowcase(env.DB, user);
  let style: unknown = null;
  try {
    style = row.style ? JSON.parse(row.style) : null;
  } catch {
    // A damaged copy is treated as no copy.
  }
  return json({ profile: { displayName: row.display_name, style, styleAt: row.style_at ?? 0, showcase } });
}

// The app's look. The app checks every value itself, so this only keeps it to a sane size and shape.
async function handlePutStyle(req: Request, env: Env, user: string) {
  const body = (await req.json().catch(() => null)) as { style?: unknown; at?: unknown } | null;
  const style = body?.style;
  const at = Number(body?.at);
  if (!style || typeof style !== "object" || Array.isArray(style) || !Number.isFinite(at)) return json({ error: "style and at are required" }, 400);
  const text = JSON.stringify(style);
  if (text.length > 4000) return json({ error: "That style is too large" }, 413);
  const now = new Date().toISOString();
  // An older copy never overwrites a newer one, so two devices can't undo each other by syncing late.
  await env.DB.prepare(
    `INSERT INTO profiles (user_id, display_name, created_at, updated_at, style, style_at) VALUES (?1, '', ?2, ?2, ?3, ?4)
     ON CONFLICT (user_id) DO UPDATE SET style = ?3, style_at = ?4, updated_at = ?2 WHERE COALESCE(style_at, 0) <= ?4`,
  )
    .bind(user, now, text, Math.round(at))
    .run();
  return json({ ok: true });
}

async function handlePutProfile(req: Request, env: Env, user: string) {
  const body = (await req.json().catch(() => null)) as { displayName?: unknown } | null;
  if (typeof body?.displayName !== "string") return json({ error: "displayName is required" }, 400);
  const displayName = body.displayName.trim().slice(0, 24);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO profiles (user_id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET display_name = excluded.display_name, updated_at = excluded.updated_at`,
  )
    .bind(user, displayName, now, now)
    .run();
  return json({ profile: { displayName } });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    try {
      const artMatch = path.match(/^\/api\/art\/([\w.-]+)$/);
      if (artMatch && req.method === "GET") {
        const obj = await env.ART.get(artMatch[1]);
        if (!obj) return new Response("Not found", { status: 404 });
        return new Response(obj.body, {
          headers: {
            "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }

      const user = await authenticate(req, env);
      if (!user) return json({ error: "Sign in required" }, 401);
      const tz = validTz(req.headers.get("X-Tz"));

      if (path === "/api/status" && req.method === "GET") return await handleStatus(env, user, tz);
      if (path === "/api/profile") {
        if (req.method === "GET") return await handleGetProfile(env, user);
        if (req.method === "PUT") return await handlePutProfile(req, env, user);
      }
      if (path === "/api/profile/style" && req.method === "PUT") return await handlePutStyle(req, env, user);
      if (path.startsWith("/api/leaderboard") && (await isDeveloper(env, user))) {
        // The creator tag is granted here, from the verified developer account, and never from the app.
        const now = new Date().toISOString();
        await env.DB.prepare(`INSERT INTO profiles (user_id, display_name, created_at, updated_at, role) VALUES (?1, '', ?2, ?2, 'creator')
          ON CONFLICT (user_id) DO UPDATE SET role = 'creator'`).bind(user, now).run();
      }
      if (path === "/api/leaderboard" && req.method === "GET") {
        const q = url.searchParams;
        const metric = METRICS.find((m) => m === q.get("metric")) ?? "score";
        const crew = q.get("crew");
        if (crew && !(await isCrewMember(env.DB, user, crew))) return json({ error: "Not found" }, 404);
        const board = await loadBoard(env.DB, user, { scope: q.get("scope") === "week" ? "week" : "all", metric, today: localDay(tz), crew });
        return json({ ...board, crew: crew ? { id: crew, name: await crewName(env.DB, crew) } : null });
      }
      if (path === "/api/crews") {
        if (req.method === "GET") return await listCrews(env.DB, user);
        if (req.method === "POST") return await createCrew(env.DB, user, (await req.json().catch(() => null)) as { name?: unknown } | null);
      }
      if (path === "/api/crews/join" && req.method === "POST") return await joinCrew(env.DB, user, (await req.json().catch(() => null)) as { code?: unknown } | null);
      const crewMatch = path.match(/^\/api\/crews\/([\w-]+)$/);
      if (crewMatch && req.method === "DELETE") return await leaveCrew(env.DB, user, crewMatch[1]);
      if (path === "/api/showcase" && req.method === "PUT") return await setShowcase(env.DB, user, (await req.json().catch(() => null)) as { ids?: unknown } | null);
      const playerMatch = path.match(/^\/api\/players\/([^/]+)$/);
      if (playerMatch && req.method === "GET") return await playerPage(env.DB, decodeURIComponent(playerMatch[1]), localDay(tz));
      if (path === "/api/feedback" && req.method === "POST") return await addFeedback(env.DB, user, (await req.json().catch(() => null)) as any);
      if (path === "/api/report" && req.method === "POST") return await addReport(env.DB, user, (await req.json().catch(() => null)) as any);
      if (path === "/api/admin/stats" && req.method === "GET") {
        return (await isDeveloper(env, user)) ? await adminStats(env.DB) : json({ error: "Not found" }, 404);
      }
      if (path === "/api/leaderboard/me") {
        if (req.method === "PUT") {
          const result = await joinBoard(env.DB, user, (await req.json().catch(() => null)) as { kind?: unknown; name?: unknown } | null);
          return "error" in result ? json({ error: result.error }, result.status) : json({ name: result.name, kind: result.kind });
        }
        if (req.method === "DELETE") {
          await leaveBoard(env.DB, user);
          return json({ ok: true });
        }
      }
      if (path === "/api/catch" && req.method === "POST") return await handleCatch(req, env, user, tz);
      if (path === "/api/cards" && req.method === "GET") return await handleCollection(env, user, tz);
      const cardMatch = path.match(/^\/api\/cards\/([\w-]+)$/);
      if (cardMatch && req.method === "GET") {
        const row = await env.DB.prepare(CARD_WITH_NUMBER).bind(cardMatch[1], user).first();
        return row ? json({ card: rowToCard(row) }) : json({ error: "Not found" }, 404);
      }
      // Testing helpers, only for the developer account.
      if (path.startsWith("/api/dev/") && req.method === "POST") {
        if (!(await isDeveloper(env, user))) return json({ error: "Not found" }, 404);
        if (path === "/api/dev/reset-cap") {
          await env.DB.prepare("DELETE FROM daily_counts WHERE user_id = ?").bind(user).run();
          return json({ ok: true });
        }
        // Sample cards are the ones made in mock mode, without an OpenAI key.
        if (path === "/api/dev/clear-samples") {
          const { results } = await env.DB.prepare("SELECT art_key FROM cards WHERE user_id = ? AND is_sample = 1")
            .bind(user)
            .all<{ art_key: string }>();
          if (results.length) {
            await env.ART.delete(results.map((r) => r.art_key));
            await env.DB.prepare("DELETE FROM cards WHERE user_id = ? AND is_sample = 1").bind(user).run();
          }
          return json({ ok: true, deleted: results.length });
        }
        // Repaints one sample card's placeholder art with a real illustration (one image call).
        const paintMatch = path.match(/^\/api\/dev\/paint-sample\/([\w-]+)$/);
        if (paintMatch) return await paintSample(env, user, paintMatch[1]);
      }
      return json({ error: "Not found" }, 404);
    } catch (err) {
      console.error(err);
      return json({ status: "error", message: err instanceof Error ? err.message : String(err) }, 500);
    }
  },
};
