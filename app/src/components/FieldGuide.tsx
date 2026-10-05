import { useState } from "react";
import type { AlbumSlot, AlbumState } from "../lib/albums";
import { nextToFind } from "../lib/albums";
import { XP, type ClassKey, type Progress } from "../lib/progress";
import { tierClass } from "../lib/tiers";
import { ProgressRing } from "./game";
import { ClassGlyph, glyphFor, IconNext, IconPrev } from "./glyphs";

/*
  The Field Guide: albums of named animals to go and find. A filled slot shows your best card of that
  animal; an empty one shows its name and where to look, so there's always something specific to chase.
*/

export default function FieldGuide({ progress, onOpenCard }: { progress: Progress; onOpenCard: (id: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const albums = progress.albums;
  const album = albums.find((a) => a.def.id === open);

  if (album) return <AlbumPage album={album} onBack={() => setOpen(null)} onOpenCard={onOpenCard} />;

  const done = albums.filter((a) => a.done).length;
  const found = albums.reduce((s, a) => s + a.found, 0);
  const total = albums.reduce((s, a) => s + a.total, 0);
  return (
    <div className="mt-6">
      <p className="text-[14px] text-ink-2">
        {found} of {total} animals found across {albums.length} albums{done ? `, ${done} complete` : ""}. Finish an album for +{XP.album.toLocaleString("en-US")} XP.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((a) => (
          <button key={a.def.id} onClick={() => setOpen(a.def.id)} className="guide-album text-left">
            <ProgressRing ratio={a.found / a.total} size={58} stroke={6} color={a.def.color}>
              <AlbumGlyph glyph={a.def.glyph} color={a.def.color} />
            </ProgressRing>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px] leading-tight font-bold">{a.def.name}</span>
              <span className="mt-0.5 block truncate text-[12.5px] text-ink-3">{a.def.blurb}</span>
              <span className="mt-1.5 block text-[12.5px] font-semibold tabular" style={{ color: a.done ? "var(--color-xp-ink)" : undefined }}>
                {a.done ? "Complete" : `${a.found} of ${a.total}`}
              </span>
            </span>
            <IconNext size={18} className="shrink-0 text-ink-3" />
          </button>
        ))}
      </div>
    </div>
  );
}

function AlbumGlyph({ glyph, color }: { glyph: string; color: string }) {
  const G = glyphFor(glyph);
  return <G size={22} strokeWidth={2.2} style={{ color }} />;
}

function AlbumPage({ album, onBack, onOpenCard }: { album: AlbumState; onBack: () => void; onOpenCard: (id: string) => void }) {
  return (
    <div className="fade-in mt-5">
      <button onClick={onBack} className="-ml-1.5 inline-flex items-center gap-0.5 text-[15px] font-semibold text-canopy hover:underline">
        <IconPrev size={20} />
        Field Guide
      </button>
      <div className="mt-3 flex items-center gap-4">
        <ProgressRing ratio={album.found / album.total} size={64} stroke={7} color={album.def.color}>
          <AlbumGlyph glyph={album.def.glyph} color={album.def.color} />
        </ProgressRing>
        <div className="min-w-0">
          <h2 className="font-display text-[26px] leading-tight font-extrabold tracking-tight">{album.def.name}</h2>
          <div className="text-[13.5px] text-ink-2">
            {album.done ? `Complete. +${XP.album.toLocaleString("en-US")} XP earned.` : `${album.found} of ${album.total} found. ${album.def.blurb}.`}
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {album.slots.map((s) => (
          <Slot key={s.entry.name} slot={s} onOpen={onOpenCard} />
        ))}
      </div>
    </div>
  );
}

function Slot({ slot, onOpen }: { slot: AlbumSlot; onOpen: (id: string) => void }) {
  const { entry, card } = slot;
  if (card) {
    return (
      <button onClick={() => onOpen(card.id)} className={`dex-tile ${tierClass(card.rarity)}`} aria-label={`${entry.name}, found. Best card ${card.name}, ${card.rarity}`}>
        <div className="dex-tile__art">
          <img src={card.artUrl} alt="" loading="lazy" decoding="async" draggable={false} />
        </div>
        <div className="px-3 pt-2.5 pb-3">
          <div className="truncate text-[14px] font-bold">{entry.name}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-3">
            <span className="tier-dot !size-[7px]" />
            {card.rarity}
          </div>
        </div>
      </button>
    );
  }
  return (
    <div className="guide-missing">
      <div className="guide-missing__art">
        <ClassGlyph cls={entry.cls as ClassKey} size={44} strokeWidth={1.6} />
      </div>
      <div className="px-3 pt-2.5 pb-3">
        <div className="truncate text-[14px] font-bold">{entry.name}</div>
        <div className="mt-1 line-clamp-2 text-[12px] leading-snug text-ink-3">{entry.hint}</div>
      </div>
    </div>
  );
}

// "Next to find": one specific animal to look for, so every outing has a target.
export function NextToFind({ progress, onOpen, className = "" }: { progress: Progress; onOpen?: () => void; className?: string }) {
  const next = nextToFind(progress.albums);
  if (!next) return null;
  const { album, slot } = next;
  return (
    <button onClick={onOpen} disabled={!onOpen} className={`flex w-full items-center gap-3.5 rounded-2xl bg-paper-2 p-4 text-left ${onOpen ? "transition hover:bg-paper-3" : ""} ${className}`}>
      <ProgressRing ratio={album.found / album.total} size={52} stroke={6} color={album.def.color}>
        <ClassGlyph cls={slot.entry.cls as ClassKey} size={20} strokeWidth={2.2} style={{ color: album.def.color }} />
      </ProgressRing>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-semibold text-ink-3">Next to find</span>
        <span className="block truncate font-display text-[17px] leading-tight font-bold">{slot.entry.name}</span>
        <span className="block truncate text-[12.5px] text-ink-3">
          {album.def.name} · {album.found} of {album.total}. {slot.entry.hint}
        </span>
      </span>
      {onOpen && <IconNext size={18} className="shrink-0 text-ink-3" />}
    </button>
  );
}

