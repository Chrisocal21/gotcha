import { ANIMAL_CLASSES, TRAIT_KEYS, type ArtLayout } from "./rules";

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
  trait_notes: Record<string, string>;
}

// One animal found in the photo. A photo can hold several, and each becomes its own card.
export interface Find {
  kind: "animal" | "statue";
  position: string;
  animal_class: string;
  species: string;
  name: string;
  visual_description: string;
  card_description: string;
  traits: Record<string, number>;
  special: { name: string; description: string };
  facts: Facts;
}

export interface Vision {
  verdict: "found" | "rejected";
  rejection_reason: string;
  people_present: boolean;
  // True when the photo is of a screen, a printed picture or another photo, not the animal itself.
  photo_of_picture?: boolean;
  animals: Find[];
}

// The most animals turned into cards from one photo. Each one uses one of the day's catches.
export const MAX_PER_PHOTO = 3;

// What painting needs to know about an animal.
export type Subject = Pick<Find, "kind" | "species" | "visual_description" | "position">;

export interface AiEnv {
  OPENAI_API_KEY?: string;
  VISION_MODEL: string;
  IMAGE_MODEL: string;
  // "low", "medium" or "high". Lower is much cheaper per image. Defaults to low while testing.
  IMAGE_QUALITY?: string;
}

const imageQuality = (env: AiEnv) => (["low", "medium", "high"].includes(env.IMAGE_QUALITY ?? "") ? env.IMAGE_QUALITY! : "low");

export type ArtMode = "reference" | "text";

export const VISION_PROMPT = `You are the catch judge for Gotcha, a collectible card game where a live photo of real animals becomes cards: one card for each animal, like catching each one.

1. Find the animals.
- List every real, living animal and every statue or sculpture of an animal (stone, bronze, wood, metal) that is clearly visible, the most prominent first. Any kind counts: mammal, bird, reptile, amphibian, fish, insect, spider, and so on.
- List at most ${MAX_PER_PHOTO}. If more are visible, list the ${MAX_PER_PHOTO} most prominent.
- Only list an animal that is clear enough to paint on its own. A tiny blur in the far background does not count.
- Plush toys, cartoons, screens and printed pictures do not count. Set photo_of_picture to true when the photo is mostly of a screen, a monitor, a phone, a printed photo, a poster or a book page showing an animal, instead of the animal itself in front of the camera. Then verdict is "rejected" and rejection_reason kindly asks for the real animal.
- verdict is "found" when you list at least one animal. Otherwise verdict is "rejected", animals is an empty list, and rejection_reason is one short, friendly sentence (encouraging, no blame).
- For each animal, kind is "animal" or "statue", and position says where it is in the photo in a few words (for example "on the left", "in front", "the larger one on the right"), so it can be painted on its own. Use an empty string when it is the only one.
Everything below is for each animal you list.

2. Class. animal_class is one of: mammal, bird, reptile, amphibian, fish, insect, arachnid, other. For a statue, use the class of the animal it depicts.

3. People. Set people_present if any person or body part is visible. People must never appear on a card, so leave them out of every description.

4. Describe for likeness. visual_description is used to paint an illustration of this one animal that the owner must recognize. Describe only this animal, as if it were alone. Be specific: breed or species, body shape and size, coat, feather or scale colors, exact markings and where they are, eye color, ear shape, tail, distinctive features, pose. For a statue, describe the material and the sculpted animal. 60 to 120 words. No people, no other animals, no background clutter.

5. Name. A short, friendly card name that is easy to say out loud, inspired by how this animal looks (for example "Biscuit Bolt" or "Sir Hops"). Two words at most. Animals in the same photo get different names.

6. card_description: one playful sentence of flavor text, under 20 words.

7. Traits. Score the real animal (the species, not the photo) from 1 to 100 on one scale shared by every animal, so a fly and a lion get fair, comparable numbers:
- power: raw strength and force
- speed: top movement speed
- defense: armor, size, toughness, protective features
- agility: maneuverability, reflexes, climbing, flight control
- senses: sight, smell, hearing, echolocation and other perception
For a statue, score the animal it depicts.

8. special: one signature real ability of this species (for example sting, spray, venom, echolocation, camouflage). name is one or two words, description is one short sentence.

9. Species. Identify the animal as precisely as the photo allows: for a pet, the breed or type (for example "Domestic cat, tabby"); for wildlife, the species. Use the common name in species.

10. Facts. These must be true and well established. Never invent. If unsure, be general rather than specific.
- common_name: the animal's common name.
- scientific_name: the Latin name of the species (for a statue, of the animal it depicts).
- variety: breed, subspecies or coloring if recognizable, otherwise an empty string.
- habitat: where this animal lives in the wild, one short phrase.
- diet: what it eats, one short phrase.
- lifespan: typical lifespan, for example "12 to 16 years".
- size: typical size or weight, for example "3.5 to 5 kg".
- conservation_status: IUCN status in words (for example "Least concern"), or "Domestic" for domesticated animals.
- fun_facts: exactly 3 surprising, accurate facts, each one sentence.
- trait_notes: for each of power, speed, defense, agility, senses, one short sentence of real-world evidence for the score you gave. Where you can, include a real number (for example a top speed). The notes should make the game score feel earned.`;

const FACTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "common_name",
    "scientific_name",
    "variety",
    "habitat",
    "diet",
    "lifespan",
    "size",
    "conservation_status",
    "fun_facts",
    "trait_notes",
  ],
  properties: {
    common_name: { type: "string" },
    scientific_name: { type: "string" },
    variety: { type: "string" },
    habitat: { type: "string" },
    diet: { type: "string" },
    lifespan: { type: "string" },
    size: { type: "string" },
    conservation_status: { type: "string" },
    fun_facts: { type: "array", items: { type: "string" } },
    trait_notes: {
      type: "object",
      additionalProperties: false,
      required: [...TRAIT_KEYS],
      properties: Object.fromEntries(TRAIT_KEYS.map((k) => [k, { type: "string" }])),
    },
  },
};

const FIND_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "position", "animal_class", "species", "name", "visual_description", "card_description", "traits", "special", "facts"],
  properties: {
    kind: { type: "string", enum: ["animal", "statue"] },
    position: { type: "string" },
    animal_class: { type: "string", enum: [...ANIMAL_CLASSES] },
    species: { type: "string" },
    name: { type: "string" },
    visual_description: { type: "string" },
    card_description: { type: "string" },
    traits: {
      type: "object",
      additionalProperties: false,
      required: [...TRAIT_KEYS],
      properties: Object.fromEntries(TRAIT_KEYS.map((k) => [k, { type: "integer" }])),
    },
    special: {
      type: "object",
      additionalProperties: false,
      required: ["name", "description"],
      properties: { name: { type: "string" }, description: { type: "string" } },
    },
    facts: FACTS_SCHEMA,
  },
};

const VISION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "rejection_reason", "people_present", "photo_of_picture", "animals"],
  properties: {
    verdict: { type: "string", enum: ["found", "rejected"] },
    rejection_reason: { type: "string" },
    people_present: { type: "boolean" },
    photo_of_picture: { type: "boolean" },
    animals: { type: "array", items: FIND_SCHEMA },
  },
};

const COMPOSITION: Record<ArtLayout, string> = {
  framed:
    "Composition: square. The animal is the hero, centered and fully in frame with a little room around it, with no cropped ears, tails or legs.",
  full: "Composition: portrait orientation. The animal is the hero, centered in the upper two thirds and fully in frame, with no cropped ears, tails or legs. Keep the top eighth and the bottom third calm and slightly darker so card text can sit on them.",
};

// `together` is how many animals were in the photo. With more than one, the painting keeps to this one.
export function artPrompt(v: Subject, mode: ArtMode, layout: ArtLayout, together = 1): string {
  const subject =
    v.kind === "statue" ? `a statue of a ${v.species}, shown as the sculpture itself with its real material and texture` : `a ${v.species}`;
  const focus =
    together > 1 && mode === "reference"
      ? `The reference photo shows ${together} animals. Paint only this one${v.position ? `, ${v.position}` : ""}, alone. Leave every other animal out.`
      : "";
  const likeness =
    mode === "reference"
      ? "Use the reference photo for the animal only. Match its exact markings, colors, proportions and features so the owner instantly recognizes this individual animal."
      : "Match these details exactly so the owner instantly recognizes this individual animal.";
  return [
    `Illustration for a collectible card: ${subject}.`,
    `Details: ${v.visual_description}`,
    focus,
    likeness,
    "Style: painterly gouache illustration with confident brushwork and crisp edges, rich natural color, soft directional light with a gentle rim light, simple atmospheric background drawn from the animal's habitat.",
    COMPOSITION[layout],
    "Strictly no people, no human hands or body parts, no text, no letters, no borders, no card frame.",
  ]
    .filter(Boolean)
    .join("\n");
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function openai(env: AiEnv, path: string, init: RequestInit): Promise<any> {
  const res = await fetch(`https://api.openai.com/v1/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, ...(init.headers || {}) },
  });
  const body = (await res.json()) as any;
  if (!res.ok) throw new Error(`OpenAI ${path} ${res.status}: ${body?.error?.message ?? "unknown error"}`);
  return body;
}

export async function analyzePhoto(env: AiEnv, photo: Uint8Array, mime: string): Promise<Vision> {
  if (!env.OPENAI_API_KEY) return mockVision();
  const body = await openai(env, "chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.VISION_MODEL,
      temperature: 0.4,
      response_format: {
        type: "json_schema",
        json_schema: { name: "catch", strict: true, schema: VISION_SCHEMA },
      },
      messages: [
        { role: "system", content: VISION_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Judge this live camera photo." },
            { type: "image_url", image_url: { url: `data:${mime};base64,${toBase64(photo)}`, detail: "high" } },
          ],
        },
      ],
    }),
  });
  return tidy(JSON.parse(body.choices[0].message.content) as Vision);
}

// Holds the answer to the rules whatever comes back: at most MAX_PER_PHOTO animals, and "found" only with one.
function tidy(v: Vision): Vision {
  const animals = (v.animals ?? []).slice(0, MAX_PER_PHOTO);
  if (v.photo_of_picture || v.verdict !== "found" || animals.length === 0) {
    return {
      ...v,
      verdict: "rejected",
      animals: [],
      rejection_reason:
        v.rejection_reason ||
        (v.photo_of_picture ? "That looks like a picture of an animal. Find the real one, or a statue, and try again." : "No animal spotted this time. Try getting the whole critter in frame."),
    };
  }
  return { ...v, animals };
}

export interface Art {
  bytes: Uint8Array;
  mime: string;
  prompt: string;
}

export async function illustrate(
  env: AiEnv,
  v: Subject,
  photo: Uint8Array,
  mime: string,
  mode: ArtMode,
  layout: ArtLayout,
  together = 1,
): Promise<Art> {
  const prompt = artPrompt(v, mode, layout, together);
  if (!env.OPENAI_API_KEY) {
    await sleep(900);
    return { bytes: new TextEncoder().encode(mockArt(v, layout)), mime: "image/svg+xml", prompt };
  }

  const size = layout === "full" ? "1024x1536" : "1024x1024";
  let body: any;
  if (mode === "reference") {
    const form = new FormData();
    form.append("model", env.IMAGE_MODEL);
    form.append("prompt", prompt);
    form.append("size", size);
    form.append("quality", imageQuality(env));
    form.append("image[]", new Blob([photo], { type: mime }), "photo.jpg");
    body = await openai(env, "images/edits", { method: "POST", body: form });
  } else {
    body = await openai(env, "images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: env.IMAGE_MODEL, prompt, size, quality: imageQuality(env) }),
    });
  }
  return { bytes: fromBase64(body.data[0].b64_json), mime: "image/png", prompt };
}

// Mock mode: lets the whole app run with no API key.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type MockCatch = Omit<Find, "facts" | "position">;

const mf = (
  common_name: string,
  scientific_name: string,
  variety: string,
  habitat: string,
  diet: string,
  lifespan: string,
  size: string,
  conservation_status: string,
  fun_facts: string[],
  notes: [string, string, string, string, string],
): Facts => ({
  common_name,
  scientific_name,
  variety,
  habitat,
  diet,
  lifespan,
  size,
  conservation_status,
  fun_facts,
  trait_notes: { power: notes[0], speed: notes[1], defense: notes[2], agility: notes[3], senses: notes[4] },
});

const MOCK_FACTS: Record<string, Facts> = {
  "Golden Retriever": mf("Golden Retriever", "Canis lupus familiaris", "Golden Retriever", "Homes and farms worldwide", "Omnivore", "10 to 12 years", "25 to 34 kg", "Domestic", ["Golden Retrievers were bred in Scotland to fetch waterfowl.", "They have water-repellent double coats.", "A retriever's nose has about 300 million scent receptors."], ["Strong enough to pull a loaded cart.", "Can sprint around 56 km/h.", "A thick double coat gives some protection.", "Quick turns, made for retrieving.", "Scent detection is far beyond human ability."]),
  "Honey Bee": mf("Western Honey Bee", "Apis mellifera", "", "Meadows, forests and managed hives", "Nectar and pollen", "6 weeks for workers", "12 to 15 mm", "Domesticated, with wild declines", ["A hive makes about 1 kg of honey from 4 million flowers.", "Bees tell each other where flowers are by dancing.", "Workers beat their wings about 230 times per second."], ["Can carry nearly their own weight in pollen.", "Flies up to 25 km/h.", "A barbed sting defends the hive.", "Hovers and turns in tiny spaces.", "Sees ultraviolet patterns on flowers."]),
  "American Robin": mf("American Robin", "Turdus migratorius", "", "Lawns, woodlands and gardens across North America", "Worms, insects and berries", "2 years in the wild", "23 to 28 cm", "Least concern", ["Robins can hear and see worms below the surface.", "Males sing before dawn, earlier than most birds.", "Their eggs are the famous robin's-egg blue."], ["Small and light, little raw strength.", "Flies about 50 km/h in steady flight.", "Little armor, relies on flying away.", "Agile in the air and on the ground.", "Excellent eyesight for spotting prey."]),
  "Tabby Cat": mf("Domestic Cat", "Felis catus", "Tabby", "Homes worldwide", "Carnivore", "12 to 18 years", "3.5 to 5 kg", "Domestic", ["Cats can rotate their ears 180 degrees.", "A cat's righting reflex lets it land on its feet from a fall.", "Tabby is a coat pattern, not a breed."], ["Can leap about five times its own height.", "Sprints near 48 km/h.", "Loose skin helps in a scuffle.", "Famous balance and a flexible spine.", "Sees in about one sixth the light humans need."]),
  "Eastern Gray Squirrel": mf("Eastern Gray Squirrel", "Sciurus carolinensis", "", "Hardwood forests and parks in eastern North America", "Nuts, seeds and fruit", "6 years in the wild", "400 to 700 g", "Least concern", ["Squirrels forget many buried nuts, which grow into trees.", "They can rotate their ankles 180 degrees to climb down headfirst.", "Their tail works as a balance aid and a blanket."], ["Strong for its size when leaping.", "Runs about 27 km/h.", "Fast escapes rather than armor.", "Among the most agile climbers.", "Sharp eyes and a good memory for caches."]),
  Mallard: mf("Mallard", "Anas platyrhynchos", "", "Ponds, lakes and wetlands worldwide", "Plants, seeds and small invertebrates", "5 to 10 years", "1 to 1.4 kg", "Least concern", ["Mallards are the ancestors of most domestic ducks.", "Only females quack loudly.", "Their feathers shed water thanks to an oil from a gland near the tail."], ["Strong wings for long migrations.", "Flies up to about 90 km/h.", "Dense waterproof feathers.", "Quick takeoffs straight off the water.", "Good eyesight and hearing."]),
  "Cross Orbweaver": mf("Cross Orbweaver", "Araneus diadematus", "", "Gardens, fences and woodland edges", "Flying insects", "1 year", "6 to 20 mm", "Not evaluated", ["The orb web is rebuilt often, sometimes daily.", "The white cross on its back gives it its name.", "It senses prey through vibrations in the web."], ["Small, but venom subdues insects.", "Fast only over short distances.", "Hides when threatened.", "Precise movement around the web.", "Reads tiny vibrations in the silk."]),
  "Monarch Butterfly": mf("Monarch Butterfly", "Danaus plexippus", "", "Meadows and milkweed fields in the Americas", "Nectar as adults, milkweed as caterpillars", "2 to 6 weeks, migrants 8 months", "Wingspan 9 to 10 cm", "Endangered (migratory subspecies)", ["Eastern monarchs migrate up to 4,000 km to Mexico.", "Milkweed makes them taste bad to predators.", "No single monarch makes the whole round trip."], ["Light, but strong enough for long flights.", "Cruises around 20 km/h.", "Bright colors warn predators of toxins.", "Glides efficiently on thermals.", "Tastes with its feet and sees color well."]),
  "Green Anole": mf("Green Anole", "Anolis carolinensis", "", "Trees and shrubs in the southeastern United States", "Insects and spiders", "4 to 8 years", "12 to 20 cm", "Least concern", ["Anoles shift between green and brown.", "Males puff out a pink throat fan to signal.", "They can drop their tail and regrow a new one."], ["Small lizard with a quick bite.", "Short, fast dashes.", "Camouflage and a detachable tail.", "Excellent climber with sticky toe pads.", "Sharp eyes for spotting insects."]),
  Lion: mf("Lion", "Panthera leo", "", "Savannas and grasslands of Africa, and a small group in India", "Carnivore", "10 to 14 years in the wild", "150 to 250 kg", "Vulnerable", ["A lion's roar can be heard from 8 km away.", "Lions are the only big cats that live in groups.", "Lionesses do most of the hunting."], ["Among the strongest big cats.", "Sprints up to 80 km/h in short bursts.", "Thick muscle and a mane protect the neck.", "Powerful but built for bursts, not agility.", "Strong night vision for hunting at dusk."]),
};

function factsFor(species: string): Facts {
  return (
    MOCK_FACTS[species] ??
    mf(species, "", "", "Varies", "Varies", "Varies", "Varies", "Not evaluated", ["Sample facts only.", "Connect OpenAI for real ones.", "Real cards get researched facts."], ["", "", "", "", ""])
  );
}

const MOCKS: MockCatch[] = [
  {
    kind: "animal",
    animal_class: "mammal",
    species: "Golden Retriever",
    name: "Biscuit Bolt",
    visual_description: "A golden retriever with a wavy honey coat, feathered ears and a white blaze on the chest.",
    card_description: "Fetches anything, returns most of it.",
    traits: { power: 38, speed: 45, defense: 30, agility: 50, senses: 72 },
    special: { name: "Super Sniff", description: "Tracks a scent trail hours after it was laid." },
  },
  {
    kind: "animal",
    animal_class: "insect",
    species: "Honey Bee",
    name: "Buzz Bloom",
    visual_description: "A honey bee with amber and black bands, translucent wings and pollen-dusted legs.",
    card_description: "Small, busy, and not to be trifled with.",
    traits: { power: 4, speed: 22, defense: 8, agility: 70, senses: 55 },
    special: { name: "Sting", description: "A barbed sting that warns the whole hive." },
  },
  {
    kind: "animal",
    animal_class: "bird",
    species: "American Robin",
    name: "Red Ruffle",
    visual_description: "An American robin with a brick-orange breast, slate gray back and a yellow beak.",
    card_description: "First up, first to sing about it.",
    traits: { power: 6, speed: 40, defense: 6, agility: 68, senses: 64 },
    special: { name: "Worm Radar", description: "Hears worms moving under the soil." },
  },
  {
    kind: "animal",
    animal_class: "mammal",
    species: "Tabby Cat",
    name: "Marble Paws",
    visual_description: "A tabby cat with gray and black marbled stripes, white socks and green eyes.",
    card_description: "Will knock it off the table. Eventually.",
    traits: { power: 22, speed: 48, defense: 18, agility: 88, senses: 80 },
    special: { name: "Night Eyes", description: "Sees in light six times dimmer than people need." },
  },
  {
    kind: "animal",
    animal_class: "mammal",
    species: "Eastern Gray Squirrel",
    name: "Nutmeg Dash",
    visual_description: "An eastern gray squirrel with silver fur, a cream belly and a huge plumed tail.",
    card_description: "Forgets most of its buried nuts and plants forests by accident.",
    traits: { power: 8, speed: 35, defense: 10, agility: 90, senses: 58 },
    special: { name: "Tree Sprint", description: "Runs headfirst down trunks by turning its ankles around." },
  },
  {
    kind: "animal",
    animal_class: "bird",
    species: "Mallard",
    name: "Sir Splash",
    visual_description: "A drake mallard with an iridescent green head, white collar, chestnut chest and orange feet.",
    card_description: "Calm on the surface, paddling hard below.",
    traits: { power: 12, speed: 55, defense: 14, agility: 52, senses: 50 },
    special: { name: "Waterproof", description: "Oils its feathers so water rolls right off." },
  },
  {
    kind: "animal",
    animal_class: "arachnid",
    species: "Cross Orbweaver",
    name: "Silk Knot",
    visual_description: "A cross orbweaver spider with a tan abdomen marked by a white cross of dots and banded legs.",
    card_description: "Rebuilds its whole web every single night.",
    traits: { power: 3, speed: 12, defense: 6, agility: 60, senses: 45 },
    special: { name: "Venom", description: "A quick bite that stills its prey in seconds." },
  },
  {
    kind: "animal",
    animal_class: "insect",
    species: "Monarch Butterfly",
    name: "Ember Wing",
    visual_description: "A monarch butterfly with orange wings veined in black and edged with white-spotted borders.",
    card_description: "Flies thousands of miles on a body lighter than a paperclip.",
    traits: { power: 2, speed: 18, defense: 20, agility: 66, senses: 40 },
    special: { name: "Bad Taste", description: "Milkweed in its body makes predators sick." },
  },
  {
    kind: "animal",
    animal_class: "reptile",
    species: "Green Anole",
    name: "Lime Flick",
    visual_description: "A green anole with bright lime skin, a slender pointed snout and a pink throat fan.",
    card_description: "Changes color when it changes its mind.",
    traits: { power: 4, speed: 30, defense: 10, agility: 74, senses: 55 },
    special: { name: "Color Shift", description: "Turns from green to brown to blend in." },
  },
  {
    kind: "statue",
    animal_class: "mammal",
    species: "Lion",
    name: "Brass Mane",
    visual_description: "A weathered bronze lion statue with a green patina, a full sculpted mane and one paw on a sphere.",
    card_description: "Has guarded the same door for a hundred years.",
    traits: { power: 92, speed: 60, defense: 55, agility: 50, senses: 70 },
    special: { name: "Roar", description: "Carries for five miles across open grassland." },
  },
];

// Used to repaint sample cards with real art once an OpenAI key is connected.
export function sampleDescription(species: string): string | null {
  return MOCKS.find((m) => m.species.toLowerCase() === species.toLowerCase())?.visual_description ?? null;
}

const MOCK_REJECTIONS = [
  "No animal spotted this time. Try getting the whole critter in frame.",
  "Nice shot, but there is no animal in it. Try again when one wanders by.",
];

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

// Mostly one animal, sometimes two (so the multi-animal catch can be tried without a key), sometimes none.
async function mockVision(): Promise<Vision> {
  await sleep(1200);
  const roll = Math.random();
  if (roll < 0.12) return { verdict: "rejected", rejection_reason: pick(MOCK_REJECTIONS), people_present: false, animals: [] };
  const first = pick(MOCKS);
  const second = pick(MOCKS.filter((m) => m !== first));
  const found = roll < 0.3 ? [first, second] : [first];
  return {
    verdict: "found",
    rejection_reason: "",
    people_present: false,
    animals: found.map((m, i) => ({
      ...m,
      facts: factsFor(m.species),
      position: found.length > 1 ? (i === 0 ? "on the left" : "on the right") : "",
    })),
  };
}

// Placeholder art: a dusk landscape with the species initial, so mock cards still look like cards.
function mockArt(v: Subject, layout: ArtLayout): string {
  const seed = [...v.species].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const hue = seed % 360;
  const warm = (hue + 28) % 360;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const letter = esc(v.species.trim().charAt(0).toUpperCase() || "?");
  const h = layout === "full" ? 1536 : 1024;
  const sunY = layout === "full" ? 700 : 440;
  const ground = layout === "full" ? [930, 1060, 1200] : [640, 760, 880];
  const hill = (y: number, i: number) =>
    `<path d="M0 ${y} C 200 ${y - 70} 360 ${y - 50} 520 ${y + 10} S 860 ${y + 70} 1024 ${y - 30} V${h} H0 Z" fill="hsl(${hue},${32 + i * 2}%,${24 - i * 7}%)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 ${h}">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="hsl(${hue},38%,16%)"/>
<stop offset="0.6" stop-color="hsl(${warm},48%,46%)"/>
<stop offset="1" stop-color="hsl(${warm},45%,62%)"/>
</linearGradient>
<radialGradient id="glow">
<stop offset="0" stop-color="hsl(${warm},95%,85%)" stop-opacity="0.9"/>
<stop offset="1" stop-color="hsl(${warm},95%,70%)" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="1024" height="${h}" fill="url(#sky)"/>
<circle cx="512" cy="${sunY}" r="400" fill="url(#glow)"/>
<circle cx="512" cy="${sunY}" r="180" fill="hsl(${warm},90%,86%)"/>
<text x="512" y="${sunY + 88}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="250" font-weight="700" fill="hsl(${warm},45%,40%)">${letter}</text>
${ground.map(hill).join("\n")}
</svg>`;
}
