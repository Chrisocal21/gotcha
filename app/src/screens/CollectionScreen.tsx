import { useMemo, useState } from "react";
import { scoreOf, type Collection } from "../lib/api";
import { setBrowseOrder } from "../lib/browse";
import { formatDay, plural } from "../lib/format";
import { CLASS_NAMES, CLASS_ORDER, classKeyOf, type ClassKey, type Progress, type SpeciesEntry } from "../lib/progress";
import { navigate } from "../lib/router";
import { ODDS, TIERS, tierClass, tierRank, type Tier } from "../lib/tiers";
import { SHOWCASE } from "../lib/showcase";
import { CardFan, CardFront, CardSkeleton } from "../components/GameCard";
import FieldGuide, { NextToFind } from "../components/FieldGuide";
import { ClassEmblem } from "../components/game";
import { Button, Panel, Segmented } from "../components/ui";

type Sort = "newest" | "rarity" | "score";
type View = "cards" | "species" | "guide";

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "rarity", label: "Rarity" },
  { value: "score", label: "Score" },
];

// Remembered for the session, so coming back from a card or another page keeps your place.
let lastView: View = "cards";

// Lets other screens ("Next to find") open Collection on the Field Guide.
export function showGuideNext() {
  lastView = "guide";
}

export default function CollectionScreen({
  collection,
  progress,
  onOpenCard,
}: {
  collection: Collection | null;
  progress: Progress | null;
  onOpenCard: (id: string) => void;
}) {
  const [view, setViewState] = useState<View>(lastView);
  const setView = (v: View) => {
    lastView = v;
    setViewState(v);
  };
  const [filter, setFilter] = useState<Tier | "all">("all");
  const [cls, setCls] = useState<ClassKey | "all">("all");
  const [sort, setSort] = useState<Sort>("newest");

  const cards = collection?.cards ?? [];
  const shown = useMemo(() => {
    const list = cards.filter((c) => (filter === "all" || c.rarity === filter) && (cls === "all" || classKeyOf(c) === cls));
    if (sort === "rarity") return [...list].sort((a, b) => tierRank(b.rarity) - tierRank(a.rarity) || scoreOf(b.stats) - scoreOf(a.stats));
    if (sort === "score") return [...list].sort((a, b) => scoreOf(b.stats) - scoreOf(a.stats));
    return list;
  }, [cards, filter, cls, sort]);

  if (view === "cards") setBrowseOrder(shown.map((c) => c.id));

  const rarest = cards.reduce<Tier | null>((best, c) => (!best || tierRank(c.rarity) > tierRank(best) ? c.rarity : best), null);
  const classesFound = progress ? CLASS_ORDER.filter((k) => k !== "other" && progress.classes[k].cards > 0).length : 0;
  const classOptions = CLASS_ORDER.filter((k) => progress && progress.classes[k].cards > 0);

  return (
    <div className="page">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-[30px] leading-none font-extrabold tracking-tight lg:text-[40px]">Collection</h1>
        {(cards.length > 0 || view === "guide") && (
          <Segmented
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: "cards", label: "Cards" },
              { value: "species", label: "Species" },
              { value: "guide", label: "Guide" },
            ]}
          />
        )}
      </div>
      {collection && (
        <p className="mt-2 text-[13.5px] text-ink-2 tabular">
          {plural(cards.length, "card")} · {plural(collection.species, "species", "species")} · {classesFound} of 8 classes
          {rarest && rarest !== "Common" ? (
            <span className="hidden sm:inline">
              {" "}
              · best pull: <b className={`font-semibold ${tierClass(rarest)} tier-ink`}>{rarest}</b>
            </span>
          ) : null}
        </p>
      )}

      {!collection ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : view === "guide" && progress ? (
        <FieldGuide progress={progress} onOpenCard={onOpenCard} />
      ) : cards.length === 0 ? (
        <EmptyCollection progress={progress} onGuide={() => setView("guide")} />
      ) : view === "species" && progress ? (
        <SpeciesView progress={progress} onOpenCard={onOpenCard} />
      ) : (
        <>
          {/* One row of filters. It scrolls sideways on a phone. */}
          <div className="no-scrollbar -mx-4 mt-5 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
            <FilterChip label="All" count={cards.length} active={filter === "all"} onClick={() => setFilter("all")} />
            {TIERS.map((t) => (
              <FilterChip key={t} tier={t} label={t} count={collection.tiers[t]} active={filter === t} onClick={() => setFilter(t)} />
            ))}
            <span className="mx-1 w-px shrink-0 self-stretch bg-line" aria-hidden />
            <select aria-label="Animal class" value={cls} onChange={(e) => setCls(e.target.value as ClassKey | "all")} className="select-pill shrink-0">
              <option value="all">All classes</option>
              {classOptions.map((k) => (
                <option key={k} value={k}>
                  {CLASS_NAMES[k].many}
                </option>
              ))}
            </select>
            <select aria-label="Sort cards" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="select-pill shrink-0">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {shown.length === 0 ? (
            filter !== "all" && collection.tiers[filter] === 0 ? (
              <Panel className={`mt-6 px-6 py-12 text-center ${tierClass(filter)}`}>
                <div className="tier-dot mx-auto" />
                <div className="mt-4 font-display text-[22px] font-bold">No {filter} cards yet</div>
                <p className="mt-2 text-[14.5px] text-ink-2">
                  {filter} cards turn up in about {ODDS[filter]} of every 100 catches. Keep catching.
                </p>
              </Panel>
            ) : (
              <Panel className="mt-6 px-6 py-12 text-center">
                <div className="font-display text-[22px] font-bold">Nothing matches both filters</div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setFilter("all");
                    setCls("all");
                  }}
                >
                  Show everything
                </Button>
              </Panel>
            )
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {shown.map((card, i) => (
                <button
                  key={card.id}
                  onClick={() => onOpenCard(card.id)}
                  aria-label={`${card.name}, ${card.rarity} ${card.species}`}
                  className="binder-slot fade-up"
                  style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
                >
                  <CardFront card={card} size="thumb" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// The species journal: every species you've found, grouped by class, numbered in the order you found them.
function SpeciesView({ progress, onOpenCard }: { progress: Progress; onOpenCard: (id: string) => void }) {
  const numbered = new Map(progress.journal.map((s, i) => [s.key, i + 1]));
  const groups = CLASS_ORDER.map((k) => ({ k, list: progress.journal.filter((s) => s.cls === k) }));
  const found = groups.filter((g) => g.list.length > 0);
  const missing = groups.filter((g) => g.list.length === 0 && g.k !== "other");

  setBrowseOrder(found.flatMap((g) => g.list.map((s) => s.best.id)));

  return (
    <div className="mt-6 space-y-8">
      {found.map(({ k, list }) => (
        <section key={k}>
          <div className="flex items-center gap-3">
            <ClassEmblem cls={k} size={34} />
            <h2 className="font-display text-[21px] font-bold tracking-tight">{CLASS_NAMES[k].many}</h2>
            <span className="text-[13px] text-ink-3">
              {plural(list.length, "species", "species")} · {plural(progress.classes[k].cards, "card")}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {list.map((s) => (
              <SpeciesTile key={s.key} s={s} no={numbered.get(s.key)!} onOpen={() => onOpenCard(s.best.id)} />
            ))}
          </div>
        </section>
      ))}

      {missing.length > 0 && (
        <Panel className="p-5 sm:p-6">
          <div className="font-display text-[19px] font-bold">Still out there</div>
          <p className="mt-1 text-[13.5px] text-ink-3">Classes you haven't caught yet. Each one has its own badge.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {missing.map(({ k }) => (
              <span key={k} className="flex items-center gap-2 rounded-full bg-paper-2 py-1.5 pr-3.5 pl-1.5 text-[13.5px] font-semibold text-ink-2">
                <ClassEmblem cls={k} size={26} className="grayscale" />
                {CLASS_NAMES[k].many}
              </span>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function SpeciesTile({ s, no, onOpen }: { s: SpeciesEntry; no: number; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className={`dex-tile ${tierClass(s.best.rarity)}`} aria-label={`${s.name}, caught ${plural(s.count, "time")}`}>
      <div className="dex-tile__art">
        <img src={s.best.artUrl} alt="" loading="lazy" decoding="async" draggable={false} />
        <span className="dex-tile__no">#{String(no).padStart(3, "0")}</span>
        {s.count > 1 && <span className="dex-tile__count">x{s.count}</span>}
      </div>
      <div className="px-3 pt-2.5 pb-3">
        <div className="truncate text-[14px] font-bold">{s.name}</div>
        <div className="mt-1 flex items-center justify-between gap-2 text-[12px] text-ink-3">
          <span className="flex items-center gap-1.5">
            <span className="tier-dot !size-[7px]" />
            {s.best.rarity}
          </span>
          <span className="truncate">{formatDay(s.first.createdAt)}</span>
        </div>
      </div>
    </button>
  );
}

function FilterChip({
  tier,
  label,
  count,
  active,
  onClick,
}: {
  tier?: Tier;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition ${
        active ? "bg-ink text-sand shadow-soft" : "border border-line bg-paper text-ink-2 shadow-soft hover:text-ink"
      } ${tier ? tierClass(tier) : ""} ${!active && count === 0 ? "opacity-55" : ""}`}
    >
      {tier && <span className="tier-dot" />}
      {label}
      <span className={active ? "text-sand/60" : "text-ink-3"}>{count}</span>
    </button>
  );
}

function EmptyCollection({ progress, onGuide }: { progress: Progress | null; onGuide: () => void }) {
  return (
    <Panel className="mt-8 flex flex-col items-center px-6 py-14 text-center">
      <CardFan cards={SHOWCASE} width={120} />
      <h2 className="mt-8 font-display text-[28px] font-extrabold tracking-tight">Your first card is out there</h2>
      <p className="mt-3 max-w-[380px] text-[15px] leading-relaxed text-ink-2">
        Photograph any real animal and it becomes a one-of-a-kind card like these samples. Dogs, birds, bugs, even statues.
      </p>
      <Button variant="sun" className="mt-7 w-60" onClick={() => navigate("/")}>
        Start catching
      </Button>
      {progress && <NextToFind progress={progress} onOpen={onGuide} className="mt-6 max-w-[420px] !bg-paper-2 text-left" />}
    </Panel>
  );
}
