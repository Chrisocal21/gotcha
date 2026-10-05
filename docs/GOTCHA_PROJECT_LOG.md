# Gotcha — Project Log

> Add the entry below to PROJECT_LOG.md under Session History, and add Gotcha to the Active Projects table.

---

## Active Projects Row

| Project | Status | Last Session | Next Focus |
|---|---|---|---|
| Gotcha | Active | 2026-10-04 | Review the Field Expedition redesign, deploy it, then the Step Zero test subjects |

---

## Gotcha -- Session 1 -- 2026-10-03

**Status:** Active

---

### What We Decided

- Gotcha is a collectible card game where every live photo of a real animal becomes an AI-named, AI-illustrated card with trait-based stats and a random rarity.
- Rarity is a pure random roll, five tiers at 55 / 25 / 12 / 5 / 3 percent.
- 10 catches per day, counted on the server, no cooldown.
- Live camera only. No uploads.
- Any real animal or animal statue counts. People never appear on the card.
- Card art is an AI illustration. The original photo is discarded.
- Rare tiers get holographic treatment, layered in the app.
- Stats come from real traits scored by AI, math done by the Worker, with a rarity boost of +0 to +100 percent.
- No battles. Comparing is a possible later feature.
- Name: Gotcha (working title).
- MVP: snap, card or rejection, reveal, personal collection.
- Sign-in: Clerk free tier, hardcoded ID while testing.
- Phase plan: Step Zero, MVP, Polish, Trading.

---

### What Was Learned

- Chris wanted the idea to widen quickly: mammals became all animals, then bugs, then statues.
- Chris prefers names that are easy to say and friendly.
- Chris wants special rare-card treatment (holographic) and a luck-driven rarity.

---

### What Changed

- Legendary odds raised from 1 percent to 3 percent.
- Scope widened from mammals to every animal.
- Person handling changed from reject to leave off the illustration.

---

### Open Questions Added

- Does the illustration look like the real animal
- Card layout and art style
- Trait set and special traits
- Statue cards as their own type
- Name availability
- Distance warning wording

---

### Open Questions Closed

- Rarity method, daily limit, capture method, what counts, person handling, art type, rare treatment, tiers, odds, stats source, battles, name, MVP, sign-in, phase structure

---

### Progress Updates

- Gotcha tracker created. 0 of 40 subtasks done. Planning stages complete.

---

### Documents Updated

- GOTCHA_FEATURE_MAP.md created
- GOTCHA_PROGRESS_TRACKER.md created
- GOTCHA_OPEN_QUESTIONS.md created
- GOTCHA_PROJECT_LOG.md created (this entry)

---

### Next Session

Start Step Zero: pick the 5 test subjects and draft the vision prompt.

---

## Gotcha -- Session -- 2026-10-04 (Field Expedition redesign)

**Status:** Active

---

### What We Decided

- New direction, "Field Expedition": a grown-up take on Pokemon GO. Its structure (catch, Gotcha, rewards, level up, come back tomorrow) with a nature expedition's look.
- Every catch gets a GOTCHA moment, with the species named, before the rarity reveal.
- A game layer on top of the cards: XP, levels 1 to 50 with ranks, 16 badges (bronze to platinum), three daily field tasks with a daily stamp, a species journal and a day-by-day journal.
- All progress is worked out on the device from the cards. No server change, no new cost, no locked rule changed.
- Three sample cards (painted from text, not anyone's photo) welcome new players.

---

### What Changed

- New Explorer page and navigation (raised Catch button on phones, level chip on computers).
- Phone camera is full screen, like a camera app.
- Collection gained a Species view and a class filter.
- Cards gained class marks, a highlighted strongest stat and the catch date. New card back.
- Fixed: after a catch, "Keep catching" left the shutter switched off until the page was reloaded.

---

### Open Questions Added

- Are the XP values, level curve and badge goals right
- Do the rank and badge names fit
- Should XP and badges move to the server with sign-in
- Should players be able to nickname a card

---

### Open Questions Closed

- Keep the engagement hooks (yes, and go further)

---

### Documents Updated

- GOTCHA_DESIGN.md rewritten for the new direction
- GOTCHA_PROGRESS_TRACKER.md (Feature 1.8, now 68%)
- GOTCHA_OPEN_QUESTIONS.md
- GOTCHA_PROJECT_LOG.md (this entry)

---

### Next Session

Review the redesign at localhost:3000, deploy it to Vercel, then pick the Step Zero test subjects.

---

## Gotcha -- Session -- 2026-10-04 (feedback round)

**Status:** Active

---

### What Chris Asked For

- Header and bottom bar floating and fixed in place, getting out of the way while scrolling and never covering content.
- An app, not a tech thing: Settings cleaner and better organized.
- Less at once: cleaner and more organized everywhere.
- One photo of two dogs should catch two dogs, one card each, as a special multi-animal catch.

---

### What Changed

- Floating glass bars that slide away while scrolling down and return on any scroll up.
- Settings rebuilt like a phone's settings app, with short pages for the longer explanations. Customize matches.
- Explorer split into Overview, Badges and Journal tabs. One Today panel on the camera. One filter row in Collection. Plain labels instead of monospace ones outside the cards.
- Multi-animal catch: up to 3 animals per photo, each painted alone with its own rarity, each using one catch. GOTCHA ×2, one-by-one reveal, "Caught together" XP, Pack Leader badge, "caught with" links. Worker changed; no database change.

---

### Open Questions Added

- Should each animal in a multi-animal photo use a catch (built: yes)
- Is three animals per photo the right limit

---

### Next Session

Look over the changes, deploy the app and the Worker, then try one real photo with two animals in it.

---

## Gotcha -- Session -- 2026-10-04 (realignment)

**Status:** Active

---

### What Happened

- Session restarted after Chris did substantial work on his own: Clerk sign-in, a leaderboard with screen names, 99 badges with mystery badges and easter eggs, endless levels, print downloads, Founders Edition series, Creator and Founder tags, a softer light mode, the camera reusing the floating header and tab bar, a 16-font picker with live preview. Worker migrations 0004 to 0007 added.
- Realigned by reading git history and the code. Everything is committed and pushed, and Vercel's latest production deploy matches the newest commit. The multi-animal catch and Pack Leader badge survived inside the new badge system.
- Stopped my leftover mock test servers. Chris's dev servers were left alone.

---

### Documents Updated

- GOTCHA_PROGRESS_TRACKER.md (Features 1.11 and 1.12, sign-in ticked, now 74%)
- GOTCHA_PROJECT_LOG.md (this entry)

---

### Not Verified

- That the Worker with migrations 0004 to 0007 and the Clerk secrets are live on Cloudflare (the Cloudflare connection was unavailable this session).

---

## Build Rules

- No HTML in any output
- No emojis in any output
- SVG icons only when genuinely needed
