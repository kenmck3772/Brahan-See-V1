import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Trash2, 
  FolderPlus, 
  ChevronRight, 
  ChevronDown, 
  Save, 
  Database, 
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Activity, 
  Info
} from 'lucide-react';
import { DirectoryNode } from '../types';

export interface DiagnosticFolder {
  id: string;
  name: string;
  path: string;
}

export interface DiagnosticSession {
  id: string;
  name: string;
  timestamp: string;
  folderId: string; // Reference to DiagnosticFolder
  selectedFilePath: string | null;
  terminalTheme: 'emerald' | 'crimson';
  nodeViewMode: 'tree' | 'trauma';
  notes?: string;
  // Parameter Snapshots
  pressureSnapshot?: number;
  tempSnapshot?: number;
  flowRateSnapshot?: number;
}

interface DiagnosticSessionSidebarProps {
  terminalTheme: 'emerald' | 'crimson';
  isOpen: boolean;
  onToggle: () => void;
  selectedFile: DirectoryNode | null;
  onLoadFileByPath: (pathStr: string) => void;
  onSetTheme: (theme: 'emerald' | 'crimson') => void;
  onSetViewMode: (mode: 'tree' | 'trauma') => void;
  addLog: (msg: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const DiagnosticSessionSidebar: React.FC<DiagnosticSessionSidebarProps> = ({
  terminalTheme,
  isOpen,
  onToggle,
  selectedFile,
  onLoadFileByPath,
  onSetTheme,
  onSetViewMode,
  addLog
}) => {
  // 1. Directories/Folders State
  const [folders, setFolders] = useState<DiagnosticFolder[]>(() => {
    try {
      const stored = localStorage.getItem('sovereign_terminal_diagnostic_folders');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    // Default initial directory hierarchy
    return [
      { id: 'f-root', name: 'SYSTEM_ROOT', path: 'Root' },
      { id: 'f-well-a', name: 'WELL_SECTOR_A', path: 'Root/Well-Sector-A' },
      { id: 'f-well-b', name: 'WELL_SECTOR_B', path: 'Root/Well-Sector-B' },
      { id: 'f-thermal', name: 'THERMAL_TRAUMAS', path: 'Root/Thermal-Traumas' }
    ];
  });

  // 2. Saved Sessions State
  const [sessions, setSessions] = useState<DiagnosticSession[]>(() => {
    try {
      const stored = localStorage.getItem('sovereign_terminal_diagnostic_sessions');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return [
      {
        id: 's-demo-1',
        name: 'Sector_Alpha_Deep_Strain',
        timestamp: new Date().toISOString().slice(0, 10) + ' 12:00 UTC',
        folderId: 'f-well-a',
        selectedFilePath: 'Root/Sector-Alpha/casing_pressures.log',
        terminalTheme: 'emerald',
        nodeViewMode: 'tree',
        notes: 'Observed intermittent shear fractures at 4500m depth.',
        pressureSnapshot: 7200,
        tempSnapshot: 215,
        flowRateSnapshot: 42.1
      },
      {
        id: 's-demo-2',
        name: 'High_Risk_Thermal_Fracture',
        timestamp: new Date().toISOString().slice(0, 10) + ' 15:42 UTC',
        folderId: 'f-thermal',
        selectedFilePath: 'Root/Sector-Beta/thermal_gradients.dat',
        terminalTheme: 'crimson',
        nodeViewMode: 'trauma',
        notes: 'Critical cooling cycle anomalies detected inside structural casing joints.',
        pressureSnapshot: 6150,
        tempSnapshot: 295,
        flowRateSnapshot: 31.8
      }
    ];
  });

  // Persist folders
  useEffect(() => {
    try {
      localStorage.setItem('sovereign_terminal_diagnostic_folders', JSON.stringify(folders));
    } catch (e) {
      console.error('Failed to save folders to localStorage', e);
    }
  }, [folders]);

  // Persist sessions
  useEffect(() => {
    try {
      localStorage.setItem('sovereign_terminal_diagnostic_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage', e);
    }
  }, [sessions]);

  // Interactive controls
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'f-root': true,
    'f-well-a': true,
    'f-well-b': false,
    'f-thermal': true
  });
  const [selectedFolderId, setSelectedFolderId] = useState<string>('f-root');
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  
  const [newSessionName, setNewSessionName] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [isSavingSession, setIsSavingSession] = useState(false);

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectFolder = (id: string) => {
    setSelectedFolderId(id);
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrunc = newFolderName.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
    if (!nameTrunc) return;

    const parentFolder = folders.find(f => f.id === selectedFolderId) || folders[0];
    const path = `${parentFolder.path}/${nameTrunc}`;

    // Avoid duplicate paths
    if (folders.some(f => f.path === path)) {
      addLog(`Directory path '${path}' already exists.`, 'warning');
      return;
    }

    const newFolder: DiagnosticFolder = {
      id: `f-${Date.now()}`,
      name: nameTrunc,
      path
    };

    setFolders(prev => [...prev, newFolder]);
    setExpandedFolders(prev => ({ ...prev, [selectedFolderId]: true, [newFolder.id]: true }));
    setSelectedFolderId(newFolder.id);
    setNewFolderName('');
    setIsAddingFolder(false);
    addLog(`Created new forensics directory: /${path}`, 'success');
  };

  const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'f-root') {
      addLog('Cannot delete terminal system root directory.', 'error');
      return;
    }

    const folderToDelete = folders.find(f => f.id === id);
    if (!folderToDelete) return;

    // Remove child sessions
    const folderIdsToDelete = folders.filter(f => f.path.startsWith(folderToDelete.path)).map(f => f.id);

    setFolders(prev => prev.filter(f => !folderIdsToDelete.includes(f.id)));
    setSessions(prev => prev.filter(s => !folderIdsToDelete.includes(s.folderId)));
    
    if (folderIdsToDelete.includes(selectedFolderId)) {
      setSelectedFolderId('f-root');
    }

    addLog(`Purged directory tree /${folderToDelete.path} and all contained diagnostics.`, 'warning');
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    const sessionNameClean = newSessionName.trim().replace(/\s+/g, '_') || `State_${Date.now().toString().slice(-6)}`;
    
    // Read dynamic states from window global or fake telemetry if any
    const activeTelemetry = (window as any).wellTegraTelemetryReportData;
    const pSnap = activeTelemetry?.leakPressureThreshold || (selectedFile?.traumaRating ? Math.round(5000 + selectedFile.traumaRating * 30) : 6800);
    const tSnap = activeTelemetry?.leakTempDropThreshold || 205;
    const fSnap = activeTelemetry?.flowRate || 38.5;

    const newSession: DiagnosticSession = {
      id: `s-${Date.now()}`,
      name: sessionNameClean,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      folderId: selectedFolderId,
      selectedFilePath: selectedFile ? selectedFile.path : null,
      terminalTheme: terminalTheme,
      nodeViewMode: 'tree', // Will restore layout
      notes: sessionNotes.trim() || undefined,
      pressureSnapshot: pSnap,
      tempSnapshot: tSnap,
      flowRateSnapshot: fSnap
    };

    setSessions(prev => [newSession, ...prev]);
    setNewSessionName('');
    setSessionNotes('');
    setIsSavingSession(false);
    addLog(`Stored diagnostic session [${sessionNameClean}] under directory /${folders.find(f => f.id === selectedFolderId)?.name}`, 'success');
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    addLog('Purged indexed diagnostic session record.', 'info');
  };

  const handleLoadSession = (session: DiagnosticSession) => {
    try {
      // 1. Restore Theme
      onSetTheme(session.terminalTheme);

      // 2. Restore View Mode
      onSetViewMode(session.nodeViewMode);

      // 3. Load associated File
      if (session.selectedFilePath) {
        onLoadFileByPath(session.selectedFilePath);
      }

      // 4. Set custom global session parameters if exists
      const activeTelemetry = (window as any).wellTegraTelemetryReportData;
      if (activeTelemetry) {
        if (session.pressureSnapshot) activeTelemetry.leakPressureThreshold = session.pressureSnapshot;
        if (session.tempSnapshot) activeTelemetry.leakTempDropThreshold = session.tempSnapshot;
      }

      addLog(`[SESSION CABINET] Re-hydrated diagnostic session: '${session.name}' for file: '${session.selectedFilePath || 'None'}'.`, 'success');
    } catch (err: any) {
      addLog(`Failed to re-hydrate diagnostic session: ${err.message}`, 'error');
    }
  };

  // Theme styling alignment
  const colorScheme = {
    emerald: {
      border: 'border-emerald-500/15',
      borderFocus: 'focus:border-emerald-500/40',
      bgHeader: 'bg-emerald-950/20',
      text: 'text-emerald-400',
      textDim: 'text-emerald-500/60',
      textCritical: 'text-red-400',
      btnBg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30',
      activeBg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
      dot: 'bg-emerald-400',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
    },
    crimson: {
      border: 'border-red-500/15',
      borderFocus: 'focus:border-red-500/40',
      bgHeader: 'bg-red-950/20',
      text: 'text-red-400',
      textDim: 'text-red-500/60',
      textCritical: 'text-red-400',
      btnBg: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30',
      activeBg: 'bg-red-500/10 border-red-500/25 text-red-300',
      dot: 'bg-red-500',
      glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]'
    }
  };

  const ui = colorScheme[terminalTheme] || colorScheme.emerald;

  // Render Folder and Children recursively or relative to hierarchy path
  const renderFolderNode = (folder: DiagnosticFolder, level: number = 0) => {
    const isSelected = selectedFolderId === folder.id;
    const isExpanded = !!expandedFolders[folder.id];
    const childFolders = folders.filter(f => {
      const parts = f.path.split('/');
      const parentParts = folder.path.split('/');
      return parts.length === parentParts.length + 1 && f.path.startsWith(folder.path + '/');
    });
    
    const folderSessions = sessions.filter(s => s.folderId === folder.id);

    return (
      <div key={folder.id} className="flex flex-col select-none">
        {/* Folder row */}
        <div 
          onClick={() => selectFolder(folder.id)}
          className={`group flex items-center justify-between p-1.5 px-2 rounded cursor-pointer transition-all ${
            isSelected 
              ? ui.activeBg 
              : 'hover:bg-zinc-950/80 hover:text-zinc-200 text-zinc-400'
          }`}
          style={{ paddingLeft: `${Math.max(8, level * 12)}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <button 
              type="button" 
              onClick={(e) => toggleFolder(folder.id, e)}
              className="p-0.5 hover:bg-white/5 rounded text-zinc-500 hover:text-zinc-300"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {isExpanded ? (
              <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? ui.text : 'text-zinc-500'}`} />
            ) : (
              <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? ui.text : 'text-zinc-650'}`} />
            )}
            <span className="font-mono text-[9.5px] font-bold truncate tracking-wide leading-none">
              {folder.name}
            </span>
            {(folderSessions.length > 0 || childFolders.length > 0) && (
              <span className="text-[7.5px] px-1 rounded bg-black/40 text-zinc-500 font-extrabold leading-none py-0.5">
                {folderSessions.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {folder.id !== 'f-root' && (
              <button
                type="button"
                onClick={(e) => handleDeleteFolder(folder.id, e)}
                title="Purge Location"
                className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Children and Sessions */}
        {isExpanded && (
          <div className="flex flex-col pl-2 border-l border-zinc-800/60 ml-2.5 mt-0.5 mb-1 gap-0.5">
            {/* Child Folders */}
            {childFolders.map(child => renderFolderNode(child, level + 1))}

            {/* Folder Sessions */}
            {folderSessions.length === 0 && childFolders.length === 0 && (
              <div className="text-[8px] text-zinc-650 italic pl-5 py-1 font-mono">
                [empty]
              </div>
            )}

            {folderSessions.map(session => (
              <div
                key={session.id}
                onClick={() => handleLoadSession(session)}
                className={`flex items-center justify-between p-1.5 pl-5 rounded transition-all cursor-pointer group hover:bg-white/5`}
              >
                <div className="flex items-center gap-1.5 min-w-0 text-zinc-400 group-hover:text-white">
                  <FileText className={`w-3 h-3 shrink-0 ${session.terminalTheme === 'crimson' ? 'text-red-400' : 'text-emerald-400'}`} />
                  <div className="flex flex-col min-w-0 select-text">
                    <span className="font-mono text-[9px] font-bold truncate max-w-[140px] leading-tight text-zinc-200">
                      {session.name}
                    </span>
                    <span className="text-[7px] text-zinc-500 font-medium">
                      {session.timestamp.split(' ')[0]}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  title="Purge session record"
                  className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative h-full flex flex-row">
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`h-full border-r ${ui.border} bg-[#02050e]/95 flex flex-col overflow-hidden relative shrink-0 z-40 select-none`}
            id="diagnostic-sessions-sidebar"
          >
            {/* Ambient grid background overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.05)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            {/* Title panel section */}
            <div className={`p-3.5 border-b ${ui.border} ${ui.bgHeader} flex flex-col gap-1 relative z-10`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className={`w-4 h-4 ${ui.text} animate-pulse`} />
                  <span className={`font-mono text-xs font-black tracking-widest ${ui.text}`}>
                    FORENSICS BAR
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onToggle}
                  className={`p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition-colors`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[7.5px] font-black uppercase tracking-widest text-zinc-500/80">
                Diagnostic Session Directories
              </div>
            </div>

            {/* Sidebar Contents Area */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4 relative z-10 custom-scrollbar pr-1">
              
              {/* Directory Browser Tree Panel */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-[8.5px] tracking-widest text-zinc-500 font-extrabold uppercase border-b pb-1">
                  <span>DIRECTORY HIERARCHY</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingFolder(prev => !prev)}
                      className={`text-[8px] flex items-center gap-0.5 hover:text-white transition-colors ${isAddingFolder ? ui.text : ''}`}
                      title="New Directory Folder"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isAddingFolder && (
                  <form onSubmit={handleCreateFolder} className="bg-black/40 border border-zinc-800/80 p-2 rounded flex flex-col gap-2">
                    <div className="text-[7.5px] text-zinc-500 uppercase font-bold">New folder name:</div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="e.g. WELL_03_GRADIANT"
                        className="bg-[#02050d] text-[9px] font-mono text-zinc-100 placeholder-zinc-700 border border-zinc-800 focus:border-zinc-600 rounded px-2 py-1 focus:outline-none flex-1 uppercase"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className={`text-[8.5px] font-bold px-2.5 py-1 rounded bg-zinc-900 text-zinc-300 hover:bg-white/5 border border-zinc-800`}
                      >
                        Create
                      </button>
                    </div>
                  </form>
                )}

                {/* Root Tree node */}
                <div className="flex flex-col gap-1 mt-1 bg-black/20 rounded p-1.5 border border-zinc-950/80">
                  {folders.filter(f => f.id === 'f-root').map(rootFold => renderFolderNode(rootFold))}
                </div>
              </div>

              {/* Snapshot Active State capture controller */}
              <div className={`p-3 rounded-lg border ${ui.border} bg-black/50 flex flex-col gap-3 relative`}>
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                  <span className={`font-mono text-[8px] font-black uppercase tracking-wider ${ui.text} flex items-center gap-1.5`}>
                    <Activity className="w-3 h-3" />
                    SAVE ACTIVE SESSION
                  </span>
                  <span className={`text-[7px] text-zinc-600 uppercase font-black`}>REGISTRY</span>
                </div>

                <div className="flex flex-col gap-1 text-[8.5px] text-zinc-450 font-mono">
                  <div>Target Folder: <strong className={`${ui.text}`}>/{folders.find(f => f.id === selectedFolderId)?.name || 'SYSTEM_ROOT'}</strong></div>
                  <div>Diagnosed Object: <strong className="text-white">{selectedFile ? selectedFile.name : 'NO_SELECTED_OBJECT'}</strong></div>
                </div>

                {isSavingSession ? (
                  <form onSubmit={handleSaveSession} className="flex flex-col gap-2 mt-1">
                    <input
                      type="text"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      placeholder="Session unique label"
                      maxLength={32}
                      className="bg-[#02050d] text-[9.5px] font-mono border border-zinc-800 focus:border-zinc-600 rounded px-2 py-1 focus:outline-none text-white tracking-wide"
                      required
                      autoFocus
                    />
                    <textarea
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      placeholder="Add forensic notes / distress assessments..."
                      rows={2}
                      className="bg-[#02050d] text-[9px] font-mono border border-zinc-800 focus:border-zinc-600 rounded px-2 py-1 focus:outline-none text-zinc-350"
                    />
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <button
                        type="button"
                        onClick={() => setIsSavingSession(false)}
                        className="text-[8px] text-zinc-500 hover:text-zinc-200 uppercase font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`text-[8.5px] font-black uppercase text-center py-1 px-3.5 rounded border ${ui.btnBg}`}
                      >
                        Commit Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const todayStr = new Date().toLocaleTimeString([], { hour12: false });
                      setNewSessionName(`Session_${todayStr.replace(/:/g, '')}`);
                      setIsSavingSession(true);
                    }}
                    className={`text-[8.5px] py-1.5 w-full rounded border text-zinc-400 hover:text-white uppercase font-black tracking-widest text-center flex items-center justify-center gap-1.5 cursor-pointer bg-[#02050d]/80 hover:bg-zinc-900 border-zinc-800`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    Commit Static State
                  </button>
                )}
              </div>

              {/* Instructions Info Board */}
              <div className="bg-[#01040a]/40 border border-zinc-900 rounded p-2.5 flex items-start gap-2 text-[8px] text-zinc-500 font-mono leading-relaxed">
                <Info className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                <span>
                  Diagnostic folders and sessions are cached locally. Recalling loads themes, visual bounds, and targets the calibrated casing log telemetry.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Retractable Slim handle bar when sidebar is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 34 }}
            exit={{ width: 0 }}
            className={`h-full border-r ${ui.border} bg-[#02050d] hover:bg-black/80 flex flex-col items-center py-4 cursor-pointer relative shrink-0 transition-all group select-none z-30`}
            onClick={onToggle}
            title="Expand Forensics Session Directories Sidebar"
          >
            {/* Glow trail */}
            <div className="absolute inset-y-0 right-0 w-[1px] bg-emerald-500/10 group-hover:bg-emerald-500/30 transition-colors" />
            <Database className={`w-4 h-4 mb-8 ${ui.text}`} />
            
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-500 select-none whitespace-nowrap rotate-90 my-2">
                DIAGNOSTIC SESSIONS CABINET
              </span>
            </div>

            <ChevronRightIcon className={`w-4 h-4 mt-auto text-zinc-500 group-hover:text-white`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
