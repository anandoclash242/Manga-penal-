import React from 'react';
import { CanvasTool, MaskBrushConfig } from '../types';
import {
  MousePointer,
  Move,
  Paintbrush,
  Eraser,
  Sliders,
  Maximize,
  Minimize,
  FlipHorizontal,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface MaskRefineToolbarProps {
  activeTool: CanvasTool;
  onChangeTool: (tool: CanvasTool) => void;
  brushConfig: MaskBrushConfig;
  onUpdateBrushConfig: (config: MaskBrushConfig) => void;
  onExpandMask: () => void;
  onContractMask: () => void;
  onInvertMask: () => void;
  onRevertMask: () => void;
  onMakeTransparent?: () => void;
  paperThreshold?: number;
  onChangePaperThreshold?: (val: number) => void;
  hasActiveLayer: boolean;
}

export const MaskRefineToolbar: React.FC<MaskRefineToolbarProps> = ({
  activeTool,
  onChangeTool,
  brushConfig,
  onUpdateBrushConfig,
  onExpandMask,
  onContractMask,
  onInvertMask,
  onRevertMask,
  onMakeTransparent,
  paperThreshold = 228,
  onChangePaperThreshold,
  hasActiveLayer,
}) => {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl p-1 sm:p-1.5 flex items-center gap-1 sm:gap-2 z-20 backdrop-blur-md select-none max-w-[95vw] overflow-x-auto no-scrollbar">
      {/* Navigation & Selection Tools */}
      <div className="flex items-center gap-1 pr-1.5 sm:pr-2 border-r border-slate-800 shrink-0">
        <button
          onClick={() => onChangeTool('select')}
          className={`p-1.5 sm:p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
            activeTool === 'select'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Select & Inspect Layer (V)"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        <button
          onClick={() => onChangeTool('pan')}
          className={`p-1.5 sm:p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
            activeTool === 'pan'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Pan & Move Canvas (H or Space+Drag)"
        >
          <Move className="w-4 h-4" />
        </button>
      </div>

      {/* Manual Mask Paint Tools */}
      <div className="flex items-center gap-1 pr-2 border-r border-slate-800">
        <button
          onClick={() => onChangeTool('brush')}
          disabled={!hasActiveLayer}
          className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${
            activeTool === 'brush'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Brush — Add to active layer mask (B)"
        >
          <Paintbrush className="w-4 h-4" />
        </button>

        <button
          onClick={() => onChangeTool('eraser')}
          disabled={!hasActiveLayer}
          className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${
            activeTool === 'eraser'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Eraser — Remove from active layer mask (E)"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>

      {/* Brush Size Controls */}
      {(activeTool === 'brush' || activeTool === 'eraser') && (
        <div className="flex items-center gap-2 px-2 pr-3 border-r border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono">Size</span>
          <input
            type="range"
            min="1"
            max="80"
            value={brushConfig.size}
            onChange={(e) =>
              onUpdateBrushConfig({ ...brushConfig, size: Number(e.target.value) })
            }
            className="w-20 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-[10px] font-mono text-blue-400 w-6">
            {brushConfig.size}px
          </span>
        </div>
      )}

      {/* Primary Transparency Knockout Action */}
      {onMakeTransparent && (
        <div className="flex items-center gap-1.5 px-1 pr-2 border-r border-slate-800">
          <button
            onClick={onMakeTransparent}
            disabled={!hasActiveLayer}
            className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:pointer-events-none shadow-sm"
            title="Knock out white paper & make transparent alpha (Key Out Background)"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Make Transparent</span>
          </button>

          {onChangePaperThreshold && hasActiveLayer && (
            <div className="hidden lg:flex items-center gap-1.5 pl-1">
              <span className="text-[9px] text-slate-400">Paper Cutoff</span>
              <input
                type="range"
                min="180"
                max="250"
                step="2"
                value={paperThreshold}
                onChange={(e) => onChangePaperThreshold(Number(e.target.value))}
                className="w-16 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-500"
                title={`Paper cutoff sensitivity: ${paperThreshold}`}
              />
              <span className="text-[9px] font-mono text-emerald-400">{paperThreshold}</span>
            </div>
          )}
        </div>
      )}

      {/* Morphological & Filter Mask Quick Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onExpandMask}
          disabled={!hasActiveLayer}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
          title="Expand Mask Boundary (+2px Dilation)"
        >
          <Maximize className="w-4 h-4" />
        </button>

        <button
          onClick={onContractMask}
          disabled={!hasActiveLayer}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
          title="Contract Mask Boundary (-2px Erosion)"
        >
          <Minimize className="w-4 h-4" />
        </button>

        <button
          onClick={onInvertMask}
          disabled={!hasActiveLayer}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
          title="Invert Mask"
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>

        <button
          onClick={onRevertMask}
          disabled={!hasActiveLayer}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
          title="Revert to Original AI Extraction"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
