import { useState } from "react";
import type { Collection, Status } from "../lib/api";
import { captureShot, testFrame, type Shot } from "../lib/capture";
import { countdown, plural } from "../lib/format";
import { useNow } from "../lib/hooks";
import { askMotionPermission } from "../lib/motion";
import { XP, type Progress } from "../lib/progress";
import { haptic, sfx } from "../lib/sfx";
import DevUpload from "../components/DevUpload";
import { CardFront } from "../components/GameCard";
import { LevelBadge, SectionTitle, TaskRow } from "../components/game";
import { IconSettings, IconStreak } from "../components/glyphs";
import Logo from "../components/Logo";
import { Meter, Panel } from "../components/ui";
import { useCamera, Viewfinder } from "../components/Viewfinder";

function hintFor(status: Status | null, progress: Progress | null, now: number): string {
  if (!status) return "";
  if (status.left === 0) return `That's all ${status.cap} for today. New catches in ${countdown(status.resetsAt, now)}.`;
  if (status.totalCards === 0) return "Point at any real animal, or a statue of one.";
  if (!status.caughtToday && status.streak > 0) return `Catch one today to make it ${status.streak + 1} days in a row.`;
  const task = progress?.today.tasks.find((t) => !t.done && t.def.id !== "first");
  if (task) return `Field task: ${task.def.title.charAt(0).toLowerCase()}${task.def.title.slice(1)}, +${task.def.xp} XP`;
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

  return (
    <div className="camera-page">
      <section className="camera-stage">
        <Viewfinder camera={camera} flash={flash} onTestFrame={status && !capped && !busy ? () => shoot(testFrame) : undefined}>
          {/* Phones: the camera fills the screen, so it carries its own top bar. */}
          <div className="camera-hud lg:hidden">
            <a href="#/" aria-label="Gotcha home" className="mr-auto text-white">
              <Logo className="text-[25px]" />
            </a>
            {status && (
              <span className="hud-pill hud-pill--glass !h-9">
                <span className="text-[13.5px] font-bold tabular">
                  {status.left}
                  <span className="font-medium text-white/70"> left</span>
                </span>
              </span>
            )}
            <a href="#/settings" aria-label="Settings" className="glass-btn">
              <IconSettings size={19} />
            </a>
          </div>

          <div className="camera-controls">
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
function TodayPanel({ status, progress, now }: { status: Status | null; progress: Progress | null; now: number }) {
  if (!status) return <div className="skeleton h-[380px] shrink-0 rounded-(--r-panel)" />;
  const done = progress?.today.tasks.filter((t) => t.done).length ?? 0;
  return (
    <Panel className="shrink-0 px-5 pt-5 pb-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[20px] leading-tight font-bold tracking-tight">Today</h2>
        {status.streak > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-ember-soft px-2.5 py-1 text-[12.5px] font-bold text-ember-ink" title="Days in a row">
            <IconStreak size={14} strokeWidth={2.6} />
            {plural(status.streak, "day")}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-[42px] leading-none font-extrabold tracking-tight tabular">{status.left}</span>
        <span className="font-medium text-ink-2">of {status.cap} catches left</span>
      </div>
      <Meter left={status.left} cap={status.cap} className="mt-3.5" />
      <div className="mt-2 text-[12.5px] text-ink-3 tabular">
        {status.left === 0 ? "New catches in " : "Resets in "}
        {countdown(status.resetsAt, now)}
        {!status.caughtToday && status.streak > 0 ? ` · catch one to keep your streak` : ""}
      </div>
      {progress && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[14.5px] font-bold">Field tasks</span>
            <span className="text-[12.5px] text-ink-3">
              {progress.today.stamp ? "Stamped" : `${done} of 3 · +${XP.stamp} XP for all`}
            </span>
          </div>
          <ul className="mt-1">
            {progress.today.tasks.map((t) => (
              <TaskRow key={t.def.id} t={t} />
            ))}
          </ul>
        </div>
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
