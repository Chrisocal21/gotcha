import type { Card } from "./api";
import { scoreOf } from "./api";
import { tierRank, type Tier } from "./tiers";

/*
  The badge catalog. Everything here is display only and worked out on the device from the cards.

  Three kinds:
    - Tiered badges climb bronze, silver, gold, platinum, diamond and mythic. The last tiers are set far
      out on purpose, so there's always something bigger to chase.
    - Collections reward species by family (every cat, every bird of prey, every dog breed...).
    - Mystery badges stay hidden until found: card oddities, dates on the calendar, and easter eggs.

  Keep ids and goals stable: past catches are re-scored from these, so changing them changes everyone's badges.
*/

export type MedalGlyph = string;

export interface MedalDef {
  id: string;
  name: string;
  blurb: string; // what counts, in a few words (for mystery badges, what you did)
  unit: string; // the thing being counted, for "12 / 50 cards"
  glyph: MedalGlyph;
  color: string;
  goals: number[];
  metric: (t: Totals) => number;
  group: "progress" | "class" | "collection" | "habit" | "mystery";
  secret?: { hint: string }; // mystery badges: hidden until found, one step only
}

export interface Totals {
  cards: number;
  species: number;
  level: number;
  bestStreak: number;
  rarePlus: number;
  legendary: number;
  epic: number;
  uncommon: number;
  tiersOwned: number;
  fullDays: number;
  stampDays: number;
  activeDays: number;
  packs: number;
  bigPack: number;
  bestScore: number;
  heavy: number; // cards scoring 250+
  titans: number; // cards scoring 400+
  maxCopies: number;
  calendarMonths: number;
  letters: number;
  colorWords: number;
  night: number;
  early: number;
  weekend: number;
  byClass: Record<string, number>;
  speciesByClass: Record<string, number>;
  families: Record<string, number>;
  flags: Set<string>;
}

// ---------- Species families ----------

interface Family {
  id: string;
  name: string;
  glyph: string;
  words: string[];
  goals?: number[];
}

const FAMILIES: Family[] = [
  { id: "cats", name: "Cat Fancier", glyph: "Cat", words: ["cat", "lion", "tiger", "leopard", "jaguar", "cheetah", "cougar", "lynx", "bobcat", "panther", "ocelot", "serval", "caracal", "tabby", "siamese", "persian", "bengal", "ragdoll", "sphynx", "maine coon", "puma"] },
  { id: "dogs", name: "Dog Show", glyph: "Bone", goals: [2, 5, 10, 20, 40, 75], words: ["dog", "retriever", "poodle", "labrador", "terrier", "shepherd", "bulldog", "beagle", "husky", "corgi", "dachshund", "collie", "spaniel", "pug", "boxer", "rottweiler", "doberman", "greyhound", "whippet", "chihuahua", "malamute", "pointer", "setter", "mastiff", "schnauzer", "shih tzu", "pomeranian", "samoyed", "akita", "hound", "sheepdog", "cockapoo", "labradoodle"] },
  { id: "wild-dogs", name: "Pack Hunter", glyph: "Dog", words: ["wolf", "fox", "coyote", "jackal", "dingo", "dhole", "hyena"] },
  { id: "bears", name: "Bear Hug", glyph: "Panda", words: ["bear", "panda"] },
  { id: "primates", name: "Monkey Business", glyph: "Smile", words: ["monkey", "ape", "gorilla", "chimpanzee", "chimp", "orangutan", "lemur", "gibbon", "baboon", "macaque", "marmoset", "tamarin", "loris", "mandrill", "capuchin", "bonobo", "langur"] },
  { id: "raptors", name: "Talon Watch", glyph: "Eye", words: ["eagle", "hawk", "falcon", "owl", "kite", "osprey", "harrier", "buzzard", "vulture", "condor", "kestrel", "merlin", "peregrine", "goshawk"] },
  { id: "waterfowl", name: "Pond Party", glyph: "Waves", words: ["duck", "goose", "swan", "teal", "mallard", "merganser", "mandarin", "wigeon", "pintail", "shoveler", "eider", "gadwall", "canvasback", "bufflehead"] },
  { id: "songbirds", name: "Songbook", glyph: "Music", words: ["robin", "sparrow", "finch", "jay", "wren", "warbler", "cardinal", "thrush", "chickadee", "starling", "oriole", "swallow", "bluebird", "tanager", "grosbeak", "nuthatch", "mockingbird", "bunting", "lark", "titmouse", "junco", "waxwing", "flycatcher", "blackbird"] },
  { id: "seabirds", name: "Sea Legs", glyph: "Anchor", words: ["gull", "pelican", "albatross", "puffin", "tern", "penguin", "cormorant", "petrel", "booby", "gannet", "frigatebird", "skua"] },
  { id: "parrots", name: "Polly Wants", glyph: "Feather", words: ["parrot", "macaw", "cockatoo", "parakeet", "budgie", "cockatiel", "lorikeet", "lovebird", "conure"] },
  { id: "snakes", name: "Slither Sheet", glyph: "Worm", words: ["snake", "python", "cobra", "viper", "boa", "rattlesnake", "adder", "mamba", "anaconda", "racer", "garter", "copperhead", "kingsnake"] },
  { id: "lizards", name: "Lizard Lounge", glyph: "Sun", words: ["lizard", "gecko", "iguana", "anole", "skink", "chameleon", "monitor", "dragon", "basilisk", "tegu", "gila"] },
  { id: "turtles", name: "Shell Collection", glyph: "Shell", words: ["turtle", "tortoise", "terrapin", "slider", "cooter"] },
  { id: "frogs", name: "Chorus Line", glyph: "amphibian", words: ["frog", "toad", "salamander", "newt", "treefrog", "axolotl", "bullfrog"] },
  { id: "sharks", name: "Fin Fan", glyph: "Shield", words: ["shark", "ray", "skate", "stingray", "manta", "hammerhead"] },
  { id: "marine", name: "Marine Life", glyph: "Waves", words: ["whale", "dolphin", "seal", "sea lion", "orca", "otter", "walrus", "manatee", "porpoise", "narwhal", "beluga", "dugong"] },
  { id: "hoofed", name: "Hoofbeats", glyph: "Mountain", words: ["deer", "elk", "moose", "antelope", "gazelle", "caribou", "reindeer", "bison", "buffalo", "goat", "sheep", "ibex", "impala", "wildebeest", "oryx", "kudu", "yak", "muntjac"] },
  { id: "rodents", name: "Gnaw Club", glyph: "Squirrel", words: ["squirrel", "chipmunk", "mouse", "rat", "beaver", "hamster", "gerbil", "vole", "porcupine", "capybara", "marmot", "prairie dog", "guinea pig", "chinchilla", "groundhog", "woodchuck", "muskrat"] },
  { id: "hoppers", name: "Hop To It", glyph: "Rabbit", words: ["rabbit", "hare", "pika", "bunny", "cottontail", "jackrabbit"] },
  { id: "savanna", name: "Savanna Giants", glyph: "Tent", words: ["elephant", "giraffe", "zebra", "rhino", "rhinoceros", "hippo", "hippopotamus", "lion", "cheetah", "wildebeest", "meerkat", "warthog", "okapi", "ostrich"] },
  { id: "farm", name: "Farmyard", glyph: "House", words: ["cow", "pig", "horse", "chicken", "sheep", "goat", "donkey", "rooster", "hen", "llama", "alpaca", "turkey", "pony", "ox", "calf", "lamb", "piglet", "mule"] },
  { id: "butterflies", name: "Wing Collector", glyph: "Flower", words: ["butterfly", "moth", "skipper", "swallowtail", "monarch", "admiral", "fritillary", "emperor"] },
  { id: "bees", name: "Buzz Worthy", glyph: "Hexagon", words: ["bee", "wasp", "hornet", "bumblebee", "honeybee", "yellowjacket"] },
  { id: "beetles", name: "Beetlemania", glyph: "insect", words: ["beetle", "ladybug", "ladybird", "weevil", "firefly", "scarab", "stag beetle", "June bug"] },
  { id: "colony", name: "Colony Life", glyph: "Users", words: ["ant", "termite", "cricket", "grasshopper", "cicada", "katydid", "mantis", "locust"] },
  { id: "fishes", name: "Tackle Box", glyph: "fish", words: ["trout", "bass", "salmon", "carp", "catfish", "goldfish", "koi", "tuna", "pike", "perch", "cod", "eel", "clownfish", "angelfish", "betta", "guppy", "tetra", "bluegill", "sunfish", "pufferfish", "seahorse", "barracuda", "swordfish", "marlin"] },
  { id: "myth", name: "Myth & Legend", glyph: "Wand2", words: ["dragon", "unicorn", "griffin", "gryphon", "phoenix", "pegasus", "mermaid", "sphinx", "centaur", "minotaur", "hydra", "kraken", "yeti", "bigfoot", "cerberus", "basilisk"] },
];

const wordPattern = (words: string[]) => new RegExp(`\\b(?:${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})s?\\b`, "i");
const FAMILY_TESTS = FAMILIES.map((f) => ({ ...f, test: wordPattern(f.words) }));

const COLOR_WORDS = ["red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "black", "white", "gray", "grey", "silver", "golden", "scarlet", "crimson", "violet", "indigo"];
const COLOR_TEST = COLOR_WORDS.map((c) => [c, new RegExp(`\\b${c}\\b`, "i")] as const);

// ---------- Secret checks ----------

export interface SecretContext {
  cards: Card[]; // oldest first
  photos: Card[][];
  days: Card[][]; // one list per day with catches, oldest day first
  eggs: ReadonlySet<string>;
  dayKeys: string[]; // matches days
}

const local = (iso: string) => new Date(iso);
const isPalindrome = (n: number) => {
  const s = String(n);
  return s.length >= 3 && s === [...s].reverse().join("");
};
const onDate = (c: Card, month: number, day: number) => {
  const d = local(c.createdAt);
  return d.getMonth() + 1 === month && d.getDate() === day;
};
const DAY_MS = 86_400_000;

const nameTest = (re: RegExp) => (x: SecretContext) => x.cards.some((c) => re.test(c.species));
const dateTest = (month: number, day: number) => (x: SecretContext) => x.cards.some((c) => onDate(c, month, day));

interface SecretDef {
  id: string;
  name: string;
  glyph: string;
  color: string;
  hint: string; // shown while hidden
  reveal: string; // shown once found
  test: (x: SecretContext) => boolean;
}

const SECRETS: SecretDef[] = [
  { id: "dragon", name: "Here Be Dragons", glyph: "Flame", color: "#c2412d", hint: "Some real animals wear mythical names.", reveal: "Caught an animal with dragon in its name", test: nameTest(/dragon/i) },
  { id: "spooky", name: "Spooky Season", glyph: "Ghost", color: "#5b4b8a", hint: "Not every monster is made up.", reveal: "Caught a ghost, vampire, devil or other creep", test: nameTest(/\b(ghost|vampire|devil|skeleton|zombie|witch|goblin|ghoul|phantom|banshee|reaper|demon)\b/i) },
  { id: "royal", name: "Royal Court", glyph: "Crown", color: "#8a5a12", hint: "Bow before nature's nobility.", reveal: "Caught a king, queen, emperor or other royal", test: nameTest(/\b(king|queen|prince|princess|emperor|empress|royal|monarch|duke|baron|lord|regal)\b/i) },
  { id: "sevens", name: "Triple Sevens", glyph: "Dices", color: "#b8860b", hint: "Lucky numbers hide in the stats.", reveal: "Caught a card with a score of exactly 777", test: (x) => x.cards.some((c) => scoreOf(c.stats) === 777) },
  { id: "mirror", name: "Mirror, Mirror", glyph: "Binary", color: "#3f7f9a", hint: "Some numbers read the same both ways.", reveal: "Owned a card with a palindrome number", test: (x) => x.cards.some((c) => isPalindrome(c.number)) },
  { id: "answer", name: "The Answer", glyph: "Infinity", color: "#2f6fd6", hint: "What is the answer to life, the universe and everything?", reveal: "Reached card number 42", test: (x) => x.cards.length >= 42 },
  { id: "witching", name: "Witching Hour", glyph: "MoonStar", color: "#3b3f8c", hint: "Some explorers never sleep.", reveal: "Caught something between 2 and 4 in the morning", test: (x) => x.cards.some((c) => [2, 3].includes(local(c.createdAt).getHours())) },
  { id: "friday13", name: "Unlucky For Some", glyph: "Skull", color: "#444", hint: "A certain Friday brings out the brave.", reveal: "Caught something on Friday the 13th", test: (x) => x.cards.some((c) => { const d = local(c.createdAt); return d.getDay() === 5 && d.getDate() === 13; }) },
  { id: "halloween", name: "Trick or Treat", glyph: "Ghost", color: "#d9650d", hint: "The last night of October.", reveal: "Caught something on Halloween", test: dateTest(10, 31) },
  { id: "newyear", name: "Fresh Start", glyph: "PartyPopper", color: "#a23fb5", hint: "The very first day of the year.", reveal: "Caught something on January 1", test: dateTest(1, 1) },
  { id: "valentine", name: "Sweetheart", glyph: "Heart", color: "#c23a6a", hint: "Love is in the air in February.", reveal: "Caught something on Valentine's Day", test: dateTest(2, 14) },
  { id: "leap", name: "Leap of Faith", glyph: "Calendar", color: "#2c8a5c", hint: "A day that only comes around sometimes.", reveal: "Caught something on February 29", test: dateTest(2, 29) },
  { id: "earthday", name: "Planet Pal", glyph: "Leaf", color: "#3f8f3a", hint: "A day for the whole planet.", reveal: "Caught something on Earth Day", test: dateTest(4, 22) },
  { id: "piday", name: "Slice of Pi", glyph: "Pi", color: "#b05a1f", hint: "3.14 and counting.", reveal: "Caught something on March 14", test: dateTest(3, 14) },
  { id: "maythe4th", name: "Fourth Be With You", glyph: "Star", color: "#2a4f9d", hint: "A date a long time ago in a galaxy far away.", reveal: "Caught something on May 4", test: dateTest(5, 4) },
  { id: "solstice", name: "Sun Chaser", glyph: "Sunrise", color: "#d98a0b", hint: "The longest and shortest days.", reveal: "Caught something on a solstice", test: (x) => x.cards.some((c) => onDate(c, 6, 21) || onDate(c, 12, 21)) },
  { id: "holiday", name: "Holiday Spirit", glyph: "Gift", color: "#b02a37", hint: "Even explorers unwrap something.", reveal: "Caught something on Christmas Eve or Day", test: (x) => x.cards.some((c) => onDate(c, 12, 24) || onDate(c, 12, 25)) },
  { id: "double", name: "Seeing Double", glyph: "Layers", color: "#1d7f99", hint: "Two of a kind in one shot.", reveal: "Caught the same species twice in one photo", test: (x) => x.photos.some((g) => g.length > 1 && new Set(g.map((c) => c.species.trim().toLowerCase())).size < g.length) },
  { id: "rainbowday", name: "Rainbow Day", glyph: "Rainbow", color: "#6a4fd0", hint: "Variety is the spice of a day.", reveal: "Caught four different animal classes in one day", test: (x) => x.days.some((d) => new Set(d.map((c) => (c.isStatue ? "statue" : c.animalClass))).size >= 4) },
  { id: "beginner", name: "Beginner's Luck", glyph: "Clover", color: "#2c8a5c", hint: "Some people start with a bang.", reveal: "Your very first card was Legendary", test: (x) => x.cards[0]?.rarity === "Legendary" },
  { id: "comeback", name: "Welcome Back", glyph: "Hourglass", color: "#7a5a3a", hint: "The wild waits for you.", reveal: "Came back after a month away", test: (x) => x.dayKeys.some((k, i) => i > 0 && Date.parse(`${k}T00:00:00Z`) - Date.parse(`${x.dayKeys[i - 1]}T00:00:00Z`) >= 30 * DAY_MS) },
  { id: "mouthful", name: "Quite a Mouthful", glyph: "Type", color: "#7c4aa8", hint: "Some names just keep going.", reveal: "Caught a species with a name 30 or more letters long", test: (x) => x.cards.some((c) => c.species.length >= 30) },
  { id: "museum", name: "Museum Night", glyph: "Landmark", color: "#6b6862", hint: "After hours, the statues are the stars.", reveal: "Caught three statues in one day", test: (x) => x.days.some((d) => d.filter((c) => c.isStatue).length >= 3) },
  { id: "hothand", name: "Hot Hand", glyph: "Zap", color: "#e5641a", hint: "Fortune favors a streak.", reveal: "Caught three Rare or better cards in a row", test: (x) => x.cards.some((_, i) => i >= 2 && [0, 1, 2].every((j) => tierRank(x.cards[i - j].rarity) >= 2)) },
  { id: "fullspread", name: "Full Spread", glyph: "Gem", color: "#6a4fd0", hint: "Every rarity, one single day.", reveal: "Caught all five rarities in one day", test: (x) => x.days.some((d) => new Set(d.map((c) => c.rarity as Tier)).size === 5) },
  { id: "maxed", name: "Maxed Out", glyph: "Gauge", color: "#b23f6a", hint: "Some traits go to the limit.", reveal: "Caught a card with a natural trait of 100", test: (x) => x.cards.some((c) => Object.values(c.traits).some((v) => v >= 100)) },
  // Easter eggs found by poking around the app. Each one is marked by the screen that hides it.
  { id: "e-logo", name: "Logo Poker", glyph: "Hand", color: "#0f6e53", hint: "That logo looks tappable. Very tappable.", reveal: "Tapped the logo seven times", test: (x) => x.eggs.has("e-logo") },
  { id: "e-konami", name: "Old School", glyph: "Joystick", color: "#444", hint: "Up, up, down, down...", reveal: "Entered a famous cheat code", test: (x) => x.eggs.has("e-konami") },
  { id: "e-word", name: "Magic Word", glyph: "Wand", color: "#6a4fd0", hint: "Say the name of the game. Type it, anywhere.", reveal: "Typed the magic word", test: (x) => x.eggs.has("e-word") },
  { id: "e-level", name: "Level Up, Level Up", glyph: "Rocket", color: "#2f6fd6", hint: "Your level badge likes attention.", reveal: "Tapped your level badge ten times", test: (x) => x.eggs.has("e-level") },
  { id: "e-wander", name: "Wanderer", glyph: "Compass", color: "#1f8fb8", hint: "Have you looked everywhere?", reveal: "Visited every screen in one visit", test: (x) => x.eggs.has("e-wander") },
  { id: "e-version", name: "Version Collector", glyph: "Tally5", color: "#7a5a3a", hint: "Settings keeps a number it's proud of.", reveal: "Poked the version number five times", test: (x) => x.eggs.has("e-version") },
];

// Which eggs exist, so the app can tell the player how many are left to find.
export const EGG_IDS = SECRETS.filter((s) => s.id.startsWith("e-")).map((s) => s.id);
export const SECRET_COUNT = SECRETS.length;

export const secretFlags = (ctx: SecretContext) => new Set(SECRETS.filter((s) => s.test(ctx)).map((s) => s.id));

// ---------- Totals that need the whole collection ----------

export interface CollectionFacts {
  species: number;
  bestScore: number;
  heavy: number;
  titans: number;
  maxCopies: number;
  calendarMonths: number;
  letters: number;
  colorWords: number;
  night: number;
  early: number;
  weekend: number;
  families: Record<string, number>;
}

export function collectionFacts(cards: Card[], copies: Map<string, number>): CollectionFacts {
  const bySpecies = new Map<string, string>();
  for (const c of cards) bySpecies.set(c.species.trim().toLowerCase(), c.species);
  const names = [...bySpecies.values()];

  const months = new Set<string>();
  let night = 0;
  let early = 0;
  let weekend = 0;
  let heavy = 0;
  let titans = 0;
  let bestScore = 0;
  for (const c of cards) {
    const d = local(c.createdAt);
    months.add(`${d.getFullYear()}-${d.getMonth()}`);
    const h = d.getHours();
    if (h < 5) night++;
    else if (h < 8) early++;
    if (d.getDay() === 0 || d.getDay() === 6) weekend++;
    const s = scoreOf(c.stats);
    bestScore = Math.max(bestScore, s);
    if (s >= 250) heavy++;
    if (s >= 400) titans++;
  }

  const letters = new Set(names.map((n) => n.trim().charAt(0).toUpperCase()).filter((l) => /[A-Z]/.test(l)));
  const colors = new Set<string>();
  for (const n of names) for (const [c, re] of COLOR_TEST) if (re.test(n)) colors.add(c === "grey" ? "gray" : c);

  const families: Record<string, number> = {};
  for (const f of FAMILY_TESTS) families[f.id] = names.filter((n) => f.test.test(n)).length;

  return {
    species: names.length,
    bestScore,
    heavy,
    titans,
    maxCopies: Math.max(0, ...copies.values()),
    calendarMonths: months.size,
    letters: letters.size,
    colorWords: colors.size,
    night,
    early,
    weekend,
    families,
  };
}

// ---------- The catalog ----------

const CLASS_MEDALS: [string, string, string, string][] = [
  ["mammal", "Mammal Tracker", "Mammalogist", "Mammals"],
  ["bird", "Birder", "Ornithologist", "Birds"],
  ["reptile", "Reptile Spotter", "Herpetologist", "Reptiles"],
  ["amphibian", "Pond Watcher", "Pond Scholar", "Amphibians"],
  ["fish", "Angler", "Ichthyologist", "Fish"],
  ["insect", "Bug Hunter", "Entomologist", "Insects"],
  ["arachnid", "Web Watcher", "Arachnologist", "Arachnids"],
  ["statue", "Statue Seeker", "Curator", "Statues"],
];

const CLASS_COLORS: Record<string, string> = {
  mammal: "#c86f1f",
  bird: "#2489c4",
  reptile: "#45893a",
  amphibian: "#108e81",
  fish: "#2c5bc2",
  insect: "#b08408",
  arachnid: "#8045ab",
  statue: "#6b6862",
};

const PALETTE = ["#0f6e53", "#3f8f3a", "#2f6fd6", "#b07a10", "#6a4fd0", "#1f8fb8", "#b23f6a", "#c86f1f", "#108e81", "#8045ab", "#c2412d", "#2c5bc2"];

const tiered = (m: Omit<MedalDef, "group"> & { group?: MedalDef["group"] }): MedalDef => ({ group: "progress", ...m });

export const MEDALS: MedalDef[] = [
  tiered({ id: "collector", name: "Collector", blurb: "Cards caught", unit: "cards", glyph: "cards", color: "#0f6e53", goals: [10, 50, 200, 1000, 3000, 10000], metric: (t) => t.cards }),
  tiered({ id: "naturalist", name: "Naturalist", blurb: "Species discovered", unit: "species", glyph: "species", color: "#3f8f3a", goals: [5, 25, 75, 200, 500, 1500], metric: (t) => t.species }),
  tiered({ id: "ascendant", name: "Ascendant", blurb: "Explorer level", unit: "level", glyph: "Mountain", color: "#2f6fd6", goals: [5, 10, 25, 50, 100, 200], metric: (t) => t.level }),
  tiered({ id: "devoted", name: "Devoted", blurb: "Longest day streak", unit: "days", glyph: "streak", color: "#e5641a", goals: [3, 7, 30, 100, 365, 1000], metric: (t) => t.bestStreak, group: "habit" }),
  tiered({ id: "regular", name: "Regular", blurb: "Days you went catching", unit: "days", glyph: "CalendarDays", color: "#1f8fb8", goals: [5, 20, 60, 150, 365, 1000], metric: (t) => t.activeDays, group: "habit" }),
  tiered({ id: "seasons", name: "Through the Seasons", blurb: "Different calendar months played", unit: "months", glyph: "Snowflake", color: "#4a8fc0", goals: [2, 4, 8, 12, 24, 60], metric: (t) => t.calendarMonths, group: "habit" }),
  tiered({ id: "fullday", name: "Full Day", blurb: "Days with every catch used", unit: "days", glyph: "fullday", color: "#1f8fb8", goals: [1, 5, 20, 60, 200, 500], metric: (t) => t.fullDays, group: "habit" }),
  tiered({ id: "researcher", name: "Field Researcher", blurb: "Days with every task done", unit: "days", glyph: "stamp", color: "#b23f6a", goals: [1, 7, 30, 100, 250, 600], metric: (t) => t.stampDays, group: "habit" }),
  tiered({ id: "weekend", name: "Weekend Warrior", blurb: "Catches on a weekend", unit: "cards", glyph: "Tent", color: "#c86f1f", goals: [5, 25, 100, 300, 750, 2000], metric: (t) => t.weekend, group: "habit" }),
  tiered({ id: "night", name: "Night Owl", blurb: "Catches after midnight", unit: "cards", glyph: "Moon", color: "#3b3f8c", goals: [1, 5, 15, 40, 100, 250], metric: (t) => t.night, group: "habit" }),
  tiered({ id: "early", name: "Early Bird", blurb: "Catches before 8 in the morning", unit: "cards", glyph: "Sunrise", color: "#d98a0b", goals: [1, 5, 15, 40, 100, 250], metric: (t) => t.early, group: "habit" }),
  tiered({ id: "spectrum", name: "Full Spectrum", blurb: "Rarities owned", unit: "rarities", glyph: "spectrum", color: "#6a4fd0", goals: [2, 3, 4, 5], metric: (t) => t.tiersOwned }),
  tiered({ id: "uncommon", name: "Uncommon Taste", blurb: "Uncommon cards", unit: "cards", glyph: "Gem", color: "#2c8a5c", goals: [3, 15, 50, 150, 400, 1000], metric: (t) => t.uncommon }),
  tiered({ id: "lucky", name: "Lucky Find", blurb: "Rare or better", unit: "cards", glyph: "lucky", color: "#2f6fd6", goals: [1, 10, 40, 150, 400, 1000], metric: (t) => t.rarePlus }),
  tiered({ id: "epic", name: "Epic Eye", blurb: "Epic or better", unit: "cards", glyph: "Sparkle", color: "#8045ab", goals: [1, 5, 20, 60, 150, 400], metric: (t) => t.epic }),
  tiered({ id: "legend", name: "Legend Hunter", blurb: "Legendary pulls", unit: "cards", glyph: "legend", color: "#b07a10", goals: [1, 3, 10, 30, 80, 200], metric: (t) => t.legendary }),
  tiered({ id: "heavy", name: "Heavy Hitter", blurb: "Cards scoring 250 or more", unit: "cards", glyph: "Dumbbell", color: "#c86f1f", goals: [3, 10, 30, 100, 300, 1000], metric: (t) => t.heavy }),
  tiered({ id: "titan", name: "Titan", blurb: "Cards scoring 400 or more", unit: "cards", glyph: "Swords", color: "#c2412d", goals: [1, 3, 10, 30, 100, 300], metric: (t) => t.titans }),
  tiered({ id: "highscore", name: "High Score", blurb: "Your best card score", unit: "points", glyph: "Trophy", color: "#b8860b", goals: [250, 350, 450, 550, 700, 900], metric: (t) => t.bestScore }),
  tiered({ id: "pack", name: "Pack Leader", blurb: "Photos with two or more animals", unit: "photos", glyph: "pack", color: "#1d7f99", goals: [1, 5, 20, 50, 120, 300], metric: (t) => t.packs }),
  tiered({ id: "crowd", name: "Crowd Pleaser", blurb: "Most animals in one photo", unit: "animals", glyph: "Users", color: "#108e81", goals: [2, 3, 4, 5, 6, 8], metric: (t) => t.bigPack }),
  tiered({ id: "superfan", name: "Superfan", blurb: "Most cards of a single species", unit: "cards", glyph: "Heart", color: "#c23a6a", goals: [3, 5, 10, 20, 35, 50], metric: (t) => t.maxCopies }),
  tiered({ id: "alphabet", name: "A to Z", blurb: "Different first letters of species names", unit: "letters", glyph: "Type", color: "#7c4aa8", goals: [5, 10, 16, 22, 25, 26], metric: (t) => t.letters, group: "collection" }),
  tiered({ id: "colors", name: "Color Wheel", blurb: "Colors found in species names", unit: "colors", glyph: "Palette", color: "#b23f6a", goals: [2, 4, 6, 8, 10, 13], metric: (t) => t.colorWords, group: "collection" }),
  ...CLASS_MEDALS.map(
    ([cls, name, , many]): MedalDef => ({
      id: `class-${cls}`,
      name,
      blurb: `${many} caught`,
      unit: "cards",
      glyph: cls,
      color: CLASS_COLORS[cls],
      goals: [3, 15, 50, 150, 400, 1000],
      metric: (t) => t.byClass[cls] ?? 0,
      group: "class",
    }),
  ),
  ...CLASS_MEDALS.map(
    ([cls, , name, many]): MedalDef => ({
      id: `expert-${cls}`,
      name,
      blurb: `Different ${many.toLowerCase()} discovered`,
      unit: "species",
      glyph: cls,
      color: CLASS_COLORS[cls],
      goals: [2, 6, 15, 40, 100, 250],
      metric: (t) => t.speciesByClass[cls] ?? 0,
      group: "class",
    }),
  ),
  ...FAMILIES.map(
    (f, i): MedalDef => ({
      id: `family-${f.id}`,
      name: f.name,
      blurb: `Different kinds found: ${f.words.slice(0, 3).join(", ")}...`,
      unit: "species",
      glyph: f.glyph,
      color: PALETTE[i % PALETTE.length],
      goals: f.goals ?? [1, 3, 6, 10, 20, 35],
      metric: (t) => t.families[f.id] ?? 0,
      group: "collection",
    }),
  ),
  ...SECRETS.map(
    (s): MedalDef => ({
      id: `secret-${s.id}`,
      name: s.name,
      blurb: s.reveal,
      unit: "found",
      glyph: s.glyph,
      color: s.color,
      goals: [1],
      metric: (t) => (t.flags.has(s.id) ? 1 : 0),
      group: "mystery",
      secret: { hint: s.hint },
    }),
  ),
];

