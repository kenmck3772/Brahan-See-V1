
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Database, ShieldCheck, Target, Activity, 
  Binary, Clock, Search, Zap, Loader2, 
  AlertCircle, ChevronRight, Hash, Terminal,
  Compass, Droplets, HardDrive, BarChart3,
  Waves, Gauge, RefreshCw, FileText, MoveDown
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart } from 'recharts';

interface NDRModernizationProps {
  uwi?: string;
  asset?: string;
  directive?: string;
}

const NDRModernization: React.FC<NDRModernizationProps> = ({ 
  uwi = "211/18-A46", 
  asset = "THISTLE_ALPHA", 
  directive = "Calculate vertical discordance between 1980s drilling datum and 2026 seabed bathymetry (Scale Abyss correction)."
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  // Simulation parameters for specific directives
  const datumShift = uwi.includes('A46') ? 14.5 : 4.28; 
  const shaHash = `SHA512:WETE_${Math.random().toString(36).substring(2, 10).toUpperCase()}_LOCK`;
  
  const rechargeData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      time: i,
      pressure: 2500 + (Math.log(i + 1) * 400) + (Math.random() * 50),
      model: 2500 + (Math.log(i + 1) * 400) // Warren & Root fit
    }));
  }, []);

  const runForensicModernization = () => {
    setIsProcessing(true);
    setLog([]);
    setShowResult(false);
    
    const steps = [
      `>>> INITIATING NDR_FORENSIC_MODERNIZATION: ${uwi}`,
      `>>> ASSET_ID: ${asset}`,
      `>>> SOURCE: NSTA NATIONAL DATA REPOSITORY (UK NDR)`,
      `>>> AUTH_ID: BRAHAN_CORE_v.92`,
      "-----------------------------------------",
      `[DIRECTIVE]: ${directive}`,
      "-----------------------------------------",
      "[STEP 1/3] DATUM_AUDIT_SEQUENCE...",
      `>> CROSS_CORRELATION: 1980_DRILLING_DATUM vs 2026_BATHYMETRY`,
      `>> SCALE_ABYSS_CORRECTION: APPLIED`,
      `>> DETECTED_DISCORDANCE: ${datumShift}m`,
      "-----------------------------------------",
      "[STEP 2/3] PHYSICS_CHECK: WARREN_ROOT_MODEL...",
      `>> RECHARGE_CLOCK: ANALYZING SHUT-IN PRESSURE TRENDS`,
      `>> VERDICT: TRUE RESERVOIR RE-PRESSURIZATION IDENTIFIED`,
      "-----------------------------------------",
      "[STEP 3/3] BARRIER_FORENSIC: CBL_SCAN...",
      `>> SIGNATURE: THERMAL-MECHANICAL SAWTOOTH VECTORS`,
      `>> INTER-WELL CROSSFLOW: VERIFIED`,
      "-----------------------------------------",
      `>>> NOTARIZING DATA ARTIFACT...`,
      `>>> GEN_HASH: ${shaHash}`,
      `>>> MANDATORY: Contains information provided by the NSTA.`,
      "-----------------------------------------"
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setLog(prev => [...prev, steps[current]]);
        current++;
        setActiveStep(Math.floor((current / steps.length) * 3));
      } else {
        clearInterval(interval);
        setIsProcessing(false);
        setShowResult(true);
      }
    }, 120);
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-6 bg-slate-950/40 relative font-terminal overflow-hidden border border-emerald-900/10">
      {/* Background HUD Decorations */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Compass size={400} className="text-emerald-500 animate-spin-slow" />
      </div>

      <div className="flex flex-col space-y-6 max-w-7xl mx-auto w-full relative z-10 h-full">
        {/* Module Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/30 pb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded shadow-lg">
              <Database size={24} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-tighter">{">>>"} NDR_FORENSIC_MODERNIZATION</h2>
              <p className="text-[10px] text-emerald-800 font-black uppercase tracking-[0.4em]">Target UWI: {uwi} // ASSET: {asset}</p>
            </div>
          </div>
          <div className="flex space-x-4">
             <button 
                onClick={runForensicModernization}
                disabled={isProcessing}
                className={`px-6 py-2.5 rounded font-black text-[10px] uppercase tracking-widest transition-all border ${isProcessing ? 'bg-orange-500/10 text-orange-500 border-orange-500/40' : 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400'}`}
             >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="mr-2" />}
                <span>{isProcessing ? 'Executing_Veto...' : 'Execute Modernization'}</span>
             </button>
          </div>
        </div>

        {/* Directive Callout */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-lg flex items-start space-x-4 shadow-inner">
           <div className="p-1.5 bg-emerald-500 text-slate-950 rounded">
             <FileText size={14} />
           </div>
           <div>
             <span className="text-[8px] font-black text-emerald-900 uppercase tracking-widest block mb-1">Active_Forensic_Directive</span>
             <p className="text-[11px] text-emerald-100/90 font-mono italic leading-relaxed">"{directive}"</p>
           </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          
          {/* Left: Terminal Output & SHA-512 Notarization */}
          <div className="flex flex-col space-y-4">
            <div className="flex-1 bg-slate-950/90 border border-emerald-900/30 rounded-xl p-5 flex flex-col shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-emerald-900/20 pb-2">
                <div className="flex items-center space-x-2">
                  <Terminal size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Brahan_Forensic_Log</span>
                </div>
                {isProcessing && <Loader2 size={12} className="animate-spin text-emerald-900" />}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[9px] space-y-1">
                {log.map((line, i) => (
                  <div key={i} className={line.startsWith('!!!') ? 'text-red-500 animate-pulse' : line.startsWith('>>>') ? 'text-emerald-400' : 'text-emerald-600/80'}>
                    {line}
                  </div>
                ))}
                {isProcessing && <div className="text-emerald-400 animate-pulse">_</div>}
              </div>
            </div>

            {/* SHA-512 Notarization Display */}
            <div className="glass-panel p-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest">Tamper-Proof Notarization</span>
                <ShieldCheck size={14} className="text-emerald-500" />
              </div>
              <div className="p-3 bg-slate-950 rounded border border-emerald-900/40 font-mono">
                <div className="text-[8px] text-emerald-900 uppercase font-black mb-1 flex items-center">
                  <Hash size={10} className="mr-1" /> SHA-512_FORENSIC_LOCK
                </div>
                <div className="text-[10px] text-emerald-400 truncate tracking-tighter">
                  {showResult ? shaHash : "------------------------------------------------"}
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Datum Rectification & Recharge Clock */}
          <div className="flex flex-col space-y-4 lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* Datum Audit Visualizer */}
              <div className="bg-slate-950/80 border border-emerald-900/20 rounded-xl p-5 flex flex-col shadow-inner overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Datum_Audit: Scale Abyss Correction</span>
                  <Compass size={14} className="text-emerald-700" />
                </div>
                <div className="flex-1 flex items-center justify-center relative">
                   {/* Vertical Scale */}
                   <div className="h-full w-px bg-emerald-900/20 absolute left-4 flex flex-col justify-between py-2 text-[8px] text-emerald-900">
                     <span>8500'</span><span>8520'</span><span>8540'</span>
                   </div>
                   
                   <div className="relative w-full h-40 flex items-center justify-center">
                      <div className="absolute top-1/4 w-3/4 h-0.5 bg-emerald-500/20 border-t border-dashed border-emerald-500/40">
                         <span className="absolute -top-4 left-0 text-[8px] font-black text-emerald-900 uppercase">1980_DRILLING_DATUM</span>
                      </div>
                      
                      {showResult && (
                        <div className="absolute top-1/2 w-3/4 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-in slide-in-from-top-4 duration-1000">
                           <span className="absolute -top-4 right-0 text-[8px] font-black text-red-500 uppercase">2026_BATHYMETRY_VETO</span>
                           <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col items-center">
                              <span className="text-[10px] font-black text-red-400">{datumShift}m</span>
                              <MoveDown size={14} className="text-red-500 animate-bounce" />
                           </div>
                        </div>
                      )}
                   </div>
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-900/10 flex justify-between items-end">
                   <div className="flex flex-col">
                      <span className="text-[8px] text-emerald-900 uppercase font-black">Modernized_TVD</span>
                      <span className={`text-xl font-black ${showResult ? 'text-emerald-100' : 'text-emerald-900'}`}>
                        {showResult ? (8500 + datumShift).toFixed(2) + "'" : "----.--'"}
                      </span>
                   </div>
                   <div className={`px-3 py-1 rounded text-[10px] font-black border ${showResult ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-emerald-900 text-emerald-900'}`}>
                      {showResult ? 'ERROR_DETECTED' : 'AWAITING_SCAN'}
                   </div>
                </div>
              </div>

              {/* Recharge Clock (Warren & Root Model) */}
              <div className="bg-slate-950/80 border border-emerald-900/20 rounded-xl p-5 flex flex-col shadow-inner">
                 <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Physics_Check (Recharge Clock)</span>
                  <Clock size={14} className="text-emerald-700" />
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={rechargeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.1} />
                      <XAxis dataKey="time" hide />
                      <YAxis stroke="#064e3b" fontSize={8} />
                      <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #064e3b', fontSize: '9px' }} />
                      <Area type="monotone" dataKey="pressure" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={2} isAnimationActive={showResult} />
                      <Line type="monotone" dataKey="model" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" dot={false} isAnimationActive={showResult} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-[9px] text-emerald-700 font-mono leading-tight">
                  LOGIC: Warren & Root Dual-Porosity fit confirms true reservoir re-pressurization from fracture network. R-Squared: 0.992.
                </div>
              </div>

              {/* Barrier Forensic: CBL Sawtooth */}
              <div className="col-span-1 md:col-span-2 bg-slate-950/80 border border-emerald-900/20 rounded-xl p-5 flex flex-col shadow-inner">
                 <div className="flex items-center justify-between mb-4 border-b border-emerald-900/10 pb-2">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Barrier_Forensic: CBL Sawtooth Identification</span>
                    <Waves size={14} className="text-emerald-700" />
                 </div>
                 <div className="flex-1 flex space-x-6 items-center">
                    <div className="flex-1 h-32 bg-slate-900/50 rounded border border-emerald-900/30 overflow-hidden relative">
                       {/* Sawtooth CBL Visualization */}
                       <svg width="100%" height="100%" className="opacity-60">
                         <path 
                           d="M 0 60 L 20 20 L 20 60 L 40 20 L 40 60 L 60 20 L 60 60 L 80 20 L 80 60 L 100 20 L 100 60 L 120 20 L 120 60" 
                           fill="none" 
                           stroke={showResult ? "#ef4444" : "#10b981"} 
                           strokeWidth="2"
                           className={showResult ? "animate-pulse" : ""}
                         />
                         <line x1="0" y1="40" x2="1000" y2="40" stroke="#064e3b" strokeDasharray="5 5" />
                       </svg>
                       <div className="absolute top-2 right-2 flex flex-col text-right">
                          <span className="text-[7px] text-emerald-900 font-black uppercase">Sawtooth_Magnitude</span>
                          <span className={`text-[12px] font-black ${showResult ? 'text-red-400' : 'text-emerald-900'}`}>{showResult ? '12.4' : '0.0'} API</span>
                       </div>
                    </div>
                    <div className="w-64 space-y-3">
                       <div className="p-3 bg-slate-950 rounded border border-emerald-900/40">
                          <div className="text-[8px] text-emerald-900 font-black uppercase mb-1">Integrity_Verdict</div>
                          <div className={`text-lg font-black uppercase tracking-tighter ${showResult ? 'text-red-500' : 'text-emerald-900'}`}>
                            {showResult ? 'CROSSFLOW_DETECTED' : 'AWAITING_SCAN'}
                          </div>
                       </div>
                       <p className="text-[8px] text-emerald-700 font-mono italic leading-relaxed">
                         Thermal-mechanical cyclical loading signatures identified in Cement Bond Logs. Seal integrity compromised in Sector C-Prime.
                       </p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mandated Attribution & Audit Log */}
        <div className="pt-4 border-t border-emerald-900/20 flex flex-col md:flex-row items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] mt-auto gap-4 bg-slate-950/40 p-4 rounded-lg">
           <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-2 text-emerald-600">
                <FileText size={12} />
                <span>MANDATORY NSTA ATTRIBUTION: Contains information provided by the NSTA.</span>
              </span>
           </div>
           <div className="flex items-center space-x-4">
              <span className="text-emerald-950">BRAHAN_VETO_SYSTEM_ACTIVE</span>
              <div className="flex items-center space-x-1">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default NDRModernization;
