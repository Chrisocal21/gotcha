import type { AnimalClass } from "./api";

export const CLASS_LABELS: Record<AnimalClass, string> = {
  mammal: "Mammal",
  bird: "Bird",
  reptile: "Reptile",
  amphibian: "Amphibian",
  fish: "Fish",
  insect: "Insect",
  arachnid: "Arachnid",
  other: "Wild",
};

// Statues keep their depicted animal's class for stats, but always wear the stone card color.
export const classClass = (c: AnimalClass, isStatue = false) => (isStatue ? "cls-statue" : `cls-${c}`);

export const classLabel = (c: AnimalClass, isStatue = false) => (isStatue ? "Statue" : CLASS_LABELS[c]);
