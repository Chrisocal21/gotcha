import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCard, getCollection, getStatus, sendCatch, type Card, type CatchResult, type Collection, type Status } from "./lib/api";
import { neighbors, position } from "./lib/browse";
import type { Shot } from "./lib/capture";
import { useAutoHide } from "./lib/hooks";
import { findEgg, useEggs, useKeyEggs } from "./lib/eggs";
import { hasSeenWelcome, markWelcomeSeen } from "./lib/prefs";
import { computeProgress } from "./lib/progress";
import { navigate, useRoute } from "./lib/router";
import EggToast from "./components/EggToast";
import Welcome from "./components/Welcome";
import { MobileTopBar, TabBar, TopNav, type Screen } from "./components/AppShell";
import CameraScreen from "./screens/CameraScreen";
import CardDetail from "./screens/CardDetail";
import CatchFlow from "./screens/CatchFlow";
import CollectionScreen from "./screens/CollectionScreen";
import CustomizeScreen from "./screens/CustomizeScreen";
import ExplorerScreen from "./screens/ExplorerScreen";
import SettingsScreen from "./screens/SettingsScreen";

interface ActiveCatch {
  photoUrl: string;
  original: Blob;
  request: Promise<CatchResult>;
  before: Card[] | null; // the collection as it was, so the catch can show what it earned
}

const SCREENS: Screen[] = ["collection", "explorer", "settings", "customize"];

export default function App() {
  const route = useRoute();
  const [status, setStatus] = useState<Status | null>(null);
  const [offline, setOffline] = useState(false);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [looseCard, setLooseCard] = useState<Card | null>(null);
  const [active, setActive] = useState<ActiveCatch | null>(null);
  const openedInApp = useRef(false);
  const [welcome, setWelcome] = useState(() => !hasSeenWelcome());
  const closeWelcome = () => {
    markWelcomeSeen();
    setWelcome(false);
  };

  const refreshStatus = useCallback(
    (): Promise<Status | null> =>
      getStatus()
        .then((s) => {
          setStatus(s);
          setOffline(false);
          return s;
        })
        .catch(() => {
          setOffline(true);
          return null;
        }),
    [],
  );
  const refreshCollection = useCallback(() => getCollection().then(setCollection).catch(() => {}), []);

  useEffect(() => {
    refreshStatus();
    refreshCollection();
    const onVisible = () => document.visibilityState === "visible" && refreshStatus();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshStatus, refreshCollection]);

  useEffect(() => {
    if (!offline) return;
    const t = setInterval(() => {
      refreshStatus();
      refreshCollection();
    }, 5000);
    return () => clearInterval(t);
  }, [offline, refreshStatus, refreshCollection]);

  // Levels, badges and field tasks all come from the cards, so they're recomputed whenever the collection changes.
  const eggs = useEggs();
  useKeyEggs();
  const progress = useMemo(
    () => (collection ? computeProgress(collection.cards, { cap: status?.cap ?? 10, eggs }) : null),
    [collection, status?.cap, eggs],
  );

  const [, section = "", cardId] = route.split("/");
  const screen: Screen = (SCREENS as string[]).includes(section) ? (section as Screen) : "camera";

  // The Customize page lives under Settings, so Settings stays highlighted in the navigation.
  const navScreen: Screen = screen === "customize" ? "settings" : screen;

  // Visiting every part of the app in one sitting is an easter egg.
  const visited = useRef(new Set<Screen>());
  useEffect(() => {
    visited.current.add(navScreen);
    if (["camera", "collection", "explorer", "settings"].every((s) => visited.current.has(s as Screen))) findEgg("e-wander");
  }, [navScreen]);

  // Each page (and each page under Settings) starts at the top.
  const pageKey = screen === "settings" ? `settings/${cardId ?? ""}` : screen;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pageKey]);

  useEffect(() => {
    const titles: Record<Screen, string> = {
      camera: "Gotcha",
      collection: "Collection · Gotcha",
      explorer: "Explorer · Gotcha",
      settings: "Settings · Gotcha",
      customize: "Customize · Gotcha",
    };
    document.title = titles[screen];
  }, [screen]);

  // The third part of the route is a card on Collection and Explorer, and a page on Settings.
  const detailId = screen === "collection" || screen === "explorer" ? cardId : undefined;

  // A card link can arrive before the collection includes it (or from outside the list).
  useEffect(() => {
    if (!detailId || !collection || collection.cards.some((c) => c.id === detailId)) return;
    getCard(detailId)
      .then(setLooseCard)
      .catch(() => navigate("/collection"));
  }, [detailId, collection]);

  const card = detailId
    ? (collection?.cards.find((c) => c.id === detailId) ?? (looseCard?.id === detailId ? looseCard : undefined))
    : undefined;

  function startCatch(shot: Shot) {
    const request = sendCatch(shot.upload).then((r) => {
      refreshStatus();
      if (r.status === "caught") refreshCollection();
      return r;
    });
    setActive({ photoUrl: URL.createObjectURL(shot.upload), original: shot.original, request, before: collection?.cards ?? null });
  }

  function endCatch(to?: string) {
    if (active) URL.revokeObjectURL(active.photoUrl);
    setActive(null);
    if (to) navigate(to);
  }

  function openCard(id: string) {
    openedInApp.current = true;
    navigate(`/${screen === "explorer" ? "explorer" : "collection"}/${id}`);
  }

  function closeCard() {
    if (openedInApp.current) {
      openedInApp.current = false;
      window.history.back();
    } else {
      navigate(`/${screen === "explorer" ? "explorer" : "collection"}`);
    }
  }

  const ids = collection?.cards.map((c) => c.id) ?? [];
  const onCamera = screen === "camera";
  const barsHidden = useAutoHide(route);

  return (
    <div className="min-h-dvh">
      <div className="hidden lg:block">
        <TopNav screen={navScreen} progress={progress} hidden={barsHidden} />
      </div>
      {!onCamera && (
        <div className="lg:hidden">
          <MobileTopBar progress={progress} hidden={barsHidden} />
        </div>
      )}

      {offline && (
        <div className="fade-in fixed top-20 left-1/2 z-[70] w-[calc(100%-32px)] max-w-[460px] -translate-x-1/2 rounded-2xl border border-line bg-paper px-4 py-3 text-[14px] text-ink-2 shadow-lift">
          Can't reach the Gotcha server.{import.meta.env.DEV ? " Start it with npm run dev." : " Trying again."}
        </div>
      )}

      <main>
        {screen === "camera" && (
          <CameraScreen status={status} collection={collection} progress={progress} onCapture={startCatch} onOpenCard={openCard} />
        )}
        {screen === "collection" && <CollectionScreen collection={collection} progress={progress} onOpenCard={openCard} />}
        {screen === "explorer" && <ExplorerScreen progress={progress} status={status} onOpenCard={openCard} />}
        {screen === "customize" && <CustomizeScreen />}
        {screen === "settings" && (
          <SettingsScreen
            topic={cardId}
            status={status}
            collection={collection}
            progress={progress}
            refreshStatus={refreshStatus}
            refreshCollection={refreshCollection}
            onShowWelcome={() => setWelcome(true)}
          />
        )}
      </main>

      {!onCamera && (
        <div className="lg:hidden">
          <TabBar screen={navScreen} hidden={barsHidden} />
        </div>
      )}

      {welcome && <Welcome onClose={closeWelcome} />}
      <EggToast />

      {card && (screen === "collection" || screen === "explorer") && (
        <CardDetail
          card={card}
          progress={progress}
          {...neighbors(card.id, ids)}
          {...position(card.id, ids)}
          onMove={(id) => window.location.replace(`#/${screen}/${id}`)}
          onClose={closeCard}
        />
      )}

      {active && (
        <CatchFlow
          key={active.photoUrl}
          photoUrl={active.photoUrl}
          original={active.original}
          request={active.request}
          before={active.before}
          status={status}
          onAgain={() => endCatch()}
          onCollection={() => endCatch("/collection")}
          onOpenCard={(id) => endCatch(`/collection/${id}`)}
          onExplorer={() => endCatch("/explorer")}
        />
      )}
    </div>
  );
}
