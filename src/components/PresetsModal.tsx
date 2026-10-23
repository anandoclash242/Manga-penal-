import React from 'react';
import { Scissors, X, Check, Sparkles, Layers, Video, Palette } from 'lucide-react';
import { PartCategory, SegmentationDetail } from '../types';

interface PresetItem {
  id: string;
  title: string;
  desc: string;
  detailLevel: SegmentationDetail;
  categories: PartCategory[];
  prompt: string;
  icon: any;
}

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (preset: {
    detailLevel: SegmentationDetail;
    categories: PartCategory[];
    userPrompt: string;
  }) => void;
}

const PRESETS: PresetItem[] = [
  {
    id: 'vtuber-live2d',
    title: 'VTuber & Live2D Rigging Kit',
    desc: 'Deconstructs face and hair into separate rigging layers: bangs, side locks, back hair, left/right eye, pupils, eyebrows, and mouth.',
    detailLevel: 'ultra',
    categories: ['hair', 'face', 'body', 'accessories'],
    prompt:
      'Separate hair into bangs, left side, right side, and back hair. Extract left eye, right eye, pupils, eyebrows, nose, mouth, and neck for 2D character rigging.',
    icon: Sparkles,
  },
  {
    id: 'amv-action',
    title: 'AMV & Motion Graphics Cutout',
    desc: 'Separates foreground characters, weapons/props, aura effects, and background scenery for parallax animation and video editing.',
    detailLevel: 'detailed',
    categories: ['background', 'body', 'clothing', 'prop'],
    prompt:
      'Separate the character from background scenery, isolate weapons and handheld props, jacket and torso for motion parallax animation.',
    icon: Video,
  },
  {
    id: 'digital-colorist',
    title: 'Digital Coloring & Shading Base',
    desc: 'Splits line art, skin regions, hair, and garment flats into independent transparent color zones.',
    detailLevel: 'detailed',
    categories: ['hair', 'face', 'body', 'clothing'],
    prompt:
      'Extract skin/face, hair silhouette, clothing garments, and accessories into separate transparent layers for shading and coloring.',
    icon: Palette,
  },
  {
    id: 'full-deconstruct',
    title: 'Complete Character Deconstruction',
    desc: 'Maximizes layer subdivision: head, hair locks, eyes, facial features, outfit components, sleeves, hands, and accessories.',
    detailLevel: 'ultra',
    categories: ['hair', 'face', 'body', 'clothing', 'accessories', 'prop'],
    prompt:
      'Deconstruct the entire character into independent transparent layers: hair locks, facial features, collar, jacket, sleeves, arms, hands, and accessories.',
    icon: Layers,
  },
];

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onApplyPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-blue-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Part Segmentation Presets</h3>
              <p className="text-[11px] text-slate-400">
                Optimized workflows for Live2D rigging, AMVs, digital painting, and animation
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

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <div
                key={preset.id}
                onClick={() => {
                  onApplyPreset({
                    detailLevel: preset.detailLevel,
                    categories: preset.categories,
                    userPrompt: preset.prompt,
                  });
                  onClose();
                }}
                className="group border border-slate-800 hover:border-blue-500/50 bg-slate-900/50 hover:bg-slate-900 p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {preset.detailLevel}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
                    {preset.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {preset.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-blue-400 font-medium">
                  <span>Apply Preset Directives</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
