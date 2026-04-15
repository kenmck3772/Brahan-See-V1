
import React, { useState } from 'react';
import { 
  BookOpen, ChevronRight, Zap, Target, Activity, 
  Database, ShieldCheck, Ghost, Box, Terminal,
  Compass, Beaker, FileText, Info, AlertTriangle,
  Fingerprint, Cpu, Search, HardDrive
} from 'lucide-react';

const ProtocolManual: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState('SYSTEM_OVERVIEW');

  const topics = [
    { 
      id: 'SYSTEM_OVERVIEW', 
      label: '00: System_Overview', 
      icon: <Fingerprint size={16} />,
      content: (
        <div className="space-y-6">
          <p className="text-emerald-100/80 leading-relaxed font-mono">The Brahan Personal Terminal is a sovereign diagnostic array designed to perform "Forensic Autopsies" on offshore data artifacts. It bypasses legacy industry assumptions to identify bypassed pay zones, structural casing failure, and tax reclamation opportunities.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-4 bg-emerald-500/5 border border-emerald-900/40 rounded-lg">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Core Philosophy</span>
                <span className="text-[11px] text-emerald-700 italic">"Data never lies, but interpretations do. The Seer finds the truth in the noise."</span>
             </div>
             <div className="p-4 bg-slate-900 border border-emerald-900/40 rounded-lg">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Security Level</span>
                <span className="text-[11px] text-emerald-100 font-mono tracking-tighter">LEVEL_7_SOVEREIGN_VETO</span>
             </div>
          </div>
        </div>
      )
    },
    { 
      id: 'GHOST_SYNC', 
      label: '01: Ghost_Sync', 
      icon: <Ghost size={16} />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">Datum Discordance Resolution</h3>
          <p className="text-[11px] text-emerald-100/70">Legacy NDR Gamma Ray logs are often incorrectly referenced to outdated surface datums. The Ghost_Sync engine performs an automated cross-correlation against modern surveys.</p>
          <ul className="space-y-2">
            <li className="flex items-start space-x-2 text-[10px]">
              <Zap size={10} className="text-emerald-500 mt-1 flex-shrink-0" />
              <span><strong className="text-emerald-400">Auto_Lineup:</strong> Triggers a sliding window correlation to find the optimal vertical offset (typical: 14.5m).</span>
            </li>
            <li className="flex items-start space-x-2 text-[10px]">
              <Zap size={10} className="text-emerald-500 mt-1 flex-shrink-0" />
              <span><strong className="text-emerald-400">Anomaly Validation:</strong> Triage automated findings by marking them as <span className="text-emerald-400">VALID</span> or <span className="text-red-400">INVALID</span> to establish a "Validated Truth" baseline.</span>
            </li>
            <li className="flex items-start space-x-2 text-[10px]">
              <Zap size={10} className="text-emerald-500 mt-1 flex-shrink-0" />
              <span><strong className="text-emerald-400">State Persistence:</strong> Your calibration array, datum shifts, and validation status are automatically cached in the local vault.</span>
            </li>
          </ul>
        </div>
      )
    },
    { 
      id: 'TRAUMA_NODE', 
      label: '02: Trauma_Node', 
      icon: <Box size={16} />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">Cylindrical Structural Autopsy</h3>
          <p className="text-[11px] text-emerald-100/70">Reconstructs casing integrity in 3D using multi-finger caliper telemetry.</p>
          <div className="bg-slate-900 border border-emerald-900/40 p-4 rounded-lg space-y-3">
             <div className="flex items-center space-x-2">
                <Target size={12} className="text-orange-500" />
                <span className="text-[10px] font-black uppercase text-emerald-100">Visual_Bridge Instructions:</span>
             </div>
             <p className="text-[10px] text-emerald-100/60 font-mono">1. Navigate to the Black Box Logs at the bottom.<br/>2. Click any log entry (e.g., 'CRITICAL METAL LOSS').<br/>3. The 3D Engine will auto-zoom, lock, and <span className="text-emerald-400">PULSE</span> on the exact depth voxel with severity-based coloring.<br/>4. Trigger a <span className="text-emerald-400">'Run Forensic Scan'</span> to visualize a real-time sweep across the entire asset.</p>
          </div>
          <div className="flex items-center space-x-3 text-[10px] text-orange-400 italic">
             <Info size={14} />
             <span>NEW: UV Index layer tracks solar radiation intensity near surface wellheads.</span>
          </div>
        </div>
      )
    },
    { 
      id: 'SOVEREIGN_TERMINAL', 
      label: '03: Sovereign_Terminal', 
      icon: <Terminal size={16} />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">Command-Line Forensic Interface</h3>
          <p className="text-[11px] text-emerald-100/70">A low-level simulated file system for managing forensic artifacts, scripts, and audit trails.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-3 border border-emerald-900/20 bg-slate-950 rounded">
                <span className="text-[8px] text-emerald-900 uppercase font-black">Navigation</span>
                <p className="text-[10px] text-emerald-500 font-mono">cd, ls, pwd</p>
             </div>
             <div className="p-3 border border-emerald-900/20 bg-slate-950 rounded">
                <span className="text-[8px] text-emerald-900 uppercase font-black">Manipulation</span>
                <p className="text-[10px] text-emerald-500 font-mono">mkdir, touch, rm, mv</p>
             </div>
             <div className="p-3 border border-emerald-900/20 bg-slate-950 rounded">
                <span className="text-[8px] text-emerald-900 uppercase font-black">Data Stream</span>
                <p className="text-[10px] text-emerald-500 font-mono">cat, echo {'>'}</p>
             </div>
             <div className="p-3 border border-emerald-900/20 bg-slate-950 rounded">
                <span className="text-[8px] text-emerald-900 uppercase font-black">System</span>
                <p className="text-[10px] text-emerald-500 font-mono">help, clear, whoami</p>
             </div>
          </div>
          <p className="text-[10px] text-emerald-100/60 italic">The terminal operates on a sandboxed virtual disk. Files created here are persistent across the current forensic session.</p>
        </div>
      )
    },
    { 
      id: 'PULSE_ANALYZER', 
      label: '04: Pulse_Analyzer', 
      icon: <Activity size={16} />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">Sawtooth Pressure Scavenger</h3>
          <p className="text-[11px] text-emerald-100/70">Analyzes annulus pressure signatures for "Sawtooth" patterns—a hallmark of sustained casing pressure.</p>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-3 border border-emerald-900/20 bg-slate-950 rounded">
                <span className="text-[8px] text-emerald-900 uppercase font-black">R-Squared {'>'} 0.98</span>
                <p className="text-[10px] text-emerald-500">Linear building confirms mechanical breach.</p>
             </div>
             <div className="p-3 border border-emerald-900/20 bg-slate-950 rounded">
                <span className="text-[8px] text-emerald-900 uppercase font-black">Slope {'>'} 15 PSI/U</span>
                <p className="text-[10px] text-red-500">Critical flow rate detected.</p>
             </div>
          </div>
        </div>
      )
    },
    { 
      id: 'CHANONRY', 
      label: '05: Chanonry_Protocol', 
      icon: <Beaker size={16} />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">Asphaltene Stability Logic</h3>
          <p className="text-[11px] text-emerald-100/70">Prevents wellbore plugging by calculating colloidal instability.</p>
          <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-lg flex items-start space-x-4">
             <AlertTriangle size={24} className="text-red-500 flex-shrink-0" />
             <div className="space-y-1">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Ribbons of Black Warning</span>
                <p className="text-[10px] text-red-400 font-mono">If CII {'>'} 0.9 and Treatment Fluid = ACID, the protocol will trigger a hard MECHANICAL VETO. Proceeding will result in bitumen sludge formation.</p>
             </div>
          </div>
        </div>
      )
    },
    { 
      id: 'VETO_SYSTEM', 
      label: '06: Sovereign_Veto', 
      icon: <ShieldCheck size={16} />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">Architectural Insight & Audit</h3>
          <p className="text-[11px] text-emerald-100/70">The terminal is integrated with the Brahan Forensic Architect (Gemini 3 Flash).</p>
          <ul className="space-y-2">
            <li className="flex items-center space-x-2 text-[10px]">
              <Database size={12} className="text-emerald-500" />
              <span>Gemini analyzes localized snapshots to provide cross-module insight.</span>
            </li>
            <li className="flex items-center space-x-2 text-[10px]">
              <FileText size={12} className="text-emerald-500" />
              <span>"Execute Sovereign Veto" generates a secure, cryptographically hashed PDF report of all findings.</span>
            </li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950/40 border border-emerald-900/20 rounded-lg overflow-hidden relative font-terminal">
      {/* HUD Background Decorations */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center">
         <BookOpen size={600} className="text-emerald-500" />
      </div>

      <header className="p-6 border-b border-emerald-900/30 flex items-center justify-between bg-slate-950/60 relative z-10">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <BookOpen size={24} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-tighter">Forensic_Protocol_Manual</h2>
            <div className="flex items-center space-x-2">
               <span className="text-[9px] text-emerald-800 uppercase tracking-[0.4em] font-black">Authorized_Instructions // v2.5.0</span>
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
            </div>
          </div>
        </div>
        <div className="text-right">
           <span className="text-[10px] text-emerald-700 font-mono block tracking-widest uppercase">Encryption: RSA-4096</span>
           <span className="text-[8px] text-emerald-950 uppercase font-black">Ref_Node: SEER_GUIDE</span>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative z-10">
        {/* Navigation Sidebar */}
        <div className="w-72 border-r border-emerald-900/20 flex flex-col bg-slate-950/40">
           <div className="p-4 border-b border-emerald-900/20">
              <div className="flex items-center space-x-2 text-[9px] font-black text-emerald-900 uppercase tracking-widest">
                 <Search size={12} />
                 <span>Index_Directory</span>
              </div>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {topics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => setActiveTopic(topic.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all group ${activeTopic === topic.id ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-emerald-800 hover:text-emerald-400 hover:bg-emerald-500/5'}`}
                >
                  <div className="flex items-center space-x-3">
                     {topic.icon}
                     <span className="text-[10px] font-black uppercase tracking-widest truncate">{topic.label}</span>
                  </div>
                  <ChevronRight size={14} className={`transition-transform duration-300 ${activeTopic === topic.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              ))}
           </div>
           <div className="p-4 bg-black/40 border-t border-emerald-900/20">
              <div className="flex items-center space-x-2 mb-2">
                 <HardDrive size={12} className="text-emerald-900" />
                 <span className="text-[8px] font-black text-emerald-950 uppercase">Knowledge_Base</span>
              </div>
              <div className="text-[9px] text-emerald-800 italic leading-tight">Terminal instructions cached locally for disconnected forensic analysis.</div>
           </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/20 overflow-hidden">
           <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
              <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-1 bg-emerald-500/40 rounded-full"></div>
                    <span className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.5em]">{activeTopic.replace('_', ' ')}</span>
                 </div>
                 
                 <div className="bg-slate-950/60 border border-emerald-900/30 rounded-2xl p-8 lg:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
                    {/* Visual Vibe */}
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                       {topics.find(t => t.id === activeTopic)?.icon}
                    </div>
                    {topics.find(topic => topic.id === activeTopic)?.content}
                 </div>

                 <div className="mt-12 pt-8 border-t border-emerald-900/20 flex items-center justify-between text-[10px] font-black text-emerald-900 uppercase">
                    <span className="flex items-center space-x-2"><Cpu size={14} /> <span>Logic: Brahan_Core_v2</span></span>
                    <span className="flex items-center space-x-2 hover:text-emerald-400 transition-colors cursor-pointer"><span>Download Technical Specs</span> <FileText size={14} /></span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolManual;
