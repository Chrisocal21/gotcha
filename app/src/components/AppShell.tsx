import type { Progress } from "../lib/progress";
import { LevelBadge, XpBar } from "./game";
import { IconCollection, IconExplorer, IconSettings } from "./glyphs";
import { useTapCounter } from "../lib/eggs";
import Logo from "./Logo";

export type Screen = "camera" | "collection" | "explorer" | "settings" | "customize";

const NAV: { id: Screen; href: string; label: string }[] = [
  { id: "camera", href: "#/", label: "Catch" },
  { id: "collection", href: "#/collection", label: "Collection" },
  { id: "explorer", href: "#/explorer", label: "Explorer" },
];

/*
  Floating bars: fixed in place, glass over the page, out of the way while you scroll down.
  Pages leave room for them (see .page), so they never sit on top of content at rest.
*/

export function TopNav({ screen, progress, hidden }: { screen: Screen; progress: Progress | null; hidden: boolean }) {
  const tap = useTapCounter("e-logo", 7);
  return (
    <header className={`floatbar floatbar--top ${hidden ? "is-hidden" : ""}`}>
      <a href="#/" aria-label="Gotcha home" className="shrink-0" onClick={tap}>
        <Logo className="text-[26px]" />
      </a>
      <nav className="flex items-center gap-1">
        {NAV.map((n) => (
          <a key={n.id} href={n.href} className="nav-link" aria-current={screen === n.id ? "page" : undefined}>
            {n.label}
          </a>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-1.5">
        {progress && (
          <a
            href="#/explorer"
            className="explorer-chip"
            aria-label={`Explorer level ${progress.level}, ${progress.rank}`}
            aria-current={screen === "explorer" ? "page" : undefined}
          >
            <LevelBadge level={progress.level} ratio={progress.ratio} size={36} />
            <span className="flex w-[86px] flex-col gap-1.5">
              <span className="text-[13px] leading-none font-bold">{progress.rank}</span>
              <XpBar ratio={progress.ratio} className="!h-[5px]" />
            </span>
          </a>
        )}
        <a
          href="#/settings"
          className="icon-link"
          aria-label="Settings"
          title="Settings"
          aria-current={screen === "settings" || screen === "customize" ? "page" : undefined}
        >
          <IconSettings size={20} />
        </a>
      </div>
    </header>
  );
}

// Phones: on every screen except the camera, which draws its own controls.
export function MobileTopBar({ progress, hidden }: { progress: Progress | null; hidden: boolean }) {
  const tap = useTapCounter("e-logo", 7);
  return (
    <header className={`floatbar floatbar--mtop ${hidden ? "is-hidden" : ""}`}>
      <a href="#/" aria-label="Gotcha home" className="mr-auto" onClick={tap}>
        <Logo className="text-[23px]" />
      </a>
      {progress && (
        <a href="#/explorer" aria-label={`Explorer level ${progress.level}`} className="rounded-full">
          <LevelBadge level={progress.level} ratio={progress.ratio} size={34} />
        </a>
      )}
      <a href="#/settings" className="icon-link" aria-label="Settings">
        <IconSettings size={20} />
      </a>
    </header>
  );
}

// On the camera, the center orb is the shutter itself (onCatch), so every page shares the same bar.
export function TabBar({
  screen,
  hidden,
  onCatch,
  catchDisabled = false,
}: {
  screen: Screen;
  hidden: boolean;
  onCatch?: () => void;
  catchDisabled?: boolean;
}) {
  const orb = (
    <span className="shutter shutter--tab" aria-hidden>
      <span className="shutter__ring" />
      <span className="shutter__core" />
    </span>
  );
  return (
    <nav className={`tabbar ${hidden ? "is-hidden" : ""}`} aria-label="Main">
      <a href="#/collection" className="tab-link" aria-current={screen === "collection" ? "page" : undefined}>
        <IconCollection size={22} />
        Collection
      </a>
      {onCatch ? (
        <button className="tab-catch" aria-label="Catch" disabled={catchDisabled} onClick={onCatch}>
          {orb}
        </button>
      ) : (
        <a href="#/" className="tab-catch" aria-label="Catch">
          {orb}
        </a>
      )}
      <a href="#/explorer" className="tab-link" aria-current={screen === "explorer" ? "page" : undefined}>
        <IconExplorer size={22} />
        Explorer
      </a>
    </nav>
  );
}
