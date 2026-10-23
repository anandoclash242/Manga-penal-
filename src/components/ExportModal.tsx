import React, { useState } from 'react';
import { Layer } from '../types';
import {
  Download,
  X,
  FileArchive,
  Image as ImageIcon,
  CheckSquare,
  Square,
  ShieldCheck,
  Check,
  FileJson,
} from 'lucide-react';
import {
  exportLayersZip,
  downloadDataUrl,
  renderCompositeCanvas,
} from '../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  layers: Layer[];
  projectName: string;
  canvasWidth: number;
  canvasHeight: number;
  originalImage: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  layers,
  projectName,
  canvasWidth,
  canvasHeight,
  originalImage,
}) => {
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(
    layers.map((l) => l.id)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [activePreviewLayerId, setActivePreviewLayerId] = useState<string>(
    layers[0]?.id || ''
  );

  if (!isOpen) return null;

  const toggleSelectLayer = (id: string) => {
    setSelectedLayerIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedLayerIds(layers.map((l) => l.id));
  const deselectAll = () => setSelectedLayerIds([]);

  const activePreviewLayer =
    layers.find((l) => l.id === activePreviewLayerId) || layers[0];

  // Export full ZIP
  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      const layersToExport = layers.filter((l) => selectedLayerIds.includes(l.id));
      const composite = await renderCompositeCanvas(layers, canvasWidth, canvasHeight);
      await exportLayersZip(
        layersToExport,
        projectName,
        canvasWidth,
        canvasHeight,
        composite
      );
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export flattened composite PNG
  const handleExportFlattened = async () => {
    setIsExporting(true);
    try {
      const compositeUrl = await renderCompositeCanvas(
        layers,
        canvasWidth,
        canvasHeight
      );
      downloadDataUrl(compositeUrl, `${projectName}_composite.png`);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Composite export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export single selected layer
  const handleExportSingle = (layer: Layer) => {
    downloadDataUrl(
      layer.transparentPngUrl,
      `${projectName}_${layer.category}_${layer.name.replace(/\s+/g, '_')}.png`
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Export Layers Manager</h3>
              <p className="text-[11px] text-slate-400">
                Genuine transparent 32-bit RGBA PNG files with preserved canvas alignment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content: 2-column layout on desktop, stacked on mobile */}
        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:grid md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
          {/* Left Column: Layers Selection (3 cols) */}
          <div className="md:col-span-3 p-3 sm:p-4 flex flex-col overflow-y-auto md:overflow-hidden space-y-3 max-h-[38vh] md:max-h-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">
                Select Layers to Export ({selectedLayerIds.length}/{layers.length})
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <button onClick={selectAll} className="text-blue-400 hover:underline">
                  Select All
                </button>
                <span className="text-slate-600">·</span>
                <button onClick={deselectAll} className="text-slate-400 hover:underline">
                  Deselect All
                </button>
              </div>
            </div>

            {/* Scrollable Layers Checklist */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {layers.map((layer) => {
                const isChecked = selectedLayerIds.includes(layer.id);
                const isPreviewing = layer.id === activePreviewLayer?.id;

                return (
                  <div
                    key={layer.id}
                    onClick={() => setActivePreviewLayerId(layer.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isPreviewing
                        ? 'bg-blue-600/15 border-blue-500/40 text-white'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectLayer(layer.id);
                        }}
                        className="text-slate-400 hover:text-white shrink-0"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>

                      {/* Small thumbnail */}
                      <div
                        className="w-6 h-6 rounded border border-slate-700 overflow-hidden bg-slate-950 shrink-0"
                        style={{
                          backgroundImage: `
                            linear-gradient(45deg, #1e2230 25%, transparent 25%),
                            linear-gradient(-45deg, #1e2230 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #1e2230 75%),
                            linear-gradient(-45deg, transparent 75%, #1e2230 75%)
                          `,
                          backgroundSize: '6px 6px',
                        }}
                      >
                        <img
                          src={layer.transparentPngUrl}
                          alt={layer.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <span className="font-medium truncate max-w-36 sm:max-w-44">{layer.name}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportSingle(layer);
                      }}
                      className="text-[10px] text-blue-400 hover:text-blue-300 px-2 py-0.5 rounded hover:bg-slate-800 shrink-0 ml-1"
                    >
                      Export PNG
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Layer Transparency Preview & Verification (2 cols) */}
          <div className="md:col-span-2 p-3 sm:p-4 bg-slate-900/30 flex flex-col items-center justify-between space-y-3">
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-medium">Alpha Preview</span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>32-bit RGBA</span>
                </span>
              </div>

              {/* Preview Window with Checkerboard */}
              <div
                className="w-full h-36 sm:h-44 rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center bg-slate-950"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #1e2230 25%, transparent 25%),
                    linear-gradient(-45deg, #1e2230 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #1e2230 75%),
                    linear-gradient(-45deg, transparent 75%, #1e2230 75%)
                  `,
                  backgroundSize: '12px 12px',
                }}
              >
                {activePreviewLayer ? (
                  <img
                    src={activePreviewLayer.transparentPngUrl}
                    alt={activePreviewLayer.name}
                    className="max-w-full max-h-full object-contain pointer-events-none p-2"
                  />
                ) : (
                  <span className="text-slate-600 text-xs">No layer selected</span>
                )}
              </div>

              {activePreviewLayer && (
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p className="font-medium text-slate-200 truncate">
                    {activePreviewLayer.name}
                  </p>
                  <p className="font-mono text-[10px]">
                    Size: {canvasWidth} × {canvasHeight} px
                  </p>
                  <p className="text-[10px] text-emerald-400/90">
                    Background: True Transparent (Alpha = 0)
                  </p>
                </div>
              )}
            </div>

            {/* Quick Export Package Info */}
            <div className="w-full p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1 text-slate-200 font-medium">
                <FileJson className="w-3.5 h-3.5 text-blue-400" />
                <span>Includes manifest.json</span>
              </div>
              <p className="text-[10px] leading-tight text-slate-500">
                JSON metadata includes exact pixel dimensions, hierarchy, and opacity for
                effortless import into video/animation tools.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors text-center order-last sm:order-first"
          >
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={handleExportFlattened}
              disabled={isExporting}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Flattened PNG</span>
            </button>

            <button
              onClick={handleExportZip}
              disabled={isExporting || selectedLayerIds.length === 0}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 rounded-lg shadow-sm transition-colors"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Export Downloaded!</span>
                </>
              ) : (
                <>
                  <FileArchive className="w-3.5 h-3.5" />
                  <span>Download ZIP ({selectedLayerIds.length} Layers)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
