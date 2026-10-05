import { useEffect, useRef, useState, type ReactNode } from "react";
import { CardBack } from "./GameCard";
import { Button } from "./ui";

// Draft wording (open question in GOTCHA_OPEN_QUESTIONS.md). The camera shows the short form on one
// line; the welcome screen and Privacy and safety carry the full message.
export const DISTANCE_MESSAGE = "Keep your distance. Never approach snakes, stinging insects, or wild animals for a photo.";
const DISTANCE_SHORT = "Keep a safe distance from wild animals";

export type CameraState = "starting" | "ready" | "denied" | "busy" | "unavailable" | "insecure";

function stateForError(e: unknown): CameraState {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotReadableError" || name === "AbortError") return "busy";
  return "unavailable";
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>("starting");
  const [mirrored, setMirrored] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState(window.isSecureContext ? "unavailable" : "insecure");
      return;
    }
    let stream: MediaStream | null = null;
    let cancelled = false;
    setState("starting");
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false,
      })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        setMirrored(s.getVideoTracks()[0]?.getSettings().facingMode === "user");
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          video.play().catch(() => {});
        }
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn("Camera unavailable:", e);
        setState(stateForError(e));
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [attempt]);

  const retry = () => setAttempt((n) => n + 1);
  return { videoRef, state, setState, mirrored, retry };
}

export type Camera = ReturnType<typeof useCamera>;

const MESSAGES: Record<Exclude<CameraState, "ready" | "starting">, { title: string; body: string }> = {
  denied: {
    title: "Camera access is blocked",
    body: "Allow camera access for this site in your browser's site settings, then reload the page.",
  },
  busy: {
    title: "Your camera is busy",
    body: "Another app may be using it. Close that app, then try again.",
  },
  unavailable: {
    title: "No camera on this device",
    body: "Catching needs a live camera, like a phone or a webcam.",
  },
  insecure: {
    title: "Camera needs a secure page",
    body: "Open Gotcha on localhost or over https to use the camera.",
  },
};

export function Viewfinder({
  camera,
  flash = 0,
  onTestFrame,
  children,
}: {
  camera: Camera;
  flash?: number; // bump to fire the shutter flash again
  onTestFrame?: () => void;
  children?: ReactNode;
}) {
  const { videoRef, state, setState, mirrored, retry } = camera;
  const message = state !== "ready" && state !== "starting" ? MESSAGES[state] : null;

  return (
    <div className="viewfinder relative h-full w-full overflow-hidden bg-night">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedData={() => setState("ready")}
        className={`h-full w-full object-cover transition-opacity duration-500 ${state === "ready" ? "opacity-100" : "opacity-0"}`}
        style={mirrored ? { transform: "scaleX(-1)" } : undefined}
      />
      <div className="vignette" />

      {state === "ready" && (
        <div className="reticle fade-in">
          <span />
          <span />
          <span />
          <span />
        </div>
      )}

      {state === "starting" && (
        <div className="absolute inset-0 grid place-items-center text-sm text-white/60">
          <span className="animate-pulse">Starting camera</span>
        </div>
      )}

      {message && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(90%_70%_at_50%_35%,#16392d_0%,#0c1411_75%)] px-8 text-center">
          <div className="relative mb-8 h-[118px] w-[200px]" aria-hidden>
            <div className="absolute top-2 left-1/2 w-[76px] -translate-x-[95%] -rotate-[14deg]">
              <CardBack />
            </div>
            <div className="absolute top-2 left-1/2 w-[76px] -translate-x-[5%] rotate-[14deg]">
              <CardBack />
            </div>
            <div className="absolute top-0 left-1/2 w-[80px] -translate-x-1/2">
              <CardBack />
            </div>
          </div>
          <div className="font-display text-[24px] font-bold text-white">{message.title}</div>
          <p className="mt-2 max-w-[360px] text-[15px] leading-relaxed text-white/70">{message.body}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {state === "denied" && (
              <Button variant="sun" onClick={() => window.location.reload()}>
                Reload
              </Button>
            )}
            {(state === "busy" || state === "unavailable") && (
              <Button variant="sun" onClick={retry}>
                Try again
              </Button>
            )}
          </div>
          {state !== "denied" && onTestFrame && import.meta.env.DEV && (
            <button onClick={onTestFrame} className="mt-5 text-[13px] text-white/55 underline-offset-4 hover:text-white/80 hover:underline">
              Run a test catch without a camera
            </button>
          )}
        </div>
      )}

      {state === "ready" && (
        <div className="safety-note" title={DISTANCE_MESSAGE}>
          <span className="size-1.5 shrink-0 rounded-full bg-sun" />
          {DISTANCE_SHORT}
        </div>
      )}

      {children}
      {flash > 0 && <div key={flash} className="flash" />}
    </div>
  );
}
