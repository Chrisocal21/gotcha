import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { scoreOf, type CatchResult, type Status } from "../lib/api";
import { countdown, pad3, plural } from "../lib/format";
import { prefersReducedMotion, useCountUp } from "../lib/hooks";
import { saveOriginal, shouldAutoSave } from "../lib/savePhoto";
import { haptic, sfx } from "../lib/sfx";
import { CHARGE_MS, REVEAL_HAPTIC, tierClass, tierRank, type Tier } from "../lib/tiers";
import { CardBack, CardFront } from "../components/GameCard";
import { Button, Chip } from "../components/ui";

type Phase = "developing" | "enter" | "charging" | "flip" | "revealed" | "rejected" | "capped" | "error";

const STEPS = [
  "Looking closely",
  "Identifying your catch",
  "Reading its strengths",
  "Rolling for rarity",
  "Painting your card",
  "Adding the finishing touches",
];

// Even a fast response gets a short build-up, so every catch has its moment.
const MIN_DEVELOP_MS = 3800;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function preload(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

export default function CatchFlow({
  photoUrl,
  original,
  request,
  status,
  onAgain,
  onCollection,
  onOpenCard,
}: {
  photoUrl: string;
  original: Blob;
  request: Promise<CatchResult>;
  status: Status | null;
  onAgain: () => void;
  onCollection: () => void;
  onOpenCard: (id: string) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [phase, setPhase] = useState<Phase>("developing");
  const [result, setResult] = useState<CatchResult | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (phase !== "developing") return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2600);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    let alive = true;
    const reduced = prefersReducedMotion();
    const pace = (ms: number) => wait(reduced ? 0 : ms);
    (async () => {
      const [r] = await Promise.all([request, pace(MIN_DEVELOP_MS)]);
      if (!alive) return;
      setResult(r);
      if (r.status !== "caught") {
        if (r.status === "rejected") sfx.reject();
        setPhase(r.status);
        return;
      }
      const tier = r.card.rarity;
      const art = preload(r.card.artUrl);
      setPhase("enter");
      await pace(700);
      if (!alive) return;
      setPhase("charging");
      sfx.charge(tier, CHARGE_MS[tier]);
      haptic(10);
      await Promise.all([pace(CHARGE_MS[tier]), Promise.race([art, wait(6000)])]);
      if (!alive) return;
      setPhase("flip");
      sfx.reveal(tier);
      haptic(REVEAL_HAPTIC[tier]);
      await pace(900);
      if (!alive) return;
      setPhase("revealed");
      if (shouldAutoSave()) saveOriginal(original, r.card.name, "download").then(() => setSaved(true));
    })();
    return () => {
      alive = false;
    };
  }, [request]);

  const caught = result?.status === "caught" ? result : null;
  const flipped = phase === "flip" || phase === "revealed";
  const score = useCountUp(caught ? scoreOf(caught.card.stats) : 0, flipped);
  const left = caught ? caught.cap - caught.used : 0;

  return (
    <div className={`reveal-backdrop fixed inset-0 z-50 overflow-hidden text-white ${caught ? tierClass(caught.card.rarity) : ""}`}>
      {phase === "developing" && <Developing photoUrl={photoUrl} step={step} />}

      {caught && phase !== "developing" && (
        <>
          <img
            src={photoUrl}
            alt=""
            className="fade-in absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-3xl saturate-150"
          />
          <div className="pt-safe pb-safe relative mx-auto flex h-full max-w-[560px] flex-col items-center px-5">
            <div className="flex h-[96px] shrink-0 flex-col items-center justify-end pb-4">
              {flipped ? (
                <div className="tier-banner text-[48px]">{caught.card.rarity}</div>
              ) : (
                <div className="fade-in font-mono text-[12px] uppercase tracking-[0.24em] text-white/70">
                  {phase === "charging" ? "Revealing" : "Caught"}
                </div>
              )}
            </div>

            <div className="flex min-h-0 w-full flex-1 items-center justify-center">
              <div
                className={`stage ${tierClass(caught.card.rarity)} is-${phase}`}
                style={{ width: "min(76vw, 360px, calc((100dvh - 330px) / 1.4))" }}
              >
                <div className="aura" />
                <div className="rays" />
                <div className="card-enter">
                  <div className="shake">
                    <div
                      className={`flip ${flipped ? "" : "is-back"} ${phase === "revealed" ? "is-done cursor-pointer" : ""}`}
                      role={phase === "revealed" ? "button" : undefined}
                      aria-label={phase === "revealed" ? "Open card details" : undefined}
                      tabIndex={phase === "revealed" ? 0 : -1}
                      onClick={() => phase === "revealed" && onOpenCard(caught.card.id)}
                      onKeyDown={(e) => phase === "revealed" && e.key === "Enter" && onOpenCard(caught.card.id)}
                    >
                      <div className="flip__face">
                        <CardFront card={caught.card} score={score} />
                      </div>
                      {phase !== "revealed" && (
                        <div className="flip__face flip__back">
                          <CardBack />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {phase === "flip" && <Particles tier={caught.card.rarity} />}
              </div>
            </div>

            <div className="flex min-h-[156px] w-full shrink-0 flex-col justify-end">
              {phase === "revealed" && (
                <div className="fade-up">
                  <div className="mb-5 flex flex-wrap justify-center gap-2">
                    {caught.newSpecies && <Chip tone="sun">New species</Chip>}
                    <Chip tone="glass">No. {pad3(caught.card.number)} in your collection</Chip>
                    <button
                      onClick={async () => {
                        if ((await saveOriginal(original, caught.card.name)) === "saved") setSaved(true);
                      }}
                      className="inline-flex h-7 items-center rounded-full border border-white/20 px-3 text-[12.5px] font-semibold text-white/85 transition hover:bg-white/10"
                    >
                      {saved ? "Photo saved" : "Save original photo"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="glass" onClick={onCollection}>
                      Collection
                    </Button>
                    <Button variant="sun" onClick={onAgain}>
                      {left > 0 ? "Keep catching" : "Done"}
                    </Button>
                  </div>
                  <p className="mt-3 text-center text-[12.5px] text-white/55">
                    {left > 0 ? `${plural(left, "catch", "catches")} left today` : "That was your last catch today"}
                  </p>
                </div>
              )}
            </div>
          </div>
          {phase === "flip" && tierRank(caught.card.rarity) >= 3 && <div className="tier-flash" />}
        </>
      )}

      {result && result.status === "rejected" && (
        <Outcome
          photoUrl={photoUrl}
          title="No animal found"
          body={result.message}
          note="This one didn't use a catch"
          actions={
            <Button variant="sun" onClick={onAgain}>
              Try again
            </Button>
          }
        />
      )}
      {result && result.status === "capped" && (
        <Outcome
          photoUrl={photoUrl}
          title="That's all for today"
          body={`You've made all ${result.cap} catches today. New catches in ${countdown(result.resetsAt)}.`}
          actions={
            <>
              <Button variant="sun" onClick={onCollection}>
                See your collection
              </Button>
              <Button variant="glass" onClick={onAgain}>
                Back to camera
              </Button>
            </>
          }
        />
      )}
      {result && result.status === "error" && (
        <Outcome
          photoUrl={photoUrl}
          title="Something went wrong"
          body={result.message}
          note={status ? "No catch was used" : undefined}
          actions={
            <Button variant="sun" onClick={onAgain}>
              Try again
            </Button>
          }
        />
      )}
    </div>
  );
}

function Developing({ photoUrl, step }: { photoUrl: string; step: number }) {
  return (
    <div className="pt-safe pb-safe mx-auto flex h-full max-w-[640px] flex-col px-4 lg:py-10">
      <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-[28px] bg-black shadow-lift">
        <img src={photoUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl" />
        <img src={photoUrl} alt="" className="developing-photo absolute inset-0 h-full w-full object-contain" />
        <div className="scan" />
        <div className="reticle is-locking">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="flex h-[150px] shrink-0 flex-col items-center justify-center text-center" aria-live="polite">
        <div key={step} className="fade-up font-display text-[24px] font-bold tracking-tight">
          {STEPS[step]}
        </div>
        <div className="spectrum-bar mt-4 w-40" />
        <div className="mt-3 text-[13px] text-white/55">Usually 10 to 30 seconds</div>
      </div>
    </div>
  );
}

function Particles({ tier }: { tier: Tier }) {
  const count = 8 + tierRank(tier) * 6;
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        "--a": `${(360 / count) * i + Math.random() * 14}deg`,
        "--d": `${130 + Math.random() * 120}px`,
        "--s": `${4 + Math.random() * 6}px`,
        animationDelay: `${Math.random() * 120}ms`,
      })),
    [count],
  );
  return (
    <>
      {parts.map((style, i) => (
        <span key={i} className="particle" style={style as CSSProperties} />
      ))}
    </>
  );
}

function Outcome({
  photoUrl,
  title,
  body,
  note,
  actions,
}: {
  photoUrl: string;
  title: string;
  body: string;
  note?: string;
  actions: ReactNode;
}) {
  return (
    <div className="pt-safe pb-safe mx-auto flex h-full max-w-[480px] flex-col px-5 lg:justify-center lg:py-16">
      <div className="fade-up flex flex-1 flex-col items-center justify-center text-center lg:flex-none">
        <div className="mb-8 aspect-[4/5] w-40 overflow-hidden rounded-[24px] bg-white/5 ring-1 ring-white/10">
          <img src={photoUrl} alt="" className="h-full w-full object-cover opacity-50 grayscale" />
        </div>
        <h2 className="font-display text-[32px] font-extrabold tracking-tight">{title}</h2>
        <p className="mt-3 max-w-[320px] text-[15px] leading-relaxed text-white/70">{body}</p>
        {note && (
          <Chip tone="glass" className="mt-6">
            {note}
          </Chip>
        )}
      </div>
      <div className="grid shrink-0 gap-2 lg:mt-10">{actions}</div>
    </div>
  );
}
