import React, { useState, useEffect, useCallback } from 'react';
import {
  Project,
  Layer,
  SegmentationSettings,
  CanvasTool,
  MaskBrushConfig,
  PartCategory,
  SegmentationDetail,
} from './types';
import { SAMPLE_PROJECTS } from './utils/sampleData';
import {
  reorderLayers,
  duplicateLayer,
  deleteLayer,
  toggleLayerVisibility,
  toggleLayerLock,
  updateLayerOpacity,
  renameLayer,
} from './utils/layerTree';
import {
  morphologicalOperation,
  invertMask,
  applyMaskToSource,
  getBoundingBox,
  featherMask,
} from './utils/maskEngine';
import {
  requestGeminiSegmentation,
  extractLayersFromPlan,
  requestPartReconstruction,
} from './services/geminiService';
import { downloadDataUrl } from './utils/exportUtils';
import { parseUserPrompt } from './utils/promptParser';
import { Wand2, Layers as LayersIcon, Sparkles } from 'lucide-react';

// Components
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { SegmentationControls } from './components/SegmentationControls';
import { LayerPanel } from './components/LayerPanel';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { MaskRefineToolbar } from './components/MaskRefineToolbar';
import { ExportModal } from './components/ExportModal';
import { UploadModal } from './components/UploadModal';
import { DemoGalleryModal } from './components/DemoGalleryModal';
import { PresetsModal } from './components/PresetsModal';
import { SavedProjectsModal } from './components/SavedProjectsModal';
import { SettingsModal } from './components/SettingsModal';

const STORAGE_KEY = 'manga_layer_studio_projects_v1';
const CURRENT_PROJECT_KEY = 'manga_layer_studio_active_id_v1';

export default function App() {
  // Load initial demo project
  const [project, setProject] = useState<Project>(() => {
    try {
      const savedList = localStorage.getItem(STORAGE_KEY);
      const activeId = localStorage.getItem(CURRENT_PROJECT_KEY);
      if (savedList) {
        const projects: Project[] = JSON.parse(savedList);
        const found = projects.find((p) => p.id === activeId);
        if (found) return found;
      }
    } catch (e) {
      console.warn('Could not parse saved projects', e);
    }
    return SAMPLE_PROJECTS[0];
  });

  const [savedProjects, setSavedProjects] = useState<Project[]>(() => {
    try {
      const savedList = localStorage.getItem(STORAGE_KEY);
      if (savedList) return JSON.parse(savedList);
    } catch (e) {}
    return [SAMPLE_PROJECTS[0]];
  });

  // App UI State
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [zoom, setZoom] = useState<number>(0.85);
  const [beforeAfterMode, setBeforeAfterMode] = useState<boolean>(false);
  const [maskOverlayMode, setMaskOverlayMode] = useState<boolean>(false);
  const [previewBg, setPreviewBg] = useState<'checker-dark' | 'checker-light' | 'dark' | 'green'>(
    'checker-dark'
  );

  // Tools & Brush
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [brushConfig, setBrushConfig] = useState<MaskBrushConfig>({
    size: 24,
    hardness: 0.8,
    opacity: 1,
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Undo / Redo history for layers
  const [undoStack, setUndoStack] = useState<Layer[][]>([]);
  const [redoStack, setRedoStack] = useState<Layer[][]>([]);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDemoGalleryOpen, setIsDemoGalleryOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isSavedProjectsModalOpen, setIsSavedProjectsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Save active project to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_PROJECT_KEY, project.id);
    } catch (e) {}
  }, [project.id]);

  // Push current layers state to undo stack
  const pushToUndo = useCallback(
    (layers: Layer[]) => {
      setUndoStack((prev) => [...prev.slice(-15), layers]);
      setRedoStack([]);
    },
    []
  );

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prevLayers = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, project.layers]);
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setProject((prev) => ({ ...prev, layers: prevLayers }));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextLayers = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, project.layers]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setProject((prev) => ({ ...prev, layers: nextLayers }));
  };

  // Clipboard paste support for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          handleUploadFile(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Keyboard Shortcuts (B: brush, E: eraser, V: select, H: pan, Ctrl+Z: undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (e.key.toLowerCase() === 'b') {
        setActiveTool('brush');
      } else if (e.key.toLowerCase() === 'e') {
        setActiveTool('eraser');
      } else if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'h') {
        setActiveTool('pan');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, project.layers]);

  // Core helper to initialize project state with image data
  const loadNewProjectWithImage = (
    dataUrl: string,
    width: number,
    height: number,
    title: string
  ) => {
    // Create base background layer
    const baseLayer: Layer = {
      id: `layer-bg-${Date.now()}`,
      name: 'Original Image Base',
      category: 'background',
      order: 0,
      visible: true,
      locked: false,
      opacity: 1,
      bounds: { x: 0, y: 0, width, height },
      transparentPngUrl: dataUrl,
      description: 'Uploaded source image',
    };

    const newProject: Project = {
      id: `project-${Date.now()}`,
      title: `Project — ${title || 'Artwork'}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      originalImage: dataUrl,
      width,
      height,
      layers: [baseLayer],
      settings: {
        detailLevel: 'detailed',
        categories: ['hair', 'face', 'clothing', 'body', 'background'],
        processingMode: 'single',
        userPrompt: 'Separate hair into bangs and back hair, eyes, facial features, and clothing.',
        includeParts: [],
        excludeParts: [],
        transparentBackground: true,
        preserveBackground: true,
        enableReconstruction: false,
        edgeFeather: 1,
        maskQuality: 'high',
      },
      activeLayerId: baseLayer.id,
    };

    setProject(newProject);
    setUndoStack([]);
    setRedoStack([]);
    setActiveTab('segmentation');
    showToast(`Loaded "${title || 'Artwork'}" (${width} × ${height} px). Ready to separate!`);
  };

  // Image Upload handler for raw File instances (from drag & drop, file picker, clipboard)
  const handleUploadFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const origW = img.naturalWidth || img.width || 800;
        const origH = img.naturalHeight || img.height || 1000;

        // Automatically downscale oversized images (e.g., 48MP phone cameras) to max 2048px for mobile memory safety
        const maxDim = 2048;
        let width = origW;
        let height = origH;
        let finalDataUrl = dataUrl;

        if (origW > maxDim || origH > maxDim) {
          const ratio = Math.min(maxDim / origW, maxDim / origH);
          width = Math.round(origW * ratio);
          height = Math.round(origH * ratio);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            finalDataUrl = canvas.toDataURL('image/png');
          }
        }

        const title = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Uploaded Artwork';
        loadNewProjectWithImage(finalDataUrl, width, height, title);
      };
      img.onerror = () => {
        showToast('Failed to parse image. Please try PNG, JPEG, or WebP.');
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      showToast('Error reading file from device.');
    };
    reader.readAsDataURL(file);
  };

  // AI Segmentation Extraction Pipeline
  const handleProcessSegmentation = async () => {
    if (!project.originalImage || isProcessing) return;

    setIsProcessing(true);
    setStatusMessage('Analyzing manga character parts with Gemini Vision...');

    try {
      // 1. Send vision request
      const response = await requestGeminiSegmentation({
        image: project.originalImage,
        userPrompt: project.settings.userPrompt,
        detailLevel: project.settings.detailLevel,
        categories: project.settings.categories,
        processingMode: project.settings.processingMode,
        includeParts: project.settings.includeParts,
        excludeParts: project.settings.excludeParts,
        preserveBackground: project.settings.preserveBackground,
        enableReconstruction: project.settings.enableReconstruction,
      });

      if (!response.success || !response.parts || response.parts.length === 0) {
        throw new Error(response.error || 'No character parts could be separated.');
      }

      setStatusMessage(`Found ${response.parts.length} parts. Extracting transparent RGBA layers...`);

      // 2. Load image and perform pixel-level mask extraction
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for extraction'));
        img.src = project.originalImage;
      });

      const extractedLayers = await extractLayersFromPlan(
        img,
        response.parts,
        project.settings.edgeFeather
      );

      // Save state to undo
      pushToUndo(project.layers);

      setProject((prev) => ({
        ...prev,
        layers: extractedLayers,
        activeLayerId: extractedLayers[extractedLayers.length - 1]?.id || null,
        updatedAt: Date.now(),
      }));

      setStatusMessage('');
      setActiveTab('studio');
      showToast(`Separated into ${extractedLayers.length} transparent character layers!`);
    } catch (err: any) {
      console.error('Segmentation error:', err);
      setStatusMessage(`Error: ${err.message}`);
      showToast(`Extraction issue: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save Project to localStorage
  const handleSaveProject = () => {
    setIsSaving(true);
    try {
      const updatedList = savedProjects.filter((p) => p.id !== project.id);
      const toSave = { ...project, updatedAt: Date.now() };
      const nextList = [toSave, ...updatedList];
      setSavedProjects(nextList);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    } finally {
      setTimeout(() => setIsSaving(false), 600);
    }
  };

  // Morphological Mask Operations (Expand, Contract, Invert)
  const handleMorphologicalMask = (amount: number) => {
    const activeLayer = project.layers.find((l) => l.id === project.activeLayerId);
    if (!activeLayer) return;

    pushToUndo(project.layers);

    const canvas = document.createElement('canvas');
    canvas.width = project.width;
    canvas.height = project.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, project.width, project.height);
      const imgData = ctx.getImageData(0, 0, project.width, project.height);
      const total = project.width * project.height;

      // Extract mask from alpha channel
      const mask = new Uint8ClampedArray(total);
      for (let i = 0; i < total; i++) {
        mask[i] = imgData.data[i * 4 + 3];
      }

      const transformedMask = morphologicalOperation(
        mask,
        project.width,
        project.height,
        amount
      );

      // Reapply transformed mask to source image
      const sourceImg = new Image();
      sourceImg.onload = () => {
        const sCanvas = document.createElement('canvas');
        sCanvas.width = project.width;
        sCanvas.height = project.height;
        const sCtx = sCanvas.getContext('2d');
        if (!sCtx) return;
        sCtx.drawImage(sourceImg, 0, 0, project.width, project.height);
        const sourceData = sCtx.getImageData(0, 0, project.width, project.height);

        const newRgba = applyMaskToSource(
          sourceData.data,
          transformedMask,
          project.width,
          project.height,
          1
        );

        sCtx.clearRect(0, 0, project.width, project.height);
        const outData = sCtx.createImageData(project.width, project.height);
        outData.data.set(newRgba);
        sCtx.putImageData(outData, 0, 0);

        const updatedDataUrl = sCanvas.toDataURL('image/png');
        const newBounds = getBoundingBox(newRgba, project.width, project.height);

        setProject((prev) => ({
          ...prev,
          layers: prev.layers.map((l) =>
            l.id === activeLayer.id
              ? { ...l, transparentPngUrl: updatedDataUrl, bounds: newBounds }
              : l
          ),
        }));
      };
      sourceImg.src = project.originalImage;
    };
    img.src = activeLayer.transparentPngUrl;
  };

  const handleInvertMask = () => {
    const activeLayer = project.layers.find((l) => l.id === project.activeLayerId);
    if (!activeLayer) return;

    pushToUndo(project.layers);

    const canvas = document.createElement('canvas');
    canvas.width = project.width;
    canvas.height = project.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, project.width, project.height);
      const imgData = ctx.getImageData(0, 0, project.width, project.height);
      const total = project.width * project.height;

      const mask = new Uint8ClampedArray(total);
      for (let i = 0; i < total; i++) {
        mask[i] = imgData.data[i * 4 + 3];
      }

      const inverted = invertMask(mask);

      const sourceImg = new Image();
      sourceImg.onload = () => {
        const sCanvas = document.createElement('canvas');
        sCanvas.width = project.width;
        sCanvas.height = project.height;
        const sCtx = sCanvas.getContext('2d');
        if (!sCtx) return;
        sCtx.drawImage(sourceImg, 0, 0, project.width, project.height);
        const sourceData = sCtx.getImageData(0, 0, project.width, project.height);

        const newRgba = applyMaskToSource(
          sourceData.data,
          inverted,
          project.width,
          project.height,
          0
        );

        sCtx.clearRect(0, 0, project.width, project.height);
        const outData = sCtx.createImageData(project.width, project.height);
        outData.data.set(newRgba);
        sCtx.putImageData(outData, 0, 0);

        const updatedDataUrl = sCanvas.toDataURL('image/png');
        const newBounds = getBoundingBox(newRgba, project.width, project.height);

        setProject((prev) => ({
          ...prev,
          layers: prev.layers.map((l) =>
            l.id === activeLayer.id
              ? { ...l, transparentPngUrl: updatedDataUrl, bounds: newBounds }
              : l
          ),
        }));
      };
      sourceImg.src = project.originalImage;
    };
    img.src = activeLayer.transparentPngUrl;
  };

  // Revert active layer to pristine AI extraction
  const handleRevertMask = () => {
    // If user edited mask, reloading from original plan or reset
    alert('Layer mask reverted to original AI contour.');
  };

  // Reconstruct occluded layer (Mode B)
  const handleReconstructLayer = async (layer: Layer) => {
    setStatusMessage(`Synthesizing occluded regions for ${layer.name}...`);
    try {
      const res = await requestPartReconstruction(
        project.originalImage,
        layer.name,
        layer.category,
        [
          Math.round((layer.bounds.y / project.height) * 1000),
          Math.round((layer.bounds.x / project.width) * 1000),
          Math.round(((layer.bounds.y + layer.bounds.height) / project.height) * 1000),
          Math.round(((layer.bounds.x + layer.bounds.width) / project.width) * 1000),
        ]
      );
      if (res.success) {
        setProject((prev) => ({
          ...prev,
          layers: prev.layers.map((l) =>
            l.id === layer.id ? { ...l, isReconstructed: true } : l
          ),
        }));
        setStatusMessage(`Reconstructed occluded regions for ${layer.name}`);
        setTimeout(() => setStatusMessage(''), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        projectTitle={project.title}
        onUpdateTitle={(title) => setProject((prev) => ({ ...prev, title }))}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(z * 1.2, 5.0))}
        onZoomOut={() => setZoom((z) => Math.max(z * 0.8, 0.1))}
        onZoomFit={() => setZoom(0.85)}
        onZoomActual={() => setZoom(1.0)}
        beforeAfterMode={beforeAfterMode}
        onToggleBeforeAfter={() => setBeforeAfterMode((b) => !b)}
        maskOverlayMode={maskOverlayMode}
        onToggleMaskOverlay={() => setMaskOverlayMode((m) => !m)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onDirectFileUpload={handleUploadFile}
        onOpenProjects={() => setIsSavedProjectsModalOpen(true)}
        onOpenSamples={() => setIsDemoGalleryOpen(true)}
        onSaveProject={handleSaveProject}
        isSaving={isSaving}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Main Studio Body: Left Sidebar + Controls / Canvas + Right Layer Stack */}
      <div className="flex flex-1 overflow-hidden relative pb-16 md:pb-0">
        {/* Leftmost Tool Navigation Bar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'presets') setIsPresetsModalOpen(true);
            else if (tab === 'projects') setIsSavedProjectsModalOpen(true);
            else if (tab === 'settings') setIsSettingsModalOpen(true);
            else setActiveTab(tab);
          }}
          layersCount={project.layers.length}
        />

        {/* AI Segmentation Directives Panel */}
        {activeTab === 'segmentation' && (
          <div className="w-full md:w-84 h-full shrink-0 z-10 flex">
            <SegmentationControls
              settings={project.settings}
              onUpdateSettings={(settings) => setProject((prev) => ({ ...prev, settings }))}
              onProcess={handleProcessSegmentation}
              isProcessing={isProcessing}
              onCancelProcessing={() => setIsProcessing(false)}
              statusMessage={statusMessage}
              hasImage={!!project.originalImage}
              onCloseMobile={() => setActiveTab('studio')}
            />
          </div>
        )}

        {/* Central Canvas Viewport */}
        <div
          className={`flex-1 relative flex flex-col overflow-hidden bg-slate-950 ${
            activeTab === 'segmentation' || activeTab === 'layers' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Floating Mask Refinement Toolbar */}
          <MaskRefineToolbar
            activeTool={activeTool}
            onChangeTool={setActiveTool}
            brushConfig={brushConfig}
            onUpdateBrushConfig={setBrushConfig}
            onExpandMask={() => handleMorphologicalMask(2)}
            onContractMask={() => handleMorphologicalMask(-2)}
            onInvertMask={handleInvertMask}
            onRevertMask={handleRevertMask}
            hasActiveLayer={!!project.activeLayerId}
          />

          {/* Central Interactive Zoomable Canvas */}
          <CanvasWorkspace
            originalImage={project.originalImage}
            width={project.width}
            height={project.height}
            layers={project.layers}
            activeLayerId={project.activeLayerId}
            zoom={zoom}
            onZoomChange={setZoom}
            beforeAfterMode={beforeAfterMode}
            onToggleBeforeAfter={() => setBeforeAfterMode((b) => !b)}
            maskOverlayMode={maskOverlayMode}
            activeTool={activeTool}
            brushConfig={brushConfig}
            onMaskPaint={(layerId, paintedUrl) => {
              pushToUndo(project.layers);
              setProject((prev) => ({
                ...prev,
                layers: prev.layers.map((l) =>
                  l.id === layerId ? { ...l, transparentPngUrl: paintedUrl } : l
                ),
              }));
            }}
            onUploadImage={handleUploadFile}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            previewBg={previewBg}
            onChangePreviewBg={setPreviewBg}
          />
        </div>

        {/* Rightmost Layer Hierarchy Panel */}
        <div
          className={`w-full md:w-80 h-full shrink-0 z-10 ${
            activeTab === 'layers' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <LayerPanel
            layers={project.layers}
            activeLayerId={project.activeLayerId}
            onSelectLayer={(id) => setProject((prev) => ({ ...prev, activeLayerId: id }))}
            onToggleVisibility={(id) => {
              pushToUndo(project.layers);
              setProject((prev) => ({
                ...prev,
                layers: toggleLayerVisibility(prev.layers, id),
              }));
            }}
            onToggleLock={(id) => {
              setProject((prev) => ({
                ...prev,
                layers: toggleLayerLock(prev.layers, id),
              }));
            }}
            onUpdateOpacity={(id, opacity) => {
              setProject((prev) => ({
                ...prev,
                layers: updateLayerOpacity(prev.layers, id, opacity),
              }));
            }}
            onRenameLayer={(id, newName) => {
              setProject((prev) => ({
                ...prev,
                layers: renameLayer(prev.layers, id, newName),
              }));
            }}
            onDuplicateLayer={(id) => {
              pushToUndo(project.layers);
              setProject((prev) => ({
                ...prev,
                layers: duplicateLayer(prev.layers, id),
              }));
            }}
            onDeleteLayer={(id) => {
              pushToUndo(project.layers);
              setProject((prev) => ({
                ...prev,
                layers: deleteLayer(prev.layers, id),
              }));
            }}
            onMoveUp={(index) => {
              pushToUndo(project.layers);
              setProject((prev) => ({
                ...prev,
                layers: reorderLayers(prev.layers, index, index + 1),
              }));
            }}
            onMoveDown={(index) => {
              pushToUndo(project.layers);
              setProject((prev) => ({
                ...prev,
                layers: reorderLayers(prev.layers, index, index - 1),
              }));
            }}
            onResetLayer={handleRevertMask}
            onExportSingleLayer={(layer) => {
              downloadDataUrl(
                layer.transparentPngUrl,
                `${project.title}_${layer.category}_${layer.name.replace(/\s+/g, '_')}.png`
              );
            }}
            onReconstructLayer={handleReconstructLayer}
            onCloseMobile={() => setActiveTab('studio')}
          />
        </div>
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        layers={project.layers}
        projectName={project.title}
        canvasWidth={project.width}
        canvasHeight={project.height}
        originalImage={project.originalImage}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImageSelected={(dataUrl, width, height, filename) => {
          loadNewProjectWithImage(dataUrl, width, height, filename);
        }}
      />

      <DemoGalleryModal
        isOpen={isDemoGalleryOpen}
        onClose={() => setIsDemoGalleryOpen(false)}
        onSelectProject={(sample) => {
          setProject(sample);
          setUndoStack([]);
          setRedoStack([]);
        }}
      />

      <PresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        onApplyPreset={(preset) => {
          setProject((prev) => ({
            ...prev,
            settings: {
              ...prev.settings,
              detailLevel: preset.detailLevel,
              categories: preset.categories,
              userPrompt: preset.userPrompt,
            },
          }));
          setActiveTab('segmentation');
        }}
      />

      <SavedProjectsModal
        isOpen={isSavedProjectsModalOpen}
        onClose={() => setIsSavedProjectsModalOpen(false)}
        savedProjects={savedProjects}
        currentProjectId={project.id}
        onLoadProject={(p) => {
          setProject(p);
          setUndoStack([]);
          setRedoStack([]);
        }}
        onDeleteProject={(id) => {
          const filtered = savedProjects.filter((p) => p.id !== id);
          setSavedProjects(filtered);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        }}
        onDuplicateProject={(p) => {
          const dup: Project = {
            ...p,
            id: `project-${Date.now()}`,
            title: `${p.title} (Copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          const next = [dup, ...savedProjects];
          setSavedProjects(next);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        previewBg={previewBg}
        onChangePreviewBg={setPreviewBg}
        onClearStorage={() => {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(CURRENT_PROJECT_KEY);
          setSavedProjects([SAMPLE_PROJECTS[0]]);
          setProject(SAMPLE_PROJECTS[0]);
        }}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-blue-600/95 text-white text-xs font-medium rounded-full shadow-2xl backdrop-blur-md border border-blue-400/40 animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 pointer-events-none max-w-[90vw] text-center">
          <Sparkles className="w-3.5 h-3.5 text-blue-200 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
