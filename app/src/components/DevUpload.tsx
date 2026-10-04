import { fileShot, type Shot } from "../lib/capture";

// PC TESTING ONLY. Lets you catch with a saved photo when there is no camera.
// Shown only in development builds (import.meta.env.DEV), so it never ships.
// To remove: delete this file and the <DevUpload /> line in screens/CameraScreen.tsx.
export default function DevUpload({ onPhoto, disabled }: { onPhoto: (shot: Shot) => void; disabled?: boolean }) {
  if (!import.meta.env.DEV) return null;
  return (
    <label
      className={`absolute right-3 bottom-3 z-10 cursor-pointer rounded-full border border-white/20 bg-black/55 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur-md transition hover:bg-black/70 ${
        disabled ? "pointer-events-none opacity-40" : ""
      }`}
    >
      Upload photo (testing)
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPhoto(await fileShot(file));
        }}
      />
    </label>
  );
}
