
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, Zap, Activity, AlertTriangle, 
  Settings2, Play, Loader2, Gauge, 
  Thermometer, Wind, Scale, Target,
  RefreshCw, History, FileWarning, MoveDown
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const SIM_STEPS = 50;

const CerberusSimulator: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [frictionFactor, setFrictionFactor] = useState(0.24);
  const [pumpRate, setPumpRate] = useState(2.5); // BPM
  const [maxDepth, setMaxDepth] = useState(3500); // meters
  
  // HUD Status (The "Three Heads" of Cerberus)
  const [status, setStatus] = useState({
    mechanical: 88,
    hydraulic: 92,
    thermal: 74
  });

  const runSimulation = () => {
    setIsSimulating(true);
    setSimProgress(0);
    const interval = setInterval(() => {
      setSimProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const simData = useMemo(() => {
    return Array.from({ length: SIM_STEPS }, (_, i) => {
      const depth = (i / SIM_STEPS) * maxDepth;
      const fatigueBase = Math.pow(i / SIM_STEPS, 2) * 60;
      const frictionEffect = frictionFactor * depth * 0.05;
      const noise = Math.random() * 5;
      
      const fatigue = Math.min(100, fatigueBase + frictionEffect + noise);
      const bucklingLimit = 80 - (i / SIM_STEPS) * 30; // Compression limit decreases with depth
      
      return {
        depth,
        fatigue,
        bucklingLimit,
        stress: Math.min(100, fatigue * 1.2)
      };
    });
  }, [maxDepth, frictionFactor, simProgress]);

  // Dynamic risk assessment
  const riskLevel = useMemo(() => {
    const maxFatigue = Math.max(...simData.map(d => d.fatigue));
    if (maxFatigue > 85) return 'CRITICAL';
    if (maxFatigue > 60) return 'ELEVATED';
    return 'STABLE';
  }, [simData]);

  return (
    <div className="flex flex-col h-full space-y-3 p-4 bg-[var(--slate-abyssal)]/40 border border-[var(--emerald-primary)]/30 rounded-lg transition-all relative overflow-hidden font-terminal scanline-effect glass-panel cyber-border">
      
      {/* Three-Headed Watchdog HUD Overlay */}
      <div className="absolute top-20 right-8 z-30 flex flex-col space-y-4">
        {[
          { label: 'MECHANICAL', val: status.mechanical, icon: <Scale size={14} />, color: 'emerald' },
          { label: 'HYDRAULIC', val: status.hydraulic, icon: <Wind size={14} />, color: 'cyan' },
          { label: 'THERMAL', val: status.thermal, icon: <Thermometer size={14} />, color: 'orange' },
        ].map(head => (
          <div key={head.label} className="flex items-center space-x-3 bg-slate-950/90 border border-[var(--emerald-primary)]/20 p-2 rounded-lg shadow-2xl backdrop-blur-md glass-panel cyber-border">
            <div className={`p-1.5 rounded bg-${head.color}-500/10 text-${head.color}-400 glass-panel`}>
              {head.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase tracking-widest text-[var(--emerald-primary)]/40">{head.label}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden border border-[var(--emerald-primary)]/20">
                  <div className={`h-full bg-${head.color}-500`} style={{ width: `${head.val}%` }}></div>
                </div>
                <span className="text-[10px] font-black text-emerald-100">{head.val}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header HUD */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-[var(--emerald-primary)]/10 border border-[var(--emerald-primary)]/40 rounded shadow-[0_0_15px_rgba(16,185,129,0.2)] glass-panel">
            <ShieldCheck size={20} className={isSimulating ? 'animate-pulse text-orange-500' : 'text-[var(--emerald-primary)] text-glow-emerald'} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--emerald-primary)] font-terminal uppercase tracking-tighter text-glow-emerald">Cerberus_Simulator</h2>
            <div className="flex items-center space-x-2">
              <span className="text-[8px] text-[var(--emerald-primary)]/40 uppercase tracking-widest font-black">Tri-Head Survival Engine v2.0</span>
              <div className="w-1 h-1 bg-[var(--emerald-primary)] rounded-full animate-pulse shadow-[0_0_8px_var(--emerald-primary)]"></div>
            </div>
          </div>
        </div>

        <button 
          onClick={runSimulation}
          disabled={isSimulating}
          className={`flex items-center space-x-2 px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest transition-all glass-panel ${isSimulating ? 'bg-orange-500/20 text-orange-500 cursor-wait' : 'bg-[var(--emerald-primary)] text-slate-950 hover:bg-[var(--emerald-primary)]/80 shadow-[0_0_20px_rgba(16,185,129,0.4)]'}`}
        >
          {isSimulating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
          <span>Run_Survival_Sim</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex space-x-4">
        
        {/* Module A: Simulation Parameters */}
        <div className="w-72 flex flex-col space-y-3">
          <div className="bg-slate-950/90 border border-[var(--emerald-primary)]/30 rounded-xl p-5 flex flex-col space-y-6 shadow-2xl glass-panel cyber-border">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-[var(--emerald-primary)] uppercase tracking-widest text-glow-emerald">Physics_Veto</span>
                <Settings2 size={14} className="text-[var(--emerald-primary)]/40" />
             </div>
             
             <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px] font-black text-[var(--emerald-primary)]/40 uppercase tracking-widest">
                    <span>Friction_Factor</span>
                    <span className="text-[var(--emerald-primary)]">{frictionFactor.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" min="0.1" max="0.6" step="0.01" 
                    value={frictionFactor} 
                    onChange={e => setFrictionFactor(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 appearance-none rounded-full accent-[var(--emerald-primary)]" 
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px] font-black text-[var(--emerald-primary)]/40 uppercase tracking-widest">
                    <span>Flow_Rate_BPM</span>
                    <span className="text-[var(--emerald-primary)]">{pumpRate.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="10" step="0.5" 
                    value={pumpRate} 
                    onChange={e => setPumpRate(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 appearance-none rounded-full accent-[var(--emerald-primary)]" 
                  />
                </div>
             </div>

             <div className={`p-4 rounded border transition-all glass-panel ${riskLevel === 'CRITICAL' ? 'bg-[var(--alert-red)]/10 border-[var(--alert-red)]/40 text-[var(--alert-red)]' : 'bg-[var(--emerald-primary)]/5 border-[var(--emerald-primary)]/20 text-[var(--emerald-primary)]'}`}>
                <div className="flex items-center space-x-2 mb-2">
                   <AlertTriangle size={14} className={riskLevel === 'CRITICAL' ? 'animate-pulse' : ''} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Survival_Risk</span>
                </div>
                <div className="text-xl font-black">{riskLevel}</div>
                <div className="text-[8px] uppercase tracking-tighter opacity-60 mt-1">
                   {riskLevel === 'CRITICAL' ? 'PROBABILITY OF FATIGUE FAILURE: > 85%' : 'FACTORS WITHIN TOLERANCE ENVELOPE'}
                </div>
             </div>
          </div>

          <div className="flex-1 bg-slate-950/90 border border-[var(--emerald-primary)]/30 rounded-xl p-4 flex flex-col space-y-3 overflow-hidden shadow-2xl glass-panel cyber-border">
             <div className="flex items-center justify-between border-b border-[var(--emerald-primary)]/10 pb-2">
                <span className="text-[10px] font-black text-[var(--emerald-primary)]/40 uppercase tracking-widest">Real-time_Telemetry</span>
                <RefreshCw size={12} className="text-[var(--emerald-primary)]/40" />
             </div>
             <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                {[
                  { label: 'Surface_Tension', val: '14,250 lbs', color: 'emerald' },
                  { label: 'Buckling_Point', val: `${(maxDepth * 0.82).toFixed(0)}m`, color: 'orange' },
                  { label: 'ECD_Correction', val: '10.2 PPG', color: 'cyan' },
                  { label: 'Cycle_Fatigue', val: '12.4%', color: 'emerald' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-900/40 p-2 rounded">
                    <span className="text-[9px] font-black text-[var(--emerald-primary)]/40 uppercase tracking-tighter">{item.label}</span>
                    <span className={`text-[10px] font-terminal font-black text-${item.color}-400`}>{item.val}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Module B: Fatigue & Buckling Envelope */}
        <div className="flex-1 bg-slate-950/80 rounded-xl border border-[var(--emerald-primary)]/20 p-4 flex flex-col relative overflow-hidden shadow-inner glass-panel cyber-border">
           <div className="absolute top-4 right-4 z-20 flex space-x-2">
              <div className="flex items-center space-x-2 bg-slate-950 border border-[var(--emerald-primary)]/50 px-2 py-1 rounded">
                 <div className="w-2 h-2 bg-[var(--emerald-primary)]"></div>
                 <span className="text-[8px] font-black uppercase text-[var(--emerald-primary)]/40">FATIGUE_TRACES</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-950 border border-[var(--emerald-primary)]/50 px-2 py-1 rounded">
                 <div className="w-2 h-2 border border-[var(--emerald-primary)]/50"></div>
                 <span className="text-[8px] font-black uppercase text-[var(--emerald-primary)]/40">BUCKLING_LIMIT</span>
              </div>
           </div>

           <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={simData} layout="vertical">
                    <defs>
                       <linearGradient id="fatigueGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="5%" stopColor="var(--emerald-primary)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.8}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--emerald-primary)" opacity={0.1} vertical={false} />
                    <XAxis type="number" stroke="var(--emerald-primary)" fontSize={9} axisLine={false} tick={false} domain={[0, 100]} />
                    <YAxis dataKey="depth" type="number" reversed domain={[0, maxDepth]} stroke="var(--emerald-primary)" fontSize={8} label={{ value: 'DEPTH (m)', angle: -90, position: 'insideLeft', fill: 'var(--emerald-primary)', opacity: 0.4, fontSize: 10, fontWeight: 'black' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid var(--emerald-primary)', opacity: 0.8, fontSize: '9px' }} />
                    <Area type="monotone" dataKey="fatigue" stroke="var(--emerald-primary)" fill="url(#fatigueGrad)" strokeWidth={2} isAnimationActive={isSimulating} />
                    <Area type="stepAfter" dataKey="bucklingLimit" stroke="#FF5F1F" fill="none" strokeWidth={1} strokeDasharray="4 4" />
                    <ReferenceLine x={80} stroke="var(--alert-red)" strokeDasharray="3 3" label={{ value: 'YIELD', position: 'top', fill: 'var(--alert-red)', fontSize: 8 }} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Module C: Survival Schematic Visualizer */}
        <div className="w-64 bg-slate-950/90 border border-[var(--emerald-primary)]/30 rounded-xl p-4 flex flex-col relative shadow-2xl glass-panel cyber-border">
           <div className="flex items-center justify-between mb-4 border-b border-[var(--emerald-primary)]/20 pb-2">
              <span className="text-[10px] font-black text-[var(--emerald-primary)] uppercase tracking-widest text-glow-emerald">Well_Survival_Map</span>
              <Target size={14} className="text-[var(--emerald-primary)]/40" />
           </div>

           <div className="flex-1 bg-slate-900/10 rounded border border-[var(--emerald-primary)]/20 flex flex-col items-center relative py-6 overflow-hidden">
              {/* Vertical Schematic SVG */}
              <svg width="60" height="100%" className="opacity-80">
                <rect x="15" y="0" width="30" height="100%" fill="none" stroke="var(--emerald-primary)" opacity={0.2} strokeWidth="1" strokeDasharray="4 2" />
                
                {/* Friction Hotspots */}
                <rect x="18" y="120" width="24" height="40" fill="#f9731611" stroke="#f97316" strokeWidth="1" strokeDasharray="2 1" />
                <rect x="18" y="240" width="24" height="20" fill="var(--alert-red)" opacity={0.2} stroke="var(--alert-red)" strokeWidth="1" />

                {/* Simulated Tool Indicator */}
                {isSimulating && (
                  <g style={{ transform: `translateY(${simProgress * 2.8}px)` }} className="transition-transform duration-100">
                    <path d="M15,0 L45,0 L30,20 Z" fill="var(--emerald-primary)" />
                    <line x1="10" y1="0" x2="50" y2="0" stroke="var(--emerald-primary)" strokeWidth="1" className="animate-pulse shadow-[0_0_10px_var(--emerald-primary)]" />
                  </g>
                )}
              </svg>

              <div className="absolute top-0 right-2 bottom-0 flex flex-col justify-between py-2 pointer-events-none">
                 <span className="text-[7px] text-[var(--emerald-primary)]/40 font-black">0.0m</span>
                 <span className="text-[7px] text-[var(--emerald-primary)]/40 font-black">{maxDepth.toFixed(0)}m</span>
              </div>
           </div>

           <div className="mt-4 flex flex-col space-y-2">
              <div className="flex justify-between items-center text-[8px] font-black uppercase text-[var(--emerald-primary)]/40 tracking-widest">
                <span>Buckling_Probability</span>
                <span className="text-orange-500">{(frictionFactor * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-[var(--emerald-primary)]/20">
                 <div className="h-full bg-orange-500" style={{ width: `${frictionFactor * 100}%` }}></div>
              </div>
           </div>
        </div>
      </div>

      {/* Footer Alert Bar */}
      <div className={`p-2.5 rounded border flex items-center justify-between transition-all ${riskLevel === 'CRITICAL' ? 'bg-[var(--alert-red)]/10 border-[var(--alert-red)]/40' : 'bg-slate-950/80 border-[var(--emerald-primary)]/20'}`}>
         <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
               {riskLevel === 'CRITICAL' ? <FileWarning size={14} className="text-[var(--alert-red)] animate-pulse" /> : <Gauge size={14} className="text-[var(--emerald-primary)]/40" />}
               <span className={`text-[10px] font-black uppercase tracking-widest ${riskLevel === 'CRITICAL' ? 'text-[var(--alert-red)]' : 'text-[var(--emerald-primary)]/40'}`}>
                 {isSimulating ? 'SIMULATION_IN_PROGRESS' : riskLevel === 'CRITICAL' ? 'FATIGUE_THRESHOLD_BREACH' : 'SURVIVAL_ENVELOPE_NORMAL'}
               </span>
            </div>
            <div className="h-4 w-px bg-[var(--emerald-primary)]/30"></div>
            <div className="flex items-center space-x-2">
               <History size={12} className="text-[var(--emerald-primary)]/40" />
               <span className="text-[9px] text-[var(--emerald-primary)]/40 uppercase font-black">ENGINE: CERBERUS_SOLVER_v2</span>
            </div>
         </div>
         <div className="flex items-center space-x-4">
            <span className="text-[9px] text-[var(--emerald-primary)]/40 font-mono tracking-tighter">DATA_TRUST: SOVEREIGN</span>
            <div className="flex items-center space-x-1">
               <div className="w-1 h-1 bg-[var(--emerald-primary)] rounded-full"></div>
               <div className="w-1 h-1 bg-[var(--emerald-primary)] rounded-full"></div>
               <div className="w-1 h-1 bg-[var(--emerald-primary)] rounded-full"></div>
            </div>
         </div>
      </div>

    </div>
  );
};

export default CerberusSimulator;
