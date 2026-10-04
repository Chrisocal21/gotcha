import { useMemo, useState } from "react";
import { scoreOf, type Collection } from "../lib/api";
import { setBrowseOrder } from "../lib/browse";
import { navigate } from "../lib/router";
import { ODDS, TIERS, tierClass, tierRank, type Tier } from "../lib/tiers";
import { CardBack, CardFront, CardSkeleton } from "../components/GameCard";
import { Button, Panel } from "../components/ui";

type Sort = "newest" | "rarity" | "score";

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "rarity", label: "Rarity" },
  { value: "score", label: "Score" },
];

export default function CollectionScreen({
  collection,
  onOpenCard,
}: {
  collection: Collection | null;
  onOpenCard: (id: string) => void;
}) {
  const [filter, setFilter] = useState<Tier | "all">("all");
  const [sort, setSort] = useState<Sort>("newest");

  const shown = useMemo(() => {
    const cards = (collection?.cards ?? []).filter((c) => filter === "all" || c.rarity === filter);
    if (sort === "rarity") return [...cards].sort((a, b) => tierRank(b.rarity) - tierRank(a.rarity) || scoreOf(b.stats) - scoreOf(a.stats));
    if (sort === "score") return [...cards].sort((a, b) => scoreOf(b.stats) - scoreOf(a.stats));
    return cards;
  }, [collection, filter, sort]);

  const cards = collection?.cards ?? [];
  const rarest = cards.reduce<Tier | null>((best, c) => (!best || tierRank(c.rarity) > tierRank(best) ? c.rarity : best), null);

  setBrowseOrder(shown.map((c) => c.id));

  return (
    <div className="page !pt-3 lg:!pt-6">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-[26px] leading-none font-extrabold tracking-tight lg:text-[34px]">Collection</h1>
        {collection && (
          <p className="truncate text-[13px] text-ink-2 tabular">
            {cards.length} {cards.length === 1 ? "card" : "cards"} · {collection.species} species
            <span className="hidden sm:inline">
              {collection.streak > 1 ? ` · ${collection.streak} day streak` : ""}
              {rarest && rarest !== "Common" ? ` · best: ${rarest}` : ""}
            </span>
          </p>
        )}
      </div>

      {!collection ? (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <EmptyCollection />
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <div className="no-scrollbar -ml-4 flex min-w-0 flex-1 gap-1.5 overflow-x-auto pl-4 lg:ml-0 lg:pl-0">
              <FilterChip label="All" count={cards.length} active={filter === "all"} onClick={() => setFilter("all")} />
              {TIERS.map((t) => (
                <FilterChip key={t} tier={t} label={t} count={collection.tiers[t]} active={filter === t} onClick={() => setFilter(t)} />
              ))}
            </div>
            <select
              aria-label="Sort cards"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-9 shrink-0 rounded-full border border-line bg-paper px-3 text-[13px] font-semibold text-ink-2 shadow-soft outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {shown.length === 0 && filter !== "all" ? (
            <Panel className={`mt-6 px-6 py-12 text-center ${tierClass(filter)}`}>
              <div className="tier-dot mx-auto" />
              <div className="mt-4 font-display text-[22px] font-bold">No {filter} cards yet</div>
              <p className="mt-2 text-[14.5px] text-ink-2">
                {filter} cards turn up in about {ODDS[filter]} of every 100 catches. Keep catching.
              </p>
            </Panel>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {shown.map((card, i) => (
                <button
                  key={card.id}
                  onClick={() => onOpenCard(card.id)}
                  aria-label={`${card.name}, ${card.rarity} ${card.species}`}
                  className="fade-up block rounded-[14px] text-left transition duration-300 hover:-translate-y-1.5"
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

function EmptyCollection() {
  return (
    <Panel className="mt-8 flex flex-col items-center px-6 py-14 text-center">
      <div className="relative h-[150px] w-[230px]" aria-hidden>
        <div className="absolute top-3 left-1/2 w-[96px] -translate-x-[95%] -rotate-[14deg]">
          <CardBack />
        </div>
        <div className="absolute top-3 left-1/2 w-[96px] -translate-x-[5%] rotate-[14deg]">
          <CardBack />
        </div>
        <div className="absolute top-0 left-1/2 w-[100px] -translate-x-1/2">
          <CardBack />
        </div>
      </div>
      <h2 className="mt-10 font-display text-[28px] font-extrabold tracking-tight">Your first card is out there</h2>
      <p className="mt-3 max-w-[340px] text-[15px] leading-relaxed text-ink-2">
        Photograph any real animal and it becomes a one-of-a-kind card. Dogs, birds, bugs, even statues.
      </p>
      <Button variant="sun" className="mt-7 w-60" onClick={() => navigate("/")}>
        Start catching
      </Button>
    </Panel>
  );
}


