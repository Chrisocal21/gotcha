const MAX_SIDE = 1280;

export function toJpeg(source: CanvasImageSource, width: number, height: number): Promise<Blob> {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Capture failed"))), "image/jpeg", 0.85),
  );
}

// A catch has two copies of the photo. `upload` is shrunk for the AI. `original` is the full-quality
// frame, kept only on the person's own device so they can save it. It is never sent anywhere.
export interface Shot {
  upload: Blob;
  original: Blob;
}

function fullQuality(source: CanvasImageSource, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(source, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Capture failed"))), "image/jpeg", 0.95),
  );
}

export async function captureShot(video: HTMLVideoElement): Promise<Shot> {
  const { videoWidth: w, videoHeight: h } = video;
  const [upload, original] = await Promise.all([toJpeg(video, w, h), fullQuality(video, w, h)]);
  return { upload, original };
}

export async function fileShot(file: File): Promise<Shot> {
  const bitmap = await createImageBitmap(file);
  return { upload: await toJpeg(bitmap, bitmap.width, bitmap.height), original: file };
}

// Development only: a plain frame for machines without a camera. Mock mode ignores the pixels.
export async function testFrame(): Promise<Shot> {
  const blob = await testFrameBlob();
  return { upload: blob, original: blob };
}

function testFrameBlob(): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 1280;
  const g = canvas.getContext("2d")!;
  const fill = g.createLinearGradient(0, 0, 0, canvas.height);
  fill.addColorStop(0, "#3d5a48");
  fill.addColorStop(1, "#16211b");
  g.fillStyle = fill;
  g.fillRect(0, 0, canvas.width, canvas.height);
  return toJpeg(canvas, canvas.width, canvas.height);
}
