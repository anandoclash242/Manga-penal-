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
 * Checks whether an RGB pixel matches light manga paper (white, off-white, cream, or light scan gray).
 */
export function isMangaPaperPixel(
  r: number,
  g: number,
  b: number,
  threshold: number = 228
): boolean {
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  if (luma < threshold) return false;
  // Check if it's neutral/paper-like (low saturation)
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  return saturation < 0.18; // Paper is neutral white/cream/gray
}

export interface PaperKnockoutOptions {
  paperThreshold?: number; // Cutoff for paper background (default 228)
  blackCutoff?: number; // Preserves dark ink strokes at 100% opacity (default 75)
  aggressiveWhiteKey?: boolean;
}

/**
 * Knocks out paper/white background from an RGBA buffer to produce true transparent alpha.
 * Uses perimeter flood-fill to eliminate exterior paper patches, followed by intelligent
 * color-to-alpha for manga line art antialiasing.
 */
export function knockoutPaperBackground(
  rgbaBuffer: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  options: PaperKnockoutOptions = {}
): Uint8ClampedArray {
  const threshold = options.paperThreshold ?? 228;
  const blackCutoff = options.blackCutoff ?? 75;
  const output = new Uint8ClampedArray(rgbaBuffer);
  const total = width * height;

  // 1. Flood-fill from borders and transparent boundaries to knock out exterior connected background
  const visited = new Uint8Array(total);
  const queue: number[] = [];

  // Seed boundary pixels that are paper-like
  for (let x = 0; x < width; x++) {
    // Top border
    const topIdx = x;
    if (
      rgbaBuffer[topIdx * 4 + 3] > 0 &&
      isMangaPaperPixel(rgbaBuffer[topIdx * 4], rgbaBuffer[topIdx * 4 + 1], rgbaBuffer[topIdx * 4 + 2], threshold - 20)
    ) {
      queue.push(topIdx);
      visited[topIdx] = 1;
    }
    // Bottom border
    const btmIdx = (height - 1) * width + x;
    if (
      rgbaBuffer[btmIdx * 4 + 3] > 0 &&
      isMangaPaperPixel(rgbaBuffer[btmIdx * 4], rgbaBuffer[btmIdx * 4 + 1], rgbaBuffer[btmIdx * 4 + 2], threshold - 20)
    ) {
      queue.push(btmIdx);
      visited[btmIdx] = 1;
    }
  }

  for (let y = 0; y < height; y++) {
    // Left border
    const leftIdx = y * width;
    if (
      visited[leftIdx] === 0 &&
      rgbaBuffer[leftIdx * 4 + 3] > 0 &&
      isMangaPaperPixel(rgbaBuffer[leftIdx * 4], rgbaBuffer[leftIdx * 4 + 1], rgbaBuffer[leftIdx * 4 + 2], threshold - 20)
    ) {
      queue.push(leftIdx);
      visited[leftIdx] = 1;
    }
    // Right border
    const rightIdx = y * width + (width - 1);
    if (
      visited[rightIdx] === 0 &&
      rgbaBuffer[rightIdx * 4 + 3] > 0 &&
      isMangaPaperPixel(rgbaBuffer[rightIdx * 4], rgbaBuffer[rightIdx * 4 + 1], rgbaBuffer[rightIdx * 4 + 2], threshold - 20)
    ) {
      queue.push(rightIdx);
      visited[rightIdx] = 1;
    }
  }

  // Also seed any pixel adjacent to an already transparent pixel (alpha == 0) that is paper-like
  for (let i = 0; i < total; i++) {
    if (visited[i] === 1) continue;
    if (rgbaBuffer[i * 4 + 3] === 0) continue;

    const x = i % width;
    const y = Math.floor(i / width);
    let hasTransparentNeighbor = false;
    if (x > 0 && rgbaBuffer[(i - 1) * 4 + 3] === 0) hasTransparentNeighbor = true;
    else if (x < width - 1 && rgbaBuffer[(i + 1) * 4 + 3] === 0) hasTransparentNeighbor = true;
    else if (y > 0 && rgbaBuffer[(i - width) * 4 + 3] === 0) hasTransparentNeighbor = true;
    else if (y < height - 1 && rgbaBuffer[(i + width) * 4 + 3] === 0) hasTransparentNeighbor = true;

    if (
      hasTransparentNeighbor &&
      isMangaPaperPixel(rgbaBuffer[i * 4], rgbaBuffer[i * 4 + 1], rgbaBuffer[i * 4 + 2], threshold - 20)
    ) {
      queue.push(i);
      visited[i] = 1;
    }
  }

  // Run BFS flood fill
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const cx = cur % width;
    const cy = Math.floor(cur / width);

    const neighbors = [
      cx > 0 ? cur - 1 : -1,
      cx < width - 1 ? cur + 1 : -1,
      cy > 0 ? cur - width : -1,
      cy < height - 1 ? cur + width : -1,
    ];

    for (const next of neighbors) {
      if (next === -1 || visited[next] === 1) continue;
      const nAlpha = rgbaBuffer[next * 4 + 3];
      if (nAlpha === 0) continue;

      const nr = rgbaBuffer[next * 4];
      const ng = rgbaBuffer[next * 4 + 1];
      const nb = rgbaBuffer[next * 4 + 2];

      if (isMangaPaperPixel(nr, ng, nb, threshold - 25)) {
        visited[next] = 1;
        queue.push(next);
      }
    }
  }

  // Knock out visited exterior connected paper pixels & apply color-to-alpha
  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    const origA = rgbaBuffer[idx + 3];

    if (origA === 0) {
      output[idx] = 0;
      output[idx + 1] = 0;
      output[idx + 2] = 0;
      output[idx + 3] = 0;
      continue;
    }

    if (visited[i] === 1) {
      // Exterior connected paper is 100% transparent
      output[idx] = 0;
      output[idx + 1] = 0;
      output[idx + 2] = 0;
      output[idx + 3] = 0;
      continue;
    }

    const r = rgbaBuffer[idx];
    const g = rgbaBuffer[idx + 1];
    const b = rgbaBuffer[idx + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;

    // Dark ink line art is preserved at full opacity
    if (luma <= blackCutoff) {
      output[idx] = r;
      output[idx + 1] = g;
      output[idx + 2] = b;
      output[idx + 3] = origA;
      continue;
    }

    // Interior paper pixels above threshold
    if (isMangaPaperPixel(r, g, b, threshold)) {
      output[idx] = 0;
      output[idx + 1] = 0;
      output[idx + 2] = 0;
      output[idx + 3] = 0;
      continue;
    }

    // Intermediate antialiased line art transitions
    if (luma > blackCutoff && luma < threshold && isMangaPaperPixel(r, g, b, blackCutoff)) {
      const inkFraction = 1 - (luma - blackCutoff) / (threshold - blackCutoff);
      const newAlpha = Math.round(origA * Math.max(0, Math.min(1, Math.pow(inkFraction, 1.2))));
      if (newAlpha === 0) {
        output[idx] = 0;
        output[idx + 1] = 0;
        output[idx + 2] = 0;
        output[idx + 3] = 0;
      } else {
        const darkFactor = inkFraction;
        output[idx] = Math.round(r * darkFactor);
        output[idx + 1] = Math.round(g * darkFactor);
        output[idx + 2] = Math.round(b * darkFactor);
        output[idx + 3] = newAlpha;
      }
      continue;
    }

    // Color artwork elements
    output[idx] = r;
    output[idx + 1] = g;
    output[idx + 2] = b;
    output[idx + 3] = origA;
  }

  return output;
}

/**
 * Refines a character layer's alpha channel to eliminate background paper bleed,
 * white halos, and hard jagged boundaries.
 *
 * For character elements (hair, face, eyes, body, clothing, props):
 * 1. Preserves dark line art (ink lines where luminance < 75) at 100% opacity.
 * 2. Knocks out exterior and interior white/off-white background paper to true alpha = 0.
 * 3. Softens boundary transitions with antialiased feathering and color-to-alpha ink blending.
 */
export function refineLayerAlpha(
  source: Uint8ClampedArray | Uint8Array,
  mask: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  category: string,
  featherRadius: number = 1,
  options: {
    paperThreshold?: number;
    autoKnockoutPaper?: boolean;
  } = {}
): Uint8ClampedArray {
  // First apply the mask to source with antialiased feathering
  const rawMasked = applyMaskToSource(source, mask, width, height, featherRadius);

  // If it's a background environment layer, return the raw masked buffer
  if (category === 'background') {
    return rawMasked;
  }

  // For character parts (hair, face, eyes, body, clothing, props, etc.):
  // Automatically knock out white/off-white paper background so the layer has genuine transparency
  const autoKnockout = options.autoKnockoutPaper !== false;
  if (autoKnockout) {
    return knockoutPaperBackground(rawMasked, width, height, {
      paperThreshold: options.paperThreshold ?? 228,
      blackCutoff: 75,
    });
  }

  return rawMasked;
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
