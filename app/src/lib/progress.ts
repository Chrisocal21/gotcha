import type { AnimalClass, Card } from "./api";
import { scoreOf } from "./api";
import { collectionFacts, MEDALS, secretFlags, type MedalDef, type Totals } from "./badges";
import { deviceTz, localDay, longestStreak, shiftDay, weekStart } from "../../../shared/tz";
import { CHALLENGE_XP, challengeFor, challengeValue, type ChallengeCard, type ChallengeDef } from "../../../shared/challenges";
import { isWildSpecies } from "../../../shared/wild";
import { completingCard, computeAlbums, type AlbumState } from "./albums";
import { isFounders } from "./series";
import { TIERS, tierRank, type Tier } from "./tiers";

/*
  Explorer progress: XP, levels, badges, daily field tasks and the species journal.

  Everything here is display only and computed on the device from the cards themselves, so it costs
  nothing, needs no server, and never touches a locked rule (odds, daily cap, stats). Days are the
  explorer's own calendar days, the same ones the catch limit and streak use (see shared/tz.ts).

  Keep the task pools and XP values stable: past days are re-scored from them, so changing them
  changes everyone's totals.
*/

// ---------- XP and levels ----------

export const XP = {
  catch: 100,
  newSpecies: 500,
  wild: 75, // a wild species: worth the trip outside
  together: 250, // each extra animal caught in the same photo
  stamp: 500,
  album: 1000, // finishing a Field Guide album
  rarity: { Common: 0, Uncommon: 50, Rare: 150, Epic: 400, Legendary: 1000 } as Record<Tier, number>,
};

export const MAX_LEVEL = 200;

// XP needed to go from level n to the next one, and the total XP at which level n starts.
export const levelStep = (n: number) => 500 * n;
export const levelFloor = (n: number) => 250 * n * (n - 1);

const RANKS: [number, string][] = [
  [1, "Rookie"],
  [5, "Spotter"],
  [10, "Tracker"],
  [15, "Ranger"],
  [20, "Pathfinder"],
  [30, "Naturalist"],
  [40, "Trailblazer"],
  [50, "Legend"],
  [75, "Sage"],
  [100, "Mythkeeper"],
  [150, "Eternal"],
  [200, "Immortal"],
];

export const rankFor = (level: number) => RANKS.filter(([min]) => level >= min).at(-1)![1];

// The next title up and the level it starts at, or null at the very top.
export const nextRank = (level: number) => RANKS.find(([min]) => min > level) ?? null;

export interface LevelInfo {
  level: number;
  rank: string;
  into: number; // XP earned inside the current level
  need: number; // XP the current level takes in total (0 at the top level)
  ratio: number; // 0 to 1, progress through the current level
}

export function levelFor(xp: number): LevelInfo {
  let level = 1;
  while (level < MAX_LEVEL && xp >= levelFloor(level + 1)) level++;
  const need = level >= MAX_LEVEL ? 0 : levelStep(level);
  const into = xp - levelFloor(level);
  return { level, rank: rankFor(level), into, need, ratio: need ? Math.min(1, into / need) : 1 };
}

// ---------- Classes ----------

export type ClassKey = AnimalClass | "statue";

export const CLASS_ORDER: ClassKey[] = ["mammal", "bird", "reptile", "amphibian", "fish", "insect", "arachnid", "statue", "other"];

export const CLASS_NAMES: Record<ClassKey, { one: string; many: string }> = {
  mammal: { one: "Mammal", many: "Mammals" },
  bird: { one: "Bird", many: "Birds" },
  reptile: { one: "Reptile", many: "Reptiles" },
  amphibian: { one: "Amphibian", many: "Amphibians" },
  fish: { one: "Fish", many: "Fish" },
  insect: { one: "Insect", many: "Insects" },
  arachnid: { one: "Arachnid", many: "Arachnids" },
  statue: { one: "Statue", many: "Statues" },
  other: { one: "Wild", many: "Wild" },
};

// A wild species (not a pet or farm animal, not a statue). The server stamps this on every card; older cards work it out.
export const isWild = (c: Pick<Card, "wild" | "facts" | "isStatue" | "isSample">) =>
  c.wild ?? isWildSpecies(c.facts?.conservation_status, c.isStatue, c.isSample);

export const classKeyOf = (c: Pick<Card, "animalClass" | "isStatue">): ClassKey => (c.isStatue ? "statue" : c.animalClass);

const speciesKey = (c: Card) => c.species.trim().toLowerCase();

// "giant panda" and "Giant Panda" are one species. Show the best-capitalised spelling.
function displaySpecies(names: string[]): string {
  const best = [...names].sort((a, b) => capitals(b) - capitals(a))[0] ?? "";
  return best.charAt(0).toUpperCase() + best.slice(1);
}
const capitals = (s: string) => (s.match(/\b[A-Z]/g) ?? []).length;

// ---------- Days ----------

// The calendar day a card was caught on: stamped by the server in the explorer's time zone.
export const cardDay = (c: Pick<Card, "day" | "createdAt">) => c.day ?? c.createdAt.slice(0, 10);
export const todayKey = (now = Date.now()) => localDay(deviceTz(), now);

// ---------- Field tasks ----------

export interface Caught {
  card: Card;
  isNew: boolean; // first card of its species, at the time it was caught
}

export interface TaskDef {
  id: string;
  title: string;
  xp: number;
  goal: number;
  count: (day: Caught[]) => number;
}

const ofClass = (day: Caught[], ...keys: ClassKey[]) => day.filter((x) => keys.includes(classKeyOf(x.card))).length;

// The day's three tasks are shown as three rings, like a fitness tracker: catch, wild, and one that changes.
// The first two never change, so every day has a reason to go outside; the third keeps the days different.
const RING_CATCH: TaskDef = { id: "catch3", title: "Catch 3 animals", xp: 250, goal: 3, count: (d) => d.length };

const wildSpecies = (d: Caught[]) => new Set(d.filter((x) => isWild(x.card)).map((x) => speciesKey(x.card))).size;
const RING_WILD: TaskDef = { id: "wild", title: "Find a wild species", xp: 300, goal: 1, count: (d) => d.filter((x) => isWild(x.card)).length };

// Weighted so the everyday ones come up more often than the hard ones.
const ROTATING: [TaskDef, number][] = [
  [{ id: "new", title: "Discover a new species", xp: 500, goal: 1, count: (d) => d.filter((x) => x.isNew).length }, 4],
  [{ id: "wild3", title: "Find 3 different wild species", xp: 600, goal: 3, count: wildSpecies }, 3],
  [{ id: "species2", title: "Catch 2 different species", xp: 300, goal: 2, count: (d) => new Set(d.map((x) => speciesKey(x.card))).size }, 2],
  [{ id: "catch5", title: "Catch 5 animals", xp: 500, goal: 5, count: (d) => d.length }, 2],
  [{ id: "bird", title: "Catch a bird", xp: 400, goal: 1, count: (d) => ofClass(d, "bird") }, 2],
  [{ id: "mammal", title: "Catch a mammal", xp: 300, goal: 1, count: (d) => ofClass(d, "mammal") }, 2],
  [{ id: "lucky", title: "Pull an Uncommon or better", xp: 400, goal: 1, count: (d) => d.filter((x) => tierRank(x.card.rarity) >= 1).length }, 2],
  [{ id: "strong", title: "Catch a card scoring 250+", xp: 400, goal: 1, count: (d) => d.filter((x) => scoreOf(x.card.stats) >= 250).length }, 2],
  [{ id: "small", title: "Catch an insect or spider", xp: 500, goal: 1, count: (d) => ofClass(d, "insect", "arachnid") }, 1],
  [{ id: "scaly", title: "Catch a reptile, amphibian or fish", xp: 500, goal: 1, count: (d) => ofClass(d, "reptile", "amphibian", "fish") }, 1],
  [{ id: "statue", title: "Catch an animal statue", xp: 500, goal: 1, count: (d) => ofClass(d, "statue") }, 1],
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rotatingFor(day: string): TaskDef {
  const total = ROTATING.reduce((s, [, w]) => s + w, 0);
  let roll = hash(`gotcha:${day}`) % total;
  for (const [def, w] of ROTATING) {
    if (roll < w) return def;
    roll -= w;
  }
  return ROTATING[0][0];
}

// The same three tasks for everyone on a given day. The third never repeats two days running.
export function tasksFor(day: string): TaskDef[] {
  let third = rotatingFor(day);
  if (third.id === rotatingFor(shiftDay(day, -1)).id) {
    const i = ROTATING.findIndex(([d]) => d.id === third.id);
    third = ROTATING[(i + 1) % ROTATING.length][0];
  }
  return [RING_CATCH, RING_WILD, third];
}

export interface TaskState {
  def: TaskDef;
  progress: number;
  done: boolean;
}

// ---------- Ledger ----------

export type XpKind = "catch" | "rarity" | "species" | "wild" | "together" | "task" | "stamp" | "challenge" | "album";

export interface XpLine {
  kind: XpKind;
  label: string;
  xp: number;
}

export interface DayLog {
  day: string;
  caught: Caught[];
  tasks: TaskState[];
  stamp: boolean;
  xp: number;
}

// ---------- Badges ----------

export type MedalTier = number;
export const MEDAL_TIERS = ["Locked", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Mythic"] as const;

export { MEDALS, type MedalDef, type MedalGlyph } from "./badges";

export interface MedalState {
  def: MedalDef;
  value: number;
  tier: MedalTier;
  goal: number | null; // next goal, or null when every tier is done
  floor: number; // the goal of the current tier (0 when locked)
}

// Mystery badges have one step and show as gold once found.
export const tierLabel = (m: MedalState) => (m.def.secret ? "Found" : MEDAL_TIERS[m.tier]);
export const isSecret = (m: MedalState) => !!m.def.secret;

function medalState(def: MedalDef, t: Totals): MedalState {
  const value = def.metric(t);
  const reached = def.goals.filter((g) => value >= g).length;
  const tier = def.secret ? (reached ? 3 : 0) : reached;
  return { def, value, tier, goal: reached < def.goals.length ? def.goals[reached] : null, floor: reached > 0 ? def.goals[reached - 1] : 0 };
}
// ---------- Journal ----------

export interface SpeciesEntry {
  key: string;
  name: string;
  cls: ClassKey;
  count: number;
  best: Card; // rarest, then highest score
  first: Card;
  latest: Card;
}

// ---------- Everything together ----------

export interface Progress extends LevelInfo {
  xp: number;
  cards: number;
  species: number;
  wild: number; // cards of wild species
  wildSpecies: number;
  currentStreak: number;
  bestStreak: number;
  challenge: { def: ChallengeDef; week: string; value: number; done: boolean }; // this week's
  albums: AlbumState[]; // the Field Guide
  tiers: Record<Tier, number>;
  classes: Record<ClassKey, { cards: number; species: number }>;
  medals: MedalState[];
  medalsEarned: number; // sum of tiers across all badges
  days: DayLog[]; // newest first, only days with catches
  today: DayLog;
  week: { day: string; stamp: boolean; caught: number }[]; // the last 7 days, oldest first
  ledger: Map<string, XpLine[]>;
  journal: SpeciesEntry[];
  together: Map<string, Card[]>; // card id to every card caught in the same photo (only for photos with 2 or more)
}

const emptyClasses = () =>
  Object.fromEntries(CLASS_ORDER.map((k) => [k, { cards: 0, species: 0 }])) as Record<ClassKey, { cards: number; species: number }>;

function better(a: Card, b: Card) {
  return tierRank(a.rarity) - tierRank(b.rarity) || scoreOf(a.stats) - scoreOf(b.stats);
}

export function computeProgress(all: Card[], { now = Date.now(), cap = 10, eggs = new Set<string>() }: { now?: number; cap?: number; eggs?: ReadonlySet<string> } = {}): Progress {
  const cards = [...all].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.number - b.number);
  const ledger = new Map<string, XpLine[]>();
  const seen = new Set<string>();
  const byDay = new Map<string, Caught[]>();
  const tiers = Object.fromEntries(TIERS.map((t) => [t, 0])) as Record<Tier, number>;
  const classes = emptyClasses();
  const speciesByClass = new Map<ClassKey, Set<string>>();
  const journal = new Map<string, { names: string[]; cards: Card[] }>();

  // Animals caught in one photo share the same moment, so they arrive here next to each other.
  const photos = new Map<string, Card[]>();
  for (const card of cards) {
    if (!photos.has(card.createdAt)) photos.set(card.createdAt, []);
    photos.get(card.createdAt)!.push(card);
  }

  for (const card of cards) {
    const key = speciesKey(card);
    const isNew = !seen.has(key);
    seen.add(key);
    const lines: XpLine[] = [{ kind: "catch", label: "Catch", xp: XP.catch }];
    if (XP.rarity[card.rarity] > 0) lines.push({ kind: "rarity", label: `${card.rarity} find`, xp: XP.rarity[card.rarity] });
    if (isNew) lines.push({ kind: "species", label: "New species", xp: XP.newSpecies });
    if (isWild(card)) lines.push({ kind: "wild", label: "Wild species", xp: XP.wild });
    if (photos.get(card.createdAt)![0] !== card) lines.push({ kind: "together", label: "Caught together", xp: XP.together });
    ledger.set(card.id, lines);

    const day = cardDay(card);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push({ card, isNew });

    tiers[card.rarity]++;
    const cls = classKeyOf(card);
    classes[cls].cards++;
    if (!speciesByClass.has(cls)) speciesByClass.set(cls, new Set());
    speciesByClass.get(cls)!.add(key);

    if (!journal.has(key)) journal.set(key, { names: [], cards: [] });
    const j = journal.get(key)!;
    j.names.push(card.species);
    j.cards.push(card);
  }
  for (const [cls, set] of speciesByClass) classes[cls].species = set.size;

  // Weekly challenges, scored week by week. The XP goes to the card that completed it.
  const asChallengeCard = (c: Card): ChallengeCard => ({ day: cardDay(c), species: c.species, wild: isWild(c), animalClass: c.animalClass, isStatue: c.isStatue, rarity: c.rarity });
  const byWeek = new Map<string, Card[]>();
  for (const card of cards) {
    const w = weekStart(cardDay(card));
    if (!byWeek.has(w)) byWeek.set(w, []);
    byWeek.get(w)!.push(card);
  }
  let challengesDone = 0;
  for (const [week, list] of byWeek) {
    const def = challengeFor(week);
    const sofar: ChallengeCard[] = [];
    for (const card of list) {
      sofar.push(asChallengeCard(card));
      if (challengeValue(def, sofar) >= def.goal) {
        ledger.get(card.id)!.push({ kind: "challenge", label: def.title, xp: CHALLENGE_XP });
        challengesDone++;
        break;
      }
    }
  }
  // Field Guide albums: finishing one pays out once, to the card that filled its last slot.
  const albums = computeAlbums(cards);
  for (const a of albums) {
    const done = completingCard(a);
    if (done) ledger.get(done.id)!.push({ kind: "album", label: `${a.def.name} complete`, xp: XP.album });
  }
  const thisWeek = weekStart(todayKey(now));
  const thisDef = challengeFor(thisWeek);
  const thisValue = challengeValue(thisDef, (byWeek.get(thisWeek) ?? []).map(asChallengeCard));

  // Field tasks, scored day by day. A task's XP goes to the card that completed it.
  const evaluate = (day: string, caught: Caught[]): DayLog => {
    const defs = tasksFor(day);
    const done = new Set<string>();
    let stamp = false;
    for (let i = 0; i < caught.length; i++) {
      const sofar = caught.slice(0, i + 1);
      const lines = ledger.get(caught[i].card.id)!;
      for (const def of defs) {
        if (done.has(def.id) || def.count(sofar) < def.goal) continue;
        done.add(def.id);
        lines.push({ kind: "task", label: def.title, xp: def.xp });
      }
      if (!stamp && done.size === defs.length) {
        stamp = true;
        lines.push({ kind: "stamp", label: "Daily stamp", xp: XP.stamp });
      }
    }
    const tasks = defs.map((def) => {
      const progress = Math.min(def.goal, def.count(caught));
      return { def, progress, done: progress >= def.goal };
    });
    const xp = caught.reduce((s, x) => s + ledger.get(x.card.id)!.reduce((a, l) => a + l.xp, 0), 0);
    return { day, caught, tasks, stamp, xp };
  };

  const days = [...byDay.entries()].map(([day, caught]) => evaluate(day, caught));
  const xp = days.reduce((s, d) => s + d.xp, 0);

  const today = todayKey(now);
  const todayLog = days.find((d) => d.day === today) ?? evaluate(today, []);

  // Streaks over consecutive days with a catch.
  const dayKeys = days.map((d) => d.day);
  let bestStreak = 0;
  let run = 0;
  for (let i = 0; i < dayKeys.length; i++) {
    run = i > 0 && shiftDay(dayKeys[i - 1], 1) === dayKeys[i] ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
  }
  let currentStreak = 0;
  const last = dayKeys.at(-1);
  if (last === today || last === shiftDay(today, -1)) {
    currentStreak = 1;
    for (let i = dayKeys.length - 1; i > 0 && shiftDay(dayKeys[i - 1], 1) === dayKeys[i]; i--) currentStreak++;
  }

  const copies = new Map([...journal.entries()].map(([k, j]) => [k, j.cards.length] as const));
  const facts = collectionFacts(cards, copies);
  const chronological = days; // already oldest first
  const photoGroups = [...photos.values()];
  const flags = secretFlags({
    cards,
    photos: photoGroups,
    days: chronological.map((d) => d.caught.map((x) => x.card)),
    dayKeys: chronological.map((d) => d.day),
    eggs,
  });
  const wildCards = cards.filter(isWild);
  const wildDays = [...new Set(wildCards.map(cardDay))];
  const wildSpeciesCount = new Set(wildCards.map(speciesKey)).size;
  const totals: Totals = {
    cards: cards.length,
    founders: cards.filter((c) => isFounders(c.series)).length,
    species: seen.size,
    level: levelFor(xp).level,
    bestStreak,
    rarePlus: tiers.Rare + tiers.Epic + tiers.Legendary,
    legendary: tiers.Legendary,
    epic: tiers.Epic + tiers.Legendary,
    uncommon: tiers.Uncommon,
    tiersOwned: TIERS.filter((t) => tiers[t] > 0).length,
    fullDays: days.filter((d) => d.caught.length >= cap).length,
    stampDays: days.filter((d) => d.stamp).length,
    activeDays: days.length,
    packs: photoGroups.filter((g) => g.length > 1).length,
    bigPack: Math.max(0, ...photoGroups.map((g) => g.length)),
    bestScore: facts.bestScore,
    heavy: facts.heavy,
    titans: facts.titans,
    maxCopies: facts.maxCopies,
    calendarMonths: facts.calendarMonths,
    letters: facts.letters,
    colorWords: facts.colorWords,
    night: facts.night,
    early: facts.early,
    weekend: facts.weekend,
    wild: wildCards.length,
    wildSpecies: wildSpeciesCount,
    wildDays: wildDays.length,
    wildStreak: longestStreak(wildDays),
    challenges: challengesDone,
    albums: albums.filter((a) => a.done).length,
    byClass: Object.fromEntries(CLASS_ORDER.map((k) => [k, classes[k].cards])),
    speciesByClass: Object.fromEntries(CLASS_ORDER.map((k) => [k, classes[k].species])),
    families: facts.families,
    flags,
  };  const medals = MEDALS.map((def) => medalState(def, totals));

  const week = Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(today, i - 6);
    const log = days.find((d) => d.day === day);
    return { day, stamp: !!log?.stamp, caught: log?.caught.length ?? 0 };
  });

  const entries: SpeciesEntry[] = [...journal.entries()].map(([key, j]) => ({
    key,
    name: displaySpecies(j.names),
    cls: classKeyOf(j.cards[0]),
    count: j.cards.length,
    best: j.cards.reduce((a, b) => (better(b, a) > 0 ? b : a)),
    first: j.cards[0],
    latest: j.cards[j.cards.length - 1],
  }));

  return {
    ...levelFor(xp),
    xp,
    cards: cards.length,
    species: seen.size,
    wild: wildCards.length,
    wildSpecies: wildSpeciesCount,
    currentStreak,
    bestStreak,
    challenge: { def: thisDef, week: thisWeek, value: thisValue, done: thisValue >= thisDef.goal },
    albums,
    tiers,
    classes,
    medals,
    medalsEarned: medals.reduce((s, m) => s + m.tier, 0),
    days: days.reverse(),
    today: todayLog,
    week,
    ledger,
    journal: entries,
    together: new Map([...photos.values()].filter((g) => g.length > 1).flatMap((g) => g.map((c) => [c.id, g] as const))),
  };
}

// ---------- One catch, before and after ----------

export interface RewardLine extends XpLine {
  count: number; // how many cards earned this line ("Catch" twice for two animals)
}

export interface Rewards {
  lines: RewardLine[];
  total: number;
  before: LevelInfo & { xp: number };
  after: LevelInfo & { xp: number };
  levelUp: boolean;
  medals: MedalState[]; // badges that reached a new tier with this catch
}

export function rewardsFor(before: Progress, after: Progress, cardIds: string[]): Rewards {
  const lines: RewardLine[] = [];
  for (const id of cardIds) {
    for (const l of after.ledger.get(id) ?? []) {
      const same = lines.find((x) => x.kind === l.kind && x.label === l.label);
      if (same) {
        same.xp += l.xp;
        same.count++;
      } else lines.push({ ...l, count: 1 });
    }
  }
  const tierOf = new Map(before.medals.map((m) => [m.def.id, m.tier]));
  return {
    lines,
    total: lines.reduce((s, l) => s + l.xp, 0),
    before: { ...levelFor(before.xp), xp: before.xp },
    after: { ...levelFor(after.xp), xp: after.xp },
    levelUp: after.level > before.level,
    medals: after.medals.filter((m) => m.tier > (tierOf.get(m.def.id) ?? 0)),
  };
}
