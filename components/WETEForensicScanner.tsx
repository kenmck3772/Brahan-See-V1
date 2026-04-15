
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Zap, Activity, Terminal, ShieldAlert, 
  Search, Play, Loader2, Gauge, 
  Clock, Hash, FileWarning, MoveDown,
  Scale, Binary, ShieldCheck, Database,
  ArrowRight, Info, AlertTriangle, Crosshair,
  Lock, History, Download, Eye
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart } from 'recharts';

interface WETEScannerProps {
  uwi?: string;
  scenario?: 'A' | 'B' | 'C';
}

const WETEForensicScanner: React.FC<WETEScannerProps> = ({ uwi = "211/18-A45", scenario = 'A' }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [showReport, setShowReport] = useState(false);

  // Scenario Mock Data
  const telemetryData = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      const depth = 8000 + (i * 20);
      const hookLoadBase = 120 + Math.sin(i * 0.4) * 5;
      const torqueBase = 8 + Math.cos(i * 0.3) * 2;
      
      // Inject anomaly for Scenario A (Phantom Steel) at 8400'
      const isAnomaly = scenario === 'A' && depth > 8380 && depth < 8420;
      return {
        depth,
        hookLoad: isAnomaly ? hookLoadBase + 18 : hookLoadBase,
        torque: isAnomaly ? torqueBase + 6 : torqueBase,
        pressure: 2500 + Math.random() * 50
      };
    });
  }, [scenario]);

  const deadzoneLog = [
    { time: '06:00', shift: 'A', status: 'OK', op: 'FISHING_START' },
    { time: '12:00', shift: 'A', status: 'OK', op: 'TOOL_ENGAGED' },
    { time: '18:00', shift: 'B', status: 'DEADZONE', op: 'NULL_RECORDS' },
    { time: '00:00', shift: 'B', status: 'DEADZONE', op: 'NULL_RECORDS' },
    { time: '06:00', shift: 'C', status: 'DEADZONE', op: 'NULL_RECORDS' },
    { time: '12:00', shift: 'C', status: 'OK', op: 'RECOVERY_BIG_REVEAL' },
  ];

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setLog([]);
    setShowReport(false);

    const steps = [
      `>>> INITIATING WETE_SCANNER v.92`,
      `>>> TARGET_UWI: ${uwi}`,
      `>>> DIRECTIVE: FACT_SCIENCE_RECONCILIATION`,
      "-----------------------------------------",
      "[1/3] HARVESTING NDR DDR RECORDS...",
      scenario === 'A' ? ">> DETECTING HOOK_LOAD ANOMALIES @ 8400'" : ">> ANALYZING CHRONO-GAPS...",
      scenario === 'A' ? ">> PHANTOM_STEEL_SIGNATURE_VERIFIED" : ">> DEADZONE_WINDOW_IDENTIFIED: 48HRS",
      "[2/3] APPLYING HYDRAULIC FINGERPRINTING...",
      ">> DECAY_MODEL: MACARONI_STRING_INVERSE",
      ">> RESULT: PRESSURE_DEVIATION_CONFIRMED",
      "[3/3] FINALIZING FORENSIC NOTARY...",
      `>> GEN_HASH: SHA512:WETE_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      "-----------------------------------------",
      ">>> VETO_LOCK_ENGAGED."
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setLog(prev => [...prev, steps[current]]);
        current++;
        setScanProgress((current / steps.length) * 100);
      } else {
        clearInterval(interval);
        setIsScanning(false);
        setShowReport(true);
      }
    }, 150);
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-6 bg-slate-950/40 relative font-terminal overflow-hidden border border-emerald-900/10">
      
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Scale size={400} className="text-emerald-500 animate-spin-slow" />
      </div>

      <div className="flex flex-col space-y-6 max-w-7xl mx-auto w-full relative z-10 h-full">
        
        {/* Module Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/30 pb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded shadow-lg">
              <Zap size={24} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-tighter">{">>>"} WETE_FORENSIC_SCANNER</h2>
              <p className="text-[10px] text-emerald-800 font-black uppercase tracking-[0.4em]">Auth: BRAHAN_CORE_v.92 // Source: UK_NDR</p>
            </div>
          </div>
          <button 
            onClick={startScan}
            disabled={isScanning}
            className={`px-8 py-3 rounded font-black text-[10px] uppercase tracking-widest transition-all border ${isScanning ? 'bg-orange-500/20 text-orange-500 border-orange-500/40' : 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400'}`}
          >
            {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="mr-2" />}
            <span>{isScanning ? 'Penetrating_Abyss...' : 'Execute WETE Scan'}</span>
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          
          {/* Left: Terminal Output & Notary Report */}
          <div className="flex flex-col space-y-4">
            <div className="flex-1 bg-slate-950/90 border border-emerald-900/30 rounded-xl p-5 flex flex-col shadow-2xl relative overflow-hidden">
               <div className="flex items-center justify-between mb-4 border-b border-emerald-900/20 pb-2">
                <div className="flex items-center space-x-2">
                  <Terminal size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">WETE_Forensic_Trace</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[9px] space-y-1">
                {log.map((line, i) => (
                  <div key={i} className={line.startsWith('!!!') ? 'text-red-500' : line.startsWith('>>>') ? 'text-emerald-400' : 'text-emerald-600/80'}>
                    {line}
                  </div>
                ))}
                {isScanning && <div className="text-emerald-400 animate-pulse">_</div>}
              </div>
            </div>

            {/* WETE Physical Status Report */}
            <div className={`glass-panel p-5 rounded-lg border transition-all duration-700 ${showReport ? 'border-red-500/40 bg-red-500/5' : 'border-emerald-900/20 opacity-40'}`}>
               <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest">WETE_Notary_Output</span>
                  <ShieldAlert size={14} className={showReport ? "text-red-500 animate-pulse" : "text-emerald-900"} />
               </div>
               <div className="p-3 bg-slate-950 rounded border border-emerald-900/40 font-mono">
                  {showReport ? (
                    <div className="space-y-2">
                       <div className="text-[8px] text-red-500 font-black uppercase tracking-tighter">{">>>"} SOVEREIGN_VETO_ENGAGED</div>
                       <p className="text-[9px] text-emerald-400 leading-tight">
                         Target {uwi} contains undocumented adapter spool stacked on Grade 3 wellhead. Inverse completion verified via hydraulic fingerprinting. Sidetrack plans must be aborted to prevent mechanical breach.
                       </p>
                    </div>
                  ) : (
                    <div className="text-[8px] text-emerald-950 uppercase italic">Awaiting Forensic Verification...</div>
                  )}
               </div>
            </div>
          </div>

          {/* Middle: Data Visualizers (Phantom Steel / Deadzone) */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                
                {/* Phantom Steel Detector (Hook Load) */}
                <div className="bg-slate-950/80 border border-emerald-900/20 rounded-xl p-5 flex flex-col shadow-inner overflow-hidden">
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Phantom_Steel_Detector</span>
                      <Scale size={14} className="text-emerald-700" />
                   </div>
                   <div className="flex-1 min-h-0 relative">
                      <ResponsiveContainer width="100%" height="100%">
                         <ComposedChart data={telemetryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="1 4" stroke="#064e3b" opacity={0.1} />
                            <XAxis dataKey="depth" reversed hide />
                            <YAxis stroke="#064e3b" fontSize={8} />
                            <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #064e3b', fontSize: '8px' }} />
                            <Area type="monotone" dataKey="hookLoad" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={2} isAnimationActive={showReport} />
                            {showReport && scenario === 'A' && (
                              <ReferenceLine x={8400} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'NESTED_STACK', position: 'top', fill: '#ef4444', fontSize: 8 }} />
                            )}
                         </ComposedChart>
                      </ResponsiveContainer>
                      {showReport && scenario === 'A' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div className="p-2 border border-red-500/40 bg-red-500/5 rounded backdrop-blur-sm animate-pulse">
                              <span className="text-[7px] text-red-400 font-black uppercase">Anomaly: HookLoad_Veto</span>
                           </div>
                        </div>
                      )}
                   </div>
                   <div className="mt-4 text-[8px] text-emerald-800 font-black uppercase tracking-widest flex justify-between">
                      <span>Telemetry_Search: Hook_Load / Torque</span>
                      <span className="text-emerald-500">Physics_Valid: YES</span>
                   </div>
                </div>

                {/* Deadzone Chrono-Audit */}
                <div className="bg-slate-950/80 border border-emerald-900/20 rounded-xl p-5 flex flex-col shadow-inner overflow-hidden">
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Deadzone_Chronology</span>
                      <Clock size={14} className="text-emerald-700" />
                   </div>
                   <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
                      {deadzoneLog.map((entry, idx) => (
                        <div key={idx} className={`p-2 rounded border flex items-center justify-between transition-all ${entry.status === 'DEADZONE' && showReport ? 'bg-red-500/10 border-red-500/40' : 'bg-slate-900/40 border-emerald-900/10'}`}>
                           <div className="flex items-center space-x-3">
                              <div className={`w-1 h-1 rounded-full ${entry.status === 'DEADZONE' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                              <span className="text-[9px] font-mono text-emerald-100">{entry.time}</span>
                              <span className="text-[8px] font-black text-emerald-900 uppercase">SHIFT_{entry.shift}</span>
                           </div>
                           <span className={`text-[8px] font-black uppercase ${entry.status === 'DEADZONE' ? 'text-red-500' : 'text-emerald-500'}`}>{entry.op}</span>
                        </div>
                      ))}
                   </div>
                   <div className="mt-4 pt-4 border-t border-emerald-900/10 text-[8px] text-emerald-800 font-black uppercase italic leading-relaxed">
                     Cross-referencing shift changes identifying cover-up windows during C-lock recovery sequence.
                   </div>
                </div>
             </div>

             {/* Bottom: Hydraulic Fingerprinting Visualizer */}
             <div className="bg-slate-950/80 border border-emerald-900/20 rounded-xl p-5 flex flex-col shadow-inner h-48 overflow-hidden relative">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Hydraulic_Fingerprinting: Macaroni_String_Signature</span>
                   <Activity size={14} className="text-emerald-700" />
                </div>
                <div className="flex-1 flex space-x-8 items-center">
                   <div className="flex-1 h-full bg-slate-900/50 rounded border border-emerald-900/30 relative overflow-hidden">
                      {/* Inverse Pressure Signature */}
                      <svg width="100%" height="100%" className="opacity-40">
                         <path d="M 0 80 Q 50 10, 100 80 T 200 80" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" />
                         {showReport && (
                           <path d="M 0 80 Q 50 120, 100 80 T 200 80" fill="none" stroke="#ef4444" strokeWidth="2" className="animate-pulse" />
                         )}
                      </svg>
                      <div className="absolute bottom-2 right-2 text-[7px] text-emerald-900 font-black uppercase">Sig_Type: REVERSE_DECAY</div>
                   </div>
                   <div className="w-64 space-y-2">
                      <div className="p-2 bg-slate-950 rounded border border-emerald-900/20">
                         <div className="text-[7px] text-emerald-900 font-black uppercase mb-1">Expected_Fingerprint</div>
                         <div className="text-[10px] font-black text-emerald-600">LINEAR_EMPTY_TUBING</div>
                      </div>
                      <div className={`p-2 bg-slate-950 rounded border transition-all ${showReport ? 'border-red-500/40' : 'border-emerald-900/20'}`}>
                         <div className="text-[7px] text-emerald-900 font-black uppercase mb-1">Observed_Fingerprint</div>
                         <div className={`text-[10px] font-black ${showReport ? 'text-red-500 animate-pulse' : 'text-emerald-900'}`}>NESTED_MACARONI_DETECTED</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Mandated Attribution */}
        <div className="pt-4 border-t border-emerald-900/20 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] mt-auto">
           <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-2 text-emerald-600">
                <Database size={12} />
                <span>MANDATORY NSTA ATTRIBUTION: Contains information provided by the NSTA.</span>
              </span>
           </div>
           <div className="flex items-center space-x-4">
              <span className="text-emerald-950">FACT_SCIENCE_VETO_SYSTEM_READY</span>
              <div className="flex items-center space-x-1">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default WETEForensicScanner;
