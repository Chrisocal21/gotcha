# Gotcha — Feature Map

> Working title. Name needs an App Store, Google Play, and domain check before going public.

---

## The Idea

A collectible card game where every live photo of a real animal becomes a unique, AI-named, AI-illustrated card with trait-based stats and a random rarity tier. Cards live in a personal collection. Trading comes later.

---

## Core Rules (Locked)

| Rule | Decision |
|---|---|
| Rarity | Pure random roll at creation, never re-rolls |
| Tiers | Common, Uncommon, Rare, Epic, Legendary |
| Odds per catch | 55 / 25 / 12 / 5 / 3 percent |
| Daily limit | 10 catches per day, counted on the server, no cooldown |
| Capture | Live in-app camera only, no uploads |
| What counts | Any real animal (mammal, bird, reptile, fish, insect, spider) or a statue of one |
| People | Never appear on the card |
| Rejections | No animal found means a friendly rejection that does not count against the 10 |
| Card art | AI illustration of the animal, original photo discarded after processing |
| Rare treatment | Holographic frame and shimmer on top tiers, layered in the app, not baked into the image |
| Stats | Real animal traits scored by AI, math done by the Worker |
| Rarity boost | Common +0, Uncommon +10, Rare +25, Epic +50, Legendary +100 percent |
| Special trait | Every animal gets one (sting, spray, venom) |
| Battles | Not planned |
| Comparing | Possible later feature |

---

## Step Zero — Prove the Catch Pipeline

**Goal:** One photo in, one illustrated card out. No app, no polish. The biggest unknown is whether the illustration looks like the real animal, so it goes first and alone.

- Pick 5 test subjects: your dog, a bug, a bird, a statue, a photo with a person in it
- Write the vision prompt (animal check, description, trait scores)
- Generate one illustration per subject
- Judge likeness: do people recognize the real animal
- Tune until your own dog looks like your dog

Nothing below matters until Step Zero holds up.

---

## Phase 1 — MVP

**Goal:** Snap a photo, get a rejection or a card, watch the reveal, browse your own collection.

### Camera Capture
- Live in-app camera, no uploads
- "Keep your distance" message on the camera screen
- Send the photo to the Worker

### Catch Pipeline (Cloudflare Worker)
- Check the daily cap (10 per user)
- Vision check: animal or statue, people left off
- Rejections do not count against the cap
- Rarity roll at 55 / 25 / 12 / 5 / 3
- Stats math: trait scores times rarity boost
- Name generation, illustration, then discard the photo
- Save card data to D1 and art to R2

### Reveal
- Build-up animation during the 10 to 30 second wait
- Rarity frame per tier

### Several Animals in One Photo (added Oct 4, 2026)
- Each animal in the photo becomes its own card, up to 3, each with its own rarity roll and painting
- Each animal uses one of the day's catches (proposed, see GOTCHA_OPEN_QUESTIONS.md)

### Collection
- Card grid and card detail view
- Empty state for a new user

### Sign-In
- Hardcoded user ID while testing
- Clerk (free tier) once the catch loop feels good

---

## Phase 2 — Polish

- Holographic tilt effect with a touch fallback for older phones
- Card comparing
- Sharing
- Daily reset timezone

---

## Phase 3 — Trading

- Trading and ownership records
- Anti-cheat (screens and stock photos, statue versus toy)
- Moderation
- Odds review before trading goes live

---

## Tools

| Need | Tool |
|---|---|
| App | React + Vite + Tailwind + TypeScript on Vercel |
| Server logic | Cloudflare Worker |
| Cards and daily counts | Cloudflare D1 |
| Card art | Cloudflare R2 (illustrations only) |
| Vision, names, trait scores | OpenAI GPT-4o |
| Illustration | OpenAI image model |
| Sign-in | Clerk free tier |

---

## Things Considered and Set Aside

| Feature | Why It Was Set Aside |
|---|---|
| Battles | Second game inside the first. Rules, balance, and likely other players. |
| Rarity by species or photo quality | Chosen instead: pure luck, so any animal can pull a Legendary |
| Camera roll uploads | Opens stock photo and screenshot cheating |
| Real photo on the card | Stores faces, including kids, and needs hard person-removal |
| Mammals only | Widened to every animal so there are fewer dead days |
| Cooldown between catches | Daily cap alone keeps the "I just saw a dog" feel |

---

## Ideas in the Backlog

- Statue cards as their own card type
- Rarer top tier above Legendary if trading ever launches
- Comparison verdict (raw totals, winner per trait, or no verdict)

---

## Build Rules

- No HTML in any output
- No emojis in any output
- SVG icons only when genuinely needed

## Series

- Every card records the series it was caught in (cards.series, CURRENT_SERIES in worker/src/rules.ts).
- **Founders Edition** is everything caught before public launch. It closes on launch day and can never be earned again. Perks are cosmetic and status only (gold edition mark, Founding Member badge, tradable later). Odds, stats and the daily cap are never changed by a series.
- Public launch starts Series One, then Series Two and on, each about 3 months with its own theme and frame.
