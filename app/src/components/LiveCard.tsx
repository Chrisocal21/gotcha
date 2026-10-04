import { useEffect, useRef, type MouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { prefersReducedMotion } from "../lib/hooks";
import { applyPose, askMotionPermission, channel, clamp, idleDrift, MAX_X, MAX_Y, spring, useGyro } from "../lib/motion";

/*
  Makes a card feel held rather than pasted on. While active it floats and breathes, leans toward a
  mouse or a dragging finger, tilts with the phone's motion, and casts a shadow that shifts with it.
  A burst gives it a jolt, for the moment a card lands.
*/
export default function LiveCard({ active, burst = 0, children }: { active: boolean; burst?: number; children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const hand = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const gyro = useGyro();
  const m = useRef({ y: channel(), rx: channel(), ry: channel(), s: channel() });
  const point = useRef<{ x: number; y: number } | null>(null);
  const drag = useRef({ on: false, sx: 0, sy: 0, moved: false });

  useEffect(() => {
    const el = hand.current;
    if (!active || !el) return;
    const reduced = prefersReducedMotion();

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") point.current = { x: e.clientX, y: e.clientY };
      else if (drag.current.on) {
        point.current = { x: e.clientX, y: e.clientY };
        if (Math.hypot(e.clientX - drag.current.sx, e.clientY - drag.current.sy) > 10) drag.current.moved = true;
      }
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      drag.current.on = false;
      point.current = null;
    };
    const onLeave = () => (point.current = null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);

    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(2.5, (now - last) / 16.67);
      last = now;
      const s = stage.current;
      if (s) {
        const c = m.current;
        const r = s.getBoundingClientRect();
        let tRx = 0;
        let tRy = 0;
        let tY = 0;
        if (!reduced) {
          const idle = idleDrift(now);
          tRx = idle.rx;
          tRy = idle.ry;
          tY = idle.y;
        }
        const p = point.current;
        if (p) {
          tRy = clamp((p.x - (r.left + r.width / 2)) / (r.width / 2), -1, 1) * MAX_Y;
          tRx = -clamp((p.y - (r.top + r.height / 2)) / (r.height / 2), -1, 1) * MAX_X;
        } else if (gyro.current && !reduced) {
          tRx += gyro.current.rx;
          tRy += gyro.current.ry;
        }

        const damping = reduced ? 0.5 : 0.76;
        spring(c.rx, tRx, dt, 0.14, damping);
        spring(c.ry, tRy, dt, 0.14, damping);
        spring(c.y, tY, dt, 0.08, 0.84);
        spring(c.s, 1, dt, 0.12, 0.8);
        applyPose(el, { x: 0, y: c.y.x, rx: c.rx.x, ry: c.ry.x, rz: 0, scale: c.s.x });

        const sh = shadow.current;
        if (sh) {
          // Higher and more tilted means a softer, smaller shadow that slides the other way.
          sh.style.transform = `translate3d(${(-c.ry.x * 1.2).toFixed(1)}px,${(14 + c.rx.x * 1.1 - c.y.x * 1.2).toFixed(1)}px,0) scale(${(1 + c.y.x * 0.012).toFixed(3)})`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      point.current = null;
      el.style.transform = "";
    };
  }, [active, gyro]);

  useEffect(() => {
    if (burst <= 0 || prefersReducedMotion()) return;
    const c = m.current;
    c.rx.v -= 2.2 * burst;
    c.ry.v += 1.6 * burst;
    c.y.v += 1.8 * burst;
    c.s.x = 1 + 0.05 * burst;
  }, [burst]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse") return;
    drag.current = { on: true, sx: e.clientX, sy: e.clientY, moved: false };
    point.current = { x: e.clientX, y: e.clientY };
    askMotionPermission();
  }

  // A tilt drag that ends on the card must not also count as a tap.
  function onClickCapture(e: MouseEvent<HTMLDivElement>) {
    if (!drag.current.moved) return;
    drag.current.moved = false;
    e.stopPropagation();
    e.preventDefault();
  }

  return (
    <div ref={stage} className={`live ${active ? "is-active" : ""}`}>
      <div ref={shadow} className="live__shadow" aria-hidden />
      <div
        ref={hand}
        className={`will-change-transform ${active ? "hand" : ""}`}
        style={active ? { touchAction: "none" } : undefined}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
