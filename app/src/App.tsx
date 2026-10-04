import { useCallback, useEffect, useRef, useState } from "react";
import { getCard, getCollection, getStatus, sendCatch, type Card, type CatchResult, type Collection, type Status } from "./lib/api";
import { neighbors, position } from "./lib/browse";
import type { Shot } from "./lib/capture";
import { hasSeenWelcome, markWelcomeSeen } from "./lib/prefs";
import { navigate, useRoute } from "./lib/router";
import Welcome from "./components/Welcome";
import { MobileTopBar, TabBar, TopNav, type Screen } from "./components/AppShell";
import CameraScreen from "./screens/CameraScreen";
import CardDetail from "./screens/CardDetail";
import CatchFlow from "./screens/CatchFlow";
import CollectionScreen from "./screens/CollectionScreen";
import CustomizeScreen from "./screens/CustomizeScreen";
import SettingsScreen from "./screens/SettingsScreen";

interface ActiveCatch {
  photoUrl: string;
  original: Blob;
  request: Promise<CatchResult>;
}

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

  const [, section = "", cardId] = route.split("/");
  const screen: Screen = section === "collection" || section === "settings" || section === "customize" ? section : "camera";

  // The Customize page lives under Settings, so Settings stays highlighted in the navigation.
  const navScreen: Screen = screen === "customize" ? "settings" : screen;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  useEffect(() => {
    const titles: Record<Screen, string> = { camera: "Gotcha", collection: "Collection · Gotcha", settings: "Settings · Gotcha", customize: "Customize · Gotcha" };
    document.title = titles[screen];
  }, [screen]);

  // A card link can arrive before the collection includes it (or from outside the list).
  useEffect(() => {
    if (!cardId || !collection || collection.cards.some((c) => c.id === cardId)) return;
    getCard(cardId)
      .then(setLooseCard)
      .catch(() => navigate("/collection"));
  }, [cardId, collection]);

  const card = cardId
    ? (collection?.cards.find((c) => c.id === cardId) ?? (looseCard?.id === cardId ? looseCard : undefined))
    : undefined;

  function startCatch(shot: Shot) {
    const request = sendCatch(shot.upload).then((r) => {
      refreshStatus();
      if (r.status === "caught") refreshCollection();
      return r;
    });
    setActive({ photoUrl: URL.createObjectURL(shot.upload), original: shot.original, request });
  }

  function endCatch(to?: string) {
    if (active) URL.revokeObjectURL(active.photoUrl);
    setActive(null);
    if (to) navigate(to);
  }

  function openCard(id: string) {
    openedInApp.current = true;
    navigate(`/collection/${id}`);
  }

  function closeCard() {
    if (openedInApp.current) {
      openedInApp.current = false;
      window.history.back();
    } else {
      navigate("/collection");
    }
  }

  return (
    <div className="min-h-dvh">
      <TopNav screen={navScreen} status={status} />
      <MobileTopBar status={status} />

      {offline && (
        <div className="fade-in fixed top-20 left-1/2 z-[70] w-[calc(100%-32px)] max-w-[460px] -translate-x-1/2 rounded-2xl border border-line bg-paper px-4 py-3 text-[14px] text-ink-2 shadow-lift">
          Can't reach the Gotcha server.{import.meta.env.DEV ? " Start it with npm run dev." : " Trying again."}
        </div>
      )}

      <main>
        {screen === "camera" && (
          <CameraScreen status={status} collection={collection} onCapture={startCatch} onOpenCard={openCard} />
        )}
        {screen === "collection" && <CollectionScreen collection={collection} onOpenCard={openCard} />}
        {screen === "customize" && <CustomizeScreen />}
        {screen === "settings" && (
          <SettingsScreen
            status={status}
            collection={collection}
            refreshStatus={refreshStatus}
            refreshCollection={refreshCollection}
            onShowWelcome={() => setWelcome(true)}
          />
        )}
      </main>

      <TabBar screen={navScreen} />

      {welcome && <Welcome onClose={closeWelcome} />}

      {card && screen === "collection" && (
        <CardDetail
          card={card}
          {...neighbors(card.id, collection?.cards.map((c) => c.id) ?? [])}
          {...position(card.id, collection?.cards.map((c) => c.id) ?? [])}
          onMove={(id) => window.location.replace(`#/collection/${id}`)}
          onClose={closeCard}
        />
      )}

      {active && (
        <CatchFlow
          key={active.photoUrl}
          photoUrl={active.photoUrl}
          original={active.original}
          request={active.request}
          status={status}
          onAgain={() => endCatch()}
          onCollection={() => endCatch("/collection")}
          onOpenCard={(id) => endCatch(`/collection/${id}`)}
        />
      )}
    </div>
  );
}


