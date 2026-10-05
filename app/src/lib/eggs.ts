import { useEffect, useRef, useSyncExternalStore } from "react";

// Easter eggs found by poking around the app. Kept on this device, and counted as mystery badges.

const KEY = "gotcha.eggs";

function load(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return new Set(Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

let found = load();
const listeners = new Set<() => void>();

export const getEggs = () => found;

export function findEgg(id: string) {
  if (found.has(id)) return;
  found = new Set(found).add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...found]));
  } catch {
    // The egg still counts for this visit.
  }
  listeners.forEach((l) => l());
  window.dispatchEvent(new CustomEvent("gotcha:egg", { detail: id }));
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export const useEggs = () => useSyncExternalStore(subscribe, getEggs);

// Counts taps in a quick run, for "tap it N times" eggs.
export function useTapCounter(id: string, taps: number) {
  const count = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  return () => {
    clearTimeout(timer.current);
    count.current++;
    if (count.current >= taps) {
      count.current = 0;
      findEgg(id);
    } else timer.current = setTimeout(() => (count.current = 0), 1500);
  };
}

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

// Keyboard eggs, active everywhere except while typing in a field.
export function useKeyEggs() {
  useEffect(() => {
    let pad = 0;
    let typed = "";
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pad = key === KONAMI[pad] ? pad + 1 : key === KONAMI[0] ? 1 : 0;
      if (pad === KONAMI.length) {
        pad = 0;
        findEgg("e-konami");
      }
      if (key.length === 1) {
        typed = (typed + key).slice(-6);
        if (typed === "gotcha") findEgg("e-word");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
