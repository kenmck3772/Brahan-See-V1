import React, { useState } from 'react';
import { WorkspaceSnapshot } from '../types';
import { Camera, Save, Trash2, RotateCcw, Plus, Info } from 'lucide-react';

interface WorkspaceSnapshotManagerProps {
  terminalTheme: 'emerald' | 'crimson';
  snapshots: WorkspaceSnapshot[];
  onSaveSnapshot: (name: string) => void;
  onLoadSnapshot: (snapshot: WorkspaceSnapshot) => void;
  onRemoveSnapshot: (id: string) => void;
  addLog: (msg: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  currentSelectedFilePath: string | null;
}

export const WorkspaceSnapshotManager: React.FC<WorkspaceSnapshotManagerProps> = ({
  terminalTheme,
  snapshots,
  onSaveSnapshot,
  onLoadSnapshot,
  onRemoveSnapshot,
  addLog,
  currentSelectedFilePath
}) => {
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const themeColors = {
    emerald: {
      border: 'border-emerald-500/20',
      borderHover: 'hover:border-emerald-500/40',
      borderFocus: 'focus:border-emerald-500/50',
      borderSubtle: 'border-emerald-500/10',
      text: 'text-emerald-400',
      textMuted: 'text-emerald-500/60',
      textDull: 'text-emerald-500/40',
      glow: 'glow-text-emerald',
      bgSubtle: 'bg-emerald-500/5',
      bgHover: 'hover:bg-emerald-500/10',
      bgActive: 'bg-emerald-500/15 border-emerald-500/30',
      accent: 'emerald'
    },
    crimson: {
      border: 'border-red-500/20',
      borderHover: 'hover:border-red-500/40',
      borderFocus: 'focus:border-red-500/50',
      borderSubtle: 'border-red-500/10',
      text: 'text-red-400',
      textMuted: 'text-red-500/60',
      textDull: 'text-red-500/40',
      glow: 'glow-text-red',
      bgSubtle: 'bg-red-500/5',
      bgHover: 'hover:bg-red-500/10',
      bgActive: 'bg-red-500/15 border-red-500/30',
      accent: 'crimson'
    }
  };

  const colors = themeColors[terminalTheme] || themeColors.emerald;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToUse = newSnapshotName.trim() || `Snapshot_${new Date().toLocaleTimeString([], { hour12: false })}`;
    onSaveSnapshot(nameToUse);
    setNewSnapshotName('');
    setIsCapturing(false);
  };

  return (
    <div className={`bg-[#020617]/90 border ${colors.border} rounded-md p-4 flex flex-col gap-3 scanline-glow relative select-text`} id="workspace-snapshots-system">
      <div className={`flex items-center justify-between border-b ${colors.borderSubtle} pb-2`}>
        <h3 className={`font-mono ${colors.text} text-sm font-bold flex items-center gap-2 ${colors.glow}`}>
          <Camera className={`w-4 h-4 ${colors.text} animate-pulse`} />
          WORKSPACE SNAPSHOTS
        </h3>
        <span className={`font-mono text-[10px] ${colors.textMuted} uppercase`}>
          State Recovery
        </span>
      </div>

      {/* Snapshots Registry List */}
      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
        {snapshots.length === 0 ? (
          <div className={`font-mono text-[11px] ${colors.textDull} italic py-4 text-center`}>
            [No active workspace snapshots captured]
          </div>
        ) : (
          snapshots.map((snap) => {
            const isSameFile = snap.selectedFilePath === currentSelectedFilePath;
            return (
              <div
                key={snap.id}
                className={`flex items-center justify-between p-2.5 rounded border transition-all duration-200 cursor-pointer ${
                  isSameFile 
                    ? colors.bgActive 
                    : `${colors.bgSubtle} ${colors.borderHover} border-transparent`
                }`}
                onClick={() => {
                  try {
                    onLoadSnapshot(snap);
                  } catch (err: any) {
                    addLog(`Error restoring snapshot state: ${err.message}`, 'error');
                  }
                }}
                title="Restore exact workspace layout, theme, expanded folders, and file state"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-mono text-[11px] text-white font-semibold truncate flex items-center gap-1.5">
                    <Save className={`w-3 h-3 ${colors.text}`} />
                    {snap.name}
                  </span>
                  
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 font-mono text-[8px] text-zinc-500">
                    <span className="text-zinc-400 font-extrabold">{snap.timestamp}</span>
                    <span className="text-zinc-600">|</span>
                    <span className="truncate">Theme: <strong className={colors.text}>{snap.terminalTheme.toUpperCase()}</strong></span>
                    <span className="text-zinc-600">|</span>
                    <span className="truncate max-w-[120px]" title={snap.selectedFilePath || 'None'}>
                      File: <strong className="text-white">{snap.selectedFilePath ? snap.selectedFilePath.split('/').pop() : 'None'}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    title="Load Workspace State"
                    className={`p-1 rounded bg-[#020617] border ${colors.border} ${colors.text} hover:bg-white/5 transition-colors`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadSnapshot(snap);
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Purge Snapshot"
                    className="p-1 hover:bg-red-500/20 rounded text-red-400/80 hover:text-red-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSnapshot(snap.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Snapshot Interaction Controller */}
      {isCapturing ? (
        <form onSubmit={handleSave} className={`flex flex-col gap-2 border-t ${colors.borderSubtle} pt-3 flex-shrink-0`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSnapshotName}
              onChange={(e) => setNewSnapshotName(e.target.value)}
              placeholder="e.g. Sector Alpha Peak PSI"
              maxLength={36}
              className={`bg-black/90 border ${colors.border} rounded px-2 py-1 text-xs text-white font-mono placeholder-zinc-700 focus:outline-none ${colors.borderFocus} flex-1`}
              autoFocus
            />
            <button
              type="submit"
              className={`bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded text-emerald-400 hover:text-emerald-300 font-mono text-xs flex items-center gap-1 transition-all`}
            >
              <Plus className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[8px] text-zinc-500">
              Captures layout split width, theme, files expanded & active graph line
            </span>
            <button 
              type="button" 
              onClick={() => setIsCapturing(false)} 
              className="text-[9px] text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            const timeStr = new Date().toLocaleTimeString([], { hour12: false });
            setNewSnapshotName(`Workspace_${timeStr}`);
            setIsCapturing(true);
          }}
          className={`w-full py-1.5 border border-dashed ${colors.border} hover:border-solid transition-all rounded font-mono text-[10px] ${colors.textMuted} hover:${colors.text} flex items-center justify-center gap-1.5 ${colors.bgSubtle} ${colors.bgHover} cursor-pointer`}
        >
          <Camera className="w-3.5 h-3.5" />
          Capture Workspace Snapshot
        </button>
      )}

      <div className="flex items-start gap-1 font-mono text-[8px] text-zinc-500 leading-tight">
        <Info className="w-3 h-3 text-zinc-600 shrink-0 mt-0.5" />
        <span>Snapshots are persisted locally and automatically loaded on startup, securing diagnostic state stability.</span>
      </div>
    </div>
  );
};
