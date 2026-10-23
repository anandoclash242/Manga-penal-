/**
 * Core mask & image segmentation engine.
 * Pure pixel-level operations designed to run deterministically in both Node.js unit tests and browser.
 */

export interface PixelBuffer {
  width: number;
  height: number;
  data: Uint8ClampedArray | Uint8Array;
}

/**
 * Validates that an RGBA buffer has genuine transparent pixels (alpha < 255)
 * and at least some visible pixels (alpha > 0).
 */
export function validateTransparency(
  buffer: Uint8ClampedArray | Uint8Array
): { isTransparent: boolean; transparentPixelCount: number; visiblePixelCount: number } {
  let transparentPixelCount = 0;
  let visiblePixelCount = 0;
  const totalPixels = buffer.length / 4;

  for (let i = 3; i < buffer.length; i += 4) {
    const alpha = buffer[i];
    if (alpha === 0) {
      transparentPixelCount++;
    } else {
      visiblePixelCount++;
    }
  }

  return {
    isTransparent: transparentPixelCount > 0,
    transparentPixelCount,
    visiblePixelCount,
  };
}

/**
 * Creates an RGBA buffer where pixels inside mask retain original RGB and given alpha,
 * and pixels outside the mask are strictly transparent (alpha = 0).
 *
 * @param source Source image RGBA buffer
 * @param mask Grayscale mask array (0 = outside/transparent, 255 = inside/visible)
 */
export function applyMaskToSource(
  source: Uint8ClampedArray | Uint8Array,
  mask: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  featherRadius: number = 0
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(source.length);
  const totalPixels = width * height;

  let activeMask = mask;
  if (featherRadius > 0) {
    activeMask = featherMask(mask, width, height, featherRadius);
  }

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const maskVal = activeMask[i]; // 0 to 255

    if (maskVal === 0) {
      // Completely transparent
      output[idx] = 0;
      output[idx + 1] = 0;
      output[idx + 2] = 0;
      output[idx + 3] = 0;
    } else {
      // Preserve original source pixels
      output[idx] = source[idx];
      output[idx + 1] = source[idx + 1];
      output[idx + 2] = source[idx + 2];
      // Multiply original alpha by mask intensity for smooth antialiasing
      output[idx + 3] = Math.round((source[idx + 3] * maskVal) / 255);
    }
  }

  return output;
}

/**
 * Refines a character layer's alpha channel to eliminate background paper bleed,
 * white halos, and hard jagged boundaries.
 *
 * For character elements (hair, face, eyes, body, clothing, props):
 * 1. Preserves dark line art (ink lines where luminance < 75) at 100% opacity.
 * 2. Attenuates near-white/backdrop pixels near mask edges.
 * 3. Smooths boundary transitions with antialiased feathering.
 */
export function refineLayerAlpha(
  source: Uint8ClampedArray | Uint8Array,
  mask: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  category: string,
  featherRadius: number = 1
): Uint8ClampedArray {
  if (category === 'background') {
    return applyMaskToSource(source, mask, width, height, 0);
  }

  const output = new Uint8ClampedArray(source.length);
  const totalPixels = width * height;

  // Detect estimated background luminance by sampling corners
  let cornerLumaSum = 0;
  let cornerCount = 0;
  const samplePoints = [
    0, // top-left
    Math.min(width - 1, 10), // near top-left
    Math.max(0, width - 1), // top-right
    (height - 1) * width, // bottom-left
    (height - 1) * width + Math.max(0, width - 1), // bottom-right
  ];
  for (const p of samplePoints) {
    if (p >= 0 && p < totalPixels) {
      const idx = p * 4;
      const luma = 0.299 * source[idx] + 0.587 * source[idx + 1] + 0.114 * source[idx + 2];
      cornerLumaSum += luma;
      cornerCount++;
    }
  }
  const isLightBackground = cornerCount > 0 && cornerLumaSum / cornerCount > 200;

  // Smooth mask with feathering
  const smoothMask = featherRadius > 0 ? featherMask(mask, width, height, featherRadius) : mask;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const maskVal = smoothMask[i];

    if (maskVal === 0) {
      output[idx] = 0;
      output[idx + 1] = 0;
      output[idx + 2] = 0;
      output[idx + 3] = 0;
      continue;
    }

    const r = source[idx];
    const g = source[idx + 1];
    const b = source[idx + 2];
    const a = source[idx + 3];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;

    // Dark line art (black ink contour) is ALWAYS preserved at full opacity
    if (luma < 70) {
      output[idx] = r;
      output[idx + 1] = g;
      output[idx + 2] = b;
      output[idx + 3] = Math.round((a * Math.max(maskVal, 200)) / 255);
      continue;
    }

    // If light paper background and pixel is near-white (>242) with low color variance,
    // attenuate alpha proportionally if near mask boundary to avoid rectangular white frames
    if (
      isLightBackground &&
      r > 242 &&
      g > 242 &&
      b > 242 &&
      Math.abs(r - g) < 10 &&
      Math.abs(g - b) < 10
    ) {
      const edgeWeight = maskVal / 255;
      if (edgeWeight < 0.95) {
        output[idx] = 0;
        output[idx + 1] = 0;
        output[idx + 2] = 0;
        output[idx + 3] = 0;
        continue;
      }
    }

    output[idx] = r;
    output[idx + 1] = g;
    output[idx + 2] = b;
    output[idx + 3] = Math.round((a * maskVal) / 255);
  }

  return output;
}

/**
 * Feathers (blurs) a 1D grayscale mask to soften hard edges for antialiasing.
 */
export function featherMask(
  mask: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray {
  if (radius <= 0) return new Uint8ClampedArray(mask);

  const r = Math.min(Math.max(1, Math.round(radius)), 10);
  const target = new Uint8ClampedArray(mask.length);
  const temp = new Float32Array(mask.length);

  // Horizontal blur pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      const xStart = Math.max(0, x - r);
      const xEnd = Math.min(width - 1, x + r);
      for (let k = xStart; k <= xEnd; k++) {
        sum += mask[rowOffset + k];
        count++;
      }
      temp[rowOffset + x] = sum / count;
    }
  }

  // Vertical blur pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0;
      let count = 0;
      const yStart = Math.max(0, y - r);
      const yEnd = Math.min(height - 1, y + r);
      for (let k = yStart; k <= yEnd; k++) {
        sum += temp[k * width + x];
        count++;
      }
      target[y * width + x] = Math.min(255, Math.max(0, Math.round(sum / count)));
    }
  }

  return target;
}

/**
 * Dilates (expands) or Erodes (contracts) a binary or grayscale mask.
 * amount > 0: Expand (Dilation)
 * amount < 0: Contract (Erosion)
 */
export function morphologicalOperation(
  mask: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  amount: number
): Uint8ClampedArray {
  if (amount === 0) return new Uint8ClampedArray(mask);

  const isDilation = amount > 0;
  const r = Math.min(Math.abs(amount), 15);
  const result = new Uint8ClampedArray(mask.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let extremeVal = isDilation ? 0 : 255;

      for (let dy = -r; dy <= r; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r) continue; // Circular kernel
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;

          const val = mask[ny * width + nx];
          if (isDilation) {
            if (val > extremeVal) extremeVal = val;
          } else {
            if (val < extremeVal) extremeVal = val;
          }
        }
      }

      result[idx] = extremeVal;
    }
  }

  return result;
}

/**
 * Inverts a mask (255 - val).
 */
export function invertMask(mask: Uint8ClampedArray | Uint8Array): Uint8ClampedArray {
  const result = new Uint8ClampedArray(mask.length);
  for (let i = 0; i < mask.length; i++) {
    result[i] = 255 - mask[i];
  }
  return result;
}

/**
 * Rasterizes a polygon contour (list of [x, y] in percentage 0..1000) into a grayscale mask buffer.
 */
export function rasterizePolygon(
  polygon: [number, number][],
  width: number,
  height: number
): Uint8ClampedArray {
  const mask = new Uint8ClampedArray(width * height);
  if (!polygon || polygon.length < 3) return mask;

  // Scale polygon points from 0..1000 to pixel dimensions
  const points = polygon.map(([px, py]) => [
    (px / 1000) * width,
    (py / 1000) * height,
  ]);

  // Scanline polygon fill algorithm
  let minY = height;
  let maxY = 0;
  for (const [, y] of points) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  minY = Math.max(0, Math.floor(minY));
  maxY = Math.min(height - 1, Math.ceil(maxY));

  for (let y = minY; y <= maxY; y++) {
    const nodeX: number[] = [];
    let j = points.length - 1;

    for (let i = 0; i < points.length; i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];

      if ((yi < y && yj >= y) || (yj < y && yi >= y)) {
        nodeX.push(xi + ((y - yi) / (yj - yi)) * (xj - xi));
      }
      j = i;
    }

    nodeX.sort((a, b) => a - b);

    for (let k = 0; k < nodeX.length; k += 2) {
      if (k + 1 >= nodeX.length) break;
      const startX = Math.max(0, Math.ceil(nodeX[k]));
      const endX = Math.min(width - 1, Math.floor(nodeX[k + 1]));

      for (let x = startX; x <= endX; x++) {
        mask[y * width + x] = 255;
      }
    }
  }

  return mask;
}

/**
 * Calculates the bounding box of non-transparent pixels in an RGBA buffer.
 */
export function getBoundingBox(
  buffer: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = buffer[(y * width + x) * 4 + 3];
      if (alpha > 5) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}
