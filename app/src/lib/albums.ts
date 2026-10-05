import type { Card } from "./api";

/*
  The Field Guide: named species to go and find, grouped into albums. It's the chase list, so there is
  always a concrete animal to look for ("a Blue Jay"), and each finished album pays out once.

  Entries match on words in the species name the AI gave the card ("Eastern Gray Squirrel" matches
  "squirrel"), so a close relative counts and spellings can't get in the way. An animal can appear in
  more than one album. Display only, worked out on the device from the cards.

  Keep ids and entries stable: past catches are re-scored from these.
*/

export interface AlbumEntry {
  name: string; // what to look for
  match: string[]; // words that count as this animal
  hint: string; // where or when to look
  cls: string; // animal class, for the placeholder icon
}

export interface AlbumDef {
  id: string;
  name: string;
  blurb: string;
  glyph: string;
  color: string;
  entries: AlbumEntry[];
}

const e = (name: string, cls: string, hint: string, ...match: string[]): AlbumEntry => ({ name, cls, hint, match: match.length ? match : [name.toLowerCase()] });

export const ALBUMS: AlbumDef[] = [
  {
    id: "backyard-birds",
    name: "Backyard Birds",
    blurb: "The regulars at feeders and fences",
    glyph: "bird",
    color: "#2489c4",
    entries: [
      e("American Robin", "bird", "Hopping across lawns after rain", "robin"),
      e("Blue Jay", "bird", "Loud and bright blue, near oak trees", "blue jay"),
      e("Northern Cardinal", "bird", "A red bird at the feeder, mornings and dusk", "cardinal"),
      e("House Sparrow", "bird", "Small brown flocks around buildings", "house sparrow", "sparrow"),
      e("Mourning Dove", "bird", "Soft cooing from wires and fences", "mourning dove", "dove"),
      e("American Crow", "bird", "Big, black and clever, on lawns and lamp posts", "crow"),
      e("Black-capped Chickadee", "bird", "Tiny and tame at winter feeders", "chickadee"),
      e("House Finch", "bird", "Red-headed and chatty at seed feeders", "house finch", "finch"),
      e("European Starling", "bird", "Glossy flocks on lawns and roofs", "starling"),
      e("Downy Woodpecker", "bird", "Tapping on tree trunks and suet feeders", "woodpecker"),
      e("Rock Pigeon", "bird", "City squares and ledges", "pigeon"),
      e("Hummingbird", "bird", "A blur at red flowers and nectar feeders", "hummingbird"),
    ],
  },
  {
    id: "city-wildlife",
    name: "City Wildlife",
    blurb: "Wild animals living right next to us",
    glyph: "Building2",
    color: "#6b6862",
    entries: [
      e("Squirrel", "mammal", "Parks, yards and tree trunks", "squirrel"),
      e("Raccoon", "mammal", "Night time, near bins and creeks", "raccoon"),
      e("Pigeon", "bird", "Any city square", "pigeon"),
      e("Opossum", "mammal", "Quiet evenings along fences", "opossum", "possum"),
      e("Skunk", "mammal", "Dusk, if you're lucky and far away", "skunk"),
      e("Fox", "mammal", "Edges of parks at dawn or dusk", "fox"),
      e("Coyote", "mammal", "Greenbelts and trails at dusk", "coyote"),
      e("Rabbit", "mammal", "Lawns at sunrise", "rabbit", "cottontail", "hare"),
      e("Chipmunk", "mammal", "Stone walls and wood piles", "chipmunk"),
      e("Seagull", "bird", "Parking lots, harbors and rooftops", "gull", "seagull"),
      e("Crow", "bird", "Lawns and lamp posts", "crow"),
      e("Rat", "mammal", "Near food and ponds, a common city dweller", "rat"),
    ],
  },
  {
    id: "pond-and-park",
    name: "Ponds and Parks",
    blurb: "Water's edge and the green in between",
    glyph: "Waves",
    color: "#108e81",
    entries: [
      e("Mallard", "bird", "Green-headed ducks on any pond", "mallard"),
      e("Canada Goose", "bird", "Grassy shores, often in a honking crowd", "goose", "geese"),
      e("Swan", "bird", "Calm lakes and park ponds", "swan"),
      e("Great Blue Heron", "bird", "Standing very still at the shallows", "heron"),
      e("Egret", "bird", "White and tall, in marshes and ditches", "egret"),
      e("Turtle", "reptile", "Sunning on logs and rocks", "turtle", "terrapin"),
      e("Frog", "amphibian", "Pond edges and damp grass", "frog"),
      e("Koi or Goldfish", "fish", "Garden ponds and park fountains", "koi", "goldfish", "carp"),
      e("Dragonfly", "insect", "Darting over water in summer", "dragonfly", "damselfly"),
      e("Cormorant", "bird", "Black diver drying its wings on a post", "cormorant"),
      e("Beaver", "mammal", "Slow rivers and lodges, at dusk", "beaver", "muskrat"),
      e("Kingfisher", "bird", "A flash of blue over clear water", "kingfisher"),
    ],
  },
  {
    id: "pet-parade",
    name: "Pet Parade",
    blurb: "The animals we share our homes with",
    glyph: "Heart",
    color: "#c23a6a",
    entries: [
      e("Dog", "mammal", "At home or on a walk", "dog", "puppy", "retriever", "terrier", "schnauzer", "poodle", "shepherd", "husky", "bulldog", "corgi", "beagle", "labrador", "dachshund"),
      e("Cat", "mammal", "On the sofa or the window sill", "cat", "kitten", "tabby", "siamese"),
      e("Rabbit", "mammal", "Hutches and living rooms", "rabbit", "bunny"),
      e("Hamster", "mammal", "Running on a wheel at night", "hamster", "gerbil"),
      e("Guinea Pig", "mammal", "Squeaking for vegetables", "guinea pig"),
      e("Ferret", "mammal", "Long, curious and everywhere", "ferret"),
      e("Parrot or Budgie", "bird", "Chatty feathers indoors", "parrot", "budgie", "parakeet", "cockatiel", "macaw"),
      e("Fish", "fish", "An aquarium glowing in a corner", "betta", "goldfish", "guppy", "tetra", "angelfish"),
      e("Gecko or Bearded Dragon", "reptile", "A warm tank with a heat lamp", "gecko", "bearded dragon"),
      e("Horse", "mammal", "Stables and riding fields", "horse", "pony"),
    ],
  },
  {
    id: "farmyard",
    name: "Farmyard",
    blurb: "Fairs, farms and petting zoos",
    glyph: "House",
    color: "#a05a1f",
    entries: [
      e("Cow", "mammal", "Pastures and dairy farms", "cow", "cattle", "bull", "calf"),
      e("Pig", "mammal", "Muddy pens", "pig", "hog", "piglet"),
      e("Horse", "mammal", "Paddocks and trails", "horse", "pony"),
      e("Sheep", "mammal", "Hillside flocks", "sheep", "lamb", "ram"),
      e("Goat", "mammal", "Climbing anything at a petting zoo", "goat"),
      e("Chicken", "bird", "Coops and farmyards", "chicken", "hen", "rooster"),
      e("Duck", "bird", "Farm ponds and puddles", "duck"),
      e("Turkey", "bird", "Open fields and farmyards", "turkey"),
      e("Donkey", "mammal", "Quiet corners of a paddock", "donkey", "mule"),
      e("Llama or Alpaca", "mammal", "Woolly necks over a fence", "llama", "alpaca"),
    ],
  },
  {
    id: "safari",
    name: "Safari Legends",
    blurb: "Zoo trips, wildlife parks and statues count too",
    glyph: "Tent",
    color: "#c86f1f",
    entries: [
      e("Lion", "mammal", "Resting in the shade at the zoo", "lion"),
      e("Elephant", "mammal", "Hard to miss", "elephant"),
      e("Giraffe", "mammal", "Look up", "giraffe"),
      e("Zebra", "mammal", "Striped and always in a group", "zebra"),
      e("Hippo", "mammal", "Mostly underwater", "hippo"),
      e("Rhino", "mammal", "Armored and calm", "rhino"),
      e("Cheetah", "mammal", "The fastest cat, usually resting", "cheetah"),
      e("Leopard", "mammal", "Spotted and shy, up in a tree", "leopard"),
      e("Gorilla", "mammal", "A gentle giant with a stare", "gorilla"),
      e("Hyena", "mammal", "Laughing and pacing", "hyena"),
      e("Meerkat", "mammal", "Standing guard on their hind legs", "meerkat"),
      e("Tiger", "mammal", "Striped, near the water", "tiger"),
    ],
  },
  {
    id: "ocean",
    name: "Ocean Life",
    blurb: "Beaches, aquariums and tide pools",
    glyph: "Anchor",
    color: "#2c5bc2",
    entries: [
      e("Dolphin", "mammal", "Leaping off the coast or in a tank", "dolphin", "porpoise"),
      e("Whale", "mammal", "A spout on the horizon", "whale", "orca"),
      e("Shark", "fish", "Aquarium tunnels, mostly", "shark"),
      e("Sea Turtle", "reptile", "Warm beaches and reefs", "sea turtle"),
      e("Octopus", "other", "Tide pools and glass tanks", "octopus", "squid", "cuttlefish"),
      e("Jellyfish", "other", "Floating in the shallows or a dim aquarium", "jellyfish", "jelly"),
      e("Seal or Sea Lion", "mammal", "Barking on rocks and piers", "seal", "sea lion"),
      e("Crab", "other", "Sideways across the sand", "crab"),
      e("Starfish", "other", "Tide pools at low tide", "starfish", "sea star"),
      e("Seahorse", "fish", "Clinging to seagrass", "seahorse"),
      e("Ray", "fish", "Gliding along the sandy bottom", "stingray", "manta", "ray"),
      e("Penguin", "bird", "Waddling at the zoo", "penguin"),
    ],
  },
  {
    id: "forest",
    name: "Forest Folk",
    blurb: "Trails, woods and mountain meadows",
    glyph: "Trees",
    color: "#3f8f3a",
    entries: [
      e("Deer", "mammal", "Meadow edges at dawn and dusk", "deer", "doe", "fawn", "stag"),
      e("Bear", "mammal", "Berry patches, from a very safe distance", "bear"),
      e("Owl", "bird", "A hoot after dark", "owl"),
      e("Wolf", "mammal", "Wild country, or a sanctuary", "wolf"),
      e("Moose", "mammal", "Northern lakes and willow", "moose"),
      e("Elk", "mammal", "High meadows in autumn", "elk"),
      e("Porcupine", "mammal", "Slow in the branches", "porcupine"),
      e("Bobcat", "mammal", "A spotted shadow at the forest edge", "bobcat", "lynx"),
      e("Woodpecker", "bird", "Drumming on a trunk", "woodpecker"),
      e("Chipmunk", "mammal", "Racing along logs", "chipmunk"),
      e("Hawk", "bird", "Circling above a clearing", "hawk"),
      e("Beaver", "mammal", "Dams and lodges on quiet streams", "beaver"),
    ],
  },
  {
    id: "bug-hunt",
    name: "Bug Hunt",
    blurb: "Look closely: the small ones count",
    glyph: "insect",
    color: "#b08408",
    entries: [
      e("Butterfly", "insect", "Flowers on a sunny day", "butterfly"),
      e("Bee", "insect", "Blossoms and clover", "bee", "bumblebee"),
      e("Ladybug", "insect", "Leaves, especially near roses", "ladybug", "ladybird"),
      e("Dragonfly", "insect", "Hovering over water", "dragonfly"),
      e("Ant", "insect", "Any sidewalk crack", "ant"),
      e("Grasshopper", "insect", "Tall grass in summer", "grasshopper", "cricket", "katydid"),
      e("Beetle", "insect", "Under logs and on leaves", "beetle", "weevil"),
      e("Moth", "insect", "Porch lights at night", "moth"),
      e("Spider", "arachnid", "Webs in the early morning dew", "spider", "orbweaver", "tarantula"),
      e("Firefly", "insect", "Summer dusk", "firefly", "lightning bug"),
      e("Praying Mantis", "insect", "Perfectly still on a stem", "mantis"),
      e("Caterpillar", "insect", "Munching a leaf", "caterpillar"),
    ],
  },
  {
    id: "scales-and-ponds",
    name: "Scales and Ponds",
    blurb: "Reptiles and amphibians",
    glyph: "reptile",
    color: "#45893a",
    entries: [
      e("Snake", "reptile", "Sunny rocks, viewed from far away", "snake", "python", "boa", "garter"),
      e("Lizard", "reptile", "Warm walls and rocks", "lizard", "anole", "skink", "iguana"),
      e("Gecko", "reptile", "Walls near lights at night", "gecko"),
      e("Turtle", "reptile", "Logs in a pond", "turtle", "terrapin"),
      e("Tortoise", "reptile", "Slow and steady", "tortoise"),
      e("Crocodile or Alligator", "reptile", "Warm water, behind glass or a fence", "crocodile", "alligator", "caiman"),
      e("Chameleon", "reptile", "Slowly changing color", "chameleon"),
      e("Frog", "amphibian", "Wet grass and pond edges", "frog"),
      e("Toad", "amphibian", "Garden corners after rain", "toad"),
      e("Salamander", "amphibian", "Under damp logs", "salamander", "newt"),
      e("Tree Frog", "amphibian", "Sticky toes on a leaf", "tree frog"),
    ],
  },
];

// ---------- Matching ----------

const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const TESTS = new Map(
  ALBUMS.flatMap((a) => a.entries.map((en) => [en, new RegExp(`\\b(?:${en.match.map(escape).join("|")})(?:s|es)?\\b`, "i")] as const)),
);

export const matchesEntry = (en: AlbumEntry, species: string) => TESTS.get(en)!.test(species);

export interface AlbumSlot {
  entry: AlbumEntry;
  card: Card | null; // the best card of that animal you own
  first: Card | null; // the one that filled the slot
}

export interface AlbumState {
  def: AlbumDef;
  slots: AlbumSlot[];
  found: number;
  total: number;
  done: boolean;
}

const rankOf = (c: Card) => ["Common", "Uncommon", "Rare", "Epic", "Legendary"].indexOf(c.rarity);

// Every album's slots, filled from your cards. `cards` is oldest first.
export function computeAlbums(cards: Card[]): AlbumState[] {
  return ALBUMS.map((def) => {
    const slots = def.entries.map((entry): AlbumSlot => {
      const have = cards.filter((c) => !c.isSample && matchesEntry(entry, c.species));
      const best = have.reduce<Card | null>((a, c) => (!a || rankOf(c) > rankOf(a) ? c : a), null);
      return { entry, card: best, first: have[0] ?? null };
    });
    const found = slots.filter((s) => s.card).length;
    return { def, slots, found, total: slots.length, done: found === slots.length };
  });
}

// The card that completed an album: the latest of the cards that first filled each slot.
export function completingCard(state: AlbumState): Card | null {
  if (!state.done) return null;
  return state.slots.reduce<Card | null>((a, s) => (!a || (s.first && s.first.createdAt > a.createdAt) ? s.first : a), null);
}

// The album worth chasing next: closest to done (with something found), otherwise the first one. Returns the
// animal to look for first.
export function nextToFind(states: AlbumState[]): { album: AlbumState; slot: AlbumSlot } | null {
  const open = states.filter((a) => !a.done);
  if (!open.length) return null;
  const started = open.filter((a) => a.found > 0).sort((a, b) => b.found / b.total - a.found / a.total);
  const album = started[0] ?? open[0];
  const slot = album.slots.find((s) => !s.card);
  return slot ? { album, slot } : null;
}
