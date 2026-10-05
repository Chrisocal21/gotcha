import { useState, type ReactNode } from "react";
import {
  ACCENTS,
  ACTIONS,
  BACKGROUNDS,
  BACKS,
  CORNERS,
  DEFAULT_STYLE,
  FONTS,
  PATTERNS,
  fromCode,
  getStyle,
  saveStyle,
  toCode,
  type Corners,
  type FontKey,
  type Pattern,
  type Style,
} from "../lib/style";
import { CardBack } from "../components/GameCard";
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

  const isCustomAccent = !ACCENTS.some((a) => a.value === style.accent);

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
        <SwatchRow title="Main color" detail="Buttons, links and highlights">
          {ACCENTS.map((a) => (
            <Swatch key={a.value} label={a.name} selected={style.accent === a.value} fill={a.value} onClick={() => update({ accent: a.value })} />
          ))}
          <label
            title="Pick any color"
            className={`relative grid size-10 cursor-pointer place-items-center rounded-full border border-line-strong text-[15px] font-bold text-ink-2 ${
              isCustomAccent ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : ""
            }`}
            style={isCustomAccent ? { background: style.accent, color: "var(--on-accent)" } : undefined}
          >
            {isCustomAccent ? "" : "+"}
            <input
              type="color"
              aria-label="Custom main color"
              value={style.accent}
              onChange={(e) => update({ accent: e.target.value })}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </SwatchRow>
        <SwatchRow title="Catch button" detail="The big button on the camera">
          {Object.entries(ACTIONS).map(([key, a]) => (
            <Swatch key={key} label={a.name} selected={style.action === key} fill={gradient(a.colors)} onClick={() => update({ action: key })} />
          ))}
        </SwatchRow>
        <SwatchRow title="Background" detail="The glow behind everything">
          {Object.entries(BACKGROUNDS).map(([key, b]) => (
            <Swatch key={key} label={b.name} selected={style.bg === key} fill={gradient(b.colors)} onClick={() => update({ bg: key })} />
          ))}
        </SwatchRow>
        <ControlRow title="Pattern">
          <Segmented size="sm" value={style.pattern} options={PATTERNS} onChange={(pattern: Pattern) => update({ pattern })} />
        </ControlRow>
      </Group>

      <Group title="Card back">
        <SwatchRow title="Color" detail="Seen when a card is revealed">
          {Object.entries(BACKS).map(([key, b]) => (
            <Swatch key={key} label={b.name} selected={style.back === key} fill={gradient(b.colors)} onClick={() => update({ back: key })} />
          ))}
        </SwatchRow>
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
          <div className="text-[15.5px] font-semibold">Font</div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {(Object.keys(FONTS) as FontKey[]).map((key) => (
              <button
                key={key}
                onClick={() => update({ font: key })}
                aria-pressed={style.font === key}
                className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                  style.font === key ? "border-canopy bg-canopy-soft" : "border-line hover:border-line-strong"
                }`}
              >
                <div className="text-[20px] leading-none font-extrabold" style={{ fontFamily: FONTS[key].display }}>
                  Aa
                </div>
                <div className="mt-1.5 text-[12.5px] font-semibold text-ink-2" style={{ fontFamily: FONTS[key].sans }}>
                  {FONTS[key].name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Group>

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
function SwatchRow({ title, detail, children }: { title: string; detail?: string; children: ReactNode }) {
  return (
    <div className="custom-row">
      <div className="text-[15.5px] font-semibold">{title}</div>
      {detail && <div className="text-[13px] text-ink-3">{detail}</div>}
      <div className="mt-3 flex flex-wrap gap-3">{children}</div>
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

function Swatch({ label, selected, fill, onClick }: { label: string; selected: boolean; fill: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={`size-10 rounded-full border border-black/10 transition active:scale-95 ${selected ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "hover:scale-105"}`}
      style={{ background: fill }}
    />
  );
}
