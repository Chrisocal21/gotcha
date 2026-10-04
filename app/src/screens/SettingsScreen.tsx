import { useState, type ReactNode } from "react";
import { clearSamples, needsPaint, paintSample, resetCap, type Collection, type Status } from "../lib/api";
import { plural } from "../lib/format";
import {
  canTiltWithPhone,
  canVibrate,
  getAutoSave,
  getGyro,
  getHaptics,
  setAutoSave,
  setGyro,
  getReduceMotion,
  getTheme,
  setHaptics,
  setReduceMotion,
  setTheme,
  type Theme,
} from "../lib/prefs";
import { isSoundOn, setSoundOn } from "../lib/sfx";
import { BOOST, ODDS, TIERS, tierClass } from "../lib/tiers";
import { Button, Label, Panel, Segmented, Switch } from "../components/ui";

const THEMES: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function SettingsScreen({
  status,
  collection,
  refreshStatus,
  refreshCollection,
  onShowWelcome,
}: {
  status: Status | null;
  collection: Collection | null;
  refreshStatus: () => Promise<Status | null>;
  refreshCollection: () => Promise<unknown>;
  onShowWelcome: () => void;
}) {
  const [theme, setThemeState] = useState(getTheme);
  const [calm, setCalm] = useState(getReduceMotion);
  const [sound, setSound] = useState(isSoundOn);
  const [haptics, setHapticsState] = useState(getHaptics);
  const [autoSave, setAutoSaveState] = useState(getAutoSave);
  const [gyro, setGyroState] = useState(getGyro);

  return (
    <div className="page max-w-[760px]">
      <h1 className="font-display text-[28px] leading-none font-extrabold tracking-tight lg:text-[36px]">Settings</h1>

      <Section title="Appearance">
        <Row title="Customize" detail="Colors, background, corners, fonts and your card back">
          <a
            href="#/customize"
            className="inline-flex h-10 items-center rounded-(--r-btn) border border-line-strong bg-paper px-4 text-[14px] font-semibold shadow-soft transition hover:bg-paper-2"
          >
            Open
          </a>
        </Row>
        <Row title="Theme" detail="System follows your device's light or dark setting">
          <Segmented
            size="sm"
            value={theme}
            options={THEMES}
            onChange={(t) => {
              setThemeState(t);
              setTheme(t);
            }}
          />
        </Row>
        <Row title="Reduce motion" detail="Calmer animations, no screen flashes">
          <Switch
            label="Reduce motion"
            checked={calm}
            onChange={(on) => {
              setCalm(on);
              setReduceMotion(on);
            }}
          />
        </Row>
      </Section>

      <Section title="Sound and feel">
        <Row title="Sound effects" detail="Shutter, reveal and rarity sounds">
          <Switch
            label="Sound effects"
            checked={sound}
            onChange={(on) => {
              setSound(on);
              setSoundOn(on);
            }}
          />
        </Row>
        {canTiltWithPhone() && (
          <Row title="Tilt with phone motion" detail="Cards lean as you move your phone, so they feel like they're in your hand">
            <Switch
              label="Tilt with phone motion"
              checked={gyro}
              onChange={(on) => {
                setGyroState(on);
                setGyro(on);
              }}
            />
          </Row>
        )}
        {canVibrate() && (
          <Row title="Vibration" detail="A buzz when you catch and when a card is revealed">
            <Switch
              label="Vibration"
              checked={haptics}
              onChange={(on) => {
                setHapticsState(on);
                setHaptics(on);
              }}
            />
          </Row>
        )}
      </Section>

      <Section title="Your photos">
        <Row title="Save every original photo" detail="Downloads the full-quality photo to this device after each catch. Gotcha never keeps a copy.">
          <Switch
            label="Save every original photo"
            checked={autoSave}
            onChange={(on) => {
              setAutoSaveState(on);
              setAutoSave(on);
            }}
          />
        </Row>
        <p className="py-4 text-[13.5px] leading-relaxed text-ink-3">
          You can also save a single photo with the Save original photo button when a card is revealed. On a phone it opens the share
          sheet, where you can choose Save Image. Photos are only available right after the catch.
        </p>
      </Section>

      <Section title="How Gotcha works">
        <div className="py-4 text-[14.5px] leading-relaxed text-ink-2">
          <p>
            You get <b className="text-ink">{status?.cap ?? 10} catches a day</b>. Photos with no animal in them never use one. Any
            real animal counts, and so do statues of animals.
          </p>
          <p className="mt-3">
            Rarity is pure luck, rolled once when the card is made. It never changes, and any animal can pull a Legendary. Rarer cards
            get a bigger boost to their stats.
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-line">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 bg-paper-2 px-4 py-2 font-mono text-[11px] tracking-[0.12em] text-ink-3 uppercase">
              <span>Rarity</span>
              <span className="text-right">Odds</span>
              <span className="w-24 text-right">Stat boost</span>
            </div>
            {TIERS.map((t) => (
              <div key={t} className={`grid grid-cols-[1fr_auto_auto] gap-x-6 border-t border-line px-4 py-2.5 text-[14px] ${tierClass(t)}`}>
                <span className="flex items-center gap-2.5 font-semibold text-ink">
                  <span className="tier-dot" />
                  {t}
                </span>
                <span className="text-right tabular">{ODDS[t]}%</span>
                <span className="w-24 text-right tabular">{BOOST[t] === 0 ? "None" : `+${Math.round(BOOST[t] * 100)}%`}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Privacy and safety">
        <div className="space-y-3 py-4 text-[14.5px] leading-relaxed text-ink-2">
          <p>
            <b className="text-ink">Your photos are never stored.</b> Each photo is read once to make your card, then thrown away.
            Only the painted card and its facts are saved.
          </p>
          <p>
            <b className="text-ink">People never appear on cards.</b> If someone is in your photo, they are left out of the painting.
          </p>
          <p>
            <b className="text-ink">Keep your distance.</b> Never approach snakes, stinging insects or wild animals for a photo.
          </p>
        </div>
      </Section>

      <Section title="Account">
        <Row title="Test account" detail="Everyone testing shares this account for now. Personal sign-in is coming.">
          <span className="rounded-full bg-paper-3 px-3 py-1 text-[12.5px] font-semibold text-ink-2">Shared</span>
        </Row>
      </Section>

      <AboutSection status={status} onShowWelcome={onShowWelcome} />

      {import.meta.env.DEV && (
        <DeveloperTools status={status} collection={collection} refreshStatus={refreshStatus} refreshCollection={refreshCollection} />
      )}
    </div>
  );
}

function AboutSection({ status, onShowWelcome }: { status: Status | null; onShowWelcome: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copyDiagnostics() {
    const lines = [
      `Gotcha ${__APP_VERSION__} (${import.meta.env.MODE})`,
      `Time: ${new Date().toISOString()}`,
      `Page: ${window.location.hash || "#/"}`,
      `Theme: ${getTheme()}, reduce motion: ${getReduceMotion()}`,
      `Screen: ${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}x`,
      `Catches today: ${status ? `${status.used}/${status.cap}` : "unknown"}`,
      `Browser: ${navigator.userAgent}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this and send it along with your report:", lines.join("\n"));
    }
  }

  return (
    <Section title="About">
      <Row title="Introduction" detail="Replay the welcome guide">
        <Button variant="secondary" size="sm" onClick={onShowWelcome}>
          Show
        </Button>
      </Row>
      <Row title="Report a problem" detail={copied ? "Copied. Paste it into your message." : "Copies your version and device details to send with your report"}>
        <Button variant="secondary" size="sm" onClick={copyDiagnostics}>
          {copied ? "Copied" : "Copy details"}
        </Button>
      </Row>
      <Row title="Version" detail="Gotcha, first test build">
        <span className="font-mono text-[13px] text-ink-2">{__APP_VERSION__}</span>
      </Row>
    </Section>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function DeveloperTools({
  status,
  collection,
  refreshStatus,
  refreshCollection,
}: {
  status: Status | null;
  collection: Collection | null;
  refreshStatus: () => Promise<Status | null>;
  refreshCollection: () => Promise<unknown>;
}) {
  const [note, setNote] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const live = status ? !status.mock : false;
  const samples = (collection?.cards ?? []).filter((c) => c.isSample).length;
  const todo = (collection?.cards ?? []).filter(needsPaint);

  async function paintAll() {
    setError(null);
    setProgress({ done: 0, total: todo.length });
    for (const [i, card] of todo.entries()) {
      // OpenAI limits new accounts to a few images per minute. On a rate limit, wait and retry.
      let painted = false;
      for (let attempt = 0; attempt < 4 && !painted; attempt++) {
        try {
          await paintSample(card.id);
          painted = true;
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Painting stopped.";
          if (!/429|rate limit/i.test(msg) || attempt === 3) {
            setError(msg);
            break;
          }
          setError("OpenAI's image limit was reached. Waiting a few seconds and continuing.");
          await wait(15_000);
          setError(null);
        }
      }
      if (!painted) break;
      setProgress({ done: i + 1, total: todo.length });
    }
    await Promise.all([refreshStatus(), refreshCollection()]);
    setProgress(null);
  }

  return (
    <Section title="Developer tools" hint="Only visible while developing. Not part of a tester build.">
      <Row
        title={live ? "AI connected" : "Sample mode"}
        detail={live ? "Using GPT-4o and gpt-image-1. The key lives in worker/.dev.vars." : "No OpenAI key found in worker/.dev.vars, so catches use sample animals."}
      >
        <span className={`size-3 rounded-full ${live ? "bg-uncommon" : "bg-ember"}`} />
      </Row>
      <Row title="Reset today's catches" detail={status ? `${status.used} of ${status.cap} used today` : "Gives back today's catches"}>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await resetCap();
            await refreshStatus();
            setNote("Today's catches are reset.");
          }}
        >
          Reset
        </Button>
      </Row>
      <Row title="Remove sample cards" detail={samples ? `Deletes ${plural(samples, "sample card")} made without AI` : "There are no sample cards"}>
        <Button
          variant="secondary"
          size="sm"
          disabled={!samples}
          onClick={async () => {
            const n = await clearSamples();
            await Promise.all([refreshStatus(), refreshCollection()]);
            setNote(n ? `Removed ${plural(n, "sample card")}.` : "There were no sample cards.");
          }}
        >
          Remove
        </Button>
      </Row>
      {todo.length > 0 && (
        <Row
          title={progress ? `Painting card ${Math.min(progress.done + 1, progress.total)} of ${progress.total}` : `Paint ${plural(todo.length, "sample card")}`}
          detail={live ? `Replaces placeholder art with real illustrations. Uses ${plural(todo.length, "image")}.` : "Needs an OpenAI key first."}
        >
          <Button variant="sun" size="sm" disabled={!live || !!progress} onClick={paintAll}>
            {progress ? "Painting" : "Paint"}
          </Button>
        </Row>
      )}
      {progress && (
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-paper-3">
          <div className="sun-fill h-full rounded-full transition-all duration-500" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
        </div>
      )}
      {error && <p className="pb-4 text-[14px] font-medium text-danger">{error}</p>}
      {note && <p className="fade-in pb-4 text-[13.5px] font-medium text-canopy">{note}</p>}
    </Section>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Panel className="mt-3 px-6 pt-5 first-of-type:mt-6">
      <Label>{title}</Label>
      {hint && <p className="mt-1.5 text-[12.5px] text-ink-3">{hint}</p>}
      <div className="divide-y divide-line">{children}</div>
    </Panel>
  );
}

function Row({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <div className="text-[15.5px] font-semibold">{title}</div>
        <div className="mt-0.5 text-[13.5px] leading-snug text-ink-3">{detail}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
