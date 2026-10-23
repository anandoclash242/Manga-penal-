import React from 'react';
import { Sparkles, X, Layers, ArrowRight } from 'lucide-react';
import { SAMPLE_PROJECTS } from '../utils/sampleData';
import { Project } from '../types';

interface DemoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: Project) => void;
}

export const DemoGalleryModal: React.FC<DemoGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Manga Demo Gallery</h3>
              <p className="text-[11px] text-slate-400">
                Instantly explore pre-segmented character artwork with transparent layers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gallery Cards */}
        <div className="p-6 grid grid-cols-1 gap-4">
          {SAMPLE_PROJECTS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                onSelectProject(sample);
                onClose();
              }}
              className="group border border-slate-800 hover:border-blue-500/50 bg-slate-900/50 hover:bg-slate-900 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all shadow-sm"
            >
              {/* Preview Box */}
              <div
                className="w-24 h-28 rounded-lg border border-slate-700 overflow-hidden bg-slate-950 shrink-0 relative flex items-center justify-center"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #1e2230 25%, transparent 25%),
                    linear-gradient(-45deg, #1e2230 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #1e2230 75%),
                    linear-gradient(-45deg, transparent 75%, #1e2230 75%)
                  `,
                  backgroundSize: '8px 8px',
                }}
              >
                <img
                  src={sample.originalImage}
                  alt={sample.title}
                  className="max-w-full max-h-full object-contain p-1"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
                    {sample.title}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950/80 border border-blue-800/80 text-blue-300 font-mono">
                    {sample.layers.length} Layers
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {sample.settings.userPrompt}
                </p>

                <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500 font-medium">
                  <span>{sample.width} × {sample.height} px</span>
                  <span>·</span>
                  <span className="capitalize">{sample.settings.detailLevel} Detail</span>
                  <span>·</span>
                  <span className="text-emerald-400">100% Transparent PNGs</span>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-800/80 text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
