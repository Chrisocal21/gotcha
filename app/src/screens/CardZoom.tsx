import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import type { Card } from "../lib/api";
import { prefersReducedMotion } from "../lib/hooks";
import { getGyro } from "../lib/prefs";
import { haptic, sfx } from "../lib/sfx";
import { CardFront, CardStats } from "../components/GameCard";
import { IconClose } from "../components/icons";
import { IconButton } from "../components/ui";

/*
  The card in your hand. One wrapper holds both sides of the card, so front and back move together:
  - It leans toward your pointer or finger, with springy physics, and drifts gently when idle.
  - On phones it also tilts with the phone's motion.
  - Drag it sideways and it follows your finger, then flies off to the next card (or springs back).
  - Tap to turn it over.
*/

const MAX_X = 13; // degrees, tilting forward and back
const MAX_Y = 17; // degrees, tilting left and right
const GYRO_SIGN = 1; // flip to -1 if phone motion feels inverted
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface Channel {
  x: number;
  v: number;
}
const channel = (): Channel => ({ x: 0, v: 0 });

function spring(c: Channel, target: number, dt: number, stiffness: number, damping: number) {
  c.v += (target - c.x) * stiffness * dt;
  c.v *= Math.pow(damping, dt);
  c.x += c.v * dt;
}

interface Props {
  card: Card;
  prev: string | null;
  next: string | null;
  index: number;
  total: number;
  onMove: (id: string) => void;
  onClose: () => void;
}

export default function CardZoom({ card, prev, next, index, total, onMove, onClose }: Props) {
  const [flipped, setFlipped] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const hand = useRef<HTMLDivElement>(null);

  // Latest props for the animation loop and handlers, which are set up once.
  const live = useRef({ prev, next, onMove, onClose });
  live.current = { prev, next, onMove, onClose };

  const motion = useRef({ x: channel(), rx: channel(), ry: channel(), rz: channel() });
  const ptr = useRef({ down: false, inside: false, mode: "none" as "none" | "swipe", sx: 0, sy: 0, x: 0, y: 0, t0: 0, vx: 0, lastX: 0, lastT: 0 });
  const hover = useRef<{ x: number; y: number } | null>(null);
  const gyro = useRef<{ rx: number; ry: number } | null>(null);
  const commit = useRef<{ dir: 1 | -1; id: string } | null>(null);
  const askedGyro = useRef(false);

  function flip() {
    setFlipped((f) => !f);
    sfx.flip();
    haptic(10);
  }

  // dir -1: this card leaves to the left and the next one arrives. dir 1: leaves right, the previous one arrives.
  function go(dir: 1 | -1) {
    const id = dir < 0 ? live.current.next : live.current.prev;
    if (commit.current) return;
    if (!id) {
      motion.current.x.v += dir * -14; // a small bump: there is nothing further that way
      haptic(6);
      return;
    }
    commit.current = { dir, id };
    setFlipped(false);
    sfx.swipe();
    haptic(8);
  }

  // Animation loop.
  useEffect(() => {
    const reduced = prefersReducedMotion();
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = Math.min(2.5, (now - last) / 16.67);
      last = now;
      const m = motion.current;
      const p = ptr.current;
      const s = stage.current;
      const h = hand.current;
      if (s && h) {
        const r = s.getBoundingClientRect();
        let tRx = 0;
        let tRy = 0;
        let tX = 0;
        let tRz = 0;

        if (!reduced) {
          tRx += Math.sin(now / 1100) * 1.1;
          tRy += Math.cos(now / 1400) * 1.5;
        }
        const point = p.down ? { x: p.x, y: p.y } : hover.current;
        if (point) {
          tRy = clamp((point.x - (r.left + r.width / 2)) / (r.width / 2), -1, 1) * MAX_Y;
          tRx = -clamp((point.y - (r.top + r.height / 2)) / (r.height / 2), -1, 1) * MAX_X;
        } else if (gyro.current && !reduced) {
          tRx += gyro.current.rx;
          tRy += gyro.current.ry;
        }

        if (p.down && p.mode === "swipe") {
          const dx = p.x - p.sx;
          const hasNeighbor = dx < 0 ? live.current.next : live.current.prev;
          tX = hasNeighbor ? dx : dx * 0.25; // resists when there is no card that way
          tRz = (tX / r.width) * 14;
        }
        if (commit.current) {
          tX = commit.current.dir * window.innerWidth * 1.15;
          tRz = commit.current.dir * 20;
        }

        spring(m.rx, tRx, dt, 0.14, reduced ? 0.5 : 0.76);
        spring(m.ry, tRy, dt, 0.14, reduced ? 0.5 : 0.76);
        spring(m.x, tX, dt, commit.current ? 0.1 : 0.13, 0.78);
        spring(m.rz, tRz, dt, 0.13, 0.78);

        if (commit.current && Math.abs(m.x.x) > window.innerWidth * 0.8) {
          const { dir, id } = commit.current;
          commit.current = null;
          live.current.onMove(id);
          // The new card arrives from the opposite side and springs into place.
          m.x.x = -dir * window.innerWidth * 0.55;
          m.x.v = 0;
          m.rz.x = -dir * 14;
          m.rz.v = 0;
        }

        h.style.transform = `translate3d(${m.x.x.toFixed(2)}px,0,0) rotate(${m.rz.x.toFixed(3)}deg) perspective(1100px) rotateX(${m.rx.x.toFixed(3)}deg) rotateY(${m.ry.x.toFixed(3)}deg)`;
        h.style.setProperty("--gx", `${clamp(50 + m.ry.x * 2.8, 0, 100)}%`);
        h.style.setProperty("--gy", `${clamp(50 - m.rx.x * 2.8, 0, 100)}%`);
        h.style.setProperty("--hx", `${clamp(50 + m.ry.x * 3.4, 0, 100)}%`);
        h.style.setProperty("--hy", `${clamp(50 - m.rx.x * 3.4, 0, 100)}%`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Phone motion. On iPhone, permission has to be asked from a tap (see onPointerDown).
  function attachGyro() {
    let b0: number | null = null;
    let g0: number | null = null;
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      b0 ??= e.beta;
      g0 ??= e.gamma;
      // The resting angle slowly follows how you hold the phone, so tilt is relative to that.
      b0 += (e.beta - b0) * 0.015;
      g0 += (e.gamma - g0) * 0.015;
      gyro.current = {
        rx: clamp((e.beta - b0) * 0.8 * GYRO_SIGN, -MAX_X, MAX_X),
        ry: clamp((e.gamma - g0) * 0.9 * GYRO_SIGN, -MAX_Y, MAX_Y),
      };
    };
    window.addEventListener("deviceorientation", onOrientation);
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }

  useEffect(() => {
    const D = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
    if (!D || !getGyro() || D.requestPermission) return; // iPhone: wait for a tap
    return attachGyro();
  }, []);

  // Keep the screen awake while someone is looking at a card.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    return () => void lock?.release().catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(1);
      else if (e.key === "ArrowRight") go(-1);
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isNodrag = (t: EventTarget) => t instanceof Element && !!t.closest("[data-nodrag]");

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (isNodrag(e.target)) return;
    const r = stage.current?.getBoundingClientRect();
    const p = ptr.current;
    p.down = true;
    p.inside = !!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    p.mode = "none";
    p.sx = p.x = p.lastX = e.clientX;
    p.sy = p.y = e.clientY;
    p.t0 = p.lastT = e.timeStamp;
    p.vx = 0;
    e.currentTarget.setPointerCapture(e.pointerId);

    const D = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
    if (e.pointerType === "touch" && D?.requestPermission && getGyro() && !askedGyro.current) {
      askedGyro.current = true;
      D.requestPermission().then((res) => res === "granted" && attachGyro()).catch(() => {});
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse") hover.current = { x: e.clientX, y: e.clientY };
    const p = ptr.current;
    if (!p.down) return;
    p.x = e.clientX;
    p.y = e.clientY;
    const dt = e.timeStamp - p.lastT;
    if (dt > 0) p.vx = 0.7 * p.vx + 0.3 * ((e.clientX - p.lastX) / dt);
    p.lastX = e.clientX;
    p.lastT = e.timeStamp;
    if (p.mode === "none") {
      const dx = e.clientX - p.sx;
      const dy = e.clientY - p.sy;
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 0.9) p.mode = "swipe";
    }
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const p = ptr.current;
    if (!p.down) return;
    p.down = false;
    if (e.pointerType !== "mouse") hover.current = null;
    const dx = e.clientX - p.sx;
    const dy = e.clientY - p.sy;

    if (p.mode === "swipe") {
      const width = stage.current?.getBoundingClientRect().width ?? 300;
      const fling = Math.abs(p.vx) > 0.5;
      if (Math.abs(dx) > width * 0.25 || fling) go((fling ? p.vx : dx) < 0 ? -1 : 1);
      return;
    }
    // A tap (barely moved, quick): flip the card, or close if the tap was on the background.
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && e.timeStamp - p.t0 < 600) {
      if (p.inside) flip();
      else live.current.onClose();
    }
  }

  const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  return createPortal(
    <div
      className="fade-in fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[rgb(12_20_17_/_0.94)] backdrop-blur-md select-none"
      style={{ touchAction: "none" }}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.name}, in hand`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (ptr.current.down = false)}
      onPointerLeave={() => (hover.current = null)}
      onClick={(e) => e.stopPropagation()}
    >
      <div data-nodrag className="absolute top-3 right-3 left-4 flex items-center justify-between">
        <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-[12px] tracking-[0.08em] text-white/80 tabular-nums">
          {index >= 0 ? `${index + 1} of ${total}` : ""}
        </span>
        <IconButton label="Close" onClick={onClose} className="text-white hover:bg-white/10 hover:text-white">
          <IconClose />
        </IconButton>
      </div>

      <ArrowButton side="left" disabled={!prev} onClick={() => go(1)} />
      <ArrowButton side="right" disabled={!next} onClick={() => go(-1)} />

      <div ref={stage} className="relative" style={{ width: "min(94vw, calc((100dvh - 112px) / 1.4), 640px)" }}>
        <div ref={hand} className="hand is-tilting will-change-transform">
          <div className={`flip ${flipped ? "is-back" : ""}`}>
            <div className="flip__face" aria-hidden={flipped}>
              <CardFront card={card} />
            </div>
            <div className="flip__face flip__back" aria-hidden={!flipped}>
              <CardStats card={card} />
            </div>
          </div>
        </div>
      </div>

      <p className="pointer-events-none absolute right-0 bottom-4 left-0 text-center text-[12.5px] text-white/55">
        {touch ? "Tap to turn it over. Swipe for the next card." : "Click to turn it over. Drag or use the arrow keys for the next card."}
      </p>
    </div>,
    document.body,
  );
}

function ArrowButton({ side, disabled, onClick }: { side: "left" | "right"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      data-nodrag
      aria-label={side === "left" ? "Previous card" : "Next card"}
      disabled={disabled}
      onClick={onClick}
      className={`absolute top-1/2 z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-0 md:grid ${
        side === "left" ? "left-5" : "right-5"
      }`}
    >
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
