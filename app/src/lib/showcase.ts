import type { CardFace } from "../components/GameCard";

// Three sample cards for first-run screens, so a new player sees what they're catching for before
// they have any cards. The art was painted from text alone (no one's photo) and the cards say
// "Sample card" on them.
const day = "2026-10-01T15:00:00.000Z";

export const SHOWCASE: CardFace[] = [
  {
    number: 7,
    name: "Sir Splash",
    species: "Mallard",
    isStatue: false,
    isSample: true,
    animalClass: "bird",
    rarity: "Rare",
    stats: { power: 15, speed: 69, defense: 18, agility: 65, senses: 63 },
    artUrl: "/showcase/mallard.webp",
    special: { name: "Waterproof", description: "Oils its feathers so water rolls right off." },
    description: "Calm on the surface, paddling hard below.",
    createdAt: day,
  },
  {
    number: 3,
    name: "Red Ruffle",
    species: "American Robin",
    isStatue: false,
    isSample: true,
    animalClass: "bird",
    rarity: "Legendary",
    stats: { power: 12, speed: 80, defense: 12, agility: 136, senses: 128 },
    artUrl: "/showcase/robin.webp",
    special: { name: "Worm Radar", description: "Hears worms moving under the soil." },
    description: "First up, first to sing about it.",
    createdAt: day,
  },
  {
    number: 10,
    name: "Biscuit Bolt",
    species: "Golden Retriever",
    isStatue: false,
    isSample: true,
    animalClass: "mammal",
    rarity: "Epic",
    stats: { power: 57, speed: 68, defense: 45, agility: 75, senses: 108 },
    artUrl: "/showcase/retriever.webp",
    special: { name: "Super Sniff", description: "Tracks a scent trail hours after it was laid." },
    description: "Fetches anything, returns most of it.",
    createdAt: day,
  },
];
