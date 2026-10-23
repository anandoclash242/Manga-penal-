import React, { useState } from 'react';
import { Layer, PartCategory } from '../types';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Search,
  Sliders,
  Download,
  FolderTree,
} from 'lucide-react';

interface LayerPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onUpdateOpacity: (layerId: string, opacity: number) => void;
  onRenameLayer: (layerId: string, newName: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onResetLayer: (layerId: string) => void;
  onExportSingleLayer: (layer: Layer) => void;
  onReconstructLayer?: (layer: Layer) => void;
  onMakeLayerTransparent?: (layerId: string) => void;
  onMakeAllLayersTransparent?: () => void;
  onCloseMobile?: () => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onUpdateOpacity,
  onRenameLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onMoveUp,
  onMoveDown,
  onResetLayer,
  onExportSingleLayer,
  onReconstructLayer,
  onMakeLayerTransparent,
  onMakeAllLayersTransparent,
  onCloseMobile,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeLayer = layers.find((l) => l.id === activeLayerId) || null;

  const handleStartRename = (layer: Layer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(layer.id);
    setEditingName(layer.name);
  };

  const handleFinishRename = (layerId: string) => {
    if (editingName.trim()) {
      onRenameLayer(layerId, editingName.trim());
    }
    setEditingId(null);
  };

  // Filtered layers, displayed from top of stack to bottom of stack (descending order)
  const displayLayers = [...layers]
    .sort((a, b) => b.order - a.order)
    .filter((layer) => {
      if (filterCategory !== 'all' && layer.category !== filterCategory) return false;
      if (searchQuery && !layer.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'hair', label: 'Hair' },
    { id: 'face', label: 'Face' },
    { id: 'clothing', label: 'Clothing' },
    { id: 'body', label: 'Body' },
    { id: 'prop', label: 'Props' },
    { id: 'background', label: 'BG' },
  ];

  return (
    <div className="w-full md:w-80 bg-slate-950 border-l border-slate-800/80 flex flex-col h-full overflow-hidden select-none shrink-0 z-10">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-100">Layer Stack</h2>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
            {layers.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onMakeAllLayersTransparent && layers.length > 0 && (
            <button
              onClick={onMakeAllLayersTransparent}
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60 transition-colors flex items-center gap-1"
              title="Remove background paper from all layers & make 100% transparent"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Make All Transparent</span>
            </button>
          )}

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden px-2 py-1 text-xs text-blue-400 hover:text-white bg-slate-900 rounded border border-slate-800"
            >
              Canvas View
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-2.5 border-b border-slate-800/80 space-y-2 bg-slate-900/30">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search layers..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${
                filterCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Layer Opacity Slider & Quick Controls */}
      {activeLayer && (
        <div className="px-3.5 py-2.5 bg-slate-900/60 border-b border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span className="font-medium truncate max-w-44">{activeLayer.name}</span>
            <span className="font-mono text-blue-400">
              {Math.round(activeLayer.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={activeLayer.opacity}
            onChange={(e) => onUpdateOpacity(activeLayer.id, parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />

          {onMakeLayerTransparent && (
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-slate-400">Background:</span>
              <button
                onClick={() => onMakeLayerTransparent(activeLayer.id)}
                className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-medium flex items-center gap-1 transition-colors"
                title="Knock out white background paper & make transparent"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Make Transparent</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Scrollable Layers List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-900/80">
        {displayLayers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            {layers.length === 0 ? 'No layers extracted yet.' : 'No matching layers found.'}
          </div>
        ) : (
          displayLayers.map((layer) => {
            const isActive = layer.id === activeLayerId;
            const originalIndex = layers.findIndex((l) => l.id === layer.id);

            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`group flex items-center gap-2 p-2 px-3 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/15 border-l-2 border-blue-500 text-slate-100'
                    : 'hover:bg-slate-900/60 text-slate-300 border-l-2 border-transparent'
                } ${!layer.visible ? 'opacity-50' : ''}`}
              >
                {/* Visibility Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(layer.id);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors"
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? (
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </button>

                {/* Lock Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(layer.id);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors"
                  title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                >
                  {layer.locked ? (
                    <Lock className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Unlock className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100" />
                  )}
                </button>

                {/* Layer Thumbnail with Transparent Checkerboard */}
                <div
                  className="w-9 h-9 rounded border border-slate-700/80 overflow-hidden shrink-0 relative flex items-center justify-center bg-slate-950"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #1e2230 25%, transparent 25%),
                      linear-gradient(-45deg, #1e2230 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #1e2230 75%),
                      linear-gradient(-45deg, transparent 75%, #1e2230 75%)
                    `,
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                  }}
                >
                  <img
                    src={layer.transparentPngUrl}
                    alt={layer.name}
                    className="max-w-full max-h-full object-contain pointer-events-none"
                  />
                </div>

                {/* Name & Metadata */}
                <div className="flex-1 min-w-0 pr-1">
                  {editingId === layer.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleFinishRename(layer.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFinishRename(layer.id)}
                      autoFocus
                      className="w-full text-xs bg-slate-900 border border-blue-500 rounded px-1.5 py-0.5 text-white focus:outline-none"
                    />
                  ) : (
                    <div
                      onDoubleClick={(e) => handleStartRename(layer, e)}
                      className="text-xs font-medium truncate leading-tight select-none"
                      title="Double click to rename"
                    >
                      {layer.name}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-500 capitalize">
                      {layer.category}
                    </span>
                    {layer.isReconstructed && (
                      <span className="text-[9px] px-1 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80">
                        Inpainted
                      </span>
                    )}
                  </div>
                </div>

                {/* Row Action Buttons (Move up/down, duplicate, delete) */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveUp(originalIndex);
                    }}
                    disabled={originalIndex >= layers.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded disabled:opacity-20"
                    title="Bring forward"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveDown(originalIndex);
                    }}
                    disabled={originalIndex <= 0}
                    className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded disabled:opacity-20"
                    title="Send backward"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {onMakeLayerTransparent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMakeLayerTransparent(layer.id);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded"
                      title="Key out white paper & make transparent"
                    >
                      <Sparkles className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportSingleLayer(layer);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded"
                    title="Download this transparent PNG"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateLayer(layer.id);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded"
                    title="Duplicate layer"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                    className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded"
                    title="Delete layer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Layer Panel Footer Action Bar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5">
          {activeLayer && (
            <>
              <button
                onClick={() => onResetLayer(activeLayer.id)}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-900 text-slate-300 hover:text-white transition-colors"
                title="Reset layer mask to original AI extracted state"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Mask</span>
              </button>

              {onReconstructLayer && (
                <button
                  onClick={() => onReconstructLayer(activeLayer)}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-900 text-amber-300 hover:text-amber-200 transition-colors"
                  title="AI Inpainting for occluded edges"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Inpaint</span>
                </button>
              )}
            </>
          )}
        </div>

        {activeLayer && (
          <button
            onClick={() => onExportSingleLayer(activeLayer)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Export Layer</span>
          </button>
        )}
      </div>
    </div>
  );
};
