
import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, ChevronRight, Cpu, ShieldCheck, Database, Search, Folder, FileText, Trash2, Edit3, Plus, ArrowRight } from 'lucide-react';
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
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { pwd, ls, cd, mkdir, touch, rm, mv, cat, write, currentPath } = useFileSystem();

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const fullCommand = input.trim();
    const [cmd, ...args] = fullCommand.split(' ');
    const timestamp = new Date().toLocaleTimeString();

    setHistory(prev => [...prev, { type: 'input', content: fullCommand, timestamp }]);

    let output: string | null = null;
    let error: string | null = null;

    switch (cmd.toLowerCase()) {
      case 'help':
        output = 'Available commands: help, clear, pwd, ls, cd [dir], mkdir [dir], touch [file], rm [name], mv [old] [new], cat [file], echo [text] > [file], whoami';
        break;
      case 'clear':
        setHistory([]);
        setInput('');
        return;
      case 'pwd':
        output = pwd();
        break;
      case 'ls':
        const items = ls();
        output = items.map(item => `${item.type === 'directory' ? '[DIR] ' : '[FILE]'} ${item.name}`).join('\n') || 'Directory is empty';
        break;
      case 'cd':
        error = cd(args[0] || '/');
        break;
      case 'mkdir':
        if (!args[0]) error = 'Usage: mkdir [directory_name]';
        else error = mkdir(args[0]);
        break;
      case 'touch':
        if (!args[0]) error = 'Usage: touch [file_name]';
        else error = touch(args[0]);
        break;
      case 'rm':
        if (!args[0]) error = 'Usage: rm [name]';
        else error = rm(args[0]);
        break;
      case 'mv':
        if (args.length < 2) error = 'Usage: mv [old_name] [new_name]';
        else error = mv(args[0], args[1]);
        break;
      case 'cat':
        if (!args[0]) error = 'Usage: cat [file_name]';
        else {
          const content = cat(args[0]);
          if (content.startsWith('File not found')) error = content;
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

  return (
    <div className="flex flex-col h-full bg-slate-950/90 font-terminal overflow-hidden glass-panel cyber-border shadow-2xl relative">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-500/20 bg-slate-900/50 relative z-10">
        <div className="flex items-center space-x-3">
          <TerminalIcon size={16} className="text-[var(--emerald-primary)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Sovereign Terminal</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-repeat"
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((line, idx) => (
          <div key={idx} className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex items-start space-x-2">
              <span className="text-[8px] text-slate-600 mt-1 shrink-0">[{line.timestamp}]</span>
              {line.type === 'input' && <span className="text-[var(--emerald-primary)] font-bold shrink-0">wete@sovereign:{currentPath}$</span>}
              <pre className={`text-xs whitespace-pre-wrap break-all ${
                line.type === 'error' ? 'text-[var(--alert-red)]' : 
                line.type === 'system' ? 'text-[var(--sovereign-gold)] italic' : 
                line.type === 'input' ? 'text-white' : 'text-slate-300'
              }`}>
                {line.content}
              </pre>
            </div>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Input */}
      <form onSubmit={handleCommand} className="p-4 border-t border-emerald-500/20 bg-slate-900/50 flex items-center space-x-2 relative z-10">
        <span className="text-[var(--emerald-primary)] font-bold text-xs shrink-0">wete@sovereign:{currentPath}$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-white text-xs font-terminal placeholder-slate-700"
          placeholder="Enter forensic command..."
          autoFocus
        />
        <ArrowRight size={14} className="text-slate-600" />
      </form>

      {/* Background Decoration */}
      <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none">
        <Cpu size={120} className="text-[var(--emerald-primary)]" />
      </div>
    </div>
  );
};

export default SovereignTerminal;
