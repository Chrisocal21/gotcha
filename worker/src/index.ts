import { analyzePhoto, illustrate, sampleDescription, type AiEnv, type ArtMode } from "./ai";
import {
  applyBoost,
  clampTraits,
  countStreak,
  layoutFor,
  nextUtcMidnight,
  rollRarity,
  utcDay,
  ANIMAL_CLASSES,
  BOOST,
  ODDS,
  TIERS,
  type Tier,
} from "./rules";

interface Env extends AiEnv {
  DB: D1Database;
  ART: R2Bucket;
  DAILY_CAP: string;
}

// Hardcoded while testing (Feature 1.5). Clerk replaces this later.
const TEST_USER = "test-user-1";

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// Every card query carries its collection number: 1 for the first card a user caught, and so on.
// Cards from one photo share a created time, so the id breaks the tie (they're numbered -0, -1, -2).
const CARD_WITH_NUMBER = `SELECT c.*, (SELECT COUNT(*) FROM cards x WHERE x.user_id = c.user_id
    AND (x.created_at < c.created_at OR (x.created_at = c.created_at AND x.id <= c.id))) AS number
  FROM cards c WHERE c.id = ? AND c.user_id = ?`;

async function caughtToday(env: Env, user: string): Promise<number> {
  const row = await env.DB.prepare("SELECT count FROM daily_counts WHERE user_id = ? AND day = ?")
    .bind(user, utcDay())
    .first<{ count: number }>();
  return row?.count ?? 0;
}

async function streakFor(env: Env, user: string): Promise<number> {
  const { results } = await env.DB.prepare(
    "SELECT DISTINCT substr(created_at, 1, 10) AS day FROM cards WHERE user_id = ? ORDER BY day DESC LIMIT 400",
  )
    .bind(user)
    .all<{ day: string }>();
  return countStreak(results.map((r) => r.day));
}

async function readPhoto(req: Request) {
  const form = await req.formData();
  const file = form.get("photo") as unknown as File | string | null;
  if (!file || typeof file === "string") throw new Error("Missing photo");
  const mode: ArtMode = form.get("mode") === "text" ? "text" : "reference";
  return { photo: new Uint8Array(await file.arrayBuffer()), mime: file.type || "image/jpeg", mode };
}

function rowToCard(r: any) {
  return {
    id: r.id,
    number: r.number,
    name: r.name,
    species: r.species,
    isStatue: !!r.is_statue,
    isSample: !!r.is_sample,
    animalClass: r.animal_class,
    rarity: r.rarity,
    description: r.description,
    traits: JSON.parse(r.traits),
    stats: JSON.parse(r.stats),
    special: { name: r.special_name, description: r.special_description },
    facts: r.facts && r.facts !== "{}" ? JSON.parse(r.facts) : null,
    artUrl: `/api/art/${r.art_key}`,
    createdAt: r.created_at,
  };
}

async function handleStatus(env: Env, user: string) {
  const cap = Number(env.DAILY_CAP);
  const used = await caughtToday(env, user);
  const latest = await env.DB.prepare(
    `SELECT art_key, rarity, created_at, (SELECT COUNT(*) FROM cards WHERE user_id = ?1) AS total
     FROM cards WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(user)
    .first<{ art_key: string; rarity: Tier; created_at: string; total: number }>();
  return json({
    user,
    used,
    cap,
    left: Math.max(0, cap - used),
    mock: !env.OPENAI_API_KEY,
    resetsAt: nextUtcMidnight(),
    streak: await streakFor(env, user),
    caughtToday: latest ? latest.created_at.slice(0, 10) === utcDay() : false,
    totalCards: latest?.total ?? 0,
    latest: latest ? { artUrl: `/api/art/${latest.art_key}`, rarity: latest.rarity } : null,
    odds: ODDS,
    boost: BOOST,
  });
}

async function handleCollection(env: Env, user: string) {
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
    streak: await streakFor(env, user),
  });
}

async function handleCatch(req: Request, env: Env, user: string) {
  const cap = Number(env.DAILY_CAP);
  const used = await caughtToday(env, user);
  if (used >= cap) return json({ status: "capped", used, cap, resetsAt: nextUtcMidnight() }, 429);

  // The photo lives only in this request's memory and is never stored.
  const { photo, mime, mode } = await readPhoto(req);
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
          stats, special_name, special_description, art_key, created_at, facts) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
      ),
    ),
    env.DB.prepare(
      `INSERT INTO daily_counts (user_id, day, count) VALUES (?, ?, ?)
       ON CONFLICT (user_id, day) DO UPDATE SET count = count + excluded.count`,
    ).bind(user, utcDay(), cards.length),
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

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const user = TEST_USER;

    try {
      if (path === "/api/status" && req.method === "GET") return await handleStatus(env, user);
      if (path === "/api/catch" && req.method === "POST") return await handleCatch(req, env, user);
      if (path === "/api/cards" && req.method === "GET") return await handleCollection(env, user);
      const cardMatch = path.match(/^\/api\/cards\/([\w-]+)$/);
      if (cardMatch && req.method === "GET") {
        const row = await env.DB.prepare(CARD_WITH_NUMBER).bind(cardMatch[1], user).first();
        return row ? json({ card: rowToCard(row) }) : json({ error: "Not found" }, 404);
      }
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
      // Testing helpers. Only answer on this computer, never on a deployed Worker.
      if (path.startsWith("/api/dev/") && LOCAL_HOSTS.includes(url.hostname) && req.method === "POST") {
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
