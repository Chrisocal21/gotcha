import { getProfile, saveRemoteStyle } from "./api";
import { applyRemoteStyle, getStyle, getStyleAt, hasSavedStyle, setStyleListener } from "./style";

/*
  Keeps the person's look (colors, background design, fonts) on their account, so every device they
  sign in on matches. The newest change wins: each copy carries the time it was made, and whichever
  device changed last is the one the others follow.
*/

let timer: ReturnType<typeof setTimeout> | undefined;
let latest: { style: ReturnType<typeof getStyle>; at: number } | null = null;

async function push() {
  const job = latest;
  latest = null;
  if (!job) return;
  try {
    await saveRemoteStyle(job.style, job.at);
  } catch {
    // Offline or signed out: the next change (or the next sign-in check) sends it.
  }
}

// Compare this device's look with the account's and follow whichever is newer.
export async function syncStyle() {
  try {
    const profile = await getProfile();
    const remoteAt = profile?.styleAt ?? 0;
    const localAt = getStyleAt();
    if (profile?.style && remoteAt > localAt) applyRemoteStyle(profile.style, remoteAt);
    else if (hasSavedStyle() && (!profile?.style || localAt > remoteAt)) {
      latest = { style: getStyle(), at: localAt || Date.now() };
      await push();
    }
  } catch {
    // Offline: this device keeps its own look until the next check.
  }
}

// Start copying changes to the account, and check for changes made elsewhere when the app comes back.
export function startStyleSync(): () => void {
  setStyleListener((style, at) => {
    latest = { style, at };
    clearTimeout(timer);
    timer = setTimeout(push, 700); // wait for a pause, so dragging a color picker sends once
  });
  const onVisible = () => document.visibilityState === "visible" && syncStyle();
  document.addEventListener("visibilitychange", onVisible);
  syncStyle();
  return () => {
    setStyleListener(null);
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
