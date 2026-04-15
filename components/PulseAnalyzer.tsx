import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart, ReferenceArea } from 'recharts';
import { MOCK_PRESSURE_DATA, MOCK_HISTORICAL_BARRIER_LOGS, MOCK_SCAVENGED_PRESSURE_TESTS } from '../constants';
import { calculateLinearRegression, diagnoseSawtooth } from '../forensic_logic/math';
// Added Loader2 to imports from lucide-react
import { 
  Activity, Zap, ShieldCheck, Target, TrendingUp, Cpu, 
  Scan, History, Search, Download, Database, Info, 
  AlertCircle, Droplet, Beaker, FileText, ChevronRight,
  Loader2
} from 'lucide-react';
import { BarrierEvent } from '../types';

const PulseAnalyzer: React.FC = () => {
  const [view, setView] = useState<'LIVE' | 'SCAVENGER'>('LIVE');
  const [scavengeProgress, setScavengeProgress] = useState(0);
  const [isScavenging, setIsScavenging] = useState(false);
  const [showHistoricalOverlay, setShowHistoricalOverlay] = useState(false);
  const [showHistoricalEvents, setShowHistoricalEvents] = useState(false);
  const [showLeakThresholds, setShowLeakThresholds] = useState(false);

  const rechargePhaseData = MOCK_PRESSURE_DATA.slice(0, 4);
  const pressures = rechargePhaseData.map(d => d.pressure);
  
  const analysis = useMemo(() => {
    const { slope, rSquared } = calculateLinearRegression(pressures);
    const diagnosis = diagnoseSawtooth(rSquared, slope);
    return { slope, rSquared, ...diagnosis };
  }, [pressures]);

  const triggerScavenge = () => {
    setIsScavenging(true);
    setScavengeProgress(0);
    const interval = setInterval(() => {
      setScavengeProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScavenging(false);
          return 100;
        }
        return prev + 5;
      });
    }, 80);
  };

  const getEventIcon = (type: BarrierEvent['type']) => {
    switch (type) {
      case 'TOPUP': return <Droplet size={14} className="text-cyan-400" />;
      case 'SQUEEZE': return <Beaker size={14} className="text-purple-400" />;
      case 'TEST': return <ShieldCheck size={14} className="text-[var(--emerald-primary)]" />;
      case 'BREACH': return <AlertCircle size={14} className="text-[var(--alert-red)]" />;
      default: return <Info size={14} className="text-slate-500" />;
    }
  };

  // Map historical events to timestamps for overlay
  const eventTimestamps = ['04:00', '08:00', '12:00', '16:00', '20:00'];
  const mappedEvents = MOCK_HISTORICAL_BARRIER_LOGS.map((event, index) => ({
    ...event,
    timestamp: eventTimestamps[index % eventTimestamps.length]
  }));

  return (
    <div className="flex flex-col h-full bg-[var(--slate-abyssal)]/40 backdrop-blur-md relative overflow-hidden border border-[var(--emerald-primary)]/10 scanline-effect glass-panel cyber-border">
      
      {/* Background HUD Graphics */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <TrendingUp size={200} className="text-[var(--emerald-primary)]" />
      </div>

      <div className="flex justify-between items-center p-4 border-b border-[var(--emerald-primary)]/20 relative z-20 bg-slate-950/60">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[var(--emerald-primary)]/10 border border-[var(--emerald-primary)]/30 rounded shadow-[0_0_15px_rgba(16,185,129,0.1)] glass-panel">
            <Activity size={20} className="text-[var(--emerald-primary)] text-glow-emerald" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--emerald-primary)] font-terminal uppercase tracking-tighter text-glow-emerald">Barrier_Integrity_Pulse</h2>
            <div className="flex items-center space-x-2">
               <span className="text-[8px] text-[var(--emerald-primary)]/40 uppercase tracking-widest font-black">Sawtooth_Scavenger_Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
           <div className="bg-slate-900 border border-[var(--emerald-primary)]/40 p-1 rounded-sm flex space-x-1 glass-panel">
              <button 
                onClick={() => setView('LIVE')}
                className={`px-4 py-1.5 rounded-sm text-[9px] font-black uppercase transition-all ${view === 'LIVE' ? 'bg-[var(--emerald-primary)] text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-[var(--emerald-primary)]/40 hover:text-[var(--emerald-primary)]'}`}
              >
                Live_Monitor
              </button>
              <button 
                onClick={() => setView('SCAVENGER')}
                className={`px-4 py-1.5 rounded-sm text-[9px] font-black uppercase transition-all ${view === 'SCAVENGER' ? 'bg-purple-500 text-slate-950 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-[var(--emerald-primary)]/40 hover:text-purple-400'}`}
              >
                Integrity_Scavenger
              </button>
           </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 relative">
        
        {/* Main Chart Area */}
        <div className="flex-1 p-6 flex flex-col space-y-4">
          <div className="flex-1 bg-slate-950/60 rounded-xl border border-[var(--emerald-primary)]/30 p-6 relative group overflow-hidden glass-panel cyber-border">
             <div className="absolute top-4 left-4 z-20 flex items-center space-x-3">
                <div className="bg-slate-950/90 border border-[var(--emerald-primary)]/50 px-3 py-1.5 rounded flex items-center space-x-2 shadow-2xl glass-panel">
                   <div className="w-1.5 h-1.5 rounded-full bg-[var(--emerald-primary)] animate-pulse shadow-[0_0_8px_var(--emerald-primary)]"></div>
                   <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest">{view === 'LIVE' ? 'ACTIVE_PRESSURE_STREAM' : 'SCAVENGED_OVERLAY'}</span>
                </div>
                {view === 'SCAVENGER' && (
                  <button 
                    onClick={() => setShowHistoricalOverlay(!showHistoricalOverlay)}
                    className={`px-3 py-1.5 rounded border text-[9px] font-black uppercase transition-all glass-panel ${showHistoricalOverlay ? 'bg-purple-500 border-purple-400 text-slate-950' : 'bg-slate-900 border-purple-900/30 text-purple-400'}`}
                  >
                    Overlay_10YR_Ghost
                  </button>
                )}
                <button 
                  onClick={() => setShowHistoricalEvents(!showHistoricalEvents)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded border text-[9px] font-black uppercase transition-all glass-panel ${showHistoricalEvents ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-slate-900 border-cyan-900/30 text-cyan-400 hover:border-cyan-400'}`}
                >
                  <Activity size={12} className={showHistoricalEvents ? 'animate-pulse' : ''} />
                  <span>Overlay_Historical_Events</span>
                </button>
                <button 
                  onClick={() => setShowLeakThresholds(!showLeakThresholds)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded border text-[9px] font-black uppercase transition-all glass-panel ${showLeakThresholds ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-slate-900 border-orange-900/30 text-orange-400 hover:border-orange-400'}`}
                >
                  <AlertCircle size={12} className={showLeakThresholds ? 'animate-pulse' : ''} />
                  <span>Leak_Thresholds</span>
                </button>
             </div>

             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={MOCK_PRESSURE_DATA} margin={{ top: 40, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={view === 'LIVE' ? analysis.color : '#a855f7'} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={view === 'LIVE' ? analysis.color : '#a855f7'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--emerald-primary)" opacity={0.1} />
                  <XAxis dataKey="timestamp" stroke="var(--emerald-primary)" opacity={0.4} fontSize={9} axisLine={{stroke: 'var(--emerald-primary)', opacity: 0.2}} />
                  <YAxis stroke="var(--emerald-primary)" opacity={0.4} fontSize={9} axisLine={{stroke: 'var(--emerald-primary)', opacity: 0.2}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid var(--emerald-primary)', opacity: 0.8, fontSize: '10px' }}
                    itemStyle={{ textTransform: 'uppercase' }}
                  />
                  
                  {/* Historical Ghost Trace */}
                  {showHistoricalOverlay && (
                    <Line 
                      type="monotone" 
                      data={MOCK_SCAVENGED_PRESSURE_TESTS} 
                      dataKey="pressure" 
                      stroke="#a855f7" 
                      strokeWidth={1} 
                      strokeDasharray="4 4" 
                      dot={false}
                      opacity={0.4}
                    />
                  )}

                  <Area 
                    type="monotone" 
                    dataKey="pressure" 
                    stroke={view === 'LIVE' ? analysis.color : '#a855f7'} 
                    fillOpacity={1} 
                    fill="url(#colorPressure)" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#020617', stroke: view === 'LIVE' ? analysis.color : '#a855f7', strokeWidth: 2 }}
                  />

                  {showLeakThresholds && (
                    <>
                      <ReferenceArea y1={0} y2={300} fill="var(--emerald-primary)" fillOpacity={0.05} label={{ value: 'STABLE', position: 'insideLeft', fill: 'var(--emerald-primary)', fontSize: 8, fontWeight: 'bold', opacity: 0.5 }} />
                      <ReferenceArea y1={300} y2={600} fill="#f59e0b" fillOpacity={0.05} label={{ value: 'LEAK_DETECTED', position: 'insideLeft', fill: '#f59e0b', fontSize: 8, fontWeight: 'bold', opacity: 0.5 }} />
                      <ReferenceArea y1={600} y2={1000} fill="var(--alert-red)" fillOpacity={0.05} label={{ value: 'CRITICAL_LEAK', position: 'insideLeft', fill: 'var(--alert-red)', fontSize: 8, fontWeight: 'bold', opacity: 0.5 }} />
                    </>
                  )}

                  <ReferenceLine y={800} stroke="#FF5F1F" strokeDasharray="5 5" label={{ value: 'CRITICAL BLEED', position: 'insideRight', fill: '#FF5F1F', fontSize: 8, fontWeight: 'bold' }} />
                  
                  {/* Historical Events Overlay */}
                  {showHistoricalEvents && mappedEvents.map((event) => (
                    <ReferenceLine 
                      key={event.id}
                      x={event.timestamp} 
                      stroke={event.severity === 'CRITICAL' ? 'var(--alert-red)' : '#06b6d4'} 
                      strokeDasharray="3 3"
                      label={({ viewBox }) => {
                        const { x, y } = viewBox;
                        const color = event.severity === 'CRITICAL' ? 'var(--alert-red)' : '#06b6d4';
                        return (
                          <g className="pointer-events-none">
                            <rect 
                              x={x - 40} 
                              y={y + 10} 
                              width={80} 
                              height={14} 
                              rx={4} 
                              fill={color} 
                              fillOpacity={0.1} 
                              stroke={color} 
                              strokeWidth={0.5} 
                            />
                            <text 
                              x={x} 
                              y={y + 20} 
                              fill={color} 
                              fontSize={7} 
                              fontWeight="black" 
                              textAnchor="middle"
                              className="uppercase tracking-tighter"
                            >
                              {event.type} [{event.annulus}]
                            </text>
                          </g>
                        );
                      }} 
                    />
                  ))}
               </ComposedChart>
             </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-950/80 border border-[var(--emerald-primary)]/30 rounded-xl glass-panel cyber-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-[var(--emerald-primary)]/40 uppercase font-black tracking-widest">Lease_Slope</span>
                  <Activity size={12} className="text-[var(--emerald-primary)]/40" />
                </div>
                <div className="text-2xl font-black text-emerald-100 font-terminal text-glow-emerald">{analysis.slope.toFixed(2)} PSI/U</div>
                <div className="text-[8px] text-[var(--emerald-primary)]/40 mt-1 uppercase font-black tracking-widest">DRIVE_FORCE: {Math.abs(analysis.slope) > 5 ? 'SUSTAINED' : 'RESIDUAL'}</div>
             </div>
             <div className="p-4 bg-slate-950/80 border border-[var(--emerald-primary)]/30 rounded-xl glass-panel cyber-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-[var(--emerald-primary)]/40 uppercase font-black tracking-widest">Integrity_Lock</span>
                  <ShieldCheck size={12} className="text-[var(--emerald-primary)]/40" />
                </div>
                <div className="text-2xl font-black text-emerald-100 font-terminal text-glow-emerald">{(analysis.rSquared * 100).toFixed(1)}%</div>
                <div className="text-[8px] text-[var(--emerald-primary)]/40 mt-1 uppercase font-black tracking-widest">R2_CONCORDANCE: {analysis.rSquared > 0.95 ? 'HIGH' : 'UNSTABLE'}</div>
             </div>
          </div>
        </div>

        {/* Sidebar: Chronology or Diagnostic */}
        <div className="w-96 border-l border-[var(--emerald-primary)]/20 flex flex-col bg-slate-950/40 overflow-hidden glass-panel">
          {view === 'LIVE' ? (
            <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
              <h3 className="text-[12px] font-black text-[var(--emerald-primary)] uppercase tracking-[0.3em] mb-4 text-glow-emerald">Sovereign_Diagnosis</h3>
              <div className="p-5 bg-slate-900/50 border-l-4 rounded-r shadow-xl relative overflow-hidden glass-panel cyber-border" style={{ borderColor: analysis.color }}>
                 <div className="absolute top-0 right-0 p-2 opacity-5"><Cpu size={40} className="text-[var(--emerald-primary)]" /></div>
                 <span className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: analysis.color }}>{analysis.status}</span>
                 <p className="text-[11px] text-emerald-100 font-terminal italic leading-relaxed">"{analysis.diagnosis}"</p>
              </div>

              <div className="space-y-4 pt-6 border-t border-[var(--emerald-primary)]/20">
                  <h4 className="text-[10px] font-black text-[var(--emerald-primary)]/40 uppercase tracking-widest">Leak_Severity_Index</h4>
                  <div className="p-4 bg-slate-950/80 border border-[var(--emerald-primary)]/30 rounded-lg glass-panel cyber-border">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[8px] text-[var(--emerald-primary)]/40 font-black uppercase">Current_Leak_Rate</span>
                      <span className={`text-[10px] font-black ${analysis.slope > 10 ? 'text-[var(--alert-red)]' : 'text-orange-500'}`}>
                        {analysis.slope > 15 ? 'CRITICAL' : 'MODERATE'}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-[var(--emerald-primary)]/20">
                      <div 
                        className={`h-full transition-all duration-1000 ${analysis.slope > 15 ? 'bg-[var(--alert-red)] shadow-[0_0_10px_#ef4444]' : 'bg-orange-500 shadow-[0_0_10px_#f59e0b]'}`} 
                        style={{ width: `${Math.min((analysis.slope / 25) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2 text-[7px] font-black text-[var(--emerald-primary)]/40 uppercase">
                      <span>0 PSI/U</span>
                      <span>25 PSI/U</span>
                    </div>
                  </div>
               </div>

              <div className="space-y-4 pt-6 border-t border-[var(--emerald-primary)]/20">
                 <h4 className="text-[10px] font-black text-[var(--emerald-primary)]/40 uppercase tracking-widest">Active_Alert_Log</h4>
                 <div className="space-y-2">
                    <div className="p-3 bg-slate-950 border border-[var(--emerald-primary)]/30 rounded text-[10px] font-terminal text-emerald-100/60 flex items-center justify-between glass-panel">
                       <span>BLEED_THRESHOLD_EXCEEDED</span>
                       <span className="text-[var(--alert-red)] font-black">@09:12</span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-[var(--emerald-primary)]/30 rounded text-[10px] font-terminal text-emerald-100/60 flex items-center justify-between glass-panel">
                       <span>GRADIENT_STABILIZED</span>
                       <span className="text-[var(--emerald-primary)] font-black">@08:45</span>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col h-full">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[12px] font-black text-purple-400 uppercase tracking-[0.3em]">Integrity_Artifacts</h3>
                  <History size={18} className="text-purple-700" />
               </div>

               <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-6">
                  {MOCK_HISTORICAL_BARRIER_LOGS.map((event) => (
                    <div key={event.id} className={`p-4 rounded-lg border-l-2 bg-slate-900/40 transition-all hover:bg-slate-900 relative group glass-panel cyber-border ${event.severity === 'CRITICAL' ? 'border-[var(--alert-red)] shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-purple-900/50'}`}>
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                             {getEventIcon(event.type)}
                             <span className={`text-[10px] font-black uppercase tracking-widest ${event.severity === 'CRITICAL' ? 'text-[var(--alert-red)]' : 'text-purple-300'}`}>{event.type}</span>
                          </div>
                          <span className="text-[8px] font-mono text-slate-500">{event.date}</span>
                       </div>
                       <p className="text-[10px] text-slate-300 font-terminal leading-relaxed mb-2 opacity-80">{event.summary}</p>
                       <div className="flex items-center justify-between">
                          <span className="text-[8px] text-purple-900 font-black uppercase tracking-widest">ANNULUS: {event.annulus}</span>
                          {event.volume && (
                            <span className="text-[8px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full font-black">{event.volume} {event.unit}</span>
                          )}
                       </div>
                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight size={12} className="text-purple-500" />
                       </div>
                    </div>
                  ))}
               </div>

               <div className="pt-6 border-t border-purple-900/30 space-y-4">
                  <button 
                    onClick={triggerScavenge}
                    disabled={isScavenging}
                    className="w-full py-4 bg-purple-500 text-slate-950 font-black uppercase text-[10px] tracking-[0.3em] rounded shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center space-x-3 group relative overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                     {isScavenging ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                     <span>{isScavenging ? 'Scavenging_Artifacts...' : 'Scavenge NDR for Logs'}</span>
                  </button>
                  
                  {isScavenging && (
                    <div className="h-1 bg-slate-900 rounded-full overflow-hidden border border-purple-900/30">
                       <div className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7]" style={{ width: `${scavengeProgress}%` }}></div>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PulseAnalyzer;
