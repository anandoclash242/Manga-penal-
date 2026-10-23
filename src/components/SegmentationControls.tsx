import React, { useState } from 'react';
import {
  SegmentationSettings,
  PartCategory,
  SegmentationDetail,
  ProcessingMode,
} from '../types';
import {
  Wand2,
  Sparkles,
  SlidersHorizontal,
  Layers,
  ShieldCheck,
  RotateCw,
  Plus,
  X,
  AlertCircle,
  Scissors,
  Check,
} from 'lucide-react';

interface SegmentationControlsProps {
  settings: SegmentationSettings;
  onUpdateSettings: (settings: SegmentationSettings) => void;
  onProcess: () => void;
  isProcessing: boolean;
  onCancelProcessing?: () => void;
  statusMessage?: string;
  hasImage: boolean;
  onCloseMobile?: () => void;
}

const CATEGORIES: { id: PartCategory; label: string; desc: string }[] = [
  { id: 'hair', label: 'Hair', desc: 'Bangs, ponytail, back locks' },
  { id: 'face', label: 'Face Parts', desc: 'Eyes, eyebrows, nose, mouth' },
  { id: 'clothing', label: 'Clothing', desc: 'Jacket, shirt, collar, sleeves' },
  { id: 'body', label: 'Body Parts', desc: 'Neck, torso, arms, hands' },
  { id: 'accessories', label: 'Accessories', desc: 'Glasses, jewelry, hats' },
  { id: 'prop', label: 'Objects & Props', desc: 'Weapons, swords, books' },
  { id: 'background', label: 'Background', desc: 'Backdrop scenery & screentone' },
  { id: 'custom', label: 'Custom Parts', desc: 'User requested sub-elements' },
];

const QUICK_PROMPTS = [
  'Separate bangs, side locks, and back hair into distinct layers',
  'Isolate left eye, right eye, mouth, and eyebrows for VTuber/Live2D rigging',
  'Extract combat jacket, inner shirt, sleeves, and collar separately',
  'Separate character from background and keep line art transparent',
  'Deconstruct character with ultra facial features and fingers',
];

export const SegmentationControls: React.FC<SegmentationControlsProps> = ({
  settings,
  onUpdateSettings,
  onProcess,
  isProcessing,
  onCancelProcessing,
  statusMessage,
  hasImage,
  onCloseMobile,
}) => {
  const [newIncludeTag, setNewIncludeTag] = useState('');
  const [newExcludeTag, setNewExcludeTag] = useState('');

  const toggleCategory = (cat: PartCategory) => {
    const exists = settings.categories.includes(cat);
    const updated = exists
      ? settings.categories.filter((c) => c !== cat)
      : [...settings.categories, cat];
    onUpdateSettings({ ...settings, categories: updated });
  };

  const selectAllCategories = () => {
    onUpdateSettings({
      ...settings,
      categories: CATEGORIES.map((c) => c.id),
    });
  };

  const clearAllCategories = () => {
    onUpdateSettings({ ...settings, categories: ['hair', 'face'] });
  };

  const addIncludeTag = () => {
    if (newIncludeTag.trim() && !settings.includeParts.includes(newIncludeTag.trim())) {
      onUpdateSettings({
        ...settings,
        includeParts: [...settings.includeParts, newIncludeTag.trim()],
      });
      setNewIncludeTag('');
    }
  };

  const removeIncludeTag = (tag: string) => {
    onUpdateSettings({
      ...settings,
      includeParts: settings.includeParts.filter((t) => t !== tag),
    });
  };

  const addExcludeTag = () => {
    if (newExcludeTag.trim() && !settings.excludeParts.includes(newExcludeTag.trim())) {
      onUpdateSettings({
        ...settings,
        excludeParts: [...settings.excludeParts, newExcludeTag.trim()],
      });
      setNewExcludeTag('');
    }
  };

  const removeExcludeTag = (tag: string) => {
    onUpdateSettings({
      ...settings,
      excludeParts: settings.excludeParts.filter((t) => t !== tag),
    });
  };

  return (
    <div className="w-full md:w-84 bg-slate-950 border-r border-slate-800/80 flex flex-col h-full overflow-hidden select-none shrink-0 z-10">
      {/* Panel Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-100">AI Part Separator</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/60">
            Vision 3.8
          </span>
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

      {/* Scrollable controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-300">
        {/* Custom Prompt */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-200 flex items-center justify-between">
            <span>Natural Language Directive</span>
            <span className="text-[10px] text-slate-500">Custom prompt</span>
          </label>
          <textarea
            value={settings.userPrompt}
            onChange={(e) => onUpdateSettings({ ...settings, userPrompt: e.target.value })}
            placeholder="e.g. Separate the character's hair into bangs, left hair, and back hair. Extract both eyes, the jacket, collar, and katana..."
            rows={3}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />

          {/* Quick Prompts */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] text-slate-500 font-medium">Quick Suggestions:</span>
            <div className="flex flex-col gap-1">
              {QUICK_PROMPTS.slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onUpdateSettings({ ...settings, userPrompt: prompt })}
                  className="text-left text-[11px] text-slate-400 hover:text-blue-300 bg-slate-900/60 hover:bg-slate-900 px-2 py-1.5 rounded border border-slate-800/60 hover:border-slate-700 transition-colors truncate"
                  title={prompt}
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Segmentation Detail Level */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-200 flex items-center justify-between">
            <span>Segmentation Detail</span>
            <span className="text-[10px] text-blue-400 font-mono capitalize">
              {settings.detailLevel}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {(['basic', 'detailed', 'ultra'] as SegmentationDetail[]).map((level) => {
              const active = settings.detailLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => onUpdateSettings({ ...settings, detailLevel: level })}
                  className={`py-1.5 text-center capitalize rounded font-medium transition-colors ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            {settings.detailLevel === 'basic' && 'Extracts major anatomical blocks and overall outfit.'}
            {settings.detailLevel === 'detailed' && 'Splits hair into bangs, back hair, facial features & clothing parts.'}
            {settings.detailLevel === 'ultra' && 'Micro-subdivision: individual hair locks, irises, pupils, teeth & fingers.'}
          </p>
        </div>

        {/* Target Categories Multi-Select */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-200">
              Target Categories ({settings.categories.length})
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllCategories}
                className="text-[10px] text-blue-400 hover:underline"
              >
                All
              </button>
              <span className="text-slate-600">·</span>
              <button
                onClick={clearAllCategories}
                className="text-[10px] text-slate-400 hover:underline"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORIES.map((cat) => {
              const isSelected = settings.categories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[11px]">{cat.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-blue-400" />}
                  </div>
                  <span className="text-[9px] text-slate-500 block truncate mt-0.5">
                    {cat.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Processing Mode */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-200">Processing Mode</label>
          <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {(
              [
                { id: 'single', label: 'Single Character' },
                { id: 'multiple', label: 'Multi-Character' },
                { id: 'whole', label: 'Whole Scene' },
                { id: 'custom', label: 'Custom Focus' },
              ] as { id: ProcessingMode; label: string }[]
            ).map((mode) => {
              const active = settings.processingMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onUpdateSettings({ ...settings, processingMode: mode.id })}
                  className={`py-1.5 px-2 text-center rounded text-[11px] font-medium transition-colors ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Include / Exclude Specific Parts */}
        <div className="space-y-3 pt-1 border-t border-slate-800/80">
          {/* Include */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-200">Must Include Parts</label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newIncludeTag}
                onChange={(e) => setNewIncludeTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addIncludeTag()}
                placeholder="e.g. Left Eye, Katana"
                className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={addIncludeTag}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {settings.includeParts.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {settings.includeParts.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 bg-blue-950/70 border border-blue-800/80 text-blue-300 text-[10px] px-1.5 py-0.5 rounded"
                  >
                    <span>{tag}</span>
                    <button onClick={() => removeIncludeTag(tag)}>
                      <X className="w-2.5 h-2.5 hover:text-white" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Exclude */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-200">Exclude Parts</label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newExcludeTag}
                onChange={(e) => setNewExcludeTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addExcludeTag()}
                placeholder="e.g. Background, Legs"
                className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              <button
                onClick={addExcludeTag}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {settings.excludeParts.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {settings.excludeParts.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 bg-red-950/70 border border-red-800/80 text-red-300 text-[10px] px-1.5 py-0.5 rounded"
                  >
                    <span>{tag}</span>
                    <button onClick={() => removeExcludeTag(tag)}>
                      <X className="w-2.5 h-2.5 hover:text-white" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Core Toggles: Transparency & Reconstruction */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
          {/* Transparent Background Toggle */}
          <label className="flex items-start gap-2.5 p-2 rounded-lg bg-blue-950/20 border border-blue-900/30 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.transparentBackground}
              onChange={(e) =>
                onUpdateSettings({ ...settings, transparentBackground: e.target.checked })
              }
              className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0"
            />
            <div>
              <span className="text-xs font-medium text-blue-300 flex items-center gap-1">
                <span>Genuine Transparent Background</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              </span>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                Every extracted part exports as a 32-bit RGBA PNG with real alpha channel.
              </p>
            </div>
          </label>

          {/* Preserve Original Background */}
          <label className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.preserveBackground}
              onChange={(e) =>
                onUpdateSettings({ ...settings, preserveBackground: e.target.checked })
              }
              className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0"
            />
            <div>
              <span className="text-xs font-medium text-slate-200">
                Preserve Original Background
              </span>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                Keeps the scene backdrop or screentone as its own bottom layer.
              </p>
            </div>
          </label>

          {/* Optional Occluded Part Reconstruction */}
          <label className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableReconstruction}
              onChange={(e) =>
                onUpdateSettings({ ...settings, enableReconstruction: e.target.checked })
              }
              className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0"
            />
            <div>
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1">
                <span>AI Inpainting Reconstruction (Mode B)</span>
              </span>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                Synthesizes occluded hair or collar lines hidden beneath other parts.
              </p>
            </div>
          </label>

          {/* Edge Refinement */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-300">Edge Feathering</span>
              <span className="font-mono text-blue-400">{settings.edgeFeather} px</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={settings.edgeFeather}
              onChange={(e) =>
                onUpdateSettings({ ...settings, edgeFeather: Number(e.target.value) })
              }
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Footer Process Action */}
      <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950 flex flex-col gap-2 shrink-0">
        {statusMessage && (
          <div className="flex items-center gap-1.5 text-[11px] text-blue-400 animate-pulse">
            <RotateCw className="w-3 h-3 animate-spin" />
            <span className="truncate">{statusMessage}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={onProcess}
            disabled={isProcessing || !hasImage}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {isProcessing ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting Layers...</span>
              </>
            ) : (
              <>
                <Scissors className="w-3.5 h-3.5" />
                <span>Separate & Extract Layers</span>
              </>
            )}
          </button>

          {isProcessing && onCancelProcessing && (
            <button
              onClick={onCancelProcessing}
              className="py-2.5 px-3 bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 text-xs rounded-lg transition-colors"
              title="Cancel processing"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
