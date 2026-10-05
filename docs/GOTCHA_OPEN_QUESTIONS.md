# Gotcha — Open Questions

---

## Answered

| Question | Answer | Session |
|---|---|---|
| What decides rarity? | Pure random roll, not species or photo quality | Oct 3, 2026 |
| What limits catches? | 10 per day, no cooldown | Oct 3, 2026 |
| Uploads or live camera? | Live camera only | Oct 3, 2026 |
| What counts as a catch? | Any real animal, including birds, reptiles, fish, insects, spiders, plus animal statues | Oct 3, 2026 |
| What about people in the photo? | Never on the card | Oct 3, 2026 |
| Real photo or illustration? | AI illustration, original photo discarded | Oct 3, 2026 |
| Do rare cards look different? | Yes, holographic treatment on top tiers | Oct 3, 2026 |
| How many tiers? | Five: Common, Uncommon, Rare, Epic, Legendary | Oct 3, 2026 |
| What are the odds? | 55 / 25 / 12 / 5 / 3 percent (Legendary raised to 3) | Oct 3, 2026 |
| Where do stats come from? | Real animal traits, rarity adds a percentage boost | Oct 3, 2026 |
| Are there battles? | No. Comparing is a possible later feature | Oct 3, 2026 |
| What is it called? | Gotcha (working title) | Oct 3, 2026 |
| What is the MVP? | Snap, card or rejection, reveal, personal collection | Oct 3, 2026 |
| Sign-in? | Clerk free tier, hardcoded ID while testing | Oct 3, 2026 |
| Phase structure? | Step Zero, then MVP, Polish, Trading | Oct 3, 2026 |
| Keep the engagement hooks from the second redesign? | Yes, and go further: Chris asked for an adult Pokemon GO feel worth coming back to. Built as the game layer (GOTCHA moment, rewards, levels, badges, field tasks, journals), all worked out on the device and none of it changing a locked rule | Oct 4, 2026 |

---

## Still Open

| Question | Why It Matters |
|---|---|
| Does the illustration look like the real animal? | The "your own dog is a card" hook depends on it. Answered by Step Zero. |
| What is the card layout and art style? | Sets the look of the whole collection and the base for tier treatments. Draft in GOTCHA_DESIGN.md, needs Chris's sign-off |
| What traits are scored, and what is each animal's special trait? | Needs a fixed set so a fly and a lion get fair, consistent numbers |
| Should statue cards be their own card type? | Keeps them distinct from live catches. Suggested, not confirmed. |
| Does the daily cap reset at midnight in whose timezone? | Answered Oct 5, 2026: each explorer's own midnight. The app sends its time zone and the server falls back to UTC for anything unrecognised. A traveler crossing zones can get a slightly short or long day |
| Is the name Gotcha available? | Check App Store, Google Play, and domain before going public. Pokemon GO shows "Gotcha!" on every catch, and "Go-tcha" is an existing Pokemon GO accessory, so the name leans on Pokemon GO |
| Keep animal classes on cards? | Added in the second redesign: every card shows Mammal, Bird, Reptile, Amphibian, Fish, Insect or Arachnid, and takes its color and mark from it. Statues wear stone gray. Since the third redesign the classes also drive eight badges and the species journal, so removing them now means removing those too |
| Are the XP values, level curve and badge goals right? | Set from Pokemon GO's pacing: a first catch reaches level 2, a week of steady play reaches about level 9, level 50 takes a long time. Tune after real play (values in GOTCHA_DESIGN.md) |
| Do the rank and badge names fit? | Ranks Rookie to Legend; badges like Birder, Bug Hunter, Statue Seeker, Field Researcher. Needs Chris's sign-off |
| Should XP and badges move to the server with sign-in? | Today they are worked out on each device from the cards, so they cost nothing and can't drift or be lost. A server copy would let friends see each other's level, but changing a rule would then need a migration |
| Should each animal in a multi-animal photo use a catch? | Built that way (Oct 4): a photo of two dogs makes two cards and uses two of the 10, so the most spent on paintings in a day stays at 10. The alternative, one catch for the whole photo, would feel more generous but could triple the daily painting cost. Needs Chris's sign-off |
| Is three animals per photo the right limit? | Keeps the wait and the cost of one photo in check (each animal is one more painting). A flock of birds gives the three most prominent |
| Should players be able to nickname a card? | Would make pet cards personal (your dog's real name instead of the AI's). Needs one database column and a thought about moderation. Suggested, not built |
| What does comparing show: totals, winner per trait, or no verdict? | Parked to Phase 2 |
| What exact wording does the "keep your distance" message use? | Safety for snakes, stinging insects, and wildlife |
| What happens to someone holding their dog? | Illustration leaves the person off. Needs testing in Step Zero. |
| How are screen photos and toy-versus-statue handled? | The vision step now flags a photo of a screen or a print and rejects it kindly. Not bulletproof (a clever photo can still pass), and untested on real photos |
| What counts as wild? | Any species whose conservation status is not Domestic, and not a statue. A feral cat or a zoo animal still counts as wild. Needs Chris's sign-off |
| Are the new numbers right? | Wild +75 XP, rings 250 / 300 / rotating up to 600, stamp 500, challenge 1,000, album 1,000. Crews: 30 people, 5 per person. Three reports hide a name. Tune after real play |
| Past XP totals change with the new rings | Daily tasks changed, and XP is worked out from cards, so earlier totals shift a little. Fine while there are only testers |
| Should there be push reminders (streak at risk)? | Deferred. Needs a push service and a permission ask. The home screen shows the streak warning instead |

---

## Build Rules

- No HTML in any output
- No emojis in any output
- SVG icons only when genuinely needed
