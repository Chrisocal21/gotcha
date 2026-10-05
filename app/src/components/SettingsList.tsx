import type { LucideProps } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { IconNext, IconPrev } from "./glyphs";

// Building blocks for settings screens, laid out like a phone's settings app: grouped rows, each with a
// colored icon tile, and a chevron when the row opens something.

type Glyph = ComponentType<LucideProps>;

export function Group({ title, footer, children }: { title?: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <section className="settings-section">
      {title && <h2 className="settings-caption">{title}</h2>}
      <div className="settings-group">{children}</div>
      {footer && <p className="settings-footer">{footer}</p>}
    </section>
  );
}

export function Tile({ icon: Icon, tone }: { icon: Glyph; tone: string }) {
  return (
    <span className="settings-tile" style={{ background: tone }} aria-hidden>
      <Icon size={17} strokeWidth={2.2} />
    </span>
  );
}

export function Row({
  icon,
  tone,
  title,
  detail,
  children,
  href,
  onClick,
}: {
  icon: Glyph;
  tone: string;
  title: string;
  detail?: ReactNode;
  children?: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const opens = href != null || onClick != null;
  const inner = (
    <>
      <Tile icon={icon} tone={tone} />
      <span className="settings-row__text">
        <span className="settings-row__title">{title}</span>
        {detail && <span className="settings-row__detail">{detail}</span>}
      </span>
      {children != null && <span className="settings-row__end">{children}</span>}
      {opens && <IconNext size={18} className="settings-row__chevron" />}
    </>
  );
  if (href != null)
    return (
      <a href={href} className="settings-row is-link">
        {inner}
      </a>
    );
  if (onClick)
    return (
      <button onClick={onClick} className="settings-row is-link">
        {inner}
      </button>
    );
  return <div className="settings-row">{inner}</div>;
}

// The top of a page reached from Settings: a way back, then the title.
export function SubpageHeader({ title, back = "#/settings", backLabel = "Settings" }: { title: string; back?: string; backLabel?: string }) {
  return (
    <div className="mb-6">
      <a href={back} className="-ml-1.5 inline-flex items-center gap-0.5 text-[15px] font-semibold text-canopy hover:underline">
        <IconPrev size={20} />
        {backLabel}
      </a>
      <h1 className="mt-2 font-display text-[30px] leading-none font-extrabold tracking-tight lg:text-[36px]">{title}</h1>
    </div>
  );
}
