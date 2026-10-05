import { createPortal } from "react-dom";
import { useEscape } from "../lib/hooks";
import { SHOWCASE } from "../lib/showcase";
import { CardFan } from "./GameCard";
import Logo from "./Logo";
import { Button } from "./ui";

const STEPS = [
  { title: "Spot an animal", body: "Pets, birds, bugs, wildlife, even a statue of one. You get 10 catches a day." },
  { title: "Say gotcha", body: "Press the catch button. Your photo becomes a painted card with a random rarity." },
  { title: "Collect and level up", body: "Earn XP, fill your species journal, finish field tasks and win badges." },
];

// First-run introduction. Also reachable again from Settings.
export default function Welcome({ onClose }: { onClose: () => void }) {
  useEscape(onClose);
  return createPortal(
    <div className="welcome fade-in fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Welcome to Gotcha">
      <div className="relative mx-auto grid min-h-full max-w-[1120px] content-center items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-14">
        <div className="flex flex-col items-center text-center text-white">
          <CardFan cards={SHOWCASE} width={176} className="welcome__fan" />
          <p className="mt-6 hidden max-w-[400px] text-[14px] text-white/70 lg:block">
            Real sample cards. Rarer cards get foil frames, full-bleed art and bigger stats.
          </p>
        </div>

        <div className="rise-in rounded-[28px] bg-paper p-6 shadow-lift sm:p-8">
          <Logo className="text-[34px]" />
          <h2 className="mt-4 font-display text-[28px] leading-[1.1] font-extrabold tracking-tight sm:text-[32px]">
            Every animal you meet becomes a card
          </h2>
          <ol className="mt-6 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-canopy-soft font-display font-bold text-canopy">{i + 1}</span>
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-[14px] leading-relaxed text-ink-2">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 space-y-2.5 rounded-2xl bg-paper-2 p-4 text-[13.5px] leading-relaxed text-ink-2">
            <p>
              <b className="text-ink">Keep your distance.</b> Never approach snakes, stinging insects or wild animals for a photo.
            </p>
            <p>
              <b className="text-ink">Your photo is never stored.</b> It's read once to make the card, then thrown away. People never appear on cards.
            </p>
          </div>
          <Button variant="sun" className="mt-6 w-full" onClick={onClose}>
            Start catching
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
