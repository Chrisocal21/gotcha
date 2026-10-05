import { useState, type ReactNode } from "react";
import { clearSamples, needsPaint, paintSample, resetCap, type Collection, type Status } from "../lib/api";
import { plural } from "../lib/format";
import {
  canTiltWithPhone,
  canVibrate,
  getAutoSave,
  getExplorerName,
  getGyro,
  getHaptics,
  getReduceMotion,
  getTheme,
  setAutoSave,
  setGyro,
  setHaptics,
  setReduceMotion,
  setTheme,
  type Theme,
} from "../lib/prefs";
import { isSoundOn, setSoundOn } from "../lib/sfx";
import { MEDALS, XP, type Progress } from "../lib/progress";
import { BOOST, ODDS, TIERS, tierClass } from "../lib/tiers";
import { LevelBadge, xpText } from "../components/game";
import {
  IconCustomize,
  IconDeveloper,
  IconHowTo,
  IconMotion,
  IconNext,
  IconPhoto,
  IconPrivacy,
  IconRarity,
  IconReplay,
  IconReport,
  IconSound,
  IconTheme,
  IconTilt,
  IconTrophy,
  IconVibrate,
} from "../components/glyphs";
import { UserButton, useUser } from "@clerk/clerk-react";
import { CLERK_KEY, DEV_EMAIL } from "../components/AuthGate";
import { Group, Row, SubpageHeader } from "../components/SettingsList";
import { Button, Segmented, Switch } from "../components/ui";

const THEMES: { value: Theme; label: string }[] = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// Tile colors for each row, so the list is easy to scan.
const TONE = {
  theme: "#5b6cf0",
  customize: "#e0447c",
  sound: "#ff8a1f",
  vibrate: "#e5484d",
  tilt: "#12a594",
  motion: "#3e7bfa",
  photo: "#30a46c",
  howto: "#0f6e53",
  rarity: "#8b4de0",
  trophy: "#d99a12",
  replay: "#2f8fe0",
  report: "#f76b15",
  privacy: "#64748b",
  developer: "#475569",
};

export default function SettingsScreen({
  topic,
  status,
  collection,
  progress,
  refreshStatus,
  refreshCollection,
  onShowWelcome,
}: {
  topic?: string;
  status: Status | null;
  collection: Collection | null;
  progress: Progress | null;
  refreshStatus: () => Promise<Status | null>;
  refreshCollection: () => Promise<unknown>;
  onShowWelcome: () => void;
}) {
  if (topic === "how") return <HowToPlay cap={status?.cap ?? 10} />;
  if (topic === "odds") return <RarityAndOdds />;
  if (topic === "levels") return <LevelsAndBadges />;
  if (topic === "privacy") return <PrivacyAndSafety />;
  return (
    <SettingsHome
      status={status}
      collection={collection}
      progress={progress}
      refreshStatus={refreshStatus}
      refreshCollection={refreshCollection}
      onShowWelcome={onShowWelcome}
    />
  );
}

function SettingsHome({
  status,
  collection,
  progress,
  refreshStatus,
  refreshCollection,
  onShowWelcome,
}: {
  status: Status | null;
  collection: Collection | null;
  progress: Progress | null;
  refreshStatus: () => Promise<Status | null>;
  refreshCollection: () => Promise<unknown>;
  onShowWelcome: () => void;
}) {
  const { user } = useUser();
  const isDeveloper = !!user?.emailAddresses.some(
    (e) => e.verification?.status === "verified" && e.emailAddress.toLowerCase() === DEV_EMAIL,
  );
  const [theme, setThemeState] = useState(getTheme);
  const [calm, setCalm] = useState(getReduceMotion);
  const [sound, setSound] = useState(isSoundOn);
  const [haptics, setHapticsState] = useState(getHaptics);
  const [autoSave, setAutoSaveState] = useState(getAutoSave);
  const [gyro, setGyroState] = useState(getGyro);
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
    <div className="page max-w-[680px]">
      <h1 className="font-display text-[30px] leading-none font-extrabold tracking-tight lg:text-[40px]">Settings</h1>

      {progress && (
        <a href="#/explorer" className="settings-profile mt-6">
          <LevelBadge level={progress.level} ratio={progress.ratio} size={54} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[17px] font-bold">{getExplorerName() || "Explorer"}</span>
            <span className="block text-[13.5px] text-ink-3">
              Level {progress.level} · {progress.rank} · {xpText(progress.xp)}
            </span>
          </span>
          <IconNext size={18} className="text-ink-3" />
        </a>
      )}

      {CLERK_KEY && (
        <Group title="Account">
          <Row icon={IconPrivacy} tone={TONE.privacy} title="Signed in" detail="Manage your account or sign out">
            <UserButton />
          </Row>
        </Group>
      )}

      <Group title="Appearance">
        <Row icon={IconTheme} tone={TONE.theme} title="Theme">
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
        <Row icon={IconCustomize} tone={TONE.customize} title="Customize" detail="Colors, card back and fonts" href="#/customize" />
      </Group>

      <Group title="Sound and feel">
        <Row icon={IconSound} tone={TONE.sound} title="Sound effects">
          <Switch
            label="Sound effects"
            checked={sound}
            onChange={(on) => {
              setSound(on);
              setSoundOn(on);
            }}
          />
        </Row>
        {canVibrate() && (
          <Row icon={IconVibrate} tone={TONE.vibrate} title="Vibration">
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
        {canTiltWithPhone() && (
          <Row icon={IconTilt} tone={TONE.tilt} title="Tilt cards with your phone">
            <Switch
              label="Tilt cards with your phone"
              checked={gyro}
              onChange={(on) => {
                setGyroState(on);
                setGyro(on);
              }}
            />
          </Row>
        )}
        <Row icon={IconMotion} tone={TONE.motion} title="Reduce motion">
          <Switch
            label="Reduce motion"
            checked={calm}
            onChange={(on) => {
              setCalm(on);
              setReduceMotion(on);
            }}
          />
        </Row>
      </Group>

      <Group title="Photos" footer="Saves the full-quality photo to this device after each catch. Gotcha never keeps a copy.">
        <Row icon={IconPhoto} tone={TONE.photo} title="Save every original photo">
          <Switch
            label="Save every original photo"
            checked={autoSave}
            onChange={(on) => {
              setAutoSaveState(on);
              setAutoSave(on);
            }}
          />
        </Row>
      </Group>

      <Group title="The game">
        <Row icon={IconHowTo} tone={TONE.howto} title="How to play" href="#/settings/how" />
        <Row icon={IconRarity} tone={TONE.rarity} title="Rarity and odds" href="#/settings/odds" />
        <Row icon={IconTrophy} tone={TONE.trophy} title="Levels and badges" href="#/settings/levels" />
      </Group>

      <Group title="Help">
        <Row icon={IconReplay} tone={TONE.replay} title="Replay the welcome" onClick={onShowWelcome} />
        <Row icon={IconReport} tone={TONE.report} title="Report a problem" detail={copied ? "Details copied. Paste them into your message." : "Copies details to send with your report"} onClick={copyDiagnostics} />
        <Row icon={IconPrivacy} tone={TONE.privacy} title="Privacy and safety" href="#/settings/privacy" />
      </Group>

      {isDeveloper && (
        <DeveloperTools status={status} collection={collection} refreshStatus={refreshStatus} refreshCollection={refreshCollection} />
      )}

      <p className="mt-8 text-center text-[12.5px] leading-relaxed text-ink-3">
        Gotcha {__APP_VERSION__} · Everyone testing shares one account for now.
      </p>
    </div>
  );
}

// ---------- Pages under Settings ----------

function HowToPlay({ cap }: { cap: number }) {
  const steps: [string, string][] = [
    ["Spot an animal", "Pets, birds, bugs, wildlife, even a statue of one. Any real animal counts."],
    ["Say gotcha", "Point the camera and press the catch button. Your photo becomes a painted card."],
    ["See what you got", "Every card gets a random rarity, from Common to Legendary, and real stats for its species."],
    ["Collect and level up", "Earn XP, fill your species journal, finish the daily field tasks and win badges."],
  ];
  const tips: [string, string][] = [
    ["Two animals in one photo?", "You catch them both, one card each. Each one uses a catch."],
    [`${cap} catches a day`, "They reset every day. Photos with no animal in them never use one."],
    ["Keep your distance", "Never approach snakes, stinging insects or wild animals for a photo."],
  ];
  return (
    <div className="page max-w-[680px]">
      <SubpageHeader title="How to play" />
      <Group>
        {steps.map(([title, body], i) => (
          <div key={title} className="flex gap-4 px-4 py-4 [&+&]:border-t [&+&]:border-line">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-canopy-soft font-display font-bold text-canopy">{i + 1}</span>
            <div>
              <div className="text-[15.5px] font-semibold">{title}</div>
              <p className="mt-0.5 text-[14px] leading-relaxed text-ink-2">{body}</p>
            </div>
          </div>
        ))}
      </Group>
      <Group title="Good to know">
        {tips.map(([title, body]) => (
          <div key={title} className="px-4 py-3.5 [&+&]:border-t [&+&]:border-line">
            <div className="text-[15px] font-semibold">{title}</div>
            <p className="mt-0.5 text-[14px] leading-relaxed text-ink-2">{body}</p>
          </div>
        ))}
      </Group>
    </div>
  );
}

function RarityAndOdds() {
  return (
    <div className="page max-w-[680px]">
      <SubpageHeader title="Rarity and odds" />
      <p className="text-[15px] leading-relaxed text-ink-2">
        Rarity is pure luck, rolled once when a card is made. It never changes, and any animal can be a Legendary. Rarer cards get a bigger
        boost to their stats.
      </p>
      <Group>
        {TIERS.map((t) => (
          <div key={t} className={`flex items-center gap-3 px-4 py-3.5 [&+&]:border-t [&+&]:border-line ${tierClass(t)}`}>
            <span className="tier-dot" />
            <span className="flex-1 text-[15.5px] font-semibold">{t}</span>
            <span className="w-28 text-right text-[13.5px] text-ink-3 tabular">{BOOST[t] === 0 ? "No boost" : `+${Math.round(BOOST[t] * 100)}% stats`}</span>
            <span className="tier-ink w-12 text-right font-display text-[17px] font-bold tabular">{ODDS[t]}%</span>
          </div>
        ))}
      </Group>
    </div>
  );
}

function LevelsAndBadges() {
  const rules: [string, string][] = [
    ["Any catch", `+${XP.catch}`],
    ["Rarity bonus", `+${XP.rarity.Uncommon} to +${XP.rarity.Legendary}`],
    ["A species you've never caught", `+${XP.newSpecies}`],
    ["Animals caught together, each extra one", `+${XP.together}`],
    ["Each field task", "+200 to +500"],
    ["All three tasks in a day", `+${XP.stamp}`],
  ];
  return (
    <div className="page max-w-[680px]">
      <SubpageHeader title="Levels and badges" />
      <p className="text-[15px] leading-relaxed text-ink-2">
        Every catch earns XP, and XP raises your explorer level, up to level 50. It's worked out on this device from the cards you own, so it never
        changes a card, the odds or your daily catches.
      </p>
      <Group title="XP">
        {rules.map(([what, xp]) => (
          <div key={what} className="flex items-center justify-between gap-4 px-4 py-3.5 [&+&]:border-t [&+&]:border-line">
            <span className="text-[15px]">{what}</span>
            <span className="shrink-0 font-display text-[15.5px] font-bold text-xp-ink tabular">{xp}</span>
          </div>
        ))}
      </Group>
      <Group title="Badges" footer="Each badge goes bronze, silver, gold, then platinum. Three new field tasks appear every day, the same for everyone.">
        <div className="px-4 py-3.5 text-[15px] leading-relaxed">
          {MEDALS.length} badges to earn, from Collector and Naturalist to one for each animal class. See your progress on the Explorer page.
        </div>
      </Group>
    </div>
  );
}

function PrivacyAndSafety() {
  const items: [string, string][] = [
    ["Your photos are never stored", "Each photo is read once to make your cards, then thrown away. Only the painted cards and their facts are saved."],
    ["People never appear on cards", "If someone is in your photo, they're left out of the painting."],
    ["Keep your distance", "Never approach snakes, stinging insects or wild animals for a photo."],
  ];
  return (
    <div className="page max-w-[680px]">
      <SubpageHeader title="Privacy and safety" />
      <Group>
        {items.map(([title, body]) => (
          <div key={title} className="px-4 py-4 [&+&]:border-t [&+&]:border-line">
            <div className="text-[15.5px] font-semibold">{title}</div>
            <p className="mt-0.5 text-[14px] leading-relaxed text-ink-2">{body}</p>
          </div>
        ))}
      </Group>
    </div>
  );
}

// ---------- Developer tools (development builds only) ----------

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

  const footer: ReactNode = error ? <span className="text-danger">{error}</span> : note ? <span className="text-canopy">{note}</span> : "Only in development builds. Testers never see this.";

  return (
    <Group title="Developer" footer={footer}>
      <Row icon={IconDeveloper} tone={TONE.developer} title={live ? "AI connected" : "Sample mode"} detail={live ? "GPT-4o and gpt-image-1, key in worker/.dev.vars" : "No OpenAI key, catches use sample animals"}>
        <span className={`size-2.5 rounded-full ${live ? "bg-uncommon" : "bg-ember"}`} />
      </Row>
      <Row icon={IconDeveloper} tone={TONE.developer} title="Reset today's catches" detail={status ? `${status.used} of ${status.cap} used today` : undefined}>
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
      <Row icon={IconDeveloper} tone={TONE.developer} title="Remove sample cards" detail={samples ? plural(samples, "sample card") : "None"}>
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
          icon={IconDeveloper}
          tone={TONE.developer}
          title={progress ? `Painting ${Math.min(progress.done + 1, progress.total)} of ${progress.total}` : `Paint ${plural(todo.length, "sample card")}`}
          detail={live ? `Uses ${plural(todo.length, "image")}` : "Needs an OpenAI key first"}
        >
          <Button variant="sun" size="sm" disabled={!live || !!progress} onClick={paintAll}>
            {progress ? "Painting" : "Paint"}
          </Button>
        </Row>
      )}
    </Group>
  );
}
