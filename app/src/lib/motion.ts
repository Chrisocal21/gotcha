import { useEffect, useRef } from "react";
import { getGyro } from "./prefs";

/*
  Shared physics for a card that feels held in the hand. Used by the card-in-hand view and the
  reveal screen, so a card moves the same way everywhere.
*/

export const MAX_X = 13; // degrees, tilting forward and back
export const MAX_Y = 17; // degrees, tilting left and right
// The card hangs in the air while the phone moves around it. Flip to 1 if phone motion feels inverted.
export const GYRO_SIGN = -1;
const LEAN = 0.7; // pixels the card slides per degree of tilt

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface Channel {
  x: number;
  v: number;
}
export const channel = (): Channel => ({ x: 0, v: 0 });

export function spring(c: Channel, target: number, dt: number, stiffness: number, damping: number) {
  c.v += (target - c.x) * stiffness * dt;
  c.v *= Math.pow(damping, dt);
  c.x += c.v * dt;
}

// A slow figure-of-eight drift, so a card at rest still looks alive.
export function idleDrift(now: number) {
  return { rx: Math.sin(now / 1100) * 1.1, ry: Math.cos(now / 1400) * 1.5, y: Math.sin(now / 1700) * 3 };
}

export interface Pose {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rz: number;
  scale?: number;
}

// Writes a pose to the card wrapper: its transform, plus the variables the glare, hologram and art depth read.
export function applyPose(el: HTMLElement, p: Pose) {
  const x = p.x + p.ry * LEAN;
  const y = p.y - p.rx * LEAN;
  el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${p.rz.toFixed(3)}deg) perspective(1100px) rotateX(${p.rx.toFixed(3)}deg) rotateY(${p.ry.toFixed(3)}deg) scale(${(p.scale ?? 1).toFixed(4)})`;
  el.style.setProperty("--gx", `${clamp(50 + p.ry * 2.8, 0, 100)}%`);
  el.style.setProperty("--gy", `${clamp(50 - p.rx * 2.8, 0, 100)}%`);
  el.style.setProperty("--hx", `${clamp(50 + p.ry * 3.4, 0, 100)}%`);
  el.style.setProperty("--hy", `${clamp(50 - p.rx * 3.4, 0, 100)}%`);
  // The art sits behind the surface, so it slides against the tilt (in card-width units).
  el.style.setProperty("--px", (-p.ry * 0.12).toFixed(3));
  el.style.setProperty("--py", (p.rx * 0.12).toFixed(3));
}

type Permissioned = { requestPermission?: () => Promise<string> };
const orientationEvent = () =>
  typeof DeviceOrientationEvent === "undefined" ? undefined : (DeviceOrientationEvent as unknown as Permissioned);

let asked = false;

// iPhone only lets a page read motion after a tap. Call this from a tap handler. It asks once.
export function askMotionPermission() {
  const D = orientationEvent();
  if (asked || !D?.requestPermission || !getGyro()) return;
  asked = true;
  D.requestPermission().catch(() => {
    asked = false; // not a real tap, so a later one can try again
  });
}

// How far the phone is tilted from how it was first held, in card degrees. Null until the phone reports motion.
export function useGyro() {
  const tilt = useRef<{ rx: number; ry: number } | null>(null);
  useEffect(() => {
    if (!getGyro() || !orientationEvent()) return;
    let b0: number | null = null;
    let g0: number | null = null;
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      b0 ??= e.beta;
      g0 ??= e.gamma;
      // The resting angle slowly follows how you hold the phone, so tilt is relative to that.
      b0 += (e.beta - b0) * 0.004;
      g0 += (e.gamma - g0) * 0.004;
      tilt.current = {
        rx: clamp((e.beta - b0) * 0.8 * GYRO_SIGN, -MAX_X, MAX_X),
        ry: clamp((e.gamma - g0) * 0.9 * GYRO_SIGN, -MAX_Y, MAX_Y),
      };
    };
    window.addEventListener("deviceorientation", onOrientation);
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }, []);
  return tilt;
}
