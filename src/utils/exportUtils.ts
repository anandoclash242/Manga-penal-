import JSZip from 'jszip';
import { Layer } from '../types';

/**
 * Downloads a data URL as a file in the browser.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Converts a base64 data URL into a binary Uint8Array or Blob.
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64Part = dataUrl.split(',')[1] || dataUrl;
  const binaryString = atob(base64Part);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates and downloads a ZIP package containing all layers, individual transparent PNGs,
 * and a manifest.json file.
 */
export async function exportLayersZip(
  layers: Layer[],
  projectName: string,
  canvasWidth: number,
  canvasHeight: number,
  compositeDataUrl?: string
): Promise<void> {
  const zip = new JSZip();
  const folderName = `${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_layers`;
  const root = zip.folder(folderName) || zip;
  const layersFolder = root.folder('transparent_layers') || root;

  const manifestLayers = [];

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const safeName = `${String(i + 1).padStart(2, '0')}_${layer.category}_${layer.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;

    try {
      const bytes = dataUrlToUint8Array(layer.transparentPngUrl);
      layersFolder.file(safeName, bytes, { binary: true });

      manifestLayers.push({
        id: layer.id,
        filename: `transparent_layers/${safeName}`,
        name: layer.name,
        category: layer.category,
        order: layer.order,
        visible: layer.visible,
        opacity: layer.opacity,
        isReconstructed: !!layer.isReconstructed,
        bounds: layer.bounds,
      });
    } catch (err) {
      console.error(`Failed to pack layer ${layer.name} into ZIP`, err);
    }
  }

  // Add composite preview if provided
  if (compositeDataUrl) {
    try {
      const compBytes = dataUrlToUint8Array(compositeDataUrl);
      root.file('composite_preview.png', compBytes, { binary: true });
    } catch (err) {
      console.warn('Could not pack composite preview', err);
    }
  }

  // Add manifest JSON
  const manifest = {
    project: projectName,
    exportedAt: new Date().toISOString(),
    generator: 'Manga Layer Studio AI',
    dimensions: {
      width: canvasWidth,
      height: canvasHeight,
    },
    totalLayers: layers.length,
    layers: manifestLayers,
  };

  root.file('manifest.json', JSON.stringify(manifest, null, 2));

  // Add helpful README
  root.file(
    'README.txt',
    `Manga Layer Studio AI — Export Package
=======================================
Project: ${projectName}
Canvas Dimensions: ${canvasWidth} x ${canvasHeight} px
Total Extracted Layers: ${layers.length}

All files in 'transparent_layers/' are genuine 32-bit RGBA transparent PNGs.
Every layer retains the exact source canvas alignment and dimensions (${canvasWidth}x${canvasHeight}),
so you can stack them in Photoshop, Clip Studio Paint, After Effects, or Premiere Pro
without having to manually reposition any part!

Created with Manga Layer Studio AI.
`
  );

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  downloadDataUrl(downloadUrl, `${folderName}.zip`);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
}

/**
 * Creates a composite flattened PNG data URL from visible layers.
 */
export async function renderCompositeCanvas(
  layers: Layer[],
  width: number,
  height: number
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const sorted = [...layers].sort((a, b) => a.order - b.order);

  for (const layer of sorted) {
    if (!layer.visible || layer.opacity <= 0) continue;

    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(img, 0, 0, width, height);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = layer.transparentPngUrl;
    });
  }

  return canvas.toDataURL('image/png');
}
