# Gotcha — Design Language

> Draft from the Oct 3, 2026 redesigns. Second pass after Chris's feedback that the first pass was too dark and plain and the cards looked generic. Answers the open question on card layout and art style until Chris confirms or changes it.

---

## The Idea in One Line

A sunlit nature card game: warm paper surfaces, cards that look like real trading cards, and a dark stage for the moment you catch.

---

## Principles

| Principle | What It Means in the App |
|---|---|
| Cards are the product | Every card has a full trading-card layout: name, score, type, art, ability, stats, flavor, number |
| Warm and alive | Sand and paper surfaces, nature colors, soft depth. Never a black void |
| Rarity you can see from across the room | Frame material changes by tier, and the top two tiers go full-art with foil |
| Every catch is a show | The camera and the reveal are dark stages with light, sound and vibration |
| Easy to handle | One big catch button, three places to go (Catch, Collection, Lab), Settings always one click away |

---

## Its Own Style, Not Pokemon GO

| Pokemon GO | Gotcha |
|---|---|
| Map and walking avatar | Camera as the home screen |
| Throwing a ball | Pressing a sun-orange shutter ringed with the five rarity colors |
| 3D cartoon creatures | Painted illustrations of the real animal you photographed |
| Types like Fire and Water | Real animal classes: Mammal, Bird, Reptile, Amphibian, Fish, Insect, Arachnid |
| Red and white ball motif | The spectrum ring: the five rarity colors in order |

What it keeps from Pokemon GO is the habit loop, not the look: limited daily catches, a suspenseful reveal, chasing rare pulls, filling out a collection, and coming back tomorrow.

---

## Color

| Token | Value | Use |
|---|---|---|
| Sand | #F2EDE3 | Page background, with soft green, gold and sky glows |
| Paper | #FFFFFF | Panels |
| Ink | #17211C | Text |
| Canopy | #0F5E47 | Brand green: primary buttons, card backs, active states |
| Sun to Ember | #FFD04D to #FF7A1A | The catch button and the most important call to action on a screen |
| Night | #0C1411 | The camera and the reveal stage |

### Rarity (frame material)

| Tier | Color | Frame |
|---|---|---|
| Common | #8E979F | Polished silver |
| Uncommon | #2FA866 | Green enamel |
| Rare | #2F7DE1 | Blue foil with a moving sheen |
| Epic | #8B4DE0 | Violet holo, full-art card |
| Legendary | #E8A317 | Gold foil, full-art card, sparkles |

### Animal class (card color)

| Class | Color |
|---|---|
| Mammal | Amber |
| Bird | Sky blue |
| Reptile | Leaf green |
| Amphibian | Teal |
| Fish | Ocean blue |
| Insect | Pollen yellow |
| Arachnid | Dusk violet |
| Statue | Stone gray (any animal) |
| Other | Berry |

---

## Type

| Role | Font | Where |
|---|---|---|
| Display | Bricolage Grotesque | Logo, card names, scores, headings, rarity banner |
| Text | Figtree | Body copy, buttons, labels |
| Catalog | DM Mono | Card numbers, class badges, small uppercase labels |

---

## The Card

Portrait at 5 by 7, read top to bottom:

- Name and score
- Class badge and species
- Illustration in a framed window (Common to Rare) or across the whole card (Epic and Legendary)
- Rarity gems and tier name
- Special ability box
- Five stats: PWR, SPD, DEF, AGI, SNS
- Flavor text
- Card number and series line ("Sample card" for cards made without AI)

Frames, foil and shimmer are layered in the app. The illustration never contains a frame or text. Thumbnails drop the small print so the art and name carry the card.

---

## Art Style (Illustration Prompt)

- Painterly gouache illustration with confident brushwork and crisp edges
- Rich natural color, soft directional light with a gentle rim light
- Simple atmospheric background drawn from the animal's habitat
- Square composition for framed cards, portrait for full-art cards with calm space for the text
- No people, no hands, no text, no borders
- Likeness comes first: Step Zero tuning wins over style if the two conflict

---

## The Catch Sequence

| Step | What Happens |
|---|---|
| Shutter | Flash, click sound, short vibration |
| Developing | The frozen photo, desaturated, with a scanning line and changing status lines |
| Card arrives | The green card back slides in over a blurred copy of the photo |
| Charge | The stage glows in the rarity color. Rarer cards charge longer and shake |
| Flip | The card flips, sparks burst, a chime plays (more notes for rarer tiers) |
| Revealed | Rarity name stamps in, score counts up, "New species" badge if it is a first |

---

## Engagement Hooks (Draft)

All of these only display existing data. None changes a locked rule.

| Hook | Where |
|---|---|
| Today's catches as ten segments | Top bar and the Today panel |
| Reset countdown | Today panel and the limit screen |
| Day streak and streak nudges | Today panel, top bar, camera hint line |
| Latest catches | Side panel next to the camera |
| New species badge | Reveal |
| Missing tiers shown with their odds | Collection filters |
| Sound and vibration | Catch sequence, can be turned off in Settings |

---

## Build Rules

- No HTML in any output
- No emojis in any output
- SVG icons only when genuinely needed
