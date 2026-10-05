# Gotcha — Design Language

> Third pass, Oct 4, 2026: "Field Expedition". Chris asked for something fun, finished, professional and impressive: an adult take on Pokemon GO that is worth coming back to, where every catch ends in "Gotcha". Builds on the second redesign (bright, warm, real trading cards), which stays.
>
> Same day, after feedback: it should feel like an app, not a tech thing, with less on screen at once. Floating bars that step aside while scrolling, a phone-style Settings, Explorer split into tabs, and one photo of several animals catching each one.

---

## The Idea in One Line

A grown-up Pokemon GO for real animals: every photo ends in "Gotcha!", a painted trading card, and progress you can see.

---

## Principles

| Principle | What It Means in the App |
|---|---|
| Every catch says Gotcha | The catch has a fixed beat: shutter, GOTCHA stamp with the species named, rarity reveal, rewards tally |
| Cards are the product | Every card has a full trading-card layout, a class mark, and the day it was caught printed on it |
| Progress you can see | Explorer level, XP, badges, daily field tasks, a species journal and a day-by-day journal |
| Adult, not childish | Pokemon GO's structure with a nature expedition's look: contour lines, enamel-pin badges, a field journal |
| Warm and alive | Sand and paper surfaces, nature colors, soft depth. The camera and reveal are dark stages with light |
| Free to run | All progress is worked out on the device from the cards. No server work, no cost, no locked rule changed |
| Calm screens | One thing at a time: tabs instead of long pages, short sub-pages instead of paragraphs, app-style lists for settings |
| Each animal is a catch | A photo of two dogs catches two dogs: one card each, like a ball catching one creature |

---

## What It Takes From Pokemon GO

| Pokemon GO | Gotcha |
|---|---|
| "Gotcha!" after the ball stops wobbling | GOTCHA stamp the moment the photo is confirmed, with the species named |
| Catch rewards (XP, Stardust, Candy) | Rewards tally: catch, rarity bonus, new species, field tasks, daily stamp |
| Trainer level 1 to 50 | Explorer level 1 to 50, with ranks from Rookie to Legend |
| Medals, bronze to platinum | 16 badges drawn as enamel pins, bronze, silver, gold, platinum |
| Pokedex | Species journal, numbered in the order you found them, grouped by animal class |
| Field Research and stamps | Three field tasks a day and a daily stamp for finishing all three |
| The main ball button | The spectrum shutter, raised in the middle of the phone tab bar |
| The map as home | The camera as home |

---

## Screens

| Screen | Computer | Phone |
|---|---|---|
| Catch | Viewfinder filling the height, rail on the right: Today (catches left, streak), Field tasks, Latest catches | Full-screen camera like a camera app: latest card bottom left (opens Collection), shutter in the middle, level badge bottom right (opens Explorer) |
| Catch sequence | Card in the middle, then it slides left as the rewards panel arrives on the right | Card on top, rewards under it, buttons pinned to the bottom |
| Collection | Title with a Cards and Species switch, one row of filters, then the binder grid or the species journal | Same, two columns |
| Explorer | Hero (level ring, name, XP bar, cards, species, streak, badges), then three tabs: Overview (field tasks, next badges, animal classes, luck), Badges, Journal | Same, compact hero |
| Card detail | Card on the left (click to hold it), stats with real-world notes, field guide and catch record (with "caught with" links) on the right | One column |
| Settings | A profile card, then grouped rows with colored icon tiles: Appearance, Sound and feel, Photos, The game, Help. Longer explanations live on short pages (How to play, Rarity and odds, Levels and badges, Privacy and safety) | Same |
| Welcome | Three real sample cards fanned out beside the three steps | Cards on top |

### Navigation

- The bars float: rounded glass bars fixed in place over the page. Scrolling down slides them away; any scroll up, the top of the page or the very end brings them back. Pages leave room for them, so they never cover content at rest.
- Computer: a floating top bar with Catch, Collection, Explorer, the level chip (ring, rank, XP bar) and Settings.
- Phone: a floating top bar (logo, level badge, Settings) on every screen except the camera, which draws its own. A floating bottom bar: Collection, the raised Catch button, Explorer.
- Catches left and the streak live where they matter: on the camera and in the Today panel, not in every bar.

---

## Progression (Display Only)

Worked out on the device from the cards. Days follow the server's day (UTC), the same day the catch limit and streak use. Past days are re-scored from these same rules, so changing a value changes everyone's totals.

### XP

| Source | XP |
|---|---|
| Any catch | +100 |
| Rarity bonus | Uncommon +50, Rare +150, Epic +400, Legendary +1000 |
| A species never caught before | +500 |
| Each extra animal caught in the same photo | +250 |
| Each field task | +200 to +500 |
| All three tasks in a day (daily stamp) | +500 |

### Levels and Ranks

Level n to n + 1 takes 500 times n XP, up to level 50. A first catch is enough for level 2.

| Levels | Rank |
|---|---|
| 1 to 4 | Rookie |
| 5 to 9 | Spotter |
| 10 to 14 | Tracker |
| 15 to 19 | Ranger |
| 20 to 29 | Pathfinder |
| 30 to 39 | Naturalist |
| 40 to 49 | Trailblazer |
| 50 | Legend |

### Badges

Each badge has four tiers: bronze, silver, gold, platinum.

| Badge | Counts | Goals |
|---|---|---|
| Collector | Cards caught | 10 / 50 / 200 / 1000 |
| Naturalist | Species discovered | 5 / 25 / 75 / 200 |
| Devoted | Longest day streak | 3 / 7 / 30 / 100 |
| Full Spectrum | Rarities owned | 2 / 3 / 4 / 5 |
| Lucky Find | Rare or better cards | 1 / 10 / 40 / 150 |
| Legend Hunter | Legendary cards | 1 / 3 / 10 / 30 |
| Full Day | Days with every catch used | 1 / 5 / 20 / 60 |
| Field Researcher | Days with every task done | 1 / 7 / 30 / 100 |
| Pack Leader | Photos with two or more animals | 1 / 5 / 20 / 50 |
| Mammal Tracker, Birder, Reptile Spotter, Pond Watcher, Angler, Bug Hunter, Web Watcher, Statue Seeker | Cards of that class | 3 / 15 / 50 / 150 |

### Field Tasks

Three rings a day, the same for everyone, picked from the date. They close at the explorer's own midnight. Ring 1 is "Catch 3 animals" (+250). Ring 2 is "Find a wild species" (+300): a species that is not a pet (anything not Domestic) and not a statue. Ring 3 rotates through variety tasks (a new species, a bird, a mammal, an Uncommon or better, a card scoring 250+, an insect or spider, a reptile, amphibian or fish, a statue, three different wild species) and never repeats two days running. Closing all three is a stamp (+500). Seven days make the week strip.

## The Core Loop

The loop that brings people back, like Fitbit rings and Pokemon GO: **go outside, find a real animal, catch it, see it count everywhere, and have a reason to go out again tomorrow.**

1. A reason to go out: today's rings, a named animal to find ("Next to find", from the Field Guide), the weekly challenge, and a streak that is at risk in the evening.
2. The catch: the photo becomes a card. A wild species pays extra (+75 XP) and marks the card "Wild species".
3. Everything counts: the same card feeds XP, rings, badges (Outdoors group), the Field Guide, the weekly challenge, the journal trail and every leaderboard.
4. A reason to come back: close the rings, finish the album (+1,000 XP), win the challenge (+1,000 XP), keep the streak, climb a board.
5. Show it off: Share a card as a picture, pick up to three showcase cards for the public page, race a crew.

Where each thing lives. The server decides what can be faked (the local day and daily limit, rarity, the wild flag, species, every leaderboard, crews, showcase). The app works out everything that is only for display (XP, levels, badges, rings, albums, challenge progress) from the cards, so a rule change never needs a migration. Rules both sides need (time zones, wild test, challenge pool) live once in `shared/`.

### Weekly Challenge

One per week (Monday to Sunday, in the explorer's time zone), the same for everyone, picked from a pool of 13 (for example Into the Wild: find 5 different wild species). +1,000 XP when finished. The Challenge board ranks everyone on this week's challenge.

### Field Guide

Ten albums of named animals (Backyard Birds, City Wildlife, Ponds and Parks, Pet Parade, Farmyard, Safari Legends, Ocean Life, Forest Folk, Bug Hunt, Scales and Ponds). A slot fills with your best card of that animal. Empty slots say where to look. Finishing an album pays +1,000 XP once.

### Leaderboards and Crews

Six boards: Score, Streak, Species, Wild, Rare finds, Challenge. Each for This week or All time (Streak shows Current or Best ever). Everyone, or a crew: a private group of up to 30 joined by a six-letter code (a person can be in 5). Tapping a name opens a public page with totals and up to three showcase cards. Nobody is listed without a chosen board name, and three different reports take a name off the boards.

### Safety and Cost

Photos go through OpenAI's free moderation check before the paid vision call. A photo of a screen or a printed picture is turned down kindly. A kill switch (`CATCHING_PAUSED`) and a global daily limit (`GLOBAL_DAILY_CAP`) stop spending. Testers send feedback in the app. The developer account has a private stats page.

---

## Color

| Token | Value | Use |
|---|---|---|
| Sand | #F2EDE3 | Page background, with soft green, gold and sky glows |
| Paper | #FFFFFF | Panels |
| Ink | #17211C | Text |
| Canopy | #0F5E47 | Brand green: primary buttons, level medallion, Explorer hero, card backs |
| Sun to Ember | #FFD04D to #FF7A1A | The catch button and the most important call to action on a screen |
| Experience | #5BE3C0 to #0F9DB0 | Level rings, XP bars, finished tasks, daily stamps |
| Night | #0C1411 | The camera and the reveal stage |

### Badge metals

| Tier | Look |
|---|---|
| Bronze | Warm copper rim |
| Silver | Cool polished rim |
| Gold | Bright gold rim |
| Platinum | Iridescent rim |
| Locked | Dashed outline, grey enamel |

### Rarity (frame material)

| Tier | Color | Frame |
|---|---|---|
| Common | #8E979F | Polished silver |
| Uncommon | #2FA866 | Green enamel |
| Rare | #2F7DE1 | Blue foil with a moving sheen |
| Epic | #8B4DE0 | Violet holo, full-art card |
| Legendary | #E8A317 | Gold foil, full-art card, sparkles |

### Animal class (card color and mark)

| Class | Color | Mark |
|---|---|---|
| Mammal | Amber | Paw print |
| Bird | Sky blue | Bird |
| Reptile | Leaf green | Turtle |
| Amphibian | Teal | Frog |
| Fish | Ocean blue | Fish |
| Insect | Pollen yellow | Beetle |
| Arachnid | Dusk violet | Spider |
| Statue | Stone gray (any animal) | Monument |
| Other | Berry | Sprout |

---

## Customizing

Everything here changes the app only, never a card, and stays on the device. Style codes carry it all to a friend.

- Every color setting (Main color, Catch button, Card back, Glow) has presets, a "+" that opens a color picker and a box for hex codes, and keeps the customs used lately. Gradient settings take one to three codes: one grows into a matching set of tones, two blend, three are used as given.
- Background designs are whole-page looks drawn in plain CSS, no image files: 42 of them in a compact picker like the font one (arrows, or a grouped list with thumbnails). Groups: game consoles and handhelds, computers and the early web (Winamp, Buddy List, Teal 95), TV, toys and pop, paper and craft, glow. Dark designs switch the panels and text to their dark versions. A design replaces the Glow and Texture settings while it is on. Definitions live in app/src/lib/skins.ts.

---

## The App Icon

Gotcha installs like an app (Settings, App, Install). Its icon is the spectrum "o" from the wordmark, the five rarity colors in order, on the card-back green. The files are generated PNGs in app/public (icon-192, icon-512, a maskable version for Android, and the iPhone icon). A small service worker keeps the app opening instantly and available offline, and never caches catches or cards.

---

## Type

| Role | Font | Where |
|---|---|---|
| Display | Bricolage Grotesque | Logo, GOTCHA stamp, card names, scores, levels, headings |
| Text | Figtree | Body copy, buttons, labels |
| Catalog | DM Mono | On the cards only: card numbers, dates, stat labels. The app around them uses plain sentence-case labels, so it reads like an app, not a terminal |

---

## Symbols

All symbols live in one place (app/src/components/glyphs.tsx), so their use stays deliberate. They are used only where they carry meaning text can't: the animal class marks (the "types" of this card game), badge emblems, the colored tiles that make the Settings list easy to scan, and a few controls (settings, close, next and previous, the phone tab bar). They come from the Lucide set (ISC license) plus a spider and a frog drawn to match.

---

## The Card

Portrait at 5 by 7, read top to bottom:

- Name and score
- Class pill with its mark, and the species
- Illustration in a framed window (Common to Rare) or across the whole card (Epic and Legendary)
- Rarity gems and tier name
- Special ability box
- Five stats: PWR, SPD, DEF, AGI, SNS, with the animal's strongest one highlighted
- Flavor text
- Card number and the date it was caught, and the series line ("Sample card" for cards made without AI)

The card back carries the catch button itself: the spectrum ring around a sun-colored core, on the chosen card-back color with contour lines.

Frames, foil and shimmer are layered in the app. The illustration never contains a frame or text.

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
| Developing | The frozen photo, desaturated, in a frame that matches its shape, with a scanning line, a locking reticle and a six-step progress bar |
| Gotcha | The photo snaps back to full color, GOTCHA slams in with a burst and confetti, a two-note jingle plays, and the species is named underneath. With several animals, a "×2" or "×3" sticker lands on the stamp and every species is named |
| Card arrives | The card back slides in over a blurred copy of the photo |
| Charge | Only now does the stage glow in the rarity color. Rarer cards charge longer and shake |
| Flip | The card flips, sparks burst, a chime plays (more notes for rarer tiers) |
| Revealed | Rarity name stamps in, the score counts up, the card floats in your hand |
| More animals | With several animals, each card is revealed in turn ("Animal 1 of 2", then Next animal), like opening a pack |
| Rewards | After the last card: XP lines tick in one by one (matching lines add up, "Catch ×2"), the total counts up, the XP bar fills, then "Level up!" and any new badges |

### Several animals in one photo

- Every real animal (or animal statue) clearly in the photo becomes its own card, up to three, most prominent first.
- Each card gets its own rarity roll, its own painting (just that animal, the others left out) and its own stats.
- Each animal uses one of the day's catches, so the most anyone can spend on paintings in a day doesn't change. With fewer catches left than animals, the most prominent ones are caught and the rest are mentioned.
- Cards caught together share their catch moment, link to each other in the card's catch record, and earn "Caught together" XP and the Pack Leader badge.

### Sound

| Moment | Sound |
|---|---|
| Shutter | A soft click |
| Gotcha | A pickup note into a bright chord |
| Charge | A rising tone, longer for rarer cards |
| Reveal | A bell run, one note per rarity step, sparkle on Legendary |
| Reward line | A soft tick |
| Level up | A five-note arpeggio with shimmer |
| New badge | Two bells |
| No animal | Two falling notes |

---

## First Run

A new player sees three real sample cards (a Rare mallard, a Legendary robin, an Epic golden retriever) fanned out on the welcome screen and in the empty collection. They were painted from text alone, not from anyone's photo, and say "Sample card" on them. The home rail shows today's field tasks and how it works, so the first catch already earns a level.

---

## Build Rules

- No HTML in any output
- No emojis in any output
- SVG icons only when genuinely needed
