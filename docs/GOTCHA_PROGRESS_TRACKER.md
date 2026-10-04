# Gotcha — Progress Tracker

---

## Gotcha

**Overall progress:** 38% (15/40 subtasks)
**Last updated:** October 3, 2026
**Status:** Active — redesigned app running locally in mock mode, waiting on an OpenAI key for Step Zero

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
- [x] Write the vision prompt (animal check, description, trait scores) — draft in worker/src/ai.ts, untested against GPT-4o
- [ ] Generate one illustration per subject
- [ ] Judge likeness
- [ ] Tune until your own dog looks like your dog

---

### Phase 1 — MVP

**Phase progress:** 78% (14/18)
**Goal:** Snap, reveal, collect. Does not start until Step Zero holds up.
**Note:** Every feature below is built and runs in mock mode. Ticked items were checked in a real browser (Edge with a test camera) or through the API. Unticked items wait on a real OpenAI run or on Clerk. Nothing has been tried on a phone yet.

#### Feature 1.1 — Camera Capture
**Progress:** 100% (3/3)

- [x] Live in-app camera, no uploads
- [x] "Keep your distance" message on screen
- [x] Send the photo to the Worker

#### Feature 1.2 — Catch Pipeline
**Progress:** 63% (5/8)

- [x] Daily cap check (10 per user)
- [ ] Vision check: animal or statue, people left off
- [ ] Rejections do not count against the cap
- [x] Rarity roll at 55 / 25 / 12 / 5 / 3
- [x] Stats math: trait scores times rarity boost
- [ ] Name generation, illustration, photo discarded
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
**Progress:** 50% (1/2)

- [x] Hardcoded user ID while testing
- [ ] Clerk once the catch loop feels good

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

---

## Before Testers Get It

Done Oct 3, 2026: dark mode and theme setting, reduce motion, vibration setting, first-run welcome, how-it-works and odds page, privacy note, copy-details for bug reports, developer tools hidden outside development.

Also built Oct 3, 2026: Customize screen (main color, catch button color, background and pattern, card back, corners, fonts, shareable style codes). Settings changes the app only. Cards never change, so they look identical to everyone once trading exists. Saved on the device for now; once sign-in exists it can save to the account so friends see it.

Also built Oct 3, 2026: card-in-hand view (both sides tilt together with springy physics, drag the card and it follows your finger then flies to the next, tap to flip, phone motion tilt, card counter, screen stays awake, soft sounds and buzzes). Phone motion tilt is untested on a real phone. If it feels inverted, flip GYRO_SIGN in app/src/screens/CardZoom.tsx.

Still missing:

- [ ] Put it online with https (Vercel for the app, Cloudflare for the server). Phones cannot use the camera without https
- [ ] Real sign-in (Clerk). Everyone shares one test account right now, so collections and the daily limit are shared
- [ ] Try it on a real phone and a real tablet
- [ ] Decide what testers do with feedback (a form or an email address for the Report a problem button)
- [ ] Spending cap or alert on the OpenAI account. Each catch costs two AI calls
- [ ] Safety check on photos (inappropriate images) before the AI sees them
- [ ] Verify the dark theme screen by screen (built, but not yet checked in a browser)

## What to Tackle Next

- [ ] Paste the OpenAI key in Settings, then paint the sample cards there
- [ ] Pick the 5 Step Zero test subjects and run them through the Lab
- [ ] Try the app on a phone (the camera needs https away from localhost)
- [ ] Decide whether to keep the engagement hooks added in the redesign (see GOTCHA_OPEN_QUESTIONS.md)
- [ ] Check name availability (App Store, Google Play, domain)

---

## Build Rules

- No HTML in any output
- No emojis in any output
- SVG icons only when genuinely needed
