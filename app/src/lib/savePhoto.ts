import { getAutoSave } from "./prefs";

// Saves the person's original photo to their own device. Nothing is uploaded.
// "share" opens the phone's share sheet (which has Save Image). "download" saves a file directly.

const fileName = (name: string) => `gotcha-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "photo"}.jpg`;

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName(name);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export type SaveResult = "saved" | "cancelled";

export async function saveOriginal(blob: Blob, name: string, via: "share" | "download" = "share"): Promise<SaveResult> {
  const file = new File([blob], fileName(name), { type: blob.type || "image/jpeg" });
  if (via === "share" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return "saved";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
      // Sharing failed for another reason: fall through to a normal download.
    }
  }
  download(blob, name);
  return "saved";
}

export const shouldAutoSave = getAutoSave;
