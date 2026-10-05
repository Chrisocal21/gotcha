import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ACCENTS,
  ACTIONS,
  BACKGROUNDS,
  BACKS,
  CORNERS,
  DEFAULT_STYLE,
  FONTS,
  FONT_GROUPS,
  PATTERNS,
  fromCode,
  tripleOf,
  getStyle,
  saveStyle,
  toCode,
  type Corners,
  type FontKey,
  type Pattern,
  type Style,
} from "../lib/style";
import ColorChoice from "../components/ColorChoice";
import { CardBack } from "../components/GameCard";
import { SKINS, SKIN_GROUPS } from "../lib/skins";
import { IconCheck, IconNext, IconPrev } from "../components/glyphs";
import { getExplorerName } from "../lib/prefs";
import { Group, SubpageHeader } from "../components/SettingsList";
import { Button, Segmented } from "../components/ui";

const gradient = (colors: readonly string[]) => `linear-gradient(135deg, ${colors.join(", ")})`;

// Your own look for the app. Cards never change, so every card looks the same to everyone.
export default function CustomizeScreen() {
  const [style, setStyle] = useState<Style>(getStyle);
  const [code, setCode] = useState("");
  const [note, setNote] = useState<string | null>(null);

  function update(patch: Partial<Style>) {
    const next = { ...style, ...patch };
    setStyle(next);
    saveStyle(next);
    setNote(null);
  }


  return (
    <div className="page max-w-[1040px]">
      <SubpageHeader title="Customize" />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        {/* Always in view, even on a phone: change anything below and watch this change. */}
        <div className="sticky top-[70px] z-20 -mx-1 mb-4 lg:top-24 lg:order-2 lg:mx-0">
          <Preview />
        </div>

        <div className="min-w-0 lg:order-1">
          <p className="settings-footer !mt-0 !mb-3">Everything updates live and stays on this device. Cards never change, so they look the same to everyone.</p>
      <Group title="Colors">
        <ColorChoice
          id="accent"
          title="Main color"
          detail="Buttons, links, your level and highlights"
          presets={ACCENTS.map((c) => ({ key: c.value, name: c.name, fill: c.value }))}
          value={style.accent}
          onChange={(accent) => update({ accent })}
          fillOf={(v) => v}
        />
        <ColorChoice
          id="action"
          title="Catch button"
          detail="The big button on the camera"
          presets={Object.entries(ACTIONS).map(([key, c]) => ({ key, name: c.name, fill: gradient(c.colors) }))}
          value={style.action}
          onChange={(action) => update({ action })}
          fillOf={(v) => gradient(tripleOf("action", v))}
          maxColors={3}
        />
        <ColorChoice
          id="back"
          title="Card back"
          detail="Seen when a card is revealed"
          presets={Object.entries(BACKS).map(([key, c]) => ({ key, name: c.name, fill: gradient(c.colors) }))}
          value={style.back}
          onChange={(back) => update({ back })}
          fillOf={(v) => gradient(tripleOf("back", v))}
          maxColors={3}
        />
      </Group>

      <Group title="Background">
        <div className="custom-row">
          <div className="text-[15.5px] font-semibold">Design</div>
          <div className="text-[13px] text-ink-3">A whole look for the page behind everything</div>
          <SkinPicker value={style.skin} glow={gradient(tripleOf("bg", style.bg))} onChange={(skin) => update({ skin })} />
        </div>
        <ColorChoice
          id="bg"
          title="Glow"
          detail={style.skin === "none" ? "The soft color behind the page" : "Used when the design is None"}
          presets={Object.entries(BACKGROUNDS).map(([key, c]) => ({ key, name: c.name, fill: gradient(c.colors) }))}
          value={style.bg}
          onChange={(bg) => update({ bg })}
          fillOf={(v) => gradient(tripleOf("bg", v))}
          maxColors={3}
          dim={style.skin !== "none"}
        />
        <ControlRow title="Texture">
          <Segmented size="sm" value={style.pattern} options={PATTERNS} onChange={(pattern: Pattern) => update({ pattern })} />
        </ControlRow>
      </Group>

      <Group title="Shape and type">
        <ControlRow title="Corners">
          <Segmented
            size="sm"
            value={style.corners}
            options={(Object.keys(CORNERS) as Corners[]).map((c) => ({ value: c, label: CORNERS[c].name }))}
            onChange={(corners) => update({ corners })}
          />
        </ControlRow>
        <div className="custom-row">
          <div className="text-[15.5px] font-semibold">Headings font</div>
          <div className="text-[13px] text-ink-3">Titles, big numbers and your name</div>
          <FontPicker value={style.font} onChange={(font) => update({ font })} />
        </div>
        <div className="custom-row">
          <div className="text-[15.5px] font-semibold">App font</div>
          <div className="text-[13px] text-ink-3">Everything else: buttons, labels and paragraphs</div>
          <FontPicker value={style.body} onChange={(body) => update({ body })} bodyOnly />
        </div>      </Group>

      <Group title="Share your style" footer={note ? <span className="text-canopy">{note}</span> : "Send a friend your code, or paste theirs to try their look."}>
        <div className="custom-row flex flex-col gap-2.5 sm:flex-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste a style code"
            aria-label="Style code"
            spellCheck={false}
            className="h-11 min-w-0 flex-1 rounded-2xl border border-line-strong bg-paper-2 px-4 text-[14px] outline-none placeholder:text-ink-3 focus:border-canopy"
          />
          <div className="flex gap-2.5">
            <Button
              size="sm"
              className="h-11 flex-1"
              disabled={!code.trim()}
              onClick={() => {
                const next = fromCode(code);
                if (!next) return setNote("That doesn't look like a Gotcha style code.");
                setStyle(next);
                saveStyle(next);
                setCode("");
                setNote("Style applied.");
              }}
            >
              Apply
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-11 flex-1"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(toCode(style));
                  setNote("Style code copied.");
                } catch {
                  window.prompt("Copy your style code:", toCode(style));
                }
              }}
            >
              Copy mine
            </Button>
          </div>
        </div>
      </Group>

      <div className="mt-6 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setStyle({ ...DEFAULT_STYLE });
            saveStyle({ ...DEFAULT_STYLE });
            setNote("Back to the original look.");
          }}
        >
          Reset to the original look
        </Button>
      </div>
        </div>
      </div>
    </div>
  );
}

// A compact picker: arrows flip through every font one by one, or open the list to jump straight to one.
function FontPicker({ value, onChange, bodyOnly = false }: { value: FontKey; onChange: (f: FontKey) => void; bodyOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  // Body text needs a readable face, so the app-font list leaves out the decorative headline fonts.
  const keys = (Object.keys(FONTS) as FontKey[]).filter((k) => !bodyOnly || FONTS[k].scope === "all");
  const index = keys.indexOf(value);
  const go = (step: number) => onChange(keys[(index + step + keys.length) % keys.length]);
  const def = FONTS[value];
  return (
    <div className="relative mt-2.5">
      <div className="flex items-stretch gap-2">
        <button onClick={() => go(-1)} aria-label="Previous font" className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line-strong bg-paper-2 hover:bg-paper-3">
          <IconPrev size={20} />
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-2xl border border-line-strong bg-paper-2 px-4 text-left hover:bg-paper-3"
        >
          <span className="min-w-0">
            <span className="block truncate text-[19px] leading-tight font-extrabold" style={{ fontFamily: def.display }}>
              {def.name}
            </span>
            <span className="block text-[11.5px] text-ink-3">
              {index + 1} of {keys.length}
            </span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-ink-3 transition ${open ? "rotate-180" : ""}`} aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <button onClick={() => go(1)} aria-label="Next font" className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line-strong bg-paper-2 hover:bg-paper-3">
          <IconNext size={20} />
        </button>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <ul role="listbox" className="relative z-40 mt-2 max-h-[min(50vh,340px)] overflow-y-auto overscroll-contain rounded-2xl border border-line-strong bg-paper-2 p-1.5">
            {FONT_GROUPS.map((g) => (
              <li key={g}>
                <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-ink-3 uppercase">{g}</div>
                <ul>
                  {keys
                    .filter((k) => FONTS[k].group === g)
                    .map((k) => (
                      <li key={k} role="option" aria-selected={k === value}>
                        <button
                          onClick={() => {
                            onChange(k);
                            setOpen(false);
                          }}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left hover:bg-paper-3 ${k === value ? "bg-canopy-soft" : ""}`}
                        >
                          <span className="truncate text-[18px] leading-tight font-bold" style={{ fontFamily: FONTS[k].display }}>
                            {FONTS[k].name}
                          </span>
                          {k === value && <IconCheck size={16} className="shrink-0 text-canopy" />}
                        </button>
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
// A small sample of the app that restyles with every change: your name, the fonts, the buttons, the corners and the card back.
function Preview() {
  const name = getExplorerName() || "Explorer";
  return (
    <div className="flex items-center gap-4 rounded-(--r-panel) border border-line bg-paper p-3.5 shadow-lift lg:flex-col lg:items-stretch lg:gap-4 lg:p-5">
      <div className="w-[64px] shrink-0 lg:mx-auto lg:w-[150px]">
        <CardBack />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold tracking-wide text-ink-3 uppercase">Live preview</div>
        <div className="truncate font-display text-[22px] leading-tight font-extrabold tracking-tight lg:text-[30px]">{name}</div>
        <p className="mt-0.5 text-[13px] leading-snug text-ink-2 lg:text-[14.5px]">Every animal becomes a card. Catch them all.</p>
        <div className="mt-2.5 hidden h-2 overflow-hidden rounded-full bg-paper-3 lg:block">
          <i className="block h-full w-3/5 rounded-full bg-canopy" />
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="sun">
            Catch
          </Button>
        </div>
      </div>
    </div>
  );
}
function ControlRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="custom-row flex items-center justify-between gap-4">
      <div className="text-[15.5px] font-semibold">{title}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// A shrunken picture of a background design: the real background drawn at 400 by 300 and scaled to fit,
// so big shapes (a sun, hills) keep their proportions.
function SkinThumb({ look, className = "" }: { look: React.CSSProperties; className?: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(0.15);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / 400);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <span ref={box} className={`relative block shrink-0 overflow-hidden rounded-lg border border-black/10 ${className}`}>
      <span className="absolute top-0 left-0 block origin-top-left" style={{ width: 400, height: 300, transform: `scale(${scale})`, ...look }} />
    </span>
  );
}

const lookOf = (key: string, glow: string): React.CSSProperties => (key === "none" ? { background: glow } : { background: SKINS[key].bg, backgroundSize: SKINS[key].size });

// Like the font picker: arrows step through every design, or open the list to jump to one.
function SkinPicker({ value, glow, onChange }: { value: string; glow: string; onChange: (k: string) => void }) {
  const [open, setOpen] = useState(false);
  const listed = new Set(SKIN_GROUPS.flatMap((g) => g.keys));
  const groups = [...SKIN_GROUPS, { name: "More", keys: Object.keys(SKINS).filter((k) => !listed.has(k)) }].map((g) => ({ ...g, keys: g.keys.filter((k) => k in SKINS) })).filter((g) => g.keys.length);
  const keys = ["none", ...groups.flatMap((g) => g.keys)];
  const index = Math.max(0, keys.indexOf(value));
  const go = (step: number) => onChange(keys[(index + step + keys.length) % keys.length]);
  const name = value === "none" ? "None" : SKINS[value]?.name;
  const era = value === "none" ? "Soft glow" : SKINS[value]?.era;
  return (
    <div className="relative mt-2.5">
      <div className="flex items-stretch gap-2">
        <button onClick={() => go(-1)} aria-label="Previous design" className="grid size-14 shrink-0 place-items-center rounded-2xl border border-line-strong bg-paper-2 hover:bg-paper-3">
          <IconPrev size={20} />
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-line-strong bg-paper-2 py-1.5 pr-3 pl-1.5 text-left hover:bg-paper-3"
        >
          <SkinThumb look={lookOf(value, glow)} className="h-11 w-[58px]" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[16px] leading-tight font-bold">{name}</span>
            <span className="block truncate text-[11.5px] text-ink-3">
              {era} · {index + 1} of {keys.length}
            </span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-ink-3 transition ${open ? "rotate-180" : ""}`} aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <button onClick={() => go(1)} aria-label="Next design" className="grid size-14 shrink-0 place-items-center rounded-2xl border border-line-strong bg-paper-2 hover:bg-paper-3">
          <IconNext size={20} />
        </button>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <ul role="listbox" className="relative z-40 mt-2 max-h-[min(55vh,420px)] overflow-y-auto overscroll-contain rounded-2xl border border-line-strong bg-paper-2 p-1.5">
            {[{ name: "", keys: ["none"] }, ...groups].map((g) => (
              <li key={g.name || "none"}>
                {g.name && <div className="px-3 pt-2.5 pb-1 text-[11px] font-semibold tracking-wide text-ink-3 uppercase">{g.name}</div>}
                <ul>
                  {g.keys.map((k) => (
                    <li key={k} role="option" aria-selected={k === value}>
                      <button
                        onClick={() => {
                          onChange(k);
                          setOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-paper-3 ${k === value ? "bg-canopy-soft" : ""}`}
                      >
                        <SkinThumb look={lookOf(k, glow)} className="h-10 w-[54px]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] leading-tight font-bold">{k === "none" ? "None" : SKINS[k].name}</span>
                          <span className="block truncate text-[11.5px] text-ink-3">{k === "none" ? "Soft glow" : SKINS[k].era}</span>
                        </span>
                        {k === value && <IconCheck size={16} className="shrink-0 text-canopy" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
