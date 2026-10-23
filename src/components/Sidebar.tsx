import React from 'react';
import {
  Wand2,
  Layers,
  FolderOpen,
  Sparkles,
  Sliders,
  HelpCircle,
  Scissors,
  ListFilter,
} from 'lucide-react';

export type ActiveTab = 'studio' | 'segmentation' | 'layers' | 'presets' | 'projects' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  layersCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  layersCount,
}) => {
  const desktopNavItems = [
    {
      id: 'segmentation' as ActiveTab,
      label: 'AI Separator',
      icon: Wand2,
      badge: null,
    },
    {
      id: 'studio' as ActiveTab,
      label: 'Layers & Canvas',
      icon: Layers,
      badge: layersCount > 0 ? String(layersCount) : null,
    },
    {
      id: 'presets' as ActiveTab,
      label: 'Part Presets',
      icon: Scissors,
      badge: null,
    },
    {
      id: 'projects' as ActiveTab,
      label: 'Saved Projects',
      icon: FolderOpen,
      badge: null,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings',
      icon: Sliders,
      badge: null,
    },
  ];

  return (
    <>
      {/* Desktop Vertical Sidebar */}
      <aside className="hidden md:flex w-16 bg-slate-950 border-r border-slate-800/80 flex-col items-center py-3 select-none z-20 shrink-0">
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id || (item.id === 'studio' && activeTab === 'layers');
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full py-2.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all relative ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium tracking-tight text-center truncate max-w-full">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.2 text-[9px] font-mono bg-blue-600 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-3">
          <div className="w-8 h-px bg-slate-800" />
          <a
            href="https://ai.google.dev"
            target="_blank"
            rel="noreferrer"
            title="Powered by Gemini 3.8 Flash Vision"
            className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </a>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Fixed at bottom on small screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-md flex items-center justify-around px-2 z-40 select-none">
        {/* 1. Canvas View */}
        <button
          onClick={() => onSelectTab('studio')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition-colors min-h-[48px] ${
            activeTab === 'studio' ? 'text-blue-400 font-medium' : 'text-slate-400'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Canvas</span>
        </button>

        {/* 2. AI Separator */}
        <button
          onClick={() => onSelectTab('segmentation')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition-colors min-h-[48px] ${
            activeTab === 'segmentation' ? 'text-blue-400 font-medium' : 'text-slate-400'
          }`}
        >
          <Wand2 className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">AI Separator</span>
        </button>

        {/* 3. Layer Stack (Mobile View) */}
        <button
          onClick={() => onSelectTab('layers')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition-colors relative min-h-[48px] ${
            activeTab === 'layers' ? 'text-blue-400 font-medium' : 'text-slate-400'
          }`}
        >
          <ListFilter className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Layers</span>
          {layersCount > 0 && (
            <span className="absolute top-1 right-3 px-1.5 py-0.2 text-[8px] font-mono bg-blue-600 text-white rounded-full">
              {layersCount}
            </span>
          )}
        </button>

        {/* 4. Presets */}
        <button
          onClick={() => onSelectTab('presets')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition-colors min-h-[48px] ${
            activeTab === 'presets' ? 'text-blue-400 font-medium' : 'text-slate-400'
          }`}
        >
          <Scissors className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Presets</span>
        </button>

        {/* 5. Projects */}
        <button
          onClick={() => onSelectTab('projects')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition-colors min-h-[48px] ${
            activeTab === 'projects' ? 'text-blue-400 font-medium' : 'text-slate-400'
          }`}
        >
          <FolderOpen className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Projects</span>
        </button>
      </nav>
    </>
  );
};
