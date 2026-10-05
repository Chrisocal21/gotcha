import { useState } from "react";
import type { Collection, Status } from "../lib/api";
import { captureShot, testFrame, type Shot } from "../lib/capture";
import { countdown, plural } from "../lib/format";
import { useNow } from "../lib/hooks";
import { askMotionPermission } from "../lib/motion";
import { navigate } from "../lib/router";
import { type Progress } from "../lib/progress";
import { haptic, sfx } from "../lib/sfx";
import { MobileTopBar, TabBar } from "../components/AppShell";
import DevUpload from "../components/DevUpload";
import { CardFront } from "../components/GameCard";
import { NextToFind } from "../components/FieldGuide";
import { ChallengeCard, DayRings, LevelBadge, SectionTitle, TaskRow } from "../components/game";
import { IconStreak } from "../components/glyphs";
import { Meter, Panel } from "../components/ui";
import { useCamera, Viewfinder } from "../components/Viewfinder";
import { showGuideNext } from "./CollectionScreen";

// One line under the shutter: the most useful thing to do right now, with the outdoors first.
function hintFor(status: Status | null, progress: Progress | null, now: number): string {
  if (!status) return "";
  if (status.left === 0) return `That's all ${status.cap} for today. New catches in ${countdown(status.resetsAt, now)}.`;
  if (status.totalCards === 0) return "Point at any real animal. A wild one counts extra.";
  const hoursLeft = (Date.parse(status.resetsAt) - now) / 3_600_000;
  if (!status.caughtToday && status.streak > 0 && hoursLeft < 6) return `Your ${status.streak}-day streak ends in ${Math.max(1, Math.ceil(hoursLeft))}h. Catch one!`;
  if (!status.caughtToday && status.streak > 0) return `Catch one today to make it ${status.streak + 1} days in a row.`;
  const wild = progress?.today.tasks.find((t) => t.def.id === "wild" && !t.done);
  if (wild) return `Find a wild animal for your green ring, +${wild.def.xp} XP`;
  const task = progress?.today.tasks.find((t) => !t.done);
  if (task) return `${task.def.title}, +${task.def.xp} XP`;
  return "Two animals in one shot? You'll catch them both.";
}

export default function CameraScreen({
  status,
  collection,
  progress,
  onCapture,
  onOpenCard,
}: {
  status: Status | null;
  collection: Collection | null;
  progress: Progress | null;
  onCapture: (shot: Shot) => void;
  onOpenCard: (id: string) => void;
}) {
  const camera = useCamera();
  const [flash, setFlash] = useState(0); // counts shots, so the flash replays every time
  const [busy, setBusy] = useState(false);
  const now = useNow();

  const capped = status != null && status.left === 0;
  const canCatch = camera.state === "ready" && status != null && !capped && !busy;
  const latest = collection?.cards[0];

  async function shoot(getShot: () => Promise<Shot>) {
    setBusy(true);
    sfx.shutter();
    haptic(12);
    setFlash((n) => n + 1);
    try {
      const shot = await getShot();
      setTimeout(() => {
        onCapture(shot);
        // The catch screen now covers the camera. Ready the shutter for when it closes.
        setBusy(false);
      }, 180);
    } catch {
      setBusy(false);
    }
  }

  function catchNow() {
    askMotionPermission();
    const video = camera.videoRef.current;
    if (video) shoot(() => captureShot(video));
  }

  return (
    <div className="camera-page">
      <section className="camera-stage">
        <Viewfinder camera={camera} flash={flash} onTestFrame={status && !capped && !busy ? () => shoot(testFrame) : undefined}>
          {/* Phones: the same floating header and tab bar as every other page. The orb is the shutter. */}
          <div className="lg:hidden">
            <MobileTopBar progress={progress} hidden={false} />
            <TabBar screen="camera" hidden={false} onCatch={catchNow} catchDisabled={!canCatch} />
          </div>

          <div className="camera-controls">
            {status && (
              <span className="hud-pill hud-pill--glass mx-auto !h-8 lg:hidden">
                <span className="text-[13px] font-bold tabular">
                  {status.left}
                  <span className="font-medium text-white/70"> left</span>
                </span>
              </span>
            )}
            <p className="min-h-5 text-center text-[13.5px] font-semibold text-white/90 [text-shadow:0_1px_8px_rgb(0_0_0/0.5)]">
              {camera.state === "ready" ? hintFor(status, progress, now) : ""}
            </p>
            <div className="camera-controls__row">
              <a href="#/collection" className="roll-btn lg:invisible" aria-label="Collection">
                {latest ? <img src={latest.artUrl} alt="" draggable={false} /> : <span className="roll-btn__empty" />}
              </a>
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
              <a href="#/explorer" className="justify-self-end rounded-full lg:invisible" aria-label="Explorer">
                {progress ? <LevelBadge level={progress.level} ratio={progress.ratio} size={52} /> : <span className="block size-[52px]" />}
              </a>
            </div>
          </div>
        </Viewfinder>
        <DevUpload disabled={!status || capped || busy} onPhoto={(shot) => shoot(async () => shot)} />
      </section>

      <aside className="camera-rail">
        <TodayPanel status={status} progress={progress} now={now} />
        {collection && collection.cards.length > 0 ? (
          <LatestPanel collection={collection} onOpenCard={onOpenCard} />
        ) : (
          collection && <HowItWorks />
        )}
      </aside>
    </div>
  );
}

// Everything about today in one place: catches left, the streak, and the three field tasks.
// Everything about today in one place: the three rings, catches left, the streak, this week's challenge
// and a specific animal to go and find.
function TodayPanel({ status, progress, now }: { status: Status | null; progress: Progress | null; now: number }) {
  if (!status) return <div className="skeleton h-[420px] shrink-0 rounded-(--r-panel)" />;
  return (
    <Panel className="shrink-0 p-5">
      <div className="flex items-center gap-4">
        {progress && <DayRings tasks={progress.today.tasks} size={92} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-[20px] leading-tight font-bold tracking-tight">Today</h2>
            {status.streak > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-ember-soft px-2.5 py-1 text-[12.5px] font-bold text-ember-ink" title="Days in a row">
                <IconStreak size={14} strokeWidth={2.6} />
                {plural(status.streak, "day")}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-display text-[32px] leading-none font-extrabold tracking-tight tabular">{status.left}</span>
            <span className="text-[13.5px] font-medium text-ink-2">of {status.cap} catches left</span>
          </div>
          <div className="mt-1 text-[12px] text-ink-3 tabular">
            {status.left === 0 ? "New catches in " : "Resets in "}
            {countdown(status.resetsAt, now)}
          </div>
        </div>
      </div>
      <Meter left={status.left} cap={status.cap} className="mt-3.5" />
      {progress && (
        <>
          <ul className="mt-3 border-t border-line pt-1">
            {progress.today.tasks.map((t, i) => (
              <TaskRow key={t.def.id} t={t} ring={i} />
            ))}
          </ul>
          <div className="mt-2 space-y-2.5">
            <ChallengeCard c={progress.challenge} now={now} />
            <NextToFind
              progress={progress}
              onOpen={() => {
                showGuideNext();
                navigate("/collection");
              }}
            />
          </div>
        </>
      )}
    </Panel>
  );
}

// A binder page of your six latest cards. Empty pockets wait for the next ones.
function LatestPanel({ collection, onOpenCard }: { collection: Collection; onOpenCard: (id: string) => void }) {
  const latest = collection.cards.slice(0, 6);
  return (
    <Panel className="flex-[1_0_auto] p-5">
      <SectionTitle
        title="Latest catches"
        action={
          <a href="#/collection" className="text-[13px] font-semibold text-canopy hover:underline">
            See all {collection.cards.length}
          </a>
        }
      />
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {latest.map((card) => (
          <button
            key={card.id}
            onClick={() => onOpenCard(card.id)}
            aria-label={`${card.name}, ${card.rarity} ${card.species}`}
            className="block rounded-[8px] text-left transition hover:-translate-y-1"
          >
            <CardFront card={card} size="thumb" />
          </button>
        ))}
        {Array.from({ length: 6 - latest.length }, (_, i) => (
          <span key={i} className="pocket" aria-hidden />
        ))}
      </div>
    </Panel>
  );
}

const STEPS = [
  { title: "Spot an animal", body: "Pets, birds, bugs, even statues of animals all count." },
  { title: "Catch it", body: "Press the button. Two animals in the shot? You catch both, one card each." },
  { title: "Reveal your card", body: "Every card gets a random rarity, from Common to Legendary." },
];

function HowItWorks() {
  return (
    <Panel className="shrink-0 p-5">
      <SectionTitle title="How it works" />
      <ol className="mt-4 space-y-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-canopy-soft font-display font-bold text-canopy">{i + 1}</span>
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
