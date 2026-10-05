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
  streak: number;
  caughtToday: boolean;
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
  | { status: "rejected"; message: string; used: number; cap: number }
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

// ---------- Leaderboard ----------

export type BoardScope = "all" | "week";
export type NameKind = "screen" | "real";

export interface BoardEntry {
  rank: number;
  name: string;
  kind: NameKind;
  score: number;
  cards: number;
  species: number;
  founder: boolean;
  you: boolean;
}

export interface Board {
  scope: BoardScope;
  entries: BoardEntry[];
  me: { name: string; kind: NameKind; rank: number | null; score: number; cards: number; species: number; founder: boolean } | null;
  total: number;
}

export const getBoard = (scope: BoardScope) => getJson<Board>(`/api/leaderboard?scope=${scope}`);

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
