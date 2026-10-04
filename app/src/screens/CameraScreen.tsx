import { useState } from "react";
import type { Collection, Status } from "../lib/api";
import { captureShot, testFrame, type Shot } from "../lib/capture";
import { countdown, plural } from "../lib/format";
import { useNow } from "../lib/hooks";
import { askMotionPermission } from "../lib/motion";
import { haptic, sfx } from "../lib/sfx";
import DevUpload from "../components/DevUpload";
import { CardFront } from "../components/GameCard";
import { Label, Meter, Panel } from "../components/ui";
import { useCamera, Viewfinder } from "../components/Viewfinder";

function hintFor(status: Status | null, now: number): string {
  if (!status) return "";
  if (status.left === 0) return `That's all ${status.cap} for today. New catches in ${countdown(status.resetsAt, now)}.`;
  if (status.totalCards === 0) return "Point at any real animal, or a statue of one.";
  if (!status.caughtToday && status.streak > 0) return `Catch one today to make it ${status.streak + 1} days in a row.`;
  return "Any animal counts. Bugs, birds, even statues.";
}

export default function CameraScreen({
  status,
  collection,
  onCapture,
  onOpenCard,
}: {
  status: Status | null;
  collection: Collection | null;
  onCapture: (shot: Shot) => void;
  onOpenCard: (id: string) => void;
}) {
  const camera = useCamera();
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const now = useNow();

  const capped = status != null && status.left === 0;
  const canCatch = camera.state === "ready" && status != null && !capped && !busy;

  async function shoot(getShot: () => Promise<Shot>) {
    setBusy(true);
    sfx.shutter();
    haptic(12);
    setFlash(true);
    const shot = await getShot();
    setTimeout(() => onCapture(shot), 180);
  }

  return (
    <div className="page lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6">
      <section className="camera-stage relative w-full">
        <Viewfinder camera={camera} flash={flash} onTestFrame={status && !capped && !busy ? () => shoot(testFrame) : undefined}>
          {camera.state === "ready" && (
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black/65 via-black/25 to-transparent px-6 pt-24 pb-6">
              <button
                className="shutter"
                aria-label="Catch"
                disabled={!canCatch}
                onClick={() => {
                  askMotionPermission();
                  const video = camera.videoRef.current;
                  if (video) shoot(() => captureShot(video));
                }}
              >
                <span className="shutter__ring" />
                <span className="shutter__core" />
              </button>
              <p className="min-h-5 text-center text-[13.5px] font-medium text-white/85">{hintFor(status, now)}</p>
            </div>
          )}
        </Viewfinder>
        <DevUpload disabled={!status || capped || busy} onPhoto={(shot) => shoot(async () => shot)} />
      </section>

      <aside className="hidden flex-col gap-4 lg:flex">
        <TodayPanel status={status} now={now} />
        {collection && collection.cards.length > 0 ? (
          <LatestPanel collection={collection} onOpenCard={onOpenCard} />
        ) : (
          <HowItWorks />
        )}
      </aside>
    </div>
  );
}

function TodayPanel({ status, now }: { status: Status | null; now: number }) {
  if (!status) return <div className="skeleton h-[236px] rounded-[24px]" />;
  const streakNote = status.caughtToday
    ? "You caught something today. Nice."
    : status.streak > 0
      ? `Catch one today to make it ${status.streak + 1}.`
      : "Catch one today to start a streak.";
  return (
    <Panel className="p-5">
      <Label>Today</Label>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-[46px] leading-none font-extrabold tracking-tight tabular">{status.left}</span>
        <span className="font-medium text-ink-2">of {status.cap} catches left</span>
      </div>
      <Meter left={status.left} cap={status.cap} className="mt-4" />
      <p className="mt-3 text-[13px] text-ink-3">
        {status.left === 0 ? "New catches in " : "Resets in "}
        {countdown(status.resetsAt, now)}. Rejected photos never use a catch.
      </p>
      <div className="my-5 h-px bg-line" />
      <div className="flex items-center gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ember-soft font-display text-[22px] font-extrabold text-ember-ink tabular">
          {status.streak}
        </div>
        <div>
          <div className="font-semibold">{status.streak === 1 ? "1 day streak" : `${status.streak} day streak`}</div>
          <div className="text-[13px] text-ink-3">{streakNote}</div>
        </div>
      </div>
    </Panel>
  );
}

function LatestPanel({ collection, onOpenCard }: { collection: Collection; onOpenCard: (id: string) => void }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <Label>Latest catches</Label>
        <a href="#/collection" className="text-[13.5px] font-semibold text-canopy hover:underline">
          See all {plural(collection.cards.length, "card")}
        </a>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {collection.cards.slice(0, 3).map((card) => (
          <button
            key={card.id}
            onClick={() => onOpenCard(card.id)}
            aria-label={`${card.name}, ${card.rarity} ${card.species}`}
            className="block rounded-[10px] text-left transition hover:-translate-y-0.5"
          >
            <CardFront card={card} size="thumb" />
          </button>
        ))}
      </div>
    </Panel>
  );
}

const STEPS = [
  { title: "Spot an animal", body: "Dogs, birds, bugs, even statues of animals all count." },
  { title: "Catch it", body: "Press the button. Photos with no animal never use a catch." },
  { title: "Reveal your card", body: "Every card gets a random rarity, from Common to Legendary." },
];

function HowItWorks() {
  return (
    <Panel className="p-5">
      <Label>How it works</Label>
      <ol className="mt-4 space-y-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-canopy-soft font-display font-bold text-canopy">
              {i + 1}
            </span>
            <div>
              <div className="font-semibold">{s.title}</div>
              <div className="text-[13.5px] leading-relaxed text-ink-2">{s.body}</div>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
