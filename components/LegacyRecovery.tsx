
import React, { useState, useMemo } from 'react';
import { 
  Zap, TrendingUp, Search, Layers, Coins, 
  AlertCircle, ShieldCheck, Database, Target,
  ArrowRightLeft, Sparkles, Activity, RefreshCw,
  Droplet, Beaker, Crosshair, Binary, Eye,
  ArrowDownToLine, MoveDown, Info, ChevronRight,
  Shield, Waves, Anchor, Lock
} from 'lucide-react';

const LegacyRecovery: React.FC = () => {
  const [isCorrected, setIsCorrected] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

  const handleToggle = () => {
    setIsGlitching(true);
    setTimeout(() => {
      setIsCorrected(!isCorrected);
      setIsGlitching(false);
    }, 450);
  };

  // Generate trace points for the Gamma Ray curve
  const curvePoints = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => {
      // Create a prominent sand package (high GR deflection)
      const isPeakZone = i > 45 && i < 65;
      const baseValue = isPeakZone ? 75 : 25;
      const noise = Math.random() * 10;
      return {
        x: baseValue + noise,
        y: i * 3
      };
    });
  }, []);

  const curvePath = useMemo(() => {
    return `M ${curvePoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
  }, [curvePoints]);

  return (
    <div className="flex flex-col h-full space-y-4 p-6 bg-slate-950/40 relative overflow-hidden font-terminal glass-panel cyber-border scanline-effect">
      {/* Background HUD Decorations */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Waves size={400} className="text-[var(--emerald-primary)] animate-pulse" />
      </div>

      <div id="legacy-recovery" className="flex flex-col space-y-6 max-w-6xl mx-auto w-full relative z-10 h-full">
        
        {/* Module Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/30 pb-4 glass-panel">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-[var(--emerald-primary)]/10 border border-[var(--emerald-primary)]/40 rounded shadow-lg shadow-emerald-500/5 glass-panel">
              <Anchor size={24} className="text-[var(--emerald-primary)] animate-bounce-slow text-glow-emerald" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--emerald-primary)] uppercase tracking-tighter text-glow-emerald">{">>>"} MODULE_LOAD: OFFSHORE_PAY_RECOVERY (NOPIMS)</h2>
              <p className="text-xs text-[var(--emerald-primary)]/50 font-black uppercase tracking-[0.4em]">Target: Carnarvon Basin // Anomaly: Velocity Push-Down</p>
            </div>
          </div>
          <div className="flex items-center space-x-6 text-right">
             <div className="flex flex-col">
                <span className="text-[8px] text-[var(--emerald-primary)]/30 uppercase font-black">Seismic_Veto_Auth</span>
                <span className="text-xl font-black text-[var(--emerald-primary)] text-glow-emerald">NOPIMS_VALID</span>
             </div>
             <div className="flex flex-col">
                <span className="text-[8px] text-[var(--emerald-primary)]/30 uppercase font-black">Potential_Recovery</span>
                <span className="text-xl font-black text-[var(--emerald-primary)] text-glow-emerald">1.2M BBLS</span>
             </div>
          </div>
        </div>

        {/* Main Interface Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0 overflow-hidden">
          
          {/* Left Column: Forensic Intel & Controls */}
          <div className="lg:col-span-1 flex flex-col space-y-4">
            {/* Card 1: The Glitch - Forensic Visualizer */}
            <div className="glass-panel p-5 rounded-lg border border-amber-900/40 bg-slate-900/60 relative overflow-hidden h-fit cyber-border">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <AlertCircle size={32} className="text-amber-500" />
              </div>
              <h3 className="text-[10px] font-black text-amber-500 mb-3 uppercase tracking-widest flex items-center">
                <Layers size={14} className="mr-2" /> Data Card 1: The Glitch
              </h3>
              
              {/* CSS Visualizer: Depth Misalignment */}
              <div className="p-4 bg-slate-950/90 rounded-md border border-amber-900/20 font-mono text-[9px] leading-tight relative h-64 overflow-hidden mb-4 shadow-inner glass-panel">
                <div className="mb-4 text-amber-900 text-[7px] uppercase font-black border-b border-amber-900/10 pb-1 flex justify-between">
                  <span>{">>"} SEISMIC_DATUM_CORRELATION</span>
                  <span className="animate-pulse">{isCorrected ? '[STABLE]' : '[VOLATILE]'}</span>
                </div>
                
                <div className="relative h-44">
                  {/* Grid Lines for scale */}
                  <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none">
                    {[...Array(8)].map((_, i) => <div key={i} className="w-full h-px bg-amber-500"></div>)}
                  </div>

                  {/* Vertical Scan Beam */}
                  <div className="absolute inset-y-0 w-px bg-[var(--emerald-primary)]/20 left-1/3 animate-[scan-horizontal_4s_linear_infinite] pointer-events-none"></div>

                  {/* Target Depth Line (The fixed reference) */}
                  <div className={`absolute top-1/4 w-full transition-colors duration-1000 z-20 ${isCorrected ? 'text-[var(--emerald-primary)]' : 'text-emerald-600/40'}`}>
                    <div className="flex items-center space-x-2">
                       <div className="h-0.5 flex-1 bg-current shadow-[0_0_10px_currentColor]"></div>
                       <span className="font-black bg-slate-950 px-1 whitespace-nowrap">Target Depth: 8500'</span>
                    </div>
                  </div>

                  {/* Offset Gap Visualization Bracket */}
                  <div 
                    className={`absolute left-4 w-1 border-y border-l transition-all duration-700 ease-in-out ${
                      isCorrected ? 'h-0 top-1/4 opacity-0 border-[var(--emerald-primary)]' : 'h-24 top-1/4 opacity-100 border-[var(--alert-red)]'
                    }`}
                  >
                    {!isCorrected && (
                      <div className="absolute top-1/2 left-2 -translate-y-1/2 whitespace-nowrap text-[7px] font-black text-[var(--alert-red)] uppercase tracking-tighter animate-pulse">
                        Δ Error: 12.4'
                      </div>
                    )}
                  </div>

                  {/* Actual Depth Line (The "Glitchy" line that snaps) */}
                  <div 
                    className={`absolute w-full transition-all duration-[800ms] z-30 ${
                      isCorrected 
                        ? 'top-1/4 text-[var(--emerald-primary)]' 
                        : 'top-[calc(25%+96px)] text-amber-400 animate-[flicker-glitch_2s_infinite]'
                    }`}
                    style={{ transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' }}
                  >
                    <div className="flex items-center space-x-2">
                       <div className={`h-0.5 flex-1 bg-current shadow-[0_0_15px_currentColor] ${isCorrected ? 'shadow-[var(--emerald-primary)]' : 'shadow-amber-500'}`}></div>
                       <span className="font-black bg-slate-950 px-1 whitespace-nowrap">Actual Depth: {isCorrected ? '8500.0\'' : '8512.4\''}</span>
                       {isCorrected && (
                         <div className="absolute -top-6 right-0 animate-in fade-in zoom-in duration-300">
                           <div className="flex items-center space-x-1 px-2 py-0.5 bg-[var(--emerald-primary)] text-slate-950 rounded text-[7px] font-black uppercase tracking-widest">
                             <ShieldCheck size={10} />
                             <span>LOCKED</span>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center border-t border-amber-900/10 pt-1">
                  <div className="text-[7px] text-slate-700 font-mono italic">
                    {isCorrected ? 'CORRECTION_MATRIX_STABLE' : 'DEPTH_MISMATCH_ALERT'}
                  </div>
                  <div className={`text-[7px] font-black uppercase tracking-widest ${isCorrected ? 'text-emerald-500' : 'text-amber-700'}`}>
                    {isCorrected ? '>> TRUE_HORIZON' : '>> GHOST_ARTIFACT'}
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-amber-200/70 leading-relaxed font-mono">
                CRITICAL: Shallow gas velocity pull-up detected. The legacy seismic volume incorrectly positions the target sand package above the actual wellbore intersect. 
              </p>
            </div>

            {/* Toggle Controls */}
            <div className="glass-panel p-5 rounded-lg border border-emerald-900/40 bg-slate-900/80 flex flex-col space-y-4 shadow-xl cyber-border">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Brahan_Sync_Engine</span>
                <RefreshCw size={14} className={`text-[var(--emerald-primary)] ${isGlitching ? 'animate-spin' : ''}`} />
              </div>
              
              <button 
                onClick={handleToggle}
                className={`w-full py-4 rounded font-black text-[10px] uppercase tracking-[0.3em] transition-all border glass-panel ${
                  isCorrected 
                    ? 'bg-[var(--emerald-primary)] text-slate-950 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                }`}
              >
                {isCorrected ? 'REVERT_TO_RAW' : 'INITIATE_BRAHAN_SYNC'}
              </button>

              <div className="p-3 bg-slate-950 rounded border border-emerald-900/20 glass-panel">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center space-x-2">
                      <Binary size={12} className="text-[var(--emerald-primary)]" />
                      <span className="text-[8px] font-black text-emerald-700 uppercase">Tie_Status</span>
                   </div>
                   <div className="text-[8px] font-mono text-emerald-900">v2.9_LOCK</div>
                </div>
                <div className={`text-[10px] font-black uppercase flex items-center space-x-2 ${isCorrected ? 'text-[var(--emerald-primary)]' : 'text-amber-500 animate-pulse'}`}>
                  {isCorrected ? <Lock size={10} /> : <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
                  <span>{isCorrected ? 'STATE: TIE_LOCKED' : 'STATE: PUSHED_DOWN'}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 glass-panel p-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden group cyber-border">
               <h3 className="text-[10px] font-black text-emerald-100 mb-4 uppercase tracking-widest flex items-center">
                 <Coins size={14} className="mr-2" /> Data Card 3: Recovery Asset
               </h3>
               <div className="space-y-4">
                 <div className="flex items-start space-x-3">
                   <div className="p-1 bg-[var(--emerald-primary)] text-slate-950 rounded glass-panel">
                     <Shield size={12} />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-emerald-100 uppercase tracking-widest">OFFSHORE BYPASSED PAY</span>
                     <span className="text-[7px] text-[var(--emerald-primary)]/40 font-mono italic">RANKIN-12: Mungaroo Channel A7</span>
                   </div>
                 </div>
                 <div className="p-3 bg-slate-950/80 border border-emerald-500/20 rounded glass-panel">
                    <div className="text-[7px] text-emerald-900 font-black uppercase mb-1">Est_Recoverable</div>
                    <div className="text-xl font-black text-[var(--emerald-primary)] text-glow-emerald">1,200,000 BBLS</div>
                 </div>
               </div>
            </div>
          </div>

          {/* Middle Column: The Forensic Log Visualizer (Main SVG) */}
          <div className="lg:col-span-2 glass-panel rounded-lg bg-slate-950 border border-emerald-900/40 relative overflow-hidden flex flex-col p-4 shadow-2xl cyber-border">
            {/* Visualizer HUD Overlay */}
            <div className="absolute top-6 left-6 z-20 space-y-2">
              <div className="flex items-center space-x-2 bg-slate-900/90 border border-emerald-500/30 px-3 py-1.5 rounded shadow-xl glass-panel">
                 <Crosshair size={14} className={`text-[var(--emerald-primary)] ${isCorrected ? 'animate-pulse' : ''}`} />
                 <span className="text-[9px] font-black uppercase text-[var(--emerald-primary)] tracking-widest text-glow-emerald">NOPIMS_Forensic_Visualizer</span>
              </div>
              <div className="flex items-center space-x-3">
                 <div className="flex items-center space-x-1.5 bg-slate-950/80 px-2 py-1 rounded border border-emerald-900/40 glass-panel">
                   <div className="w-2 h-2 bg-slate-700"></div>
                   <span className="text-[7px] text-emerald-900 font-black uppercase">SHALE</span>
                 </div>
                 <div className="flex items-center space-x-1.5 bg-slate-950/80 px-2 py-1 rounded border border-emerald-900/40 glass-panel">
                   <div className="w-2 h-2 bg-[var(--emerald-primary)]/20 border border-[var(--emerald-primary)]/40"></div>
                   <span className="text-[7px] text-emerald-900 font-black uppercase">MUNGAROO_SAND</span>
                 </div>
              </div>
            </div>

            {/* Depth Markers */}
            <div className="absolute top-0 left-0 bottom-0 w-16 border-r border-emerald-900/20 flex flex-col justify-between items-center py-20 text-[9px] font-black text-emerald-900 bg-slate-950/40 z-10 pointer-events-none">
              <span>8480'</span>
              <span className={`transition-all duration-700 ${!isCorrected ? 'text-amber-500 scale-125' : 'text-emerald-900'}`}>8500'</span>
              <span className={`transition-all duration-700 ${isCorrected ? 'text-emerald-400 scale-125 font-bold' : 'text-emerald-900'}`}>8512'</span>
              <span>8530'</span>
              <span>8550'</span>
              <span>8570'</span>
            </div>

            {/* The Track Canvas */}
            <div className={`flex-1 relative transition-all duration-300 ${isGlitching ? 'blur-sm grayscale' : ''}`}>
              <svg width="100%" height="100%" viewBox="0 0 400 360" className="overflow-visible">
                {/* Track Boundaries */}
                <rect x="150" y="0" width="100" height="360" fill="rgba(16,185,129,0.02)" stroke="#064e3b" strokeWidth="1" strokeDasharray="5 5" />
                
                {/* Lithology & Curve Group - Shifts DOWN by 12.4 feet (approx 38px in SVG space) */}
                <g className="transition-transform duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1)" style={{ transform: `translateY(${isCorrected ? '38px' : '0px'})` }}>
                  
                  {/* Shale Zone (Top) */}
                  <rect x="150" y="0" width="100" height="135" fill="rgba(15, 23, 42, 0.4)" />
                  
                  {/* The Target Sand Package */}
                  <rect 
                    x="150" y="135" width="100" height="60" 
                    fill={isCorrected ? "rgba(16,185,129,0.15)" : "rgba(255,176,0,0.1)"} 
                    className="transition-colors duration-500" 
                  />
                  <line x1="150" y1="135" x2="250" y2="135" stroke={isCorrected ? "#10b98144" : "#ffb00044"} strokeWidth="1" />
                  <line x1="150" y1="195" x2="250" y2="195" stroke={isCorrected ? "#10b98144" : "#ffb00044"} strokeWidth="1" />
                  
                  <text x="260" y="165" fill={isCorrected ? "#10b981" : "#ffb000"} fontSize="10" fontWeight="black" className="font-mono uppercase tracking-widest">
                    {isCorrected ? '>>> VERIFIED_PAY_ZONE' : '>>> VELOCITY_PUSH_DOWN'}
                  </text>

                  {/* Gamma Ray Curve */}
                  <path 
                    d={curvePath} 
                    fill="none" 
                    stroke={isCorrected ? "#10b981" : "#ffb000"} 
                    strokeWidth="2.5" 
                    className="transition-colors duration-500"
                    style={{ filter: isCorrected ? 'drop-shadow(0 0 5px #10b981)' : 'drop-shadow(0 0 5px #ffb000)' }}
                  />
                </g>

                {/* FIXED HARDWARE OVERLAY (The wellbore perfs at 8500ft stay fixed in space) */}
                <g transform="translate(200, 150)">
                   <line x1="-150" y1="0" x2="150" y2="0" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 2" opacity="0.4" />
                   <text x="-90" y="-15" fill="#ef4444" fontSize="8" fontWeight="black" className="font-mono">1985_RANKIN_PERFS [8500']</text>
                   
                   {/* Perforation Gun Marker */}
                   <path d="M -8,-8 L 8,8 M 8,-8 L -8,8" stroke="#ef4444" strokeWidth="3" />
                   <circle r="12" fill="none" stroke="#ef4444" strokeWidth="1" className="animate-pulse" />

                   {isCorrected && (
                     <g className="animate-in fade-in zoom-in duration-500 delay-300">
                        <text x="35" y="5" fill="#ef4444" fontSize="10" fontWeight="black" className="font-mono uppercase tracking-tighter">! MISSED_TARGET !</text>
                        <text x="35" y="18" fill="#ef4444" fontSize="7" fontWeight="bold" className="font-mono uppercase">PERFORATED_SHALE_BARRIER</text>
                     </g>
                   )}
                </g>

                {/* Brahan New Target Marker (Shown only when corrected, at 8512ft relative to 8500ft) */}
                {isCorrected && (
                  <g transform="translate(200, 188)" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                     <rect x="-10" y="-10" width="20" height="20" fill="none" stroke="#10b981" strokeWidth="2" className="animate-spin-slow" />
                     <text x="35" y="4" fill="#10b981" fontSize="11" fontWeight="black" className="font-mono uppercase tracking-[0.2em] shadow-lg">[O] NEW_TGT: 8,512'</text>
                     <text x="35" y="16" fill="#10b981" fontSize="8" fontWeight="bold" className="font-mono uppercase">OFFSHORE_RE-COMPLETE</text>
                     <circle r="4" fill="#10b981" className="animate-ping" />
                  </g>
                )}

                {/* Vertical Annotations */}
                <g transform="translate(130, 0)">
                   <line x1="0" y1="0" x2="0" y2="360" stroke="#064e3b" strokeWidth="1" />
                   {!isCorrected ? (
                     <g transform="translate(0, 150)" className="animate-in fade-in duration-500">
                        <text x="-110" y="4" fill="#ffb000" fontSize="8" className="font-mono uppercase font-black">SEISMIC_DATUM</text>
                        <path d="M -15,0 L 0,0" stroke="#ffb000" strokeWidth="2" />
                     </g>
                   ) : (
                     <g transform="translate(0, 188)" className="animate-in fade-in duration-500">
                        <text x="-110" y="4" fill="#10b981" fontSize="8" className="font-mono uppercase font-black">WELL_DATUM</text>
                        <path d="M -15,0 L 0,0" stroke="#10b981" strokeWidth="2" />
                     </g>
                   )}
                </g>
              </svg>
            </div>

            {/* Visualizer Footer Stats */}
            <div className="mt-4 flex items-center justify-between text-[8px] font-black text-emerald-900 uppercase tracking-widest border-t border-emerald-900/20 pt-3">
               <div className="flex items-center space-x-6">
                  <span className="flex items-center space-x-1"><Activity size={10} /> <span>TRACE: CARNARVON_V2</span></span>
                  <span className="flex items-center space-x-1"><Eye size={10} /> <span>VIEW: {isCorrected ? 'WELL_TRUTH' : 'SEISMIC_GHOST'}</span></span>
               </div>
               <span className="text-emerald-950 font-mono">|||||.....|||||||||| [ {isCorrected ? 'TIE_LOCKED' : 'READY'} ]</span>
            </div>
          </div>

          {/* Right Column: State Metrics */}
          <div className="lg:col-span-1 flex flex-col space-y-4">
            
            {/* The Analysis Metrics Card */}
            <div className={`glass-panel p-6 rounded-lg border transition-all duration-500 cyber-border ${isCorrected ? 'border-[var(--emerald-primary)]/40 bg-slate-900 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' : 'border-amber-900/40 bg-slate-950 opacity-80'}`}>
              <h3 className={`text-[10px] font-black mb-6 uppercase tracking-widest flex items-center ${isCorrected ? 'text-[var(--emerald-primary)]' : 'text-amber-500'}`}>
                <Activity size={16} className="mr-2" /> Data Card 2: NOPIMS Logic
              </h3>
              
              <div className="space-y-6">
                <div>
                   <span className="text-[8px] text-[var(--emerald-primary)]/30 uppercase font-black block mb-2">Original_Perfs (Rankin)</span>
                   <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded border font-black text-xs uppercase tracking-tighter transition-all glass-panel ${isCorrected ? 'bg-[var(--alert-red)]/20 text-[var(--alert-red)] border-[var(--alert-red)]/40' : 'bg-slate-900 text-amber-500 border-amber-900/50'}`}>
                        {isCorrected ? 'MISS: SHALE_PLUG' : 'HIT: TARGET_SEISMIC'}
                      </div>
                      <span className="text-[9px] text-[var(--emerald-primary)]/40 font-mono italic">{isCorrected ? 'Impermeable' : 'False Positive'}</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-3 bg-slate-950 rounded border border-emerald-900/10 glass-panel">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] text-[var(--emerald-primary)]/30 uppercase font-black tracking-widest">Water_Saturation (Sw)</span>
                      <Droplet size={12} className={isCorrected ? 'text-cyan-500' : 'text-emerald-950'} />
                    </div>
                    <div className={`text-2xl font-black font-terminal transition-all ${isCorrected ? 'text-cyan-400' : 'text-emerald-900'}`}>
                      {isCorrected ? '92%' : '--%'}
                    </div>
                    <div className="w-full h-1 bg-slate-900 mt-2 rounded-full overflow-hidden">
                       <div className={`h-full transition-all duration-1000 ${isCorrected ? 'bg-cyan-500' : 'bg-slate-800'}`} style={{ width: isCorrected ? '92%' : '0%' }}></div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded border border-emerald-900/10 glass-panel">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] text-[var(--emerald-primary)]/30 font-black uppercase tracking-widest">Mungaroo_Resistivity</span>
                      <Zap size={12} className={isCorrected ? 'text-[var(--emerald-primary)]' : 'text-emerald-950' } />
                    </div>
                    <div className={`text-2xl font-black font-terminal transition-all ${isCorrected ? 'text-[var(--emerald-primary)]' : 'text-emerald-900'}`}>
                      {isCorrected ? '42.5' : '01.2'} <span className="text-xs">Ohm-m</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-emerald-900/20">
                  <span className="text-[8px] text-[var(--emerald-primary)]/30 font-black uppercase mb-1 block">Pay_Zone_Status</span>
                  <div className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-[0.2em] text-center border transition-all glass-panel ${isCorrected ? 'bg-[var(--emerald-primary)]/20 text-[var(--emerald-primary)] border-emerald-400/30' : 'bg-[var(--alert-red)]/10 text-[var(--alert-red)] border-[var(--alert-red)]/30'}`}>
                    {isCorrected ? 'BYPASSED_OFFSHORE_OIL' : 'MISSING_PAY_ARTIFACT'}
                  </div>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="glass-panel p-4 rounded-lg border border-emerald-900/40 bg-slate-950/90 text-[8px] space-y-2 opacity-60 cyber-border">
               <div className="flex items-center space-x-2 text-[var(--emerald-primary)] font-black mb-1">
                 <Binary size={12} />
                 <span>VELOCITY_TIE_LOG</span>
               </div>
               <p className="font-mono text-[var(--emerald-primary)]/40 leading-tight">
                {">"} SCANNING_NOPIMS_ARCHIVE...<br/>
                {">"} {isCorrected ? 'VELOCITY_VETO: TIE_LOCKED' : 'WAITING_FOR_USER_VETO'}<br/>
                {">"} CHANNEL_ID: MUNGAROO_A7_OFFSHORE
               </p>
            </div>
          </div>

        </div>

        {/* Global Module Footer */}
        <div className="pt-4 border-t border-emerald-900/20 flex items-center justify-between text-[8px] font-black text-[var(--emerald-primary)]/30 uppercase tracking-[0.2em] mt-auto glass-panel">
           <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-2">
                <Database size={12} />
                <span>NOPIMS_FED_AUTH</span>
              </span>
              <span className="flex items-center space-x-2">
                <Target size={12} />
                <span>DATUM_LOCK: RANKIN_12</span>
              </span>
           </div>
           <div className="flex items-center space-x-4">
              <span className="text-[var(--emerald-primary)]/20">OFFSHORE_VETO_SYSTEM_ACTIVE</span>
              <div className="flex items-center space-x-1">
                 <div className="w-1.5 h-1.5 bg-[var(--emerald-primary)] rounded-full animate-ping"></div>
                 <div className="w-1.5 h-1.5 bg-[var(--emerald-primary)] rounded-full"></div>
              </div>
           </div>
        </div>
      </div>

      <style>{`
        @keyframes scan-horizontal {
          0% { left: 0%; opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes flicker-glitch {
          0% { opacity: 1; transform: translateX(0); }
          5% { opacity: 0.8; transform: translateX(1px); }
          10% { opacity: 1; transform: translateX(-1px); }
          15% { opacity: 0.9; transform: translateX(0); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default LegacyRecovery;