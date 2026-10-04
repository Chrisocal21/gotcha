import { createPortal } from "react-dom";
import { useEscape } from "../lib/hooks";
import Logo from "./Logo";
import { Button } from "./ui";

const STEPS = [
  { title: "Spot an animal", body: "Pets, birds, bugs, wildlife, even statues of animals all count." },
  { title: "Catch it", body: "Point the camera and press the button. You get 10 catches a day." },
  { title: "Collect the card", body: "Every catch becomes a painted card with a random rarity, from Common to Legendary." },
];

// First-run introduction. Also reachable again from Settings.
export default function Welcome({ onClose }: { onClose: () => void }) {
  useEscape(onClose);
  return createPortal(
    <div
      className="fade-in fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-[rgb(12_20_17_/_0.6)] p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Gotcha"
    >
      <div className="rise-in w-full max-w-[440px] rounded-[28px] bg-paper p-6 shadow-lift sm:p-8">
        <Logo className="text-[34px]" />
        <h2 className="mt-5 font-display text-[26px] leading-tight font-extrabold tracking-tight">
          Turn the animals around you into cards
        </h2>
        <ol className="mt-6 space-y-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-canopy-soft font-display font-bold text-canopy">
                {i + 1}
              </span>
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
            <b className="text-ink">Your photo is never stored.</b> It's read once to make the card, then thrown away. People never
            appear on cards.
          </p>
        </div>
        <Button variant="sun" className="mt-6 w-full" onClick={onClose}>
          Start catching
        </Button>
      </div>
    </div>,
    document.body,
  );
}
