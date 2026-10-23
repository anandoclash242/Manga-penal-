import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, Clipboard, Sparkles, Loader2 } from 'lucide-react';
import { SAMPLE_PROJECTS } from '../utils/sampleData';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (dataUrl: string, width: number, height: number, filename: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onImageSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setErrorMessage(null);
    setIsLoading(true);

    const isImageExtension = /\.(png|jpe?g|webp|svg|gif|bmp|avif|heic|heif)$/i.test(file.name);
    const isImageMime = file.type.startsWith('image/') || file.type === '';

    if (!isImageMime && !isImageExtension) {
      setErrorMessage('Please choose an image file (PNG, JPEG, WebP, SVG).');
      setIsLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        setErrorMessage('Failed to read file contents.');
        setIsLoading(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const origW = img.naturalWidth || img.width;
          const origH = img.naturalHeight || img.height;

          // Downscale high-resolution mobile photos (e.g. 48MP) to max 2048px to prevent canvas memory limits
          const maxDim = 2048;
          let targetW = origW;
          let targetH = origH;
          if (targetW > maxDim || targetH > maxDim) {
            const ratio = Math.min(maxDim / targetW, maxDim / targetH);
            targetW = Math.round(targetW * ratio);
            targetH = Math.round(targetH * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not create canvas context');

          ctx.drawImage(img, 0, 0, targetW, targetH);
          const rasterDataUrl = canvas.toDataURL('image/png');

          onImageSelected(
            rasterDataUrl,
            targetW,
            targetH,
            file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Manga Artwork'
          );
          setIsLoading(false);
          onClose();
        } catch (err: any) {
          console.warn('Canvas optimization error, using original data:', err);
          onImageSelected(
            result,
            img.naturalWidth || img.width || 800,
            img.naturalHeight || img.height || 1000,
            file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Manga Artwork'
          );
          setIsLoading(false);
          onClose();
        }
      };

      img.onerror = () => {
        setErrorMessage('Could not decode image format. Please try PNG, JPEG, or WebP.');
        setIsLoading(false);
      };

      img.src = result;
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read file.');
      setIsLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], 'clipboard-artwork.png', { type: imageType });
            processFile(file);
            return;
          }
        }
      }
      setErrorMessage('No image found in clipboard. Please copy an image first or browse your files.');
    } catch (e) {
      setErrorMessage('Clipboard access denied or unavailable. Use the file browse button below.');
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_PROJECTS[0]) => {
    onImageSelected(sample.originalImage, sample.width, sample.height, sample.title);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Upload Manga Artwork</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-950/25'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.png,.jpg,.jpeg,.webp,.svg,.avif,.gif,.bmp"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  processFile(e.target.files[0]);
                  e.target.value = '';
                }
              }}
              className="hidden"
            />
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              ) : (
                <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-100">
              {isLoading ? 'Optimizing Artwork...' : 'Tap or Drop Artwork Here'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Browse photo library, camera, or device storage
            </p>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-4 text-[10px] text-slate-500 font-mono flex-wrap justify-center">
              <span>PNG</span>
              <span>·</span>
              <span>JPEG</span>
              <span>·</span>
              <span>WebP</span>
              <span>·</span>
              <span>SVG</span>
              <span>·</span>
              <span>Auto-Scaled to 2K</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-900/50 flex items-start gap-2.5 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handlePasteClipboard}
              type="button"
              className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
            >
              <Clipboard className="w-3.5 h-3.5 text-blue-400" />
              <span>Paste Clipboard</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Browse Files</span>
            </button>
          </div>

          {/* Try with Sample Illustrations */}
          <div className="pt-2 border-t border-slate-900">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Or try with demo manga artwork:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_PROJECTS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 text-left transition-colors"
                >
                  <img
                    src={sample.originalImage}
                    alt={sample.title}
                    className="w-9 h-9 rounded object-cover bg-slate-950 border border-slate-800 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{sample.title}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{sample.layers.length} layers</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
