import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@clerk/clerk-react";
import {
  createCrew,
  getBoard,
  getCrews,
  getPlayer,
  joinBoard,
  joinCrew,
  leaveBoard,
  leaveCrew,
  reportPlayer,
  type Board,
  type BoardEntry,
  type BoardMetric,
  type BoardScope,
  type Crew,
  type NameKind,
  type Player,
} from "../lib/api";
import { useEscape } from "../lib/hooks";
import { CLERK_KEY } from "./AuthGate";
import { CardFront } from "./GameCard";
import { CreatorTag, FounderTag, SectionTitle } from "./game";
import { IconClose, IconTrophy } from "./glyphs";
import { Button, Panel, Segmented } from "./ui";

const fmt = (n: number) => n.toLocaleString("en-US");

// Each board answers a different question, so different players can be the best at something.
const METRICS: { value: BoardMetric; label: string; help: string }[] = [
  { value: "score", label: "Score", help: "Cards, rarity and new species. The all-rounder." },
  { value: "streak", label: "Streak", help: "Days in a row with a catch." },
  { value: "species", label: "Species", help: "Different species found." },
  { value: "wild", label: "Wild", help: "Different wild species found. Pets, farm animals and statues don't count, so this one needs you outside." },
  { value: "rare", label: "Rare finds", help: "Rare, Epic and Legendary cards." },
  { value: "challenge", label: "Challenge", help: "This week's challenge, the same goal for everyone." },
];

const valueText = (m: BoardMetric, v: number, goal: number) =>
  m === "streak" ? `${fmt(v)} ${v === 1 ? "day" : "days"}` : m === "challenge" ? `${Math.min(v, goal)}/${goal}` : fmt(v);

export default function Leaderboard({ onCrewChange }: { onCrewChange?: () => void } = {}) {
  const [scope, setScope] = useState<BoardScope>("week");
  const [metric, setMetric] = useState<BoardMetric>("score");
  const [crewId, setCrewId] = useState<string | null>(null);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [sheet, setSheet] = useState<string | null>(null);

  const load = () =>
    getBoard(scope, metric, crewId)
      .then((b) => {
        setBoard(b);
        setFailed(false);
      })
      .catch(() => setFailed(true));

  useEffect(() => {
    let live = true;
    getBoard(scope, metric, crewId)
      .then((b) => live && (setBoard(b), setFailed(false)))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [scope, metric, crewId]);

  useEffect(() => {
    getCrews().then(setCrews).catch(() => {});
  }, []);

  const reloadCrews = () => getCrews().then(setCrews).catch(() => {});

  if (failed && !board) {
    return (
      <Panel className="fade-in mt-5 p-5 sm:p-6">
        <SectionTitle title="Compete" />
        <p className="mt-3 text-[14.5px] text-ink-2">The boards aren't reachable right now. Sign in and try again in a moment.</p>
      </Panel>
    );
  }
  if (!board) return <div className="skeleton fade-in mt-5 h-[420px] rounded-(--r-panel)" />;

  if (!board.me || editing) {
    return (
      <NamePicker
        current={board.me}
        onDone={() => {
          setEditing(false);
          load();
        }}
        onCancel={board.me ? () => setEditing(false) : undefined}
      />
    );
  }

  const me = board.me;
  const info = METRICS.find((m) => m.value === metric)!;
  const crew = crews.find((c) => c.id === crewId) ?? null;
  const goal = board.challenge.goal;
  const onList = board.entries.some((e) => e.you);
  const timeOptions: { value: BoardScope; label: string }[] =
    metric === "streak"
      ? [
          { value: "week", label: "Current" },
          { value: "all", label: "Best ever" },
        ]
      : [
          { value: "week", label: "This week" },
          { value: "all", label: "All time" },
        ];

  return (
    <div className="fade-in mt-5 space-y-5">
      <Panel className="p-5 sm:p-6">
        <SectionTitle
          title={crew ? crew.name : "Leaderboards"}
          sub={board.total ? `${fmt(board.total)} explorer${board.total === 1 ? "" : "s"} ranked` : crew ? "Nobody has scored yet" : "Be the first on the board"}
          action={metric === "challenge" ? undefined : <Segmented size="sm" value={scope} onChange={setScope} options={timeOptions} />}
        />

        {/* Who you're comparing with: everyone, or one of your crews. */}
        <Chips>
          <Chip active={!crewId} onClick={() => setCrewId(null)}>
            Everyone
          </Chip>
          {crews.map((c) => (
            <Chip key={c.id} active={crewId === c.id} onClick={() => setCrewId(c.id)}>
              {c.name}
            </Chip>
          ))}
          <Chip active={adding} onClick={() => setAdding((v) => !v)} dashed>
            + Crew
          </Chip>
        </Chips>
        {adding && (
          <CrewForm
            onDone={(c) => {
              setAdding(false);
              reloadCrews();
              setCrewId(c.id);
              onCrewChange?.();
            }}
          />
        )}

        {/* What the board measures. */}
        <Chips className="!mt-3">
          {METRICS.map((m) => (
            <Chip key={m.value} active={metric === m.value} onClick={() => setMetric(m.value)}>
              {m.label}
            </Chip>
          ))}
        </Chips>
        <p className="mt-2.5 text-[13px] leading-snug text-ink-3">
          {metric === "challenge" ? (
            <>
              <b className="text-ink-2">{board.challenge.title}:</b> {board.challenge.blurb}.
            </>
          ) : (
            info.help
          )}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper-2 p-4">
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-ink-3">You appear as</div>
            <div className="flex items-center gap-2 font-display text-[19px] font-bold">
              <span className="truncate">{me.name}</span>
              {me.creator && <CreatorTag compact />}
              {me.founder && <FounderTag compact />}
            </div>
          </div>
          <div className="flex items-center gap-5 text-right">
            <Stat label="Rank" value={me.rank ? `#${fmt(me.rank)}` : "None yet"} />
            <Stat label={info.label} value={valueText(metric, me.value, goal)} />
          </div>
        </div>

        {board.entries.length === 0 ? (
          <p className="mt-5 text-[14.5px] text-ink-2">Nobody is on this board yet. Go catch something.</p>
        ) : (
          <ol className="mt-4 divide-y divide-line">
            {board.entries.map((e) => (
              <Row key={`${e.rank}-${e.name}`} e={e} metric={metric} goal={goal} onOpen={() => setSheet(e.name)} />
            ))}
            {!onList && me.rank && (
              <Row
                e={{ ...me, rank: me.rank, you: true }}
                metric={metric}
                goal={goal}
                onOpen={() => setSheet(me.name)}
                gap
              />
            )}
          </ol>
        )}
        <p className="mt-4 text-[12.5px] leading-snug text-ink-3">
          Boards are worked out from caught cards on the server. Only your chosen name is shown, never your email or photos. Tap a name to see their page.
        </p>
      </Panel>

      {crew && (
        <CrewPanel
          crew={crew}
          onLeft={() => {
            setCrewId(null);
            reloadCrews();
            onCrewChange?.();
          }}
        />
      )}

      <Panel className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div>
          <div className="text-[15px] font-bold">Your leaderboard name</div>
          <div className="text-[13px] text-ink-3">Change it, or leave the boards at any time.</div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Change name
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await leaveBoard().catch(() => {});
              load();
            }}
          >
            Leave boards
          </Button>
        </div>
      </Panel>

      {sheet && <PlayerSheet name={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}

function Chips({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`no-scrollbar -mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-0.5 ${className}`}>{children}</div>;
}

function Chip({ active, onClick, dashed = false, children }: { active: boolean; onClick: () => void; dashed?: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`h-9 shrink-0 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition ${
        active ? "bg-ink text-sand shadow-soft" : `border bg-paper text-ink-2 shadow-soft hover:text-ink ${dashed ? "border-dashed border-line-strong" : "border-line"}`
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[12px] font-semibold text-ink-3">{label}</div>
      <div className="font-display text-[20px] leading-tight font-extrabold tabular">{value}</div>
    </div>
  );
}

function detail(e: BoardEntry, metric: BoardMetric) {
  const cards = `${fmt(e.cards)} ${e.cards === 1 ? "card" : "cards"}`;
  if (metric === "wild") return `${cards} · ${fmt(e.species)} species`;
  if (metric === "streak") return `Best ${fmt(e.bestStreak)} ${e.bestStreak === 1 ? "day" : "days"} · ${cards}`;
  if (metric === "rare") return `${cards} · ${fmt(e.wild)} wild species`;
  return `${cards} · ${fmt(e.species)} species`;
}

function Row({ e, metric, goal, onOpen, gap = false }: { e: BoardEntry; metric: BoardMetric; goal: number; onOpen: () => void; gap?: boolean }) {
  return (
    <li className={gap ? "mt-2" : ""}>
      <button onClick={onOpen} className={`flex w-full items-center gap-3 py-3 text-left ${e.you ? "-mx-2 rounded-xl bg-xp-soft px-2" : ""}`}>
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-extrabold tabular ${
            e.rank === 1 ? "sun-fill text-[#2b1700]" : e.rank <= 3 ? "bg-paper-3 text-ink" : "text-ink-3"
          }`}
        >
          {e.rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[15px] font-bold">
            <span className="truncate">{e.name}</span>
            {e.creator && <CreatorTag compact />}
            {e.founder && <FounderTag compact />}
            {e.you && <span className="text-[12px] font-semibold text-xp-ink">You</span>}
          </div>
          <div className="text-[12.5px] text-ink-3 tabular">{detail(e, metric)}</div>
        </div>
        <div className="text-right font-display text-[17px] font-extrabold tabular">{valueText(metric, e.value, goal)}</div>
      </button>
    </li>
  );
}

// Make a new crew, or join one with a code from a friend.
function CrewForm({ onDone }: { onDone: (c: Crew) => void }) {
  const [mode, setMode] = useState<"join" | "make">("join");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      onDone(mode === "join" ? await joinCrew(text) : await createCrew(text));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-in mt-3 rounded-2xl bg-paper-2 p-4">
      <Segmented
        size="sm"
        value={mode}
        onChange={(m) => {
          setMode(m);
          setText("");
          setError(null);
        }}
        options={[
          { value: "join", label: "Join with a code" },
          { value: "make", label: "Make a crew" },
        ]}
      />
      <p className="mt-3 text-[13px] leading-snug text-ink-3">
        {mode === "join" ? "A crew is a small private board for family or friends. Ask them for their 6-character code." : "Name your crew, then share its code with the people you want in it. Up to 30 people."}
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(mode === "join" ? e.target.value.toUpperCase() : e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && text.trim() && go()}
          maxLength={mode === "join" ? 7 : 20}
          placeholder={mode === "join" ? "ABC123" : "The Backyard Crew"}
          aria-label={mode === "join" ? "Crew code" : "Crew name"}
          autoCapitalize={mode === "join" ? "characters" : "words"}
          spellCheck={false}
          className="h-11 min-w-0 flex-1 rounded-xl border border-line-strong bg-paper px-3.5 text-[15px] outline-none focus:border-canopy"
        />
        <Button size="sm" className="h-11" disabled={busy || !text.trim()} onClick={go}>
          {mode === "join" ? "Join" : "Create"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function CrewPanel({ crew, onLeft }: { crew: Crew; onLeft: () => void }) {
  const [note, setNote] = useState<string | null>(null);
  async function share() {
    const text = `Join my Gotcha crew "${crew.name}" with the code ${crew.code}.`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setNote("Copied. Paste it into a message.");
      }
    } catch {
      // The share sheet was closed.
    }
  }
  return (
    <Panel className="p-5 sm:p-6">
      <SectionTitle title="Invite people" sub={`${crew.members} in this crew. Anyone with the code can join.`} />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={async () => {
            await navigator.clipboard?.writeText(crew.code).catch(() => {});
            setNote("Code copied.");
          }}
          title="Copy the code"
          className="rounded-2xl border border-dashed border-line-strong bg-paper-2 px-5 py-3 font-display text-[28px] font-extrabold tracking-[0.18em] tabular"
        >
          {crew.code}
        </button>
        <Button size="sm" onClick={share}>
          Share the code
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            if (!window.confirm(`Leave ${crew.name}?`)) return;
            await leaveCrew(crew.id).catch(() => {});
            onLeft();
          }}
        >
          Leave crew
        </Button>
      </div>
      {note && <p className="fade-in mt-3 text-[13px] font-medium text-canopy">{note}</p>}
    </Panel>
  );
}

// Someone's public page: what they chose to put on the board, and the cards they chose to show.
function PlayerSheet({ name, onClose }: { name: string; onClose: () => void }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [failed, setFailed] = useState(false);
  useEscape(onClose);
  useEffect(() => {
    let live = true;
    getPlayer(name)
      .then((p) => live && setPlayer(p))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [name]);

  const s = player?.stats;
  const tiles: [string, string][] = s
    ? [
        ["Cards", fmt(s.cards)],
        ["Species", fmt(s.species)],
        ["Wild species", fmt(s.wild)],
        ["Rare finds", fmt(s.rare)],
        ["Streak", `${fmt(s.currentStreak)}d`],
        ["Best streak", `${fmt(s.bestStreak)}d`],
      ]
    : [];

  return createPortal(
    <div className="fade-in fixed inset-0 z-[60] grid place-items-end overflow-y-auto bg-[rgb(12_20_17_/_0.6)] backdrop-blur-sm sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label={name} onClick={onClose}>
      <div className="rise-in w-full max-w-[520px] rounded-t-[28px] bg-sand p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-lift sm:rounded-[28px] sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-[28px] leading-tight font-extrabold tracking-tight">{name}</h2>
            {player && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {player.creator && <CreatorTag compact />}
                {player.founder && <FounderTag compact />}
                <span className="text-[12.5px] text-ink-3">Playing since {new Date(player.since).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className="-mt-1 -mr-2 grid size-10 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-paper-3">
            <IconClose size={22} strokeWidth={1.8} />
          </button>
        </div>

        {failed && <p className="mt-6 text-[14.5px] text-ink-2">This explorer's page isn't available.</p>}
        {!player && !failed && <div className="skeleton mt-5 h-[220px] rounded-2xl" />}
        {player && (
          <>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {tiles.map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-paper p-3 text-center shadow-soft">
                  <div className="font-display text-[22px] leading-none font-extrabold tabular">{v}</div>
                  <div className="mt-1.5 text-[11.5px] font-semibold text-ink-3">{k}</div>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <div className="text-[13px] font-semibold text-ink-3">Showcase</div>
              {player.showcase.length === 0 ? (
                <p className="mt-2 text-[14px] text-ink-2">{name} hasn't picked cards to show yet.</p>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2.5">
                  {player.showcase.map((c) => (
                    <CardFront key={c.id} card={c} size="thumb" />
                  ))}
                </div>
              )}
            </div>
            <ReportPlayer name={name} />
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

// A quiet way to flag a name or showcase that shouldn't be here. Three different reports take a name off the boards.
function ReportPlayer({ name }: { name: string }) {
  const [step, setStep] = useState<"idle" | "pick" | "sent" | "failed">("idle");
  async function send(reason: "name" | "card" | "other") {
    try {
      await reportPlayer(name, reason);
      setStep("sent");
    } catch {
      setStep("failed");
    }
  }
  if (step === "sent") return <p className="mt-5 text-center text-[12.5px] text-ink-3">Thanks. We'll take a look.</p>;
  if (step === "failed") return <p className="mt-5 text-center text-[12.5px] text-ink-3">Couldn't send that. Try again later.</p>;
  if (step === "pick")
    return (
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[12.5px]">
        <span className="text-ink-3">What's wrong?</span>
        {(["name", "card", "other"] as const).map((r) => (
          <button key={r} onClick={() => send(r)} className="rounded-full bg-paper px-3 py-1.5 font-semibold shadow-soft hover:bg-paper-3">
            {r === "name" ? "The name" : r === "card" ? "A card" : "Something else"}
          </button>
        ))}
      </div>
    );
  return (
    <div className="mt-5 text-center">
      <button onClick={() => setStep("pick")} className="text-[12.5px] font-medium text-ink-3 hover:underline">
        Report this explorer
      </button>
    </div>
  );
}

// First-visit choice. Nothing is public until the explorer picks one of the two options.
function NamePicker({
  current,
  onDone,
  onCancel,
}: {
  current: Board["me"];
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [kind, setKind] = useState<NameKind>(current?.kind ?? "screen");
  const [screen, setScreen] = useState(current?.kind === "screen" ? current.name : "");
  const [real, setReal] = useState(current?.kind === "real" ? current.name : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const name = (kind === "screen" ? screen : real).trim();

  return (
    <Panel className="fade-in mt-5 p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-xp-soft text-xp-ink">
          <IconTrophy size={22} />
        </span>
        <SectionTitle title="Join the leaderboard" sub="Pick how other explorers will see you" />
      </div>
      <p className="mt-4 max-w-[560px] text-[14.5px] leading-relaxed text-ink-2">
        For everyone's safety you only appear under a name you choose here. Your email, photos and location are never shown, and you can leave any time.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Choice active={kind === "screen"} onClick={() => setKind("screen")} title="Make a screen name" sub="A nickname that isn't your real name. Recommended." />
        <Choice active={kind === "real"} onClick={() => setKind("real")} title="Use my name" sub="First name and last initial, like Sam R." />
      </div>

      <div className="mt-5 max-w-[420px]">
        {kind === "screen" ? (
          <label className="block">
            <span className="text-[13px] font-semibold text-ink-2">Screen name</span>
            <input
              value={screen}
              onChange={(e) => setScreen(e.target.value)}
              maxLength={20}
              placeholder="TrailOwl"
              className="mt-1.5 h-12 w-full rounded-xl border border-line-strong bg-paper px-4 text-[16px] outline-none focus:border-canopy"
            />
            <span className="mt-1.5 block text-[12.5px] text-ink-3">3 to 20 characters. Letters, numbers, spaces, and . _ ' - only.</span>
          </label>
        ) : CLERK_KEY ? (
          <RealName value={real} onChange={setReal} />
        ) : (
          <p className="text-[13.5px] text-ink-3">Sign in to use your name.</p>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-[13.5px] font-semibold text-[#c0392b]">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          disabled={busy || name.length < 3}
          onClick={async () => {
            setBusy(true);
            const err = await joinBoard(kind, name);
            setBusy(false);
            if (err) setError(err);
            else onDone();
          }}
        >
          {kind === "real" ? "Approve and join" : "Join the leaderboard"}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </Panel>
  );
}

function Choice({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border p-4 text-left transition ${active ? "border-canopy bg-paper-2 ring-2 ring-canopy/30" : "border-line hover:bg-paper-2"}`}
    >
      <div className="text-[15px] font-bold">{title}</div>
      <div className="mt-1 text-[13px] text-ink-3">{sub}</div>
    </button>
  );
}

// Offers the Clerk account's first name and last initial, which the person can edit before approving.
function RealName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { user } = useUser();
  const suggestion = user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName.charAt(0)}.` : ""}` : "";
  useEffect(() => {
    if (!value && suggestion) onChange(suggestion);
  }, [suggestion]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-ink-2">Name shown to others</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={20}
        placeholder="Sam R."
        className="mt-1.5 h-12 w-full rounded-xl border border-line-strong bg-paper px-4 text-[16px] outline-none focus:border-canopy"
      />
      <span className="mt-1.5 block text-[12.5px] text-ink-3">By joining you approve showing this name publicly. Last name initial only is best.</span>
    </label>
  );
}
