import React from 'react';
import { Sliders, X, ShieldCheck, Cpu, HardDrive } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewBg: 'checker-dark' | 'checker-light' | 'dark' | 'green';
  onChangePreviewBg: (bg: 'checker-dark' | 'checker-light' | 'dark' | 'green') => void;
  onClearStorage: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  previewBg,
  onChangePreviewBg,
  onClearStorage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Studio Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-300">
          {/* Canvas Background Default */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-200">
              Canvas Preview Background
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'checker-dark', label: 'Dark Grid (Standard)' },
                { id: 'checker-light', label: 'Light Grid' },
                { id: 'dark', label: 'Solid Charcoal' },
                { id: 'green', label: 'Chroma Green' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onChangePreviewBg(opt.id as any)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-colors ${
                    previewBg === opt.id
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Vision Pipeline Info */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-200 font-medium">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Vision Model Pipeline</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Using Google Gemini 3.8 Flash with structured polygon boundary detection and
              pixel-level RGBA canvas mask extraction.
            </p>
          </div>

          {/* Storage Management */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-200">Browser Cache</p>
              <p className="text-[10px] text-slate-500">Reset saved projects and local cache</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Clear all local saved projects?')) {
                  onClearStorage();
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-900/60 text-red-300 hover:bg-red-900 text-xs transition-colors"
            >
              Clear Storage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
