# Gotcha — Progress Tracker

---

## Gotcha

**Overall progress:** 76% (51/67 subtasks)
**Last updated:** October 4, 2026
**Status:** Active — the Field Expedition redesign, multi-animal catch, Clerk sign-in, leaderboard, 99 badges and Founders Edition are all in the code and pushed. Vercel deploys every push to https://gotcha-chrisoc.vercel.app (latest deploy matches the newest commit). Not verified from code alone: that the Worker with the newest migrations (0004 to 0007) and the Clerk keys are live on Cloudflare. Still waiting on a check on a real phone

The overall count now adds up the checklists below (Step Zero and Phases 1 to 3). Earlier percentages used a looser count of 40.

---

## Planning

| Stage | Status |
|---|---|
| Idea captured | Done |
| Core rules locked | Done |
| Name chosen | Done — Gotcha (working title, availability check open) |
| MVP defined | Done |
| Tools chosen | Done |
| Phase plan | Done |
| Build | Started |

---

### Step Zero — Prove the Catch Pipeline

**Progress:** 20% (1/5)
**Goal:** One photo in, one illustrated card out. Likeness is the biggest risk.
**Tool:** The Lab was removed Oct 3, 2026. Likeness testing now happens through real catches using the PC-only Upload photo button on the Catch screen (app/src/components/DevUpload.tsx).

- [ ] Pick 5 test subjects (dog, bug, bird, statue, photo with a person)
- [x] Write the vision prompt (animal check, description, trait scores) — in worker/src/ai.ts, now run against GPT-4o on real photos (rockhopper penguin, two miniature schnauzers; a landscape was rejected)
- [ ] Generate one illustration per subject
- [ ] Judge likeness
- [ ] Tune until your own dog looks like your dog

---

### Phase 1 — MVP

**Phase progress:** 92% (50/54)
**Goal:** Snap, reveal, collect. Does not start until Step Zero holds up.
**Note:** The whole loop now runs for real, on the live site and locally: photo, GPT-4o vision check, rarity roll, gpt-image-1 painting, card saved to D1 and R2. Ticked items were checked in a real browser or through the API. What is left is Clerk sign-in, a photo with a person in frame, and a phone check.

#### Feature 1.1 — Camera Capture
**Progress:** 100% (3/3)

- [x] Live in-app camera, no uploads
- [x] "Keep your distance" message on screen
- [x] Send the photo to the Worker

#### Feature 1.2 — Catch Pipeline
**Progress:** 89% (8/9)

- [x] Daily cap check (10 per user)
- [x] Vision check: animals and statues pass, photos with no animal are rejected
- [ ] People left off the card — not tried yet with a person in frame next to an animal
- [x] Rejections do not count against the cap — checked: a landscape was rejected and the count stayed put
- [x] Rarity roll at 55 / 25 / 12 / 5 / 3
- [x] Stats math: trait scores times rarity boost
- [x] Name generation, illustration, photo discarded — real cards have names and painted art, and the Worker only holds the photo in memory during the request
- [x] Save card data to D1
- [x] Save card art to R2

#### Feature 1.3 — Reveal
**Progress:** 100% (2/2)

- [x] Build-up animation during the wait
- [x] Rarity frame per tier

#### Feature 1.4 — Collection
**Progress:** 100% (3/3)

- [x] Card grid
- [x] Card detail view
- [x] Empty state for a new user

#### Feature 1.5 — Sign-In
**Progress:** 100% (2/2)

- [x] Hardcoded user ID while testing
- [x] Clerk sign-in (built Oct 4, 2026: sign-in gate, per-user collections and daily limit, profile). Needs a real friend sign-up to prove it end to end

#### Feature 1.6 — Live Card
**Progress:** 83% (5/6)
**Goal:** A card should feel like an object in your hand, not a picture on a screen.

- [x] Reveal screen card leans toward the mouse or a dragging finger and tilts with the phone (up, down, left and right)
- [x] Card floats and breathes while it sits there, with an aura that pulses and slow glowing specks around it
- [x] Art slides behind the surface as the card tilts, so it has depth, and the shadow moves the other way
- [x] A jolt when the card lands, stronger for rarer cards
- [x] Card-in-hand view shares the same motion, so a card moves the same everywhere
- [ ] Check the feel on a real phone (tilt direction, strength, iPhone motion permission)

#### Feature 1.7 — Online
**Progress:** 100% (5/5)

- [x] Worker, database (D1) and art storage (R2) live on Cloudflare
- [x] OpenAI key stored as a Worker secret, not in any file or in the app
- [x] Site live on Vercel at https://gotcha-chrisoc.vercel.app, with /api forwarded to the Worker
- [x] Monthly spending limit set on the OpenAI account ($15)
- [x] Developer routes (reset cap, clear samples, paint sample) refused on the live server

#### Feature 1.8 — Game Layer
**Progress:** 86% (6/7)
**Goal:** The Pokemon GO habit loop, grown up: a reason to say "gotcha" again tomorrow. Everything here is worked out on the device from the cards, costs nothing, and changes no locked rule (see GOTCHA_DESIGN.md, Progression).

- [x] GOTCHA moment: the photo snaps to color, GOTCHA stamps in with a burst and a jingle, and the species is named
- [x] Rewards tally after every reveal: XP lines, total, XP bar, level up, new badges
- [x] XP, levels 1 to 50 and ranks (Rookie to Legend), shown in the top bar and on every catch
- [x] Explorer page: level ring, editable name, badges, field tasks and stamps, animal classes, luck against the odds, a journal of every day out catching
- [x] 16 badges as enamel pins, bronze to platinum, and three field tasks a day with a daily stamp
- [x] Species journal in Collection, numbered in the order found, grouped by animal class
- [ ] Tune XP values, the level curve and badge goals after a week of real play

#### Feature 1.9 — Several Animals in One Photo
**Progress:** 75% (3/4)
**Goal:** A photo of two dogs catches two dogs, one card each, like a ball catching one creature (Chris, Oct 4, 2026).

- [x] The vision check lists every animal or animal statue in the photo (up to 3, most prominent first), and each is painted alone with its own rarity and stats
- [x] Each animal uses one of the day's catches, so the most spent on paintings in a day doesn't change; extra animals with no catches left are mentioned instead of painted
- [x] GOTCHA ×2, cards revealed one by one ("Animal 1 of 2", Next animal), combined rewards with "Caught together" XP, the Pack Leader badge, and "caught with" links on each card
- [ ] Try it with a real photo of two animals (costs about two paintings)

#### Feature 1.10 — Feels Like an App
**Progress:** 100% (3/3)
**Goal:** Cleaner and more organized, less on screen at once (Chris, Oct 4, 2026).

- [x] Floating top and bottom bars, fixed in place, that slide away while scrolling down and come back on any scroll up, never covering content
- [x] Settings rebuilt like a phone's settings app: a profile card, grouped rows with icon tiles, short pages for How to play, Rarity and odds, Levels and badges, Privacy and safety
- [x] Calmer screens: Explorer in three tabs, one Today panel on the camera, one filter row in Collection, a one-line safety note, plain labels instead of monospace ones

#### Feature 1.11 — Leaderboard and Identity
**Progress:** 80% (4/5)
**Goal:** A reason to compare and come back, without exposing anyone (built by Chris, Oct 4, 2026).

- [x] Profiles table and an editable explorer name that follows the account
- [x] Leaderboard where nobody appears until they pick a screen name or approve their real name (only that name is ever shown)
- [x] Creator and Founder tags, set only by the server
- [x] Tags kept small and quiet on the board
- [ ] Try the board with two real accounts

#### Feature 1.12 — Badges, Easter Eggs and Series
**Progress:** 80% (4/5)
**Goal:** Depth to collect (built by Chris, Oct 4, 2026).

- [x] 99 badges with six tiers, mystery badges, rims that fill with the next tier's metal
- [x] Easter eggs found by poking around (tap the logo, Konami code, typing the word)
- [x] Endless levels past 50
- [x] Founders Edition: every card records its series, with a gold edition mark and a Founding Member badge; the series flips when public launch starts
- [ ] Print downloads of a card: built, needs a try on a real printer

---

#### Feature 1.13 — Installable App and Deeper Customizing
**Progress:** 83% (5/6)
**Goal:** Gotcha on the home screen with the spectrum "o" as its icon, and more ways to make it yours (Chris, Oct 4, 2026).

- [x] Installable app (PWA): manifest, icons drawn from the wordmark's "o", service worker, install row in Settings, iPhone home-screen tags. Chrome reports it installable
- [x] Every color setting has a color picker and a "+" for hex codes, and remembers the customs you used lately (Main color, Catch button, Card back, Glow)
- [x] Many more presets: 16 main colors, 12 catch buttons, 12 glows, 12 card backs
- [x] 42 background designs in a compact picker (arrows, grouped list with thumbnails, phone friendly): game consoles and handhelds, retro computers and the early web (Winamp, Buddy List), TV and toys, paper and craft. Dark ones switch the panels to dark automatically
- [x] Style codes carry the new settings (older codes still work)
- [ ] Install it from the live site on a real phone and a PC and check the icon

---

### Phase 2 — Polish

**Phase progress:** 0% (0/4)

- [ ] Holographic tilt effect with touch fallback — built in the card detail view, needs a phone check
- [ ] Card comparing
- [ ] Sharing
- [ ] Daily reset timezone

---

### Phase 3 — Trading

**Phase progress:** 0% (0/4)

- [ ] Trading — plan: one person shows a QR or 4-letter code, the other scans it in Gotcha's camera, both pick cards and confirm, the server swaps ownership in one step. Works on iPhone and Android. True phone-to-phone tap (NFC) needs a native app wrapper, so it is a later upgrade. Needs sign-in and ownership records first
- [ ] Ownership records
- [ ] Anti-cheat
- [ ] Moderation

---

## Session Update Log

| Date | What Moved | New Overall |
|---|---|---|
| Oct 3, 2026 | Idea shaped, core rules locked, named Gotcha, MVP and phase plan defined, 40 subtasks laid out | 0% |
| Oct 3, 2026 | App and Worker skeleton running on localhost:3000 in mock mode. Vision prompt drafted, Step Zero Lab built, cap, rarity, stats, D1 and R2 working | 18% |
| Oct 3, 2026 | Full visual redesign with its own design language (GOTCHA_DESIGN.md). Camera-first home, rarity build-up reveal with sound and haptics, collection with stats and filters, card detail with tilt. Camera, reveal and collection checked in a real browser | 38% |
| Oct 3, 2026 | Second redesign after feedback (too dark, cards generic). Brighter nature look, real trading-card layout with animal classes and full-art Epic and Legendary cards, full-width computer layout, Settings page for the OpenAI key, one-click repaint of sample cards | 38% |
| Oct 3, 2026 | Went online. Worker, D1 and R2 on Cloudflare, OpenAI key as a Worker secret, app on Vercel with /api forwarded to the Worker, $15 monthly OpenAI limit, developer routes refused on the live server. Real catches checked end to end, and a no-animal photo is rejected without using a catch. Phase 1 pipeline items ticked. Counts now follow the checklists (43 subtasks) | 65% |
| Oct 3, 2026 | Live card polish. The reveal card now floats, leans toward the mouse or a dragging finger, tilts with the phone, gets a jolt when it lands, and has art depth, a moving shadow and drifting specks. The card-in-hand view shares the same motion code (app/src/lib/motion.ts) | 65% |
| Oct 4, 2026 | Third redesign, "Field Expedition": an adult take on Pokemon GO. GOTCHA moment and rewards tally on every catch, Explorer page (levels, badges, field tasks, journal), species journal in Collection, new navigation (raised Catch button on phones, level chip on computers), full-screen camera on phones, class marks and catch dates on cards, a new card back, a welcome screen with real sample cards, dark theme checked screen by screen. Fixed a bug where the shutter stayed off after "Keep catching" | 68% |
| Oct 4, 2026 | Feedback round: floating bars that step aside while scrolling, Settings rebuilt like a phone's settings app with short pages, Explorer in tabs, calmer home and Collection. One photo of several animals now catches each one (up to 3, one card and one catch each), with GOTCHA ×2, a one-by-one reveal, "Caught together" XP and the Pack Leader badge | 70% |
| Oct 4, 2026 | Chris's own work, 27 commits after my feedback round: Clerk sign-in, leaderboard with screen names, 99 badges with mystery badges and easter eggs, endless levels, print downloads, Founders Edition series, Creator and Founder tags, softer light mode, the camera sharing the floating header and tab bar on phones, a font picker with 16 fonts and a live preview in Customize | 74% |
| Oct 4, 2026 | Installable app with the "o" icon, a color picker plus "+" hex codes on every color setting, many more presets, and 18 retro background designs (Winamp, Buddy List, Vaporwave and more) | 76% |

---

## Before Testers Get It

Done Oct 3, 2026: dark mode and theme setting, reduce motion, vibration setting, first-run welcome, how-it-works and odds page, privacy note, copy-details for bug reports, developer tools hidden outside development.

Also built Oct 3, 2026: Customize screen (main color, catch button color, background and pattern, card back, corners, fonts, shareable style codes). Settings changes the app only. Cards never change, so they look identical to everyone once trading exists. Saved on the device for now; once sign-in exists it can save to the account so friends see it.

Also built Oct 3, 2026: card-in-hand view (both sides tilt together with springy physics, drag the card and it follows your finger then flies to the next, tap to flip, phone motion tilt, card counter, screen stays awake, soft sounds and buzzes). The reveal screen card now moves the same way (app/src/components/LiveCard.tsx). Phone motion tilt is untested on a real phone: the card is set to hang in the air while the phone moves around it, and if it feels inverted, flip GYRO_SIGN in app/src/lib/motion.ts. iPhone asks for motion permission once, on the first catch.

Still missing:

- [x] Put it online with https (Vercel for the app, Cloudflare for the server). Done Oct 3, 2026
- [x] Real sign-in (Clerk). Built Oct 4, 2026
- [ ] Try it on a real phone and a real tablet
- [ ] Decide what testers do with feedback (a form or an email address for the Report a problem button)
- [x] Spending cap on the OpenAI account ($15 a month). Done Oct 3, 2026
- [ ] Safety check on photos (inappropriate images) before the AI sees them
- [x] Verify the dark theme screen by screen. Done Oct 4, 2026 (Catch, Collection, Species, Explorer, card detail, Settings, Customize, computer and phone)

## What to Tackle Next

- [ ] Look over the Field Expedition redesign at localhost:3000 (Catch, Collection and its Species view, Explorer, a catch from start to rewards) and decide what to keep
- [ ] Deploy the redesign to Vercel once it looks right, and deploy the Worker for the multi-animal catch (no database change needed)
- [ ] Try one real photo with two animals in it
- [ ] Open https://gotcha-chrisoc.vercel.app on a phone, tilt a freshly caught card, and report whether the tilt feels right or inverted
- [ ] Pick the 5 Step Zero test subjects and run them through the Upload photo button
- [ ] Have one friend sign up with Clerk and catch something, to prove sign-in, the leaderboard and the daily limit work per person
- [ ] Settle XP values, badge names and goals, and whether progress should move to the server with sign-in (see GOTCHA_OPEN_QUESTIONS.md)
- [ ] Check name availability (App Store, Google Play, domain)

---

## Build Rules

- No HTML in any output
- No emojis in any output
- SVG icons only when genuinely needed
