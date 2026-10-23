import React, { useState, useRef } from 'react';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Split,
  Eye,
  Download,
  Upload,
  Sparkles,
  Save,
  RotateCcw,
  RotateCw,
} from 'lucide-react';

interface NavbarProps {
  projectTitle: string;
  onUpdateTitle: (title: string) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoomActual: () => void;
  beforeAfterMode: boolean;
  onToggleBeforeAfter: () => void;
  maskOverlayMode: boolean;
  onToggleMaskOverlay: () => void;
  onOpenExportModal: () => void;
  onOpenUpload: () => void;
  onDirectFileUpload?: (file: File) => void;
  onOpenProjects: () => void;
  onOpenSamples: () => void;
  onSaveProject: () => void;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projectTitle,
  onUpdateTitle,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoomActual,
  beforeAfterMode,
  onToggleBeforeAfter,
  maskOverlayMode,
  onToggleMaskOverlay,
  onOpenExportModal,
  onOpenUpload,
  onDirectFileUpload,
  onOpenProjects,
  onOpenSamples,
  onSaveProject,
  isSaving,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectTitle);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    } else {
      setTempTitle(projectTitle);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (onDirectFileUpload) {
        onDirectFileUpload(file);
      }
      e.target.value = '';
    }
  };

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800/80 px-2 sm:px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Hidden file input for 1-tap instant camera / file upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Brand & Project Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2 pr-2 sm:pr-3 border-r border-slate-800 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-slate-100 tracking-tight leading-none">
              Manga Layer Studio
            </h1>
            <p className="text-[10px] text-blue-400 font-medium tracking-wide">
              AI CHARACTER PART SEPARATOR
            </p>
          </div>
        </div>

        {/* Project Title */}
        <div className="flex items-center gap-1.5 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="text-xs bg-slate-900 border border-blue-500 rounded px-2 py-1 text-slate-100 focus:outline-none w-32 sm:w-48"
            />
          ) : (
            <button
              onClick={() => {
                setTempTitle(projectTitle);
                setIsEditingTitle(true);
              }}
              title="Click to rename project"
              className="text-xs font-medium text-slate-300 hover:text-white px-1.5 sm:px-2 py-1 rounded hover:bg-slate-900 transition-colors text-left truncate max-w-28 sm:max-w-48"
            >
              {projectTitle}
            </button>
          )}

          <button
            onClick={onSaveProject}
            disabled={isSaving}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors"
            title="Save project"
          >
            <Save className="w-3.5 h-3.5 text-blue-400" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Center: Canvas Controls & Modes (Desktop only) */}
      <div className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1">
        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded disabled:opacity-30 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded disabled:opacity-30 transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-800 mx-0.5" />

        {/* Zoom Controls */}
        <button
          onClick={onZoomOut}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onZoomActual}
          className="px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="100% Actual size"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={onZoomIn}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onZoomFit}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          title="Fit view"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-800 mx-0.5" />

        {/* Before / After Split Slider Toggle */}
        <button
          onClick={onToggleBeforeAfter}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors ${
            beforeAfterMode
              ? 'bg-blue-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Compare original with extracted layers"
        >
          <Split className="w-3.5 h-3.5" />
          <span>Before / After</span>
        </button>

        {/* Mask Overlay Mode */}
        <button
          onClick={onToggleMaskOverlay}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors ${
            maskOverlayMode
              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Toggle ruby mask tint"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Mask Tint</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Mobile Undo / Redo */}
        <div className="flex md:hidden items-center">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded disabled:opacity-20 transition-colors"
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded disabled:opacity-20 transition-colors"
            title="Redo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onOpenSamples}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          title="Load manga demo illustrations"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Demos</span>
        </button>

        {/* Upload Button: Opens full upload modal with camera, files, paste, and samples */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors min-h-[36px]"
          title="Upload manga image from device, photo library, or camera"
        >
          <Upload className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs">Upload</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm transition-colors min-h-[36px]"
          title="Export transparent PNG layers or ZIP"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
