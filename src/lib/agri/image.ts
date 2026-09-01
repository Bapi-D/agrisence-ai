import type { PixelPayload } from "./logic";

const SIZE = 72;

/** Downsample any image source to a compact RGB buffer for server-side analysis. */
export function sampleImage(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
): PixelPayload {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(source as CanvasImageSource, 0, 0, SIZE, SIZE);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  const pixels: number[] = new Array(SIZE * SIZE * 3);
  for (let i = 0; i < SIZE * SIZE; i++) {
    pixels[i * 3] = data[i * 4]!;
    pixels[i * 3 + 1] = data[i * 4 + 1]!;
    pixels[i * 3 + 2] = data[i * 4 + 2]!;
  }
  return { width: SIZE, height: SIZE, pixels };
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

export function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read frame"));
    img.src = dataUrl;
  });
}
