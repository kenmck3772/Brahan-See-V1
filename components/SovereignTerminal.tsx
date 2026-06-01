
import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, ChevronRight, Cpu, ShieldCheck, 
  Database, Search, Folder, FileText, Trash2, Edit3, 
  Plus, ArrowRight, Copy, FolderPlus, FilePlus, Save, X, Tv 
} from 'lucide-react';
import { useFileSystem } from '../src/hooks/useFileSystem';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: string;
}

const SovereignTerminal: React.FC = () => {
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: 'system', content: 'WellTegra Sovereign Terminal [WETE-OS v2.5]', timestamp: new Date().toLocaleTimeString() },
    { type: 'system', content: 'Establishing forensic link to NSTA NDR API...', timestamp: new Date().toLocaleTimeString() },
    { type: 'system', content: 'Connection: SECURE. Welcome, Operator.', timestamp: new Date().toLocaleTimeString() },
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { pwd, ls, cd, mkdir, touch, rm, mv, cp, cat, write, currentPath } = useFileSystem();

  // Visual File System States
  const [isCreatingDir, setIsCreatingDir] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [actionItemName, setActionItemName] = useState('');
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'cp' | 'mv' | null>(null);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<{ name: string; content: string } | null>(null);
  const [editingContent, setEditingContent] = useState<string | null>(null);

  // CRT Distortion State & Effects
  const [isDistortion, setIsDistortion] = useState(() => {
    const saved = localStorage.getItem('crt_distortion_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('crt_distortion_enabled', String(isDistortion));
    const overlay = document.getElementById('crt-overlay');
    if (overlay) {
      overlay.classList.toggle('crt-distortion-enabled', isDistortion);
    }
  }, [isDistortion]);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const cancelActions = () => {
    setIsCreatingDir(false);
    setIsCreatingFile(false);
    setActionItemName('');
    setActiveActionId(null);
    setActionType(null);
  };

  const handleCreateDirConfirm = () => {
    const name = actionItemName.trim();
    if (!name) return;
    const err = mkdir(name);
    const timestamp = new Date().toLocaleTimeString();
    if (err) {
      setHistory(prev => [
        ...prev,
        { type: 'input', content: `mkdir ${name}`, timestamp },
        { type: 'error', content: err, timestamp }
      ]);
    } else {
      setHistory(prev => [
        ...prev,
        { type: 'input', content: `mkdir ${name}`, timestamp },
        { type: 'system', content: `Constructed directory node: ${name}`, timestamp }
      ]);
    }
    cancelActions();
  };

  const handleCreateFileConfirm = () => {
    const name = actionItemName.trim();
    if (!name) return;
    const err = touch(name);
    const timestamp = new Date().toLocaleTimeString();
    if (err) {
      setHistory(prev => [
        ...prev,
        { type: 'input', content: `touch ${name}`, timestamp },
        { type: 'error', content: err, timestamp }
      ]);
    } else {
      setHistory(prev => [
        ...prev,
        { type: 'input', content: `touch ${name}`, timestamp },
        { type: 'system', content: `Initialized empty telemetry artifact: ${name}`, timestamp }
      ]);
    }
    cancelActions();
  };

  const handleRenameConfirm = (oldName: string) => {
    const newName = actionItemName.trim();
    if (!newName) return;
    const err = mv(oldName, newName);
    const timestamp = new Date().toLocaleTimeString();
    if (err) {
      setHistory(prev => [
        ...prev,
        { type: 'input', content: `mv ${oldName} ${newName}`, timestamp },
        { type: 'error', content: err, timestamp }
      ]);
    } else {
      setHistory(prev => [
        ...prev,
        { type: 'input', content: `mv ${oldName} ${newName}`, timestamp },
        { type: 'system', content: `Reassigned node identifier from "${oldName}" to "${newName}"`, timestamp }
      ]);
      if (selectedPreviewFile?.name === oldName) {
        setSelectedPreviewFile(prev => prev ? { ...prev, name: newName } : null);
      }
    }
    cancelActions();
  };

  const handleCopyConfirm = (srcName: string) => {
    const destName = actionItemName.trim();
    if (!destName) return;
    const err = cp(srcName, destName);
    const timestamp = new Date().toLocaleTimeString();
    if (err) {
      setHistory(prev => [
        ...prev,
        { type: 'input', content: `cp ${srcName} ${destName}`, timestamp },
        { type: 'error', content: err, timestamp }
      ]);
    } else {
      setHistory(prev => [
        ...prev,
        { type: 'input', content: `cp ${srcName} ${destName}`, timestamp },
        { type: 'system', content: `Duplicated telemetry artifact: "${srcName}" cloned to "${destName}"`, timestamp }
      ]);
    }
    cancelActions();
  };

  const handleVisualRemove = (name: string) => {
    const err = rm(name);
    const timestamp = new Date().toLocaleTimeString();
    if (err) {
      setHistory(prev => [
        ...prev,
        { type: 'input', content: `rm ${name}`, timestamp },
        { type: 'error', content: err, timestamp }
      ]);
    } else {
      setHistory(prev => [
        ...prev,
        { type: 'input', content: `rm ${name}`, timestamp },
        { type: 'system', content: `Decommissioned active node from registry: ${name}`, timestamp }
      ]);
      if (selectedPreviewFile?.name === name) {
        setSelectedPreviewFile(null);
        setEditingContent(null);
      }
    }
  };

  const handleVisualCd = (target: string) => {
    const err = cd(target);
    const timestamp = new Date().toLocaleTimeString();
    if (err) {
      setHistory(prev => [
        ...prev,
        { type: 'input', content: `cd ${target}`, timestamp },
        { type: 'error', content: err, timestamp }
      ]);
    } else {
      setHistory(prev => [
        ...prev,
        { type: 'input', content: `cd ${target}`, timestamp },
        { type: 'system', content: `Focus shifted segment to: ${target}`, timestamp }
      ]);
      setSelectedPreviewFile(null);
      setEditingContent(null);
    }
    cancelActions();
  };

  const selectFileForPreview = (name: string) => {
    const content = cat(name);
    const timestamp = new Date().toLocaleTimeString();
    
    setHistory(prev => [
      ...prev,
      { type: 'input', content: `cat ${name}`, timestamp }
    ]);

    if (content.startsWith('ERROR:') || content.startsWith('[SYSTEM_VETO]')) {
      setHistory(prev => [
        ...prev,
        { type: 'error', content: content, timestamp }
      ]);
      setSelectedPreviewFile(null);
      setEditingContent(null);
    } else {
      setSelectedPreviewFile({ name, content });
      setEditingContent(content);
    }
  };

  const handleSaveFileContent = () => {
    if (!selectedPreviewFile || editingContent === null) return;
    const err = write(selectedPreviewFile.name, editingContent);
    const timestamp = new Date().toLocaleTimeString();
    if (err) {
      setHistory(prev => [
        ...prev,
        { type: 'error', content: `Logic Fault: Unable to write to file: ${err}`, timestamp }
      ]);
    } else {
      setHistory(prev => [
        ...prev,
        { type: 'system', content: `Injected telemetry stream to artifact: ${selectedPreviewFile.name}`, timestamp }
      ]);
      setSelectedPreviewFile({ ...selectedPreviewFile, content: editingContent });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(nextIndex);
        setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const fullCommand = input.trim();
    setCommandHistory(prev => [...prev, fullCommand]);
    setHistoryIndex(-1);

    const [cmd, ...args] = fullCommand.split(' ');
    const timestamp = new Date().toLocaleTimeString();

    setHistory(prev => [...prev, { type: 'input', content: fullCommand, timestamp }]);

    let output: string | null = null;
    let error: string | null = null;

    switch (cmd.toLowerCase()) {
      case 'help':
        output = `
AVAILABLE FORENSIC COMMANDS:
---------------------------
HELP         - Display this manual
CLEAR        - Purge terminal buffer
PWD          - Print active forensic path
LS           - Scavenge current directory contents
CD [DIR]     - Shift focal directory segment
MKDIR [DIR]  - Construct new directory node
TOUCH [FILE] - Initialize empty data artifact
RM [NAME]    - Decommission node from registry
MV [O] [N]   - Reassign node identifier
CP [S] [D]   - Duplicate forensic log entry
CAT [FILE]   - Inspect file telemetry readout
ECHO [T] > [F] - Inject string into artifact
WHOAMI       - Report active operator credentials
HISTORY      - Review command audit trail
DATE         - Display system temporal sync
`;
        break;
      case 'clear':
        setHistory([]);
        setInput('');
        return;
      case 'pwd':
        output = `ACTIVE_LOCUS: ${pwd()}`;
        break;
      case 'ls':
        const items = ls();
        if (items.length === 0) {
          output = 'Directory is empty (No forensic artifacts detected)';
        } else {
          output = items.map(item => {
            const icon = item.type === 'directory' ? '📁' : '📄';
            return `${icon} ${item.name.padEnd(20)} | ${item.type.toUpperCase().padEnd(10)} | ${new Date(item.updatedAt).toLocaleDateString()}`;
          }).join('\n');
        }
        break;
      case 'cd':
        const cdResult = cd(args[0] || '/');
        if (cdResult) error = cdResult;
        else setHistory(prev => [...prev, { type: 'system', content: `Focus shifted to: ${args[0] || '/'}`, timestamp }]);
        break;
      case 'history':
        output = commandHistory.map((c, i) => `${(i + 1).toString().padStart(3, '0')} | ${c}`).join('\n');
        break;
      case 'date':
        output = `SYSTEM_TIME: ${new Date().toUTCString()}`;
        break;
      case 'mkdir':
        if (!args[0]) {
          error = 'Usage: mkdir [directory_name]';
        } else if (/[/\\:]/.test(args[0])) {
          error = 'Error: Directory name contains invalid characters (/, \\, :)';
        } else {
          error = mkdir(args[0]);
        }
        break;
      case 'touch':
        if (!args[0]) {
          error = 'Usage: touch [file_name]';
        } else if (/[/\\:]/.test(args[0])) {
          error = 'Error: File name contains invalid characters (/, \\, :)';
        } else {
          error = touch(args[0]);
        }
        break;
      case 'rm':
        if (!args[0]) error = 'Usage: rm [name]';
        else error = rm(args[0]);
        break;
      case 'mv':
        if (args.length < 2) error = 'Usage: mv [old_name] [new_name]';
        else error = mv(args[0], args[1]);
        break;
      case 'cp':
        if (args.length < 2) error = 'Usage: cp [source_file] [dest_file]';
        else error = cp(args[0], args[1]);
        break;
      case 'cat':
        if (!args[0]) error = 'Usage: cat [file_name]';
        else {
          const content = cat(args[0]);
          if (content.startsWith('ERROR:') || content.startsWith('[SYSTEM_VETO]')) error = content;
          else output = content;
        }
        break;
      case 'echo':
        const redirectIdx = args.indexOf('>');
        if (redirectIdx !== -1 && args[redirectIdx + 1]) {
          const content = args.slice(0, redirectIdx).join(' ');
          const fileName = args[redirectIdx + 1];
          error = write(fileName, content);
        } else {
          output = args.join(' ');
        }
        break;
      case 'whoami':
        output = 'Operator: kmck3772@gmail.com\nRole: Lead Systems Architect\nClearance: Sovereign';
        break;
      default:
        error = `Command not found: ${cmd}. Type 'help' for available commands.`;
    }

    if (output) setHistory(prev => [...prev, { type: 'output', content: output!, timestamp }]);
    if (error) setHistory(prev => [...prev, { type: 'error', content: error!, timestamp }]);

    setInput('');
  };

  const currentItems = ls();

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-950/90 font-terminal overflow-hidden glass-panel cyber-border shadow-2xl relative w-full">
      
      {/* LEFT PANEL: Interactive Visual File System */}
      <div className="w-full md:w-[42%] border-b md:border-b-0 md:border-r border-emerald-500/20 flex flex-col bg-slate-900/60 h-full relative z-10">
        
        {/* Module Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-emerald-500/20">
          <div className="flex items-center space-x-2">
            <Database size={14} className="text-[var(--sovereign-gold)] text-glow-gold animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white">Forensic Directory Nodes</span>
          </div>
          <div className="flex space-x-1.5">
            <button 
              onClick={() => { cancelActions(); setIsCreatingDir(true); }}
              className="p-1 text-emerald-400 hover:text-white border border-emerald-900/40 rounded transition-all bg-emerald-950/30"
              title="Construct Directory Node"
            >
              <FolderPlus size={12} />
            </button>
            <button 
              onClick={() => { cancelActions(); setIsCreatingFile(true); }}
              className="p-1 text-emerald-400 hover:text-white border border-emerald-900/40 rounded transition-all bg-emerald-950/30"
              title="Touch Empty Log Entry"
            >
              <FilePlus size={12} />
            </button>
          </div>
        </div>

        {/* Path Navigation breadcrumb */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950/50 border-b border-emerald-500/10 text-[10px]">
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
            <span className="text-slate-500 uppercase font-bold shrink-0">Locus:</span>
            <span className="text-emerald-400 font-bold shrink-0 font-mono tracking-tight">{currentPath}</span>
          </div>
          {currentPath !== '/' && (
            <button 
              onClick={() => handleVisualCd('..')}
              className="text-[8px] font-black text-slate-400 hover:text-white uppercase tracking-tighter shrink-0 border border-slate-800 px-1.5 py-0.5 rounded transition-all bg-slate-950/80 hover:bg-emerald-950/20"
            >
              cd ..
            </button>
          )}
        </div>

        {/* Content Explorer - Tree / List view */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar relative">
          
          {/* Inline input for constructing directory node */}
          {isCreatingDir && (
            <div className="flex items-center space-x-2 p-2 bg-emerald-500/5 border border-emerald-500/30 rounded animate-in fade-in slide-in-from-top-2 duration-300">
              <Folder size={14} className="text-emerald-500 shrink-0" />
              <input 
                type="text"
                placeholder="Name directory segment..."
                value={actionItemName}
                onChange={(e) => setActionItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateDirConfirm();
                  if (e.key === 'Escape') cancelActions();
                }}
                className="bg-transparent border-none outline-none text-white text-xs flex-1 font-terminal"
                autoFocus
              />
              <button onClick={handleCreateDirConfirm} className="text-emerald-400 font-bold text-xs p-1">✓</button>
              <button onClick={cancelActions} className="text-red-400 font-bold text-xs p-1">✗</button>
            </div>
          )}

          {/* Inline input for launching data file */}
          {isCreatingFile && (
            <div className="flex items-center space-x-2 p-2 bg-emerald-500/5 border border-emerald-500/30 rounded animate-in fade-in slide-in-from-top-2 duration-300">
              <FileText size={14} className="text-emerald-500 shrink-0" />
              <input 
                type="text"
                placeholder="Name data file..."
                value={actionItemName}
                onChange={(e) => setActionItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFileConfirm();
                  if (e.key === 'Escape') cancelActions();
                }}
                className="bg-transparent border-none outline-none text-white text-xs flex-1 font-terminal"
                autoFocus
              />
              <button onClick={handleCreateFileConfirm} className="text-emerald-400 font-bold text-xs p-1">✓</button>
              <button onClick={cancelActions} className="text-red-400 font-bold text-xs p-1">✗</button>
            </div>
          )}

          {currentItems.length === 0 && !isCreatingDir && !isCreatingFile && (
            <div className="h-24 flex flex-col items-center justify-center text-slate-700 select-none">
              <span className="text-[9px] font-black uppercase text-center italic">Empty Registry Leaf</span>
            </div>
          )}

          {/* List items rendering */}
          {currentItems.map((item) => {
            const isEditingName = activeActionId === item.id && actionType === 'mv';
            const isCopyMode = activeActionId === item.id && actionType === 'cp';
            const isSelected = selectedPreviewFile?.name === item.name;

            return (
              <div 
                key={item.id}
                className={`flex flex-col p-2.5 rounded border transition-all duration-300 select-none ${
                    isSelected 
                      ? 'bg-[var(--emerald-primary)]/10 border-[var(--emerald-primary)]/40 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                      : 'border-slate-800 hover:border-emerald-500/20 bg-slate-950/20 hover:bg-slate-950/50'
                }`}
              >
                <div className="flex items-center justify-between w-full space-x-2">
                  <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                    <div 
                      onClick={() => item.type === 'directory' ? handleVisualCd(item.name) : selectFileForPreview(item.name)}
                      className="cursor-pointer shrink-0"
                    >
                      {item.type === 'directory' ? (
                        <Folder className="text-[var(--sovereign-gold)] hover:scale-110 transition-transform" size={14} />
                      ) : (
                        <FileText className="text-emerald-400 hover:scale-110 transition-transform" size={14} />
                      )}
                    </div>

                    {isEditingName ? (
                      <div className="flex items-center space-x-1.5 flex-1 w-full animate-in zoom-in-95 duration-200">
                        <input
                          type="text"
                          value={actionItemName}
                          onChange={(e) => setActionItemName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameConfirm(item.name);
                            if (e.key === 'Escape') cancelActions();
                          }}
                          className="bg-slate-900 border border-emerald-500/40 rounded px-2 py-0.5 text-xs text-white flex-1 font-terminal outline-none"
                          autoFocus
                        />
                        <button onClick={() => handleRenameConfirm(item.name)} className="text-emerald-400 font-bold px-1.5">✓</button>
                        <button onClick={cancelActions} className="text-red-400 font-bold px-1.5">✗</button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => item.type === 'directory' ? handleVisualCd(item.name) : selectFileForPreview(item.name)}
                        className="cursor-pointer font-bold select-none text-glow-emerald text-slate-100 hover:text-white font-mono tracking-tight truncate flex-1 leading-snug"
                      >
                        {item.name}
                      </div>
                    )}
                  </div>

                  {/* Operational actions */}
                  {!isEditingName && (
                    <div className="flex items-center space-x-1 opacity-60 hover:opacity-100 transition-opacity shrink-0">
                      {item.type === 'file' && (
                        <button
                          onClick={() => { cancelActions(); setActiveActionId(item.id); setActionType('cp'); setActionItemName(`${item.name}_copy`); }}
                          className="p-1 hover:text-emerald-400 hover:bg-slate-800 rounded transition-all"
                          title="Clone / Duplicate Telemetry Log (cp)"
                        >
                          <Copy size={11} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => { cancelActions(); setActiveActionId(item.id); setActionType('mv'); setActionItemName(item.name); }}
                        className="p-1 hover:text-[var(--sovereign-gold)] hover:bg-slate-800 rounded transition-all"
                        title="Reassign Node Identifier (mv)"
                      >
                        <Edit3 size={11} />
                      </button>

                      <button
                        onClick={() => handleVisualRemove(item.name)}
                        className="p-1 hover:text-[var(--alert-red)] hover:bg-slate-800 rounded transition-all"
                        title="Decommission Registry Node (rm)"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline copy expansion */}
                {isCopyMode && (
                  <div className="flex items-center space-x-2 mt-2 pl-6 w-full bg-slate-950 border border-emerald-500/30 p-1.5 rounded animate-in slide-in-from-top-1 duration-200">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tight shrink-0">Clone copy path:</span>
                    <input
                      type="text"
                      placeholder="Enter file target..."
                      value={actionItemName}
                      onChange={(e) => setActionItemName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCopyConfirm(item.name);
                        if (e.key === 'Escape') cancelActions();
                      }}
                      className="bg-transparent border-none outline-none text-[10px] text-white flex-1 font-terminal"
                      autoFocus
                    />
                    <button onClick={() => handleCopyConfirm(item.name)} className="text-emerald-400 font-bold px-1 text-[11px]">✓</button>
                    <button onClick={cancelActions} className="text-red-400 font-bold px-1 text-[11px]">✗</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Visual Content Preview & Mod Editor Footer */}
        {selectedPreviewFile && (
          <div className="border-t border-emerald-500/20 bg-slate-950 p-3 flex flex-col space-y-2 animate-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--sovereign-gold)] uppercase font-mono truncate">
                Telemetry Preview: {selectedPreviewFile.name}
              </span>
              <div className="flex items-center space-x-1.5">
                <button 
                  onClick={handleSaveFileContent}
                  className="p-1 px-2.5 bg-emerald-500/10 border border-emerald-500/40 rounded text-[9px] font-black uppercase text-emerald-400 hover:text-white hover:bg-emerald-500/20 flex items-center space-x-1 shrink-0"
                >
                  <Save size={10} />
                  <span>Commit Logs</span>
                </button>
                <button 
                  onClick={() => { setSelectedPreviewFile(null); setEditingContent(null); }}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 shrink-0"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
            <textarea
              className="w-full h-24 bg-slate-900 border border-slate-800/80 rounded px-2.5 py-1.5 text-[10px] text-emerald-100/90 font-terminal outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 resize-none custom-scrollbar leading-relaxed"
              value={editingContent !== null ? editingContent : ''}
              onChange={(e) => setEditingContent(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* RIGHT PANEL: System Console Terminal Emulator */}
      <div className="flex-1 flex flex-col h-full bg-slate-950/90 overflow-hidden relative">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-500/20 bg-slate-900/50 relative z-10">
          <div className="flex items-center space-x-3">
            <TerminalIcon size={14} className="text-[var(--emerald-primary)] text-glow-emerald" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white">Sovereign Terminal Console</span>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setIsDistortion(!isDistortion)}
              className={`p-1 px-2 rounded border transition-all flex items-center space-x-1 ${
                isDistortion 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20' 
                  : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
              }`}
              title="Toggle CRT Lens Distortion / Blur"
            >
              <Tv size={10} className={isDistortion ? 'animate-pulse' : ''} />
              <span className="text-[7.5px] font-black uppercase tracking-wider">CRT DST</span>
            </button>
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
              <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
            </div>
          </div>
        </div>

        {/* Terminal Body */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-repeat"
          onClick={() => inputRef.current?.focus()}
        >
          {history.map((line, idx) => (
            <div key={idx} className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex items-start space-x-2">
                <span className="text-[8px] text-slate-600 mt-1 shrink-0 select-none">[{line.timestamp}]</span>
                {line.type === 'input' && <span className="text-[var(--emerald-primary)] font-bold shrink-0 select-none">wete@sovereign:{currentPath}$</span>}
                <pre className={`text-xs whitespace-pre-wrap break-all ${
                  line.type === 'error' ? 'text-[var(--alert-red)]' : 
                  line.type === 'system' ? 'text-[var(--sovereign-gold)] italic font-bold' : 
                  line.type === 'input' ? 'text-white font-medium' : 'text-slate-300 font-mono'
                }`}>
                  {line.content}
                </pre>
              </div>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Input */}
        <form onSubmit={handleCommand} className="p-4 border-t border-emerald-500/20 bg-slate-900/0 flex items-center space-x-2 relative z-10 select-none">
          <span className="text-[var(--emerald-primary)] font-bold text-xs shrink-0">wete@sovereign:{currentPath}$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-white text-xs font-terminal placeholder-slate-800"
            placeholder="Enter forensic command (e.g. 'help')..."
            autoFocus
          />
          <ArrowRight size={14} className="text-slate-700 shrink-0" />
        </form>

        {/* Background Decorative Grid */}
        <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none select-none">
          <Cpu size={120} className="text-[var(--emerald-primary)]" />
        </div>
      </div>
    </div>
  );
};

export default SovereignTerminal;

