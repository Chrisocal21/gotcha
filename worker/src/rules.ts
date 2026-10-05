// Locked rules from docs/GOTCHA_FEATURE_MAP.md. Change them there first.

// The series new cards are stamped with. Flip this when the next series starts (Founders closes at public launch).
export const CURRENT_SERIES = "founders";

export const TIERS = ["Common", "Uncommon", "Rare", "Epic", "Legendary"] as const;
export type Tier = (typeof TIERS)[number];

export const ODDS: Record<Tier, number> = {
  Common: 55,
  Uncommon: 25,
  Rare: 12,
  Epic: 5,
  Legendary: 3,
};

export const BOOST: Record<Tier, number> = {
  Common: 0,
  Uncommon: 0.1,
  Rare: 0.25,
  Epic: 0.5,
  Legendary: 1,
};

// Draft trait set (open question). Scored 1 to 100 on a scale shared by every animal.
export const TRAIT_KEYS = ["power", "speed", "defense", "agility", "senses"] as const;
export type TraitKey = (typeof TRAIT_KEYS)[number];
export type Traits = Record<TraitKey, number>;

export const ANIMAL_CLASSES = ["mammal", "bird", "reptile", "amphibian", "fish", "insect", "arachnid", "other"] as const;
export type AnimalClass = (typeof ANIMAL_CLASSES)[number];

// Epic and Legendary cards are full-art: the illustration runs edge to edge inside the foil frame.
// Lower tiers show the illustration in a framed window, so their art is painted square.
export type ArtLayout = "framed" | "full";
export const layoutFor = (tier: Tier): ArtLayout => (tier === "Epic" || tier === "Legendary" ? "full" : "framed");

export function rollRarity(): Tier {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const roll = (buf[0] / 2 ** 32) * 100;
  let edge = 0;
  for (const tier of TIERS) {
    edge += ODDS[tier];
    if (roll < edge) return tier;
  }
  return "Common";
}

export function clampTraits(raw: Partial<Record<string, number>>): Traits {
  const out = {} as Traits;
  for (const key of TRAIT_KEYS) {
    const v = Math.round(Number(raw[key]) || 1);
    out[key] = Math.min(100, Math.max(1, v));
  }
  return out;
}

export function applyBoost(traits: Traits, tier: Tier): Traits {
  const out = {} as Traits;
  for (const key of TRAIT_KEYS) out[key] = Math.round(traits[key] * (1 + BOOST[tier]));
  return out;
}
