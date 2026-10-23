import React, { useState } from 'react';
import { FolderOpen, X, Trash2, Copy, Clock, Layers, Download } from 'lucide-react';
import { Project } from '../types';

interface SavedProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedProjects: Project[];
  currentProjectId: string;
  onLoadProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (project: Project) => void;
}

export const SavedProjectsModal: React.FC<SavedProjectsModalProps> = ({
  isOpen,
  onClose,
  savedProjects,
  currentProjectId,
  onLoadProject,
  onDeleteProject,
  onDuplicateProject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Project Library</h3>
              <p className="text-[11px] text-slate-400">
                Projects and layer stacks saved in local browser storage
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

        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {savedProjects.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No saved projects yet. Click 'Save' in the top bar to save your work.
            </div>
          ) : (
            savedProjects.map((proj) => {
              const isCurrent = proj.id === currentProjectId;
              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    onLoadProject(proj);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    isCurrent
                      ? 'bg-blue-600/15 border-blue-500/50 text-white'
                      : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Thumbnail */}
                    <div
                      className="w-12 h-12 rounded-lg border border-slate-700 overflow-hidden bg-slate-950 shrink-0 flex items-center justify-center"
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
                        src={proj.originalImage}
                        alt={proj.title}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold">{proj.title}</h4>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500 text-white font-mono">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                        <span>{proj.layers.length} Layers</span>
                        <span>·</span>
                        <span>{proj.width} × {proj.height} px</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateProject(proj);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                      title="Duplicate project"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(proj.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
