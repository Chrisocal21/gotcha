import { deviceTz } from "../../../shared/tz";
import { BOOST, type Tier } from "./tiers";

export type TraitKey = "power" | "speed" | "defense" | "agility" | "senses";
export type Traits = Record<TraitKey, number>;

export const TRAIT_KEYS: TraitKey[] = ["power", "speed", "defense", "agility", "senses"];
export const TRAIT_LABELS: Record<TraitKey, string> = {
  power: "Power",
  speed: "Speed",
  defense: "Defense",
  agility: "Agility",
  senses: "Senses",
};

export type AnimalClass = "mammal" | "bird" | "reptile" | "amphibian" | "fish" | "insect" | "arachnid" | "other";

export interface Facts {
  common_name: string;
  scientific_name: string;
  variety: string;
  habitat: string;
  diet: string;
  lifespan: string;
  size: string;
  conservation_status: string;
  fun_facts: string[];
  trait_notes: Record<TraitKey, string>;
}

export interface Card {
  facts: Facts | null;
  id: string;
  number: number;
  name: string;
  species: string;
  isStatue: boolean;
  isSample: boolean;
  series?: string;
  day?: string; // the explorer's own calendar day when it was caught (YYYY-MM-DD)
  wild?: boolean; // a wild species: not a pet or farm animal, not a statue
  animalClass: AnimalClass;
  rarity: Tier;
  description: string;
  traits: Traits;
  stats: Traits;
  special: { name: string; description: string };
  artUrl: string;
  createdAt: string;
}

export interface Status {
  used: number;
  cap: number;
  left: number;
  mock: boolean;
  resetsAt: string;
  day?: string; // today, in the explorer's time zone
  streak: number;
  caughtToday: boolean;
  creator?: boolean;
  totalCards: number;
  latest: { artUrl: string; rarity: Tier } | null;
}

export interface Collection {
  cards: Card[];
  species: number;
  tiers: Record<Tier, number>;
  streak: number;
}

export type CatchResult =
  | {
      status: "caught";
      card: Card; // the first animal, kept for older servers
      cards?: Card[]; // every animal in the photo, one card each
      newSpecies: boolean;
      newSpeciesIds?: string[];
      used: number;
      cap: number;
      skipped?: number; // animals left out because the day's catches ran out
      missed?: number; // animals that couldn't be painted (they don't use a catch)
    }
  | { status: "rejected"; title?: string; message: string; used: number; cap: number }
  | { status: "capped"; used: number; cap: number; resetsAt: string }
  | { status: "error"; message: string };

// Set by the sign-in wrapper; stays null when Clerk isn't configured.
let getToken: (() => Promise<string | null>) | null = null;
export const setTokenGetter = (fn: (() => Promise<string | null>) | null) => {
  getToken = fn;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The session token can lag a moment behind sign-in, so wait for it, and retry once with a fresh one if the server refuses.
async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let token: string | null = null;
  for (let i = 0; getToken && !token && i < 10; i++) {
    token = await getToken();
    if (!token) await sleep(200);
  }
  const send = (t: string | null) => {
    const headers = new Headers(init.headers);
    if (t) headers.set("Authorization", `Bearer ${t}`);
    headers.set("X-Tz", deviceTz()); // the server rolls the day over at this explorer's midnight
    return fetch(path, { ...init, headers });
  };
  const res = await send(token);
  if (res.status === 401 && getToken) {
    await sleep(300);
    return send(await getToken());
  }
  return res;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await authFetch(path);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export const getStatus = () => getJson<Status>("/api/status");
export const getCollection = () => getJson<Collection>("/api/cards");
export const getCard = (id: string) => getJson<{ card: Card }>(`/api/cards/${id}`).then((r) => r.card);

export async function sendCatch(photo: Blob): Promise<CatchResult> {
  const form = new FormData();
  form.append("photo", photo, "photo.jpg");
  try {
    const res = await authFetch("/api/catch", { method: "POST", body: form });
    return await res.json();
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Network error" };
  }
}

export const resetCap = () => authFetch("/api/dev/reset-cap", { method: "POST" });

export async function clearSamples(): Promise<number> {
  const res = await authFetch("/api/dev/clear-samples", { method: "POST" });
  if (!res.ok) throw new Error("Could not remove sample cards");
  return (await res.json()).deleted;
}

export async function paintSample(id: string): Promise<Card> {
  const res = await authFetch(`/api/dev/paint-sample/${id}`, { method: "POST" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? body.message ?? "Could not paint this card");
  return body.card;
}

// Sample cards still showing placeholder art (real art is PNG).
export const needsPaint = (card: Card) => card.isSample && card.artUrl.endsWith(".svg");

export const scoreOf = (stats: Traits) => TRAIT_KEYS.reduce((sum, k) => sum + stats[k], 0);

export const boosted = (traits: Traits, tier: Tier): Traits =>
  Object.fromEntries(TRAIT_KEYS.map((k) => [k, Math.round(traits[k] * (1 + BOOST[tier]))])) as Traits;

export interface Profile {
  displayName: string;
  style?: unknown; // the app's look, kept on the account
  styleAt?: number;
  showcase?: string[]; // card ids shown on the public page, favorite first
}

export const getProfile = () => getJson<{ profile: Profile | null }>("/api/profile").then((r) => r.profile);

export async function saveProfile(profile: Profile): Promise<Profile> {
  const res = await authFetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error("Could not save your profile");
  return (await res.json()).profile;
}

export async function saveRemoteStyle(style: unknown, at: number): Promise<void> {
  const res = await authFetch("/api/profile/style", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ style, at }),
  });
  if (!res.ok) throw new Error("Could not save your look");
}

// ---------- Leaderboard ----------

export type BoardScope = "all" | "week";
export type BoardMetric = "score" | "streak" | "species" | "wild" | "rare" | "challenge";
export type NameKind = "screen" | "real";

export interface BoardEntry {
  rank: number;
  name: string;
  kind: NameKind;
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

export interface ChallengeInfo {
  id: string;
  title: string;
  blurb: string;
  goal: number;
  unit: string;
  week: string; // the Monday it started
}

export interface Board {
  scope: BoardScope;
  metric: BoardMetric;
  challenge: ChallengeInfo;
  entries: BoardEntry[];
  me: (Omit<BoardEntry, "rank" | "you"> & { rank: number | null }) | null;
  total: number;
  crew: { id: string; name: string } | null;
}

export const getBoard = (scope: BoardScope, metric: BoardMetric = "score", crew?: string | null) =>
  getJson<Board>(`/api/leaderboard?scope=${scope}&metric=${metric}${crew ? `&crew=${encodeURIComponent(crew)}` : ""}`);

// ---------- Crews and public pages ----------

export interface Crew {
  id: string;
  name: string;
  code: string;
  members: number;
  owner: boolean;
}

async function sendJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await authFetch(path, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Something went wrong");
  return data as T;
}

export const sendFeedback = (kind: "feedback" | "bug" | "idea", message: string, info: string) =>
  sendJson<{ ok: true }>("/api/feedback", "POST", { kind, message, info });
export const reportPlayer = (name: string, reason: "name" | "card" | "other") => sendJson<{ ok: true }>("/api/report", "POST", { name, reason });

export interface AdminStats {
  players: number;
  onBoard: number;
  crews: number;
  cards: number;
  wildShare: number;
  activeToday: number;
  activeWeek: number;
  weekRetention: number | null;
  retentionBase: number;
  perDay: { day: string; catches: number; players: number }[];
  feedback: { id: number; kind: string; message: string; app_info: string; created_at: string }[];
  reports: { target_name: string; reason: string; reports: number; last: string }[];
}
export const getAdminStats = () => getJson<AdminStats>("/api/admin/stats");

export const getCrews = () => getJson<{ crews: Crew[] }>("/api/crews").then((r) => r.crews);
export const createCrew = (name: string) => sendJson<{ crew: Crew }>("/api/crews", "POST", { name }).then((r) => r.crew);
export const joinCrew = (code: string) => sendJson<{ crew: Crew }>("/api/crews/join", "POST", { code }).then((r) => r.crew);
export const leaveCrew = (id: string) => sendJson<{ ok: true }>(`/api/crews/${encodeURIComponent(id)}`, "DELETE").then(() => undefined);
export const saveShowcase = (ids: string[]) => sendJson<{ ids: string[] }>("/api/showcase", "PUT", { ids }).then((r) => r.ids);

export interface Player {
  name: string;
  kind: NameKind;
  since: string;
  creator: boolean;
  founder: boolean;
  stats: { cards: number; species: number; wild: number; rare: number; legendary: number; currentStreak: number; bestStreak: number; activeDays: number };
  showcase: Card[];
}

export const getPlayer = (name: string) => getJson<{ player: Player }>(`/api/players/${encodeURIComponent(name)}`).then((r) => r.player);

// Resolves to null on success, or the reason the name was refused.
export async function joinBoard(kind: NameKind, name: string): Promise<string | null> {
  const res = await authFetch("/api/leaderboard/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, name }),
  });
  if (res.ok) return null;
  const body = await res.json().catch(() => null);
  return body?.error ?? "Could not save that name";
}

export async function leaveBoard(): Promise<void> {
  const res = await authFetch("/api/leaderboard/me", { method: "DELETE" });
  if (!res.ok) throw new Error("Could not leave the leaderboard");
}
