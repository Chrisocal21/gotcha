// Personal settings, kept in this browser. Every read and write is guarded because storage
// can be unavailable (private windows, blocked site data); the app then uses the defaults.

import { applyStyle, getStyle } from "./style";

export type Theme = "system" | "light" | "dark";

const KEYS = { theme: "gotcha.theme", motion: "gotcha.motion", haptics: "gotcha.haptics", welcomed: "gotcha.welcomed" };

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Nothing to do: the setting just won't persist.
  }
}

export const getTheme = (): Theme => {
  const v = read(KEYS.theme);
  return v === "light" || v === "dark" ? v : "system";
};

function isDark(theme: Theme) {
  return theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

export function applyTheme() {
  const theme = getTheme();
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDark(theme) ? "#0d1310" : "#e4ddcc");
}

export function setTheme(theme: Theme) {
  write(KEYS.theme, theme);
  applyTheme();
}

export const getReduceMotion = () => read(KEYS.motion) === "reduced";

export function setReduceMotion(on: boolean) {
  write(KEYS.motion, on ? "reduced" : "normal");
  applyMotion();
}

function applyMotion() {
  const root = document.documentElement;
  if (getReduceMotion()) root.setAttribute("data-motion", "reduced");
  else root.removeAttribute("data-motion");
}

export const getHaptics = () => read(KEYS.haptics) !== "off";
export const setHaptics = (on: boolean) => write(KEYS.haptics, on ? "on" : "off");
export const getAutoSave = () => read("gotcha.autosave") === "on";
export const setAutoSave = (on: boolean) => write("gotcha.autosave", on ? "on" : "off");

export const getGyro = () => read("gotcha.gyro") !== "off";
export const setGyro = (on: boolean) => write("gotcha.gyro", on ? "on" : "off");
export const canTiltWithPhone = () =>
  typeof window !== "undefined" && "DeviceOrientationEvent" in window && window.matchMedia("(pointer: coarse)").matches;

export const canVibrate = () => typeof navigator !== "undefined" && "vibrate" in navigator;

// The name on the Explorer page. Kept on this device until sign-in exists.
export const getExplorerName = () => read("gotcha.explorer")?.trim() ?? "";
export const setExplorerName = (name: string) => write("gotcha.explorer", name.trim().slice(0, 24));

export const hasSeenWelcome = () => read(KEYS.welcomed) === "yes";
export const markWelcomeSeen = () => write(KEYS.welcomed, "yes");

export function initPrefs() {
  applyTheme();
  applyMotion();
  applyStyle(getStyle());
  // In System mode, follow the device when it switches between light and dark.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
}
