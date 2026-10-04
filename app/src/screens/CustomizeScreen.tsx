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
import { Button, Chip, Label, Panel, Segmented } from "../components/ui";

const gradient = (colors: readonly string[]) => `linear-gradient(135deg, ${colors.join(", ")})`;

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
    <div className="page max-w-[760px]">
      <a href="#/settings" className="text-[14px] font-semibold text-ink-2 hover:text-ink">
        Back to settings
      </a>
      <h1 className="mt-3 font-display text-[28px] leading-none font-extrabold tracking-tight lg:text-[36px]">Customize</h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
        Make Gotcha yours. Changes show up right away and stay on this device. Cards never change, so every card looks the same to
        everyone.
      </p>

      <Panel className="mt-5 flex flex-wrap items-center gap-4 p-5">
        <div className="w-[64px] shrink-0">
          <CardBack />
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="sun">
            Catch
          </Button>
          <Button size="sm" variant="secondary">
            Secondary
          </Button>
          <Chip>Chip</Chip>
        </div>
        <p className="w-full font-display text-[18px] font-bold">The quick brown fox catches a Legendary</p>
      </Panel>

      <Group title="Main color" hint="Buttons, links and highlights">
        {ACCENTS.map((a) => (
          <Swatch key={a.value} label={a.name} selected={style.accent === a.value} fill={a.value} onClick={() => update({ accent: a.value })} />
        ))}
        <label
          title="Pick any color"
          className={`relative grid size-10 cursor-pointer place-items-center rounded-full border border-line-strong text-[11px] font-bold text-ink-2 ${
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
      </Group>

      <Group title="Catch button" hint="The big button on the camera">
        {Object.entries(ACTIONS).map(([key, a]) => (
          <Swatch key={key} label={a.name} selected={style.action === key} fill={gradient(a.colors)} onClick={() => update({ action: key })} />
        ))}
      </Group>

      <Group title="Background" hint="The glow behind everything">
        {Object.entries(BACKGROUNDS).map(([key, b]) => (
          <Swatch key={key} label={b.name} selected={style.bg === key} fill={gradient(b.colors)} onClick={() => update({ bg: key })} />
        ))}
      </Group>

      <Row title="Pattern" detail="A soft texture over the background">
        <Segmented size="sm" value={style.pattern} options={PATTERNS} onChange={(pattern: Pattern) => update({ pattern })} />
      </Row>

      <Group title="Card back" hint="Seen when a card is revealed and on empty screens">
        {Object.entries(BACKS).map(([key, b]) => (
          <Swatch key={key} label={b.name} selected={style.back === key} fill={gradient(b.colors)} onClick={() => update({ back: key })} />
        ))}
      </Group>

      <Row title="Corners" detail="How round panels and buttons are">
        <Segmented
          size="sm"
          value={style.corners}
          options={(Object.keys(CORNERS) as Corners[]).map((c) => ({ value: c, label: CORNERS[c].name }))}
          onChange={(corners) => update({ corners })}
        />
      </Row>

      <Panel className="mt-3 p-5">
        <Label>Font</Label>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {(Object.keys(FONTS) as FontKey[]).map((key) => (
            <button
              key={key}
              onClick={() => update({ font: key })}
              aria-pressed={style.font === key}
              className={`rounded-2xl border px-3 py-3 text-left transition ${
                style.font === key ? "border-canopy bg-canopy-soft" : "border-line hover:border-line-strong"
              }`}
            >
              <div className="text-[22px] leading-none font-extrabold" style={{ fontFamily: FONTS[key].display }}>
                Aa
              </div>
              <div className="mt-2 text-[12.5px] font-semibold text-ink-2" style={{ fontFamily: FONTS[key].sans }}>
                {FONTS[key].name}
              </div>
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="mt-3 p-5">
        <Label>Share your style</Label>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-3">
          Copy a style code to send a friend, or paste one from a friend to try their look.
        </p>
        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste a style code"
            aria-label="Style code"
            spellCheck={false}
            className="h-11 min-w-0 flex-1 rounded-2xl border border-line-strong bg-paper-2 px-4 font-mono text-[13px] outline-none placeholder:text-ink-3 focus:border-canopy"
          />
          <Button
            size="sm"
            className="h-11"
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
            className="h-11"
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
        {note && <p className="fade-in mt-3 text-[13.5px] font-medium text-canopy">{note}</p>}
      </Panel>

      <div className="mt-5 flex justify-center">
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
  );
}

function Group({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <Panel className="mt-3 p-5">
      <Label>{title}</Label>
      <p className="mt-1.5 text-[13px] text-ink-3">{hint}</p>
      <div className="mt-4 flex flex-wrap gap-3">{children}</div>
    </Panel>
  );
}

function Row({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return (
    <Panel className="mt-3 flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <div className="text-[15.5px] font-semibold">{title}</div>
        <div className="mt-0.5 text-[13.5px] text-ink-3">{detail}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </Panel>
  );
}

function Swatch({ label, selected, fill, onClick }: { label: string; selected: boolean; fill: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={`size-10 rounded-full border border-black/10 transition active:scale-95 ${
        selected ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "hover:scale-105"
      }`}
      style={{ background: fill }}
    />
  );
}
