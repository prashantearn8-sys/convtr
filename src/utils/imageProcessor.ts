/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ImageFormat, ImageProcessResult } from "../types";

/**
 * Reads a File as a Data URL (base64)
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Loads an image from a source URL
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Process image on canvas to compress and/or convert format
 */
export async function processImageClientSide(
  file: File,
  quality: number,
  scale: number,
  targetFormat: ImageFormat,
  rotation = 0
): Promise<ImageProcessResult> {
  const originalDataUrl = await readFileAsDataURL(file);
  const img = await loadImage(originalDataUrl);

  const angleRad = (rotation * Math.PI) / 180;
  const is90or270 = Math.abs(rotation % 180) === 90;

  const targetWidth = is90or270 ? Math.round(img.height * scale) : Math.round(img.width * scale);
  const targetHeight = is90or270 ? Math.round(img.width * scale) : Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not retrieve 2D context from canvas");
  }

  // Handle transparent background for non-transparent formats (like JPEG)
  if (targetFormat === "image/jpeg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Translate to center, rotate, and draw
  ctx.translate(targetWidth / 2, targetHeight / 2);
  ctx.rotate(angleRad);

  const drawWidth = Math.round(img.width * scale);
  const drawHeight = Math.round(img.height * scale);
  ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

  return new Promise((resolve, reject) => {
    // Note: BMP is usually outputted as PNG or simple base64, we can convert to canvas BMP blob if supported, or fall back
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas export failed"));
          return;
        }

        const url = URL.createObjectURL(blob);
        resolve({
          url,
          size: blob.size,
          width: targetWidth,
          height: targetHeight,
          format: targetFormat,
        });
      },
      targetFormat,
      targetFormat === "image/png" ? undefined : quality
    );
  });
}

/**
 * Compresses an image attempting to match a user-defined target size in Kilobytes (KB)
 */
export async function compressToTargetSizeKB(
  file: File,
  targetKB: number,
  targetFormat: ImageFormat
): Promise<ImageProcessResult> {
  const originalDataUrl = await readFileAsDataURL(file);
  const img = await loadImage(originalDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not retrieve 2D context from canvas");
  }

  if (targetFormat === "image/jpeg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, img.width, img.height);
  }

  ctx.drawImage(img, 0, 0, img.width, img.height);

  // If format is lossless like PNG, we can only adjust scale to control file size
  if (targetFormat === "image/png" || targetFormat === "image/bmp") {
    let currentScale = 1.0;
    let bestBlob: Blob | null = null;
    
    for (let step = 0; step < 5; step++) {
      const sw = Math.max(1, Math.round(img.width * currentScale));
      const sh = Math.max(1, Math.round(img.height * currentScale));
      
      const scanvas = document.createElement("canvas");
      scanvas.width = sw;
      scanvas.height = sh;
      const sctx = scanvas.getContext("2d");
      if (sctx) {
        sctx.drawImage(img, 0, 0, sw, sh);
        const blob: Blob = await new Promise((res) => scanvas.toBlob((b) => res(b!), targetFormat));
        bestBlob = blob;
        if (blob.size / 1024 <= targetKB) {
          break; 
        }
      }
      currentScale *= 0.8;
    }

    if (!bestBlob) {
      throw new Error("Could not output file");
    }

    return {
      url: URL.createObjectURL(bestBlob),
      size: bestBlob.size,
      width: Math.round(img.width * currentScale),
      height: Math.round(img.height * currentScale),
      format: targetFormat,
    };
  }

  // Lossy JPEG/WEBP Quality Binary Search
  let low = 0.05;
  let high = 1.0;
  let bestBlob: Blob | null = null;
  let closestDiff = Infinity;
  let finalScale = 1.0;

  // Run a quick binary search over quality settings
  for (let i = 0; i < 7; i++) {
    const mid = (low + high) / 2;
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), targetFormat, mid));
    const sizeKB = blob.size / 1024;
    const diff = Math.abs(sizeKB - targetKB);

    if (diff < closestDiff) {
      closestDiff = diff;
      bestBlob = blob;
    }

    if (sizeKB > targetKB) {
      high = mid; 
    } else {
      low = mid; 
    }
  }

  // If even at lowest quality the file is too big, let's downscale as a backup
  if (bestBlob && bestBlob.size / 1024 > targetKB * 1.1) {
    let currentScale = 0.8;
    for (let step = 0; step < 3; step++) {
      const sw = Math.max(1, Math.round(img.width * currentScale));
      const sh = Math.max(1, Math.round(img.height * currentScale));
      const scanvas = document.createElement("canvas");
      scanvas.width = sw;
      scanvas.height = sh;
      const sctx = scanvas.getContext("2d");
      if (sctx) {
        sctx.drawImage(img, 0, 0, sw, sh);
        const blob: Blob = await new Promise((res) => scanvas.toBlob((b) => res(b!), targetFormat, 0.4));
        bestBlob = blob;
        finalScale = currentScale;
        if (blob.size / 1024 <= targetKB) {
          break;
        }
      }
      currentScale *= 0.8;
    }
  }

  if (!bestBlob) {
    throw new Error("Image optimization pipeline error");
  }

  return {
    url: URL.createObjectURL(bestBlob),
    size: bestBlob.size,
    width: Math.round(img.width * finalScale),
    height: Math.round(img.height * finalScale),
    format: targetFormat,
  };
}

/**
 * Utility to format file sizes elegantly
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
