// The weekly challenge: one goal for everyone, the same all week (Monday to Sunday), with its own board.
// The app shows your own progress from your cards; the Worker ranks everyone from the cards table. Both read
// this one file, so they always agree on what counts. Keep ids and goals stable: past weeks are re-scored.

export type ChallengeKind =
  | "cards" // cards caught
  | "species" // different species caught
  | "wild" // cards of wild species
  | "wildSpecies" // different wild species
  | "wildDays" // days with a wild catch
  | "days" // days with any catch
  | "classes" // different animal classes
  | "class" // cards of one animal class
  | "statue" // animal statues
  | "rare"; // Rare or better cards

export interface ChallengeDef {
  id: string;
  title: string;
  blurb: string;
  kind: ChallengeKind;
  cls?: string; // for kind "class"
  goal: number;
  unit: string;
}

export const CHALLENGE_XP = 1000;

const POOL: ChallengeDef[] = [
  { id: "feathers", title: "Feather Week", blurb: "Catch 5 birds", kind: "class", cls: "bird", goal: 5, unit: "birds" },
  { id: "wild-life", title: "Into the Wild", blurb: "Find 5 different wild species", kind: "wildSpecies", goal: 5, unit: "wild species" },
  { id: "discoverer", title: "Discovery Week", blurb: "Catch 8 different species", kind: "species", goal: 8, unit: "species" },
  { id: "lucky", title: "Lucky Streak", blurb: "Pull 2 Rare or better cards", kind: "rare", goal: 2, unit: "rare cards" },
  { id: "habit", title: "Daily Habit", blurb: "Catch something on 5 different days", kind: "days", goal: 5, unit: "days" },
  { id: "bugs", title: "Creepy Crawlies", blurb: "Catch 4 insects", kind: "class", cls: "insect", goal: 4, unit: "insects" },
  { id: "mammals", title: "Mammal Marathon", blurb: "Catch 8 mammals", kind: "class", cls: "mammal", goal: 8, unit: "mammals" },
  { id: "scales", title: "Scales and Shells", blurb: "Catch 2 reptiles", kind: "class", cls: "reptile", goal: 2, unit: "reptiles" },
  { id: "statues", title: "Statue Safari", blurb: "Catch 3 animal statues", kind: "statue", goal: 3, unit: "statues" },
  { id: "big-week", title: "Big Week", blurb: "Catch 15 animals", kind: "cards", goal: 15, unit: "cards" },
  { id: "trail", title: "Trail Regular", blurb: "Find a wild animal on 4 different days", kind: "wildDays", goal: 4, unit: "days" },
  { id: "variety", title: "Variety Pack", blurb: "Catch 4 different kinds of animal", kind: "classes", goal: 4, unit: "classes" },
  { id: "wild-pack", title: "Wild at Heart", blurb: "Catch 10 wild animals", kind: "wild", goal: 10, unit: "wild animals" },
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// `week` is the Monday of the week, as YYYY-MM-DD.
export const challengeFor = (week: string): ChallengeDef => POOL[hash(`gotcha-week:${week}`) % POOL.length];

export interface ChallengeCard {
  day: string;
  species: string;
  wild: boolean;
  animalClass: string;
  isStatue: boolean;
  rarity: string;
}

const key = (s: string) => s.trim().toLowerCase();

// How far along a set of cards (already limited to the week) takes you.
export function challengeValue(def: ChallengeDef, cards: ChallengeCard[]): number {
  switch (def.kind) {
    case "cards":
      return cards.length;
    case "species":
      return new Set(cards.map((c) => key(c.species))).size;
    case "wild":
      return cards.filter((c) => c.wild).length;
    case "wildSpecies":
      return new Set(cards.filter((c) => c.wild).map((c) => key(c.species))).size;
    case "wildDays":
      return new Set(cards.filter((c) => c.wild).map((c) => c.day)).size;
    case "days":
      return new Set(cards.map((c) => c.day)).size;
    case "classes":
      return new Set(cards.filter((c) => !c.isStatue).map((c) => c.animalClass)).size;
    case "class":
      return cards.filter((c) => !c.isStatue && c.animalClass === def.cls).length;
    case "statue":
      return cards.filter((c) => c.isStatue).length;
    case "rare":
      return cards.filter((c) => ["Rare", "Epic", "Legendary"].includes(c.rarity)).length;
  }
}
