import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { getBoard, joinBoard, leaveBoard, type Board, type BoardEntry, type BoardScope, type NameKind } from "../lib/api";
import { CLERK_KEY } from "./AuthGate";
import { CreatorTag, FounderTag, SectionTitle } from "./game";
import { IconTrophy } from "./glyphs";
import { Button, Panel, Segmented } from "./ui";

const fmt = (n: number) => n.toLocaleString("en-US");

const SCOPES: { value: BoardScope; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "all", label: "All time" },
];

export default function Leaderboard() {
  const [scope, setScope] = useState<BoardScope>("week");
  const [board, setBoard] = useState<Board | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let live = true;
    setFailed(false);
    getBoard(scope)
      .then((b) => live && setBoard(b))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [scope]);

  const reload = () => getBoard(scope).then(setBoard).catch(() => setFailed(true));

  if (failed && !board) {
    return (
      <Panel className="fade-in mt-5 p-5 sm:p-6">
        <SectionTitle title="Leaderboard" />
        <p className="mt-3 text-[14.5px] text-ink-2">The leaderboard isn't reachable right now. Sign in and try again in a moment.</p>
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
          reload();
        }}
        onCancel={board.me ? () => setEditing(false) : undefined}
      />
    );
  }

  const me = board.me;
  const onList = board.entries.some((e) => e.you);
  return (
    <div className="fade-in mt-5 space-y-5">
      <Panel className="p-5 sm:p-6">
        <SectionTitle
          title="Leaderboard"
          sub={board.total ? `${fmt(board.total)} explorer${board.total === 1 ? "" : "s"} ranked` : "Be the first on the board"}
          action={<Segmented size="sm" value={scope} onChange={setScope} options={SCOPES} />}
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper-2 p-4">
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-ink-3">You appear as</div>
            <div className="flex items-center gap-2 font-display text-[19px] font-bold">\n              <span className="truncate">{me.name}</span>\n              {me.creator && <CreatorTag />}
              {me.founder && <FounderTag />}\n            </div>
          </div>
          <div className="flex items-center gap-5 text-right">
            <Stat label="Rank" value={me.rank ? `#${fmt(me.rank)}` : "None yet"} />
            <Stat label="Score" value={fmt(me.score)} />
          </div>
        </div>
        {me.cards === 0 && (
          <p className="mt-3 text-[13.5px] text-ink-3">{scope === "week" ? "Catch something this week to get ranked." : "Make a catch to get ranked."}</p>
        )}
        {board.entries.length === 0 ? (
          <p className="mt-5 text-[14.5px] text-ink-2">Nobody has scored {scope === "week" ? "this week" : "yet"}. Go catch something.</p>
        ) : (
          <ol className="mt-4 divide-y divide-line">
            {board.entries.map((e) => (
              <Row key={e.rank} e={e} />
            ))}
            {!onList && me.rank && <Row e={{ rank: me.rank, name: me.name, kind: me.kind, score: me.score, cards: me.cards, species: me.species, founder: me.founder, creator: me.creator, you: true }} gap />}
          </ol>
        )}
        <p className="mt-4 text-[12.5px] leading-snug text-ink-3">
          Score is 100 per card, plus a rarity bonus, plus 500 for each new species (all time only). Only your chosen name is shown, never your email or photos.
        </p>
      </Panel>
      <Panel className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div>
          <div className="text-[15px] font-bold">Your leaderboard name</div>
          <div className="text-[13px] text-ink-3">Change it, or leave the board at any time.</div>
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
              reload();
            }}
          >
            Leave board
          </Button>
        </div>
      </Panel>
    </div>
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

function Row({ e, gap = false }: { e: BoardEntry; gap?: boolean }) {
  return (
    <li className={`flex items-center gap-3 py-3 ${e.you ? "-mx-2 rounded-xl bg-xp-soft px-2" : ""} ${gap ? "mt-2 border-t-0" : ""}`}>
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
          {e.creator && <CreatorTag />}
          {e.founder && <FounderTag />}
          {e.you && <span className="text-[12px] font-semibold text-xp-ink">You</span>}
        </div>
        <div className="text-[12.5px] text-ink-3 tabular">
          {fmt(e.cards)} {e.cards === 1 ? "card" : "cards"} · {fmt(e.species)} species
        </div>
      </div>
      <div className="text-right font-display text-[17px] font-extrabold tabular">{fmt(e.score)}</div>
    </li>
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
