import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type TouchEvent } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced");

// Re-renders on an interval so countdowns stay current.
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useCountUp(target: number, run: boolean, ms = 1100): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) {
      setValue(0);
      return;
    }
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, run, ms]);
  return value;
}

// Horizontal swipe, by finger on touch screens or by dragging with a mouse.
// Swiping left calls onLeft, swiping right calls onRight. A drag never counts as a click.
export function useSwipe(onLeft: () => void, onRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  function finish(x: number, y: number) {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = x - s.x;
    const dy = y - s.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    swiped.current = true;
    if (dx < 0) onLeft();
    else onRight();
  }

  return {
    onTouchStart: (e: TouchEvent<HTMLElement>) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (e: TouchEvent<HTMLElement>) => {
      const t = e.changedTouches[0];
      finish(t.clientX, t.clientY);
    },
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse") start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse") finish(e.clientX, e.clientY);
    },
    // Runs before the card's own click handler, so a swipe doesn't also flip or open the card.
    onClickCapture: (e: MouseEvent<HTMLElement>) => {
      if (!swiped.current) return;
      swiped.current = false;
      e.stopPropagation();
      e.preventDefault();
    },
  };
}

/*
  The floating bars step aside while you scroll down through a page and come back on any scroll up,
  near the top, or at the very end, like a native app. `key` resets them (pass the current screen).
*/
export function useAutoHide(key: string): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    setHidden(false);
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = Math.max(0, window.scrollY);
        const dy = y - last;
        const atEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 8;
        if (y < 72 || atEnd) setHidden(false);
        else if (dy > 8) setHidden(true);
        else if (dy < -8) setHidden(false);
        if (Math.abs(dy) > 8) last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [key]);
  return hidden;
}

export function useEscape(onEscape: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onEscape();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onEscape]);
}
