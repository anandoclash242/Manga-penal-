import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMaskToSource,
  validateTransparency,
  morphologicalOperation,
  invertMask,
  rasterizePolygon,
  getBoundingBox,
  featherMask,
  refineLayerAlpha,
  isMangaPaperPixel,
  knockoutPaperBackground,
} from './maskEngine';

test('applyMaskToSource creates true transparent pixels outside mask and preserves original pixels inside', () => {
  const width = 4;
  const height = 4;
  const total = width * height;

  // Solid red source image (255, 0, 0, 255)
  const source = new Uint8ClampedArray(total * 4);
  for (let i = 0; i < total; i++) {
    source[i * 4] = 255;
    source[i * 4 + 1] = 0;
    source[i * 4 + 2] = 0;
    source[i * 4 + 3] = 255;
  }

  // Mask has 255 only in the center 4 pixels (x: 1..2, y: 1..2)
  const mask = new Uint8ClampedArray(total);
  mask[1 * width + 1] = 255;
  mask[1 * width + 2] = 255;
  mask[2 * width + 1] = 255;
  mask[2 * width + 2] = 255;

  const result = applyMaskToSource(source, mask, width, height, 0);

  // Validation
  const report = validateTransparency(result);
  assert.equal(report.isTransparent, true, 'Result must be transparent');
  assert.equal(report.transparentPixelCount, 12, '12 pixels must have alpha = 0');
  assert.equal(report.visiblePixelCount, 4, '4 pixels must have alpha > 0');

  // Verify corner pixel is completely transparent
  assert.equal(result[0], 0);
  assert.equal(result[3], 0);

  // Verify center pixel preserves original red color and full opacity
  const centerIdx = (1 * width + 1) * 4;
  assert.equal(result[centerIdx], 255, 'Preserves red channel');
  assert.equal(result[centerIdx + 1], 0);
  assert.equal(result[centerIdx + 2], 0);
  assert.equal(result[centerIdx + 3], 255, 'Preserves alpha channel');
});

test('invertMask flips 0 to 255 and 255 to 0', () => {
  const mask = new Uint8ClampedArray([0, 255, 100]);
  const inverted = invertMask(mask);
  assert.equal(inverted[0], 255);
  assert.equal(inverted[1], 0);
  assert.equal(inverted[2], 155);
});

test('morphologicalOperation expands mask on dilation and contracts on erosion', () => {
  const width = 5;
  const height = 5;
  const mask = new Uint8ClampedArray(width * height);
  // Single pixel in the center (2, 2)
  mask[2 * width + 2] = 255;

  const dilated = morphologicalOperation(mask, width, height, 1);
  // Neighbors must be 255
  assert.equal(dilated[2 * width + 2], 255);
  assert.equal(dilated[2 * width + 1], 255);
  assert.equal(dilated[1 * width + 2], 255);

  const eroded = morphologicalOperation(dilated, width, height, -1);
  // Center should survive
  assert.equal(eroded[2 * width + 2], 255);
});

test('rasterizePolygon correctly marks points within polygon', () => {
  const width = 100;
  const height = 100;
  // Square polygon in the middle (200..800 in 0..1000 scale)
  const polygon: [number, number][] = [
    [200, 200],
    [800, 200],
    [800, 800],
    [200, 800],
  ];

  const mask = rasterizePolygon(polygon, width, height);

  // Inside point (50, 50) -> x=50, y=50
  assert.equal(mask[50 * width + 50], 255);

  // Outside point (10, 10)
  assert.equal(mask[10 * width + 10], 0);
});

test('getBoundingBox accurately computes non-transparent bounds', () => {
  const width = 10;
  const height = 10;
  const buffer = new Uint8ClampedArray(width * height * 4);

  // Paint pixel at (3, 4) and (7, 8)
  const idx1 = (4 * width + 3) * 4;
  buffer[idx1 + 3] = 255;

  const idx2 = (8 * width + 7) * 4;
  buffer[idx2 + 3] = 255;

  const bbox = getBoundingBox(buffer, width, height);
  assert.equal(bbox.x, 3);
  assert.equal(bbox.y, 4);
  assert.equal(bbox.width, 5); // 7 - 3 + 1
  assert.equal(bbox.height, 5); // 8 - 4 + 1
});

test('featherMask creates gradual falloff around edges', () => {
  const width = 10;
  const height = 10;
  const mask = new Uint8ClampedArray(width * height);
  for (let y = 3; y <= 6; y++) {
    for (let x = 3; x <= 6; x++) {
      mask[y * width + x] = 255;
    }
  }

  const feathered = featherMask(mask, width, height, 2);
  // Center is still prominent after 2D blur
  assert.ok(feathered[4 * width + 4] > 150);
  // Immediate neighbor outside original mask has partial alpha
  assert.ok(feathered[2 * width + 2] > 0 && feathered[2 * width + 2] < 255);
});

test('refineLayerAlpha preserves dark ink line art at full opacity and creates transparent outside', () => {
  const width = 4;
  const height = 4;
  const total = width * height;

  // White paper source image with one black ink pixel at (1, 1)
  const source = new Uint8ClampedArray(total * 4);
  for (let i = 0; i < total; i++) {
    source[i * 4] = 255;
    source[i * 4 + 1] = 255;
    source[i * 4 + 2] = 255;
    source[i * 4 + 3] = 255;
  }
  // Black ink line pixel (0, 0, 0, 255)
  const inkIdx = (1 * width + 1) * 4;
  source[inkIdx] = 0;
  source[inkIdx + 1] = 0;
  source[inkIdx + 2] = 0;

  const mask = new Uint8ClampedArray(total);
  mask[1 * width + 1] = 255; // covers ink pixel

  const result = refineLayerAlpha(source, mask, width, height, 'hair', 0);
  // Ink pixel must be fully opaque
  assert.equal(result[inkIdx + 3], 255);
  // Outside pixel must be 0 alpha
  assert.equal(result[0], 0);
  assert.equal(result[3], 0);
});

test('isMangaPaperPixel correctly detects white and off-white paper while preserving color and ink', () => {
  // Pure white paper
  assert.equal(isMangaPaperPixel(255, 255, 255), true);
  // Off-white / cream manga paper
  assert.equal(isMangaPaperPixel(248, 245, 238), true);
  // Light scan newsprint
  assert.equal(isMangaPaperPixel(235, 235, 235), true);
  // Dark ink stroke (should NOT be paper)
  assert.equal(isMangaPaperPixel(20, 20, 20), false);
  // Colored skin tone (should NOT be paper due to color saturation)
  assert.equal(isMangaPaperPixel(254, 215, 170), false);
  // Vibrant yellow/red/blue clothing (should NOT be paper)
  assert.equal(isMangaPaperPixel(230, 50, 50), false);
});

test('knockoutPaperBackground eliminates white paper surrounding character and preserves ink', () => {
  const width = 6;
  const height = 6;
  const total = width * height;
  const buffer = new Uint8ClampedArray(total * 4);

  // Fill with white manga paper (255, 255, 255, 255)
  for (let i = 0; i < total; i++) {
    buffer[i * 4] = 255;
    buffer[i * 4 + 1] = 255;
    buffer[i * 4 + 2] = 255;
    buffer[i * 4 + 3] = 255;
  }

  // Draw a black ink character stroke at (2, 2) and (3, 2)
  const ink1 = (2 * width + 2) * 4;
  buffer[ink1] = 10;
  buffer[ink1 + 1] = 10;
  buffer[ink1 + 2] = 10;

  const ink2 = (2 * width + 3) * 4;
  buffer[ink2] = 10;
  buffer[ink2 + 1] = 10;
  buffer[ink2 + 2] = 10;

  const transparentOutput = knockoutPaperBackground(buffer, width, height, { paperThreshold: 228 });

  // Boundary white paper must now have alpha = 0 (completely transparent)
  assert.equal(transparentOutput[3], 0, 'Top-left corner must be transparent');
  assert.equal(transparentOutput[(width - 1) * 4 + 3], 0, 'Top-right corner must be transparent');

  // Character ink lines must remain 100% opaque
  assert.equal(transparentOutput[ink1 + 3], 255, 'Ink stroke pixel 1 must remain fully opaque');
  assert.equal(transparentOutput[ink2 + 3], 255, 'Ink stroke pixel 2 must remain fully opaque');
});

