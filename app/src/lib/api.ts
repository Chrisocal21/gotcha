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
  | { status: "caught"; card: Card; newSpecies: boolean; used: number; cap: number }
  | { status: "rejected"; message: string; used: number; cap: number }
  | { status: "capped"; used: number; cap: number; resetsAt: string }
  | { status: "error"; message: string };

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
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
    const res = await fetch("/api/catch", { method: "POST", body: form });
    return await res.json();
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Network error" };
  }
}

export const resetCap = () => fetch("/api/dev/reset-cap", { method: "POST" });

export async function clearSamples(): Promise<number> {
  const res = await fetch("/api/dev/clear-samples", { method: "POST" });
  if (!res.ok) throw new Error("Could not remove sample cards");
  return (await res.json()).deleted;
}

export async function paintSample(id: string): Promise<Card> {
  const res = await fetch(`/api/dev/paint-sample/${id}`, { method: "POST" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? body.message ?? "Could not paint this card");
  return body.card;
}

// Sample cards still showing placeholder art (real art is PNG).
export const needsPaint = (card: Card) => card.isSample && card.artUrl.endsWith(".svg");

export const scoreOf = (stats: Traits) => TRAIT_KEYS.reduce((sum, k) => sum + stats[k], 0);

export const boosted = (traits: Traits, tier: Tier): Traits =>
  Object.fromEntries(TRAIT_KEYS.map((k) => [k, Math.round(traits[k] * (1 + BOOST[tier]))])) as Traits;
