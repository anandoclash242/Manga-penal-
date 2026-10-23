import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Layer, CanvasTool, MaskBrushConfig } from '../types';
import {
  Upload,
  Split,
  Eye,
  Sliders,
  Move,
  Paintbrush,
  Eraser,
  Sparkles,
} from 'lucide-react';

interface CanvasWorkspaceProps {
  originalImage: string;
  width: number;
  height: number;
  layers: Layer[];
  activeLayerId: string | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  beforeAfterMode: boolean;
  onToggleBeforeAfter?: () => void;
  maskOverlayMode: boolean;
  activeTool: CanvasTool;
  brushConfig: MaskBrushConfig;
  onMaskPaint: (layerId: string, paintedImageDataUrl: string) => void;
  onUploadImage: (file: File) => void;
  onOpenUploadModal?: () => void;
  previewBg: 'checker-dark' | 'checker-light' | 'dark' | 'green';
  onChangePreviewBg: (bg: 'checker-dark' | 'checker-light' | 'dark' | 'green') => void;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  originalImage,
  width,
  height,
  layers,
  activeLayerId,
  zoom,
  onZoomChange,
  beforeAfterMode,
  onToggleBeforeAfter,
  maskOverlayMode,
  activeTool,
  brushConfig,
  onMaskPaint,
  onUploadImage,
  onOpenUploadModal,
  previewBg,
  onChangePreviewBg,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [splitPosition, setSplitPosition] = useState<number>(50); // 0..100%
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const activeLayer = layers.find((l) => l.id === activeLayerId) || null;

  // Center image initially or when dimensions change
  useEffect(() => {
    if (containerRef.current && width > 0 && height > 0) {
      const containerW = containerRef.current.clientWidth;
      const containerH = containerRef.current.clientHeight;
      setPan({
        x: Math.round((containerW - width * zoom) / 2),
        y: Math.round((containerH - height * zoom) / 2),
      });
    }
  }, [width, height]);

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(Math.max(0.1, zoom * zoomFactor), 5.0);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Adjust pan to zoom into cursor
      const nextPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const nextPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      onZoomChange(newZoom);
      setPan({ x: nextPanX, y: nextPanY });
    }
  };

  // Drag & Drop File Upload Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onUploadImage(file);
      }
    }
  };

  // Touch events for mobile phones
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (activeTool === 'brush' || activeTool === 'eraser') {
        setIsPainting(true);
        paintAtTouch(touch);
      } else {
        setIsPanning(true);
        setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (isPanning) {
        setPan({
          x: touch.clientX - panStart.x,
          y: touch.clientY - panStart.y,
        });
      } else if (isPainting && (activeTool === 'brush' || activeTool === 'eraser') && activeLayer) {
        paintAtTouch(touch);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    if (isPainting && canvasRef.current && activeLayer) {
      setIsPainting(false);
      const updatedDataUrl = canvasRef.current.toDataURL('image/png');
      onMaskPaint(activeLayer.id, updatedDataUrl);
    }
  };

  const paintAtTouch = (touch: React.Touch) => {
    if (!canvasRef.current || !activeLayer) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / zoom;
    const y = (touch.clientY - rect.top) / zoom;

    ctx.save();
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0,0,0,${brushConfig.opacity})`;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(255,255,255,${brushConfig.opacity})`;
    }

    ctx.beginPath();
    ctx.arc(x, y, brushConfig.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Mouse Down for Pan or Paint
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && (activeTool === 'pan' || e.altKey))) {
      // Middle click or Alt+drag or pan tool
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button === 0 && (activeTool === 'brush' || activeTool === 'eraser') && activeLayer) {
      setIsPainting(true);
      paintAtPoint(e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isDraggingSplit && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const canvasLeft = rect.left + pan.x;
      const canvasWidth = width * zoom;
      const relX = e.clientX - canvasLeft;
      const pct = Math.min(Math.max(0, (relX / canvasWidth) * 100), 100);
      setSplitPosition(pct);
      return;
    }

    if (isPainting && (activeTool === 'brush' || activeTool === 'eraser') && activeLayer) {
      paintAtPoint(e);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
    if (isPainting && canvasRef.current && activeLayer) {
      setIsPainting(false);
      // Save painted canvas back to active layer
      const updatedDataUrl = canvasRef.current.toDataURL('image/png');
      onMaskPaint(activeLayer.id, updatedDataUrl);
    }
  };

  // Painting on active layer mask
  const paintAtPoint = (e: React.MouseEvent) => {
    if (!canvasRef.current || !activeLayer) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    ctx.save();
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0,0,0,${brushConfig.opacity})`;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(255,255,255,${brushConfig.opacity})`;
    }

    ctx.beginPath();
    ctx.arc(x, y, brushConfig.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Sync canvas with active layer image
  useEffect(() => {
    if (!canvasRef.current || !activeLayer) return;
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
    };
    img.src = activeLayer.transparentPngUrl;
  }, [activeLayer?.id, width, height]);

  // Checkerboard CSS background styles
  const getCanvasBackground = () => {
    switch (previewBg) {
      case 'checker-dark':
        return {
          backgroundImage: `
            linear-gradient(45deg, #181c26 25%, transparent 25%),
            linear-gradient(-45deg, #181c26 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #181c26 75%),
            linear-gradient(-45deg, transparent 75%, #181c26 75%)
          `,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          backgroundColor: '#0f121a',
        };
      case 'checker-light':
        return {
          backgroundImage: `
            linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
            linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
            linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
          `,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          backgroundColor: '#ffffff',
        };
      case 'dark':
        return { backgroundColor: '#090b10' };
      case 'green':
        return { backgroundColor: '#00ff00' }; // AMV Chroma key green
      default:
        return {};
    }
  };

  const sortedLayers = [...layers].sort((a, b) => a.order - b.order);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 relative overflow-hidden bg-slate-950 select-none touch-none cursor-${
        activeTool === 'pan' ? 'grab' : activeTool === 'brush' ? 'crosshair' : 'default'
      }`}
    >
      {/* Drag & Drop Upload Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-950/80 border-2 border-dashed border-blue-400 z-50 flex flex-col items-center justify-center pointer-events-none">
          <Upload className="w-12 h-12 text-blue-400 animate-bounce mb-3" />
          <p className="text-base font-semibold text-white">Drop manga artwork here</p>
          <p className="text-xs text-blue-300">Supports PNG, JPEG, WebP</p>
        </div>
      )}

      {/* Main Canvas Container (Scaled & Translated) */}
      <div
        className="absolute transition-transform duration-75 origin-top-left shadow-2xl"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        {/* Transparent Checkerboard Surface */}
        <div
          className="absolute inset-0 shadow-lg border border-slate-800"
          style={getCanvasBackground()}
        >
          {/* If Before/After mode is active, render split view */}
          {beforeAfterMode ? (
            <div className="relative w-full h-full overflow-hidden">
              {/* Left Side: Untouched Original Image */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${splitPosition}%` }}
              >
                <img
                  src={originalImage}
                  alt="Original Artwork"
                  className="w-full h-full object-contain pointer-events-none"
                  style={{ width: `${width}px`, height: `${height}px` }}
                />
                <span className="absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-slate-200">
                  Original Drawing
                </span>
              </div>

              {/* Right Side: Stack of Extracted Transparent Layers */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  left: `${splitPosition}%`,
                  width: `${100 - splitPosition}%`,
                }}
              >
                <div
                  className="relative"
                  style={{
                    marginLeft: `-${(splitPosition / 100) * width}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                  }}
                >
                  {sortedLayers.map((layer) => {
                    if (!layer.visible) return null;
                    return (
                      <img
                        key={layer.id}
                        src={layer.transparentPngUrl}
                        alt={layer.name}
                        className="absolute inset-0 pointer-events-none"
                        style={{ opacity: layer.opacity }}
                      />
                    );
                  })}
                </div>
                <span className="absolute bottom-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800">
                  Extracted Layers
                </span>
              </div>

              {/* Draggable Divider Handle */}
              <div
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingSplit(true);
                }}
                className="absolute top-0 bottom-0 w-1 bg-blue-500 shadow-md cursor-ew-resize z-30"
                style={{ left: `${splitPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow flex items-center justify-center text-white">
                  <Split className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ) : (
            /* Standard View: Layers Stack */
            <div className="relative w-full h-full">
              {sortedLayers.map((layer) => {
                if (!layer.visible) return null;
                const isSelected = layer.id === activeLayerId;

                return (
                  <div key={layer.id} className="absolute inset-0">
                    <img
                      src={layer.transparentPngUrl}
                      alt={layer.name}
                      className="absolute inset-0 pointer-events-none"
                      style={{ opacity: layer.opacity }}
                    />

                    {/* Active Layer Bounding Box Indicator */}
                    {isSelected && (
                      <div
                        className="absolute border border-blue-400/80 pointer-events-none shadow-sm"
                        style={{
                          left: `${layer.bounds.x}px`,
                          top: `${layer.bounds.y}px`,
                          width: `${layer.bounds.width}px`,
                          height: `${layer.bounds.height}px`,
                        }}
                      >
                        <span className="absolute -top-5 left-0 text-[9px] font-medium bg-blue-600 text-white px-1.5 py-0.2 rounded shadow">
                          {layer.name}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Mask Overlay Mode (Ruby Tint on Active Layer) */}
              {maskOverlayMode && activeLayer && (
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-screen opacity-60"
                  style={{
                    maskImage: `url(${activeLayer.transparentPngUrl})`,
                    WebkitMaskImage: `url(${activeLayer.transparentPngUrl})`,
                    backgroundColor: '#ef4444',
                  }}
                />
              )}

              {/* Interactive Painting Canvas for Manual Refinements */}
              {(activeTool === 'brush' || activeTool === 'eraser') && activeLayer && (
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none"
                  style={{ opacity: activeLayer.opacity }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Empty State when no image loaded */}
      {!originalImage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950/90">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-xl">
            <Upload className="w-8 h-8" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-white">No Artwork Loaded</h2>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5">
            Upload an anime or manga character drawing to separate it into independent transparent layers.
          </p>
          <button
            onClick={() => onOpenUploadModal ? onOpenUploadModal() : onUploadImage(new File([], ''))}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium shadow-md transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Artwork</span>
          </button>
        </div>
      )}

      {/* Floating Canvas Viewport Tools Bottom Left */}
      <div className="absolute bottom-20 md:bottom-4 left-3 md:left-4 flex items-center gap-2 z-20 flex-wrap">
        {/* Mobile Zoom & Mode Quick Controls */}
        <div className="flex md:hidden items-center gap-1 bg-slate-900/95 border border-slate-800 rounded-lg p-1 text-slate-300 shadow-lg">
          <button
            onClick={() => onZoomChange(Math.max(0.1, zoom * 0.8))}
            className="p-1 hover:bg-slate-800 text-slate-400 rounded"
            title="Zoom Out"
          >
            -
          </button>
          <button
            onClick={() => onZoomChange(0.85)}
            className="px-1.5 py-0.5 text-[10px] font-mono text-blue-400 hover:bg-slate-800 rounded"
            title="Fit to Screen"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => onZoomChange(Math.min(5.0, zoom * 1.25))}
            className="p-1 hover:bg-slate-800 text-slate-400 rounded"
            title="Zoom In"
          >
            +
          </button>
          {onToggleBeforeAfter && (
            <button
              onClick={onToggleBeforeAfter}
              className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                beforeAfterMode ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'
              }`}
              title="Split Compare"
            >
              Split
            </button>
          )}
        </div>

        {/* Background Selector */}
        <div className="flex items-center gap-1 bg-slate-900/95 border border-slate-800 rounded-lg p-1 text-slate-300 shadow-lg">
          <button
            onClick={() => onChangePreviewBg('checker-dark')}
            className={`px-2 py-1 text-[10px] rounded transition-colors ${
              previewBg === 'checker-dark'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Dark transparent checkerboard"
          >
            Dark Grid
          </button>
          <button
            onClick={() => onChangePreviewBg('checker-light')}
            className={`px-2 py-1 text-[10px] rounded transition-colors ${
              previewBg === 'checker-light'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Light transparent checkerboard"
          >
            Light Grid
          </button>
          <button
            onClick={() => onChangePreviewBg('dark')}
            className={`px-2 py-1 text-[10px] rounded transition-colors ${
              previewBg === 'dark' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Solid dark background"
          >
            Solid
          </button>
          <button
            onClick={() => onChangePreviewBg('green')}
            className={`px-2 py-1 text-[10px] rounded transition-colors ${
              previewBg === 'green'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Chroma key green screen for AMV/video"
          >
            Green
          </button>
        </div>
      </div>

      {/* Canvas Dimensions and Coordinates Info Bottom Right (hidden on very small screens) */}
      <div className="hidden sm:flex absolute bottom-20 md:bottom-4 right-4 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-400 items-center gap-3 z-20 pointer-events-none">
        <span>
          {width} × {height} px
        </span>
        <span className="text-slate-600">|</span>
        <span>{Math.round(zoom * 100)}%</span>
        {activeLayer && (
          <>
            <span className="text-slate-600">|</span>
            <span className="text-blue-400 truncate max-w-36">{activeLayer.name}</span>
          </>
        )}
      </div>
    </div>
  );
};
