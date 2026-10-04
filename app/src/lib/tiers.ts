export const TIERS = ["Common", "Uncommon", "Rare", "Epic", "Legendary"] as const;
export type Tier = (typeof TIERS)[number];

// Mirrors worker/src/rules.ts (locked rules). The Worker stays the source of truth;
// these are only used for display.
export const ODDS: Record<Tier, number> = { Common: 55, Uncommon: 25, Rare: 12, Epic: 5, Legendary: 3 };
export const BOOST: Record<Tier, number> = { Common: 0, Uncommon: 0.1, Rare: 0.25, Epic: 0.5, Legendary: 1 };

export const tierRank = (t: Tier) => TIERS.indexOf(t);
export const tierClass = (t: Tier) => `tier-${t.toLowerCase()}`;

export const boostLabel = (t: Tier) => (BOOST[t] === 0 ? "No stat boost" : `+${Math.round(BOOST[t] * 100)}% stat boost`);

// Reveal pacing: the rarer the card, the longer the build-up before the flip.
export const CHARGE_MS: Record<Tier, number> = {
  Common: 650,
  Uncommon: 950,
  Rare: 1350,
  Epic: 1900,
  Legendary: 2700,
};

export const REVEAL_HAPTIC: Record<Tier, number[]> = {
  Common: [16],
  Uncommon: [18, 40, 18],
  Rare: [24, 50, 24],
  Epic: [30, 50, 30, 50, 60],
  Legendary: [40, 60, 40, 60, 40, 60, 140],
};
