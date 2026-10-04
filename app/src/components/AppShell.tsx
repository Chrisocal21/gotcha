import type { Status } from "../lib/api";
import Logo from "./Logo";
import { Meter } from "./ui";

export type Screen = "camera" | "collection" | "settings" | "customize";

const NAV: { id: Screen; href: string; label: string }[] = [
  { id: "camera", href: "#/", label: "Catch" },
  { id: "collection", href: "#/collection", label: "Collection" },
];

function TodayPill({ status, compact = false }: { status: Status; compact?: boolean }) {
  return (
    <div
      className="inline-flex h-10 items-center gap-3 rounded-full border border-line bg-paper px-4 shadow-soft"
      title={`${status.left} of ${status.cap} catches left today`}
    >
      <span className="text-[13.5px] font-semibold tabular">
        {status.left}
        <span className="font-medium text-ink-3"> {compact ? "left" : `of ${status.cap} left`}</span>
      </span>
      {!compact && <Meter left={status.left} cap={status.cap} variant="dots" />}
    </div>
  );
}

export function TopNav({ screen, status }: { screen: Screen; status: Status | null }) {
  return (
    <header className="sticky top-0 z-30 hidden border-b border-line bg-sand/80 backdrop-blur-xl lg:block">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-10">
        <a href="#/" aria-label="Gotcha home" className="shrink-0">
          <Logo className="text-[27px]" />
        </a>
        <nav className="flex items-center gap-1">
          {NAV.map((n) => (
            <a key={n.id} href={n.href} className="nav-link" aria-current={screen === n.id ? "page" : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          
          {status && status.streak >= 2 && (
            <span className="inline-flex h-10 items-center rounded-full border border-line bg-paper px-4 text-[13.5px] font-semibold shadow-soft">
              {status.streak} day streak
            </span>
          )}
          {status && <TodayPill status={status} />}
          <a href="#/settings" className="nav-link" aria-current={screen === "settings" ? "page" : undefined}>
            Settings
          </a>
        </div>
      </div>
    </header>
  );
}

export function MobileTopBar({ status }: { status: Status | null }) {
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-line bg-sand/85 backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <a href="#/" aria-label="Gotcha home">
          <Logo className="text-[25px]" />
        </a>
        {status && <TodayPill status={status} compact />}
      </div>
    </header>
  );
}

export function TabBar({ screen }: { screen: Screen }) {
  const tabs = [...NAV, { id: "settings" as Screen, href: "#/settings", label: "Settings" }];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-[560px]">
        {tabs.map((t) => (
          <a key={t.id} href={t.href} className="tab-link" aria-current={screen === t.id ? "page" : undefined}>
            {t.label}
          </a>
        ))}
      </div>
    </nav>
  );
}


