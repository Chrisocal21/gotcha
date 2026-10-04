import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "sun" | "secondary" | "ghost" | "glass";
type Size = "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-canopy text-(--on-accent) shadow-soft hover:bg-canopy-2",
  sun: "sun-fill text-[#2b1700] shadow-[0_12px_28px_-10px_rgb(255_122_26_/_0.75)] hover:brightness-105",
  secondary: "border border-line-strong bg-paper text-ink shadow-soft hover:bg-paper-2",
  ghost: "text-ink-2 hover:bg-paper-3/70 hover:text-ink",
  glass: "border border-white/15 bg-white/10 text-white hover:bg-white/20",
};

const SIZES: Record<Size, string> = {
  md: "h-12 px-6 text-[15.5px]",
  sm: "h-10 px-4 text-[14px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-(--r-btn) font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  );
}

export function IconButton({
  label,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={`grid size-10 place-items-center rounded-full text-ink-2 transition hover:bg-paper-3 hover:text-ink ${className}`}
    />
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-(--r-panel) border border-line bg-paper shadow-soft ${className}`}>{children}</section>;
}

type ChipTone = "default" | "tier" | "glass" | "sun";

const CHIP_TONES: Record<ChipTone, string> = {
  default: "bg-paper-3 text-ink-2",
  tier: "bg-(--tier) text-white",
  glass: "bg-white/12 text-white/85",
  sun: "sun-fill text-[#2b1700]",
};

export function Chip({ children, tone = "default", className = "" }: { children: ReactNode; tone?: ChipTone; className?: string }) {
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold ${CHIP_TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3 ${className}`}>{children}</div>;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = "md",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex rounded-full bg-paper-3 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-full font-semibold transition ${size === "sm" ? "px-3.5 py-1.5 text-[13px]" : "px-4 py-2 text-[14px]"} ${
            value === o.value ? "bg-paper text-ink shadow-soft" : "text-ink-3 hover:text-ink-2"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-canopy" : "bg-paper-3 ring-1 ring-line-strong ring-inset"}`}
    >
      <span
        className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow-soft transition-transform duration-200 ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

// Today's catches as a row of segments (or dots), lit for each catch still available.
export function Meter({ left, cap, variant = "bar", className = "" }: { left: number; cap: number; variant?: "bar" | "dots"; className?: string }) {
  return (
    <div
      className={`meter ${variant === "dots" ? "meter--dots" : ""} ${className}`}
      style={{ gridTemplateColumns: `repeat(${cap}, ${variant === "dots" ? "6px" : "1fr"})` }}
      role="img"
      aria-label={`${left} of ${cap} catches left today`}
    >
      {Array.from({ length: cap }, (_, i) => (
        <span key={i} className={i < left ? "is-on" : ""} />
      ))}
    </div>
  );
}
