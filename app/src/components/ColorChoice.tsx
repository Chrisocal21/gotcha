import { useState } from "react";
import { parseColorList } from "../lib/colors";
import { IconCheck, IconPlus } from "./glyphs";

export interface Swatch {
  key: string;
  name: string;
  fill: string;
}

const RECENT_MAX = 6;
const recentKey = (id: string) => `gotcha.colors.${id}`;

function loadRecent(id: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(recentKey(id)) ?? "[]");
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveRecent(id: string, list: string[]) {
  try {
    localStorage.setItem(recentKey(id), JSON.stringify(list));
  } catch {
    // Storage can be unavailable. The color still applies, it just isn't remembered.
  }
}

/*
  One color setting: a row of presets, a "+" for your own, and the customs you used lately.
  The "+" opens a color picker and a box for hex codes. Some settings are gradients, so they take one to
  three codes ("#ff7a1a" or "#ffd04d #ff7a1a"); a single code grows into a matching set of tones.
*/
export default function ColorChoice({
  id,
  title,
  detail,
  presets,
  value,
  onChange,
  fillOf,
  maxColors = 1,
  dim = false,
}: {
  id: string; // keeps this setting's recent colors apart from the others
  title: string;
  detail?: string;
  presets: Swatch[];
  value: string;
  onChange: (value: string) => void;
  fillOf: (value: string) => string; // how a custom value looks as a swatch
  maxColors?: number;
  dim?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [recent, setRecent] = useState(() => loadRecent(id));

  const isPreset = presets.some((p) => p.key === value);
  const parsed = parseColorList(text, maxColors);
  const invalid = text.trim() !== "" && !parsed;
  const pickerValue = (parsed ?? [isPreset ? "#888888" : value.split(",")[0]])[0];

  // Customs the person made, newest first, without repeating a preset.
  const customs = [...(isPreset ? [] : [value]), ...recent].filter((v, i, all) => !presets.some((p) => p.key === v) && all.indexOf(v) === i).slice(0, RECENT_MAX);

  const apply = (list: string[]) => onChange(list.join(","));

  function remember(v: string) {
    const next = [v, ...recent.filter((r) => r !== v)].slice(0, RECENT_MAX);
    setRecent(next);
    saveRecent(id, next);
  }

  function openEditor() {
    setText(isPreset ? "" : value.split(",").join(" "));
    setOpen((v) => !v);
  }

  function done() {
    if (parsed) {
      const v = parsed.join(",");
      apply(parsed);
      remember(v);
      setOpen(false);
    }
  }

  return (
    <div className={`custom-row transition-opacity ${dim ? "opacity-55" : ""}`}>
      <div className="text-[15.5px] font-semibold">{title}</div>
      {detail && <div className="text-[13px] text-ink-3">{detail}</div>}

      <div className="mt-3 flex flex-wrap gap-3">
        {presets.map((p) => (
          <Dot key={p.key} label={p.name} selected={value === p.key} fill={p.fill} onClick={() => onChange(p.key)} />
        ))}
        {customs.map((c) => (
          <Dot key={c} label={`Custom ${c.split(",").join(" ")}`} selected={value === c} fill={fillOf(c)} custom onClick={() => onChange(c)} />
        ))}
        <button
          onClick={openEditor}
          aria-label="Add a custom color"
          aria-expanded={open}
          title="Your own color"
          className={`grid size-10 place-items-center rounded-full border-2 border-dashed border-line-strong text-ink-2 transition hover:border-ink-3 hover:text-ink ${open ? "bg-paper-3" : ""}`}
        >
          <IconPlus size={18} strokeWidth={2.4} />
        </button>
      </div>

      {open && (
        <div className="fade-in mt-3 rounded-2xl bg-paper-2 p-3">
          <div className="flex items-center gap-3">
            <label className="relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line-strong" style={{ background: pickerValue }} title="Pick a color">
              <input
                type="color"
                aria-label="Color picker"
                value={pickerValue}
                onChange={(e) => {
                  const hex = e.target.value;
                  // With several codes, the picker edits the first one.
                  const rest = (parsed ?? []).slice(1);
                  const list = [hex, ...rest];
                  setText(list.join(" "));
                  apply(list);
                }}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                const list = parseColorList(e.target.value, maxColors);
                if (list) apply(list);
              }}
              onKeyDown={(e) => e.key === "Enter" && done()}
              placeholder={maxColors > 1 ? "#ff7a1a #ffd04d" : "#ff7a1a"}
              aria-label="Hex color code"
              spellCheck={false}
              autoCapitalize="off"
              className={`h-12 min-w-0 flex-1 rounded-xl border bg-paper px-3.5 text-[15px] outline-none placeholder:text-ink-3 focus:border-canopy ${invalid ? "border-danger" : "border-line-strong"}`}
            />
            <button
              onClick={done}
              disabled={!parsed}
              className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-xl bg-canopy px-4 text-[14px] font-semibold text-(--on-accent) transition hover:bg-canopy-2 disabled:opacity-40"
            >
              <IconCheck size={16} strokeWidth={2.6} />
              Done
            </button>
          </div>
          <p className={`mt-2 text-[12.5px] ${invalid ? "text-danger" : "text-ink-3"}`}>
            {invalid
              ? "Use hex codes like #ff7a1a."
              : maxColors > 1
                ? `Type up to ${maxColors} hex codes to blend. One code makes a matching set of tones.`
                : "Pick a color, or type a hex code like #ff7a1a."}
          </p>
        </div>
      )}
    </div>
  );
}

function Dot({ label, selected, fill, custom = false, onClick }: { label: string; selected: boolean; fill: string; custom?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={`size-10 rounded-full border transition active:scale-95 ${custom ? "border-white/70 shadow-[0_0_0_1.5px_var(--color-line-strong)]" : "border-black/10"} ${
        selected ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "hover:scale-105"
      }`}
      style={{ background: fill }}
    />
  );
}
