import { useSyncExternalStore } from "react";

// Install support. Chrome and Edge offer a one-tap install; iPhones need "Add to Home Screen" from the
// Share sheet. The browser's install event can fire before the app has drawn, so it's caught here, at load.

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: Prompt | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const standalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

export type InstallState = "installed" | "available" | "ios" | "manual";

function compute(): InstallState {
  if (installed || standalone()) return "installed";
  if (deferred) return "available";
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return "manual";
}

let state: InstallState = typeof window === "undefined" ? "manual" : compute();

export function initPwa() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as Prompt;
    state = compute();
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    state = compute();
    notify();
  });
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  }
}

export async function install() {
  if (!deferred) return;
  const p = deferred;
  deferred = null;
  state = compute();
  notify();
  await p.prompt();
  const { outcome } = await p.userChoice;
  if (outcome === "accepted") {
    installed = true;
    state = compute();
    notify();
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export const useInstallState = () => useSyncExternalStore(subscribe, () => state, () => "manual" as InstallState);
