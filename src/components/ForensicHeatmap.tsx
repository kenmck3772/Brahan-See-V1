import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Flame, Sliders, RefreshCw, ShieldAlert, Cpu, Eye, Info } from 'lucide-react';

interface ForensicHeatmapProps {
  terminalTheme: 'emerald' | 'crimson';
  maxTraumaRating: number;
  addLog: (message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

interface HourData {
  hourIndex: number; // 0 to 23 (0 is T-24H, 23 is current hour)
  label: string;
  scansCount: number;
  peakTrauma: number;
  anomaliesCount: number;
  timestamp: string;
}

export const ForensicHeatmap: React.FC<ForensicHeatmapProps> = ({
  terminalTheme,
  maxTraumaRating,
  addLog
}) => {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'trauma' | 'volume'>('trauma');
  const [anomalyDrift, setAnomalyDrift] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Generate 24 hours of deterministic but responsive data
  const hoursData = useMemo<HourData[]>(() => {
    const data: HourData[] = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const hourIndex = i; // 0 is T-24H, 23 is current hour
      const hoursAgo = 23 - i;
      
      const hourTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
      const timeStr = hourTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const label = hoursAgo === 0 ? 'CURRENT_INTERVAL' : `T-${hoursAgo}H`;

      // Base scans count: 15 to 90 scans per hour
      const baseScans = Math.round(15 + (Math.sin(i * 0.9) * 22) + (Math.cos(i * 1.3) * 12) + (i * 0.8)) % 75 + 15;
      
      // Trauma spikes: 
      let baseTrauma = Math.round((Math.sin(i * 1.5) * 32) + (Math.cos(i * 0.7) * 18) + 40) % 75 + 10;
      
      // Ensure the current hour (23) starts close to the global maximum trauma rating
      if (hoursAgo === 0) {
        baseTrauma = maxTraumaRating;
      } else if (hoursAgo <= 2) {
        // High correlation with current maxTrauma for recent hours
        baseTrauma = Math.max(baseTrauma, Math.round(maxTraumaRating * (1 - hoursAgo * 0.15)));
      }

      // Add historical random "spikes" over the last 24h
      if (i === 4) baseTrauma = 88; // 20 hours ago
      if (i === 11) baseTrauma = 76; // 13 hours ago
      if (i === 17) baseTrauma = 91; // 6 hours ago

      const peakTrauma = Math.min(100, Math.max(0, baseTrauma));

      // Anomalies count based on trauma density
      let anomaliesCount = 0;
      if (peakTrauma > 80) anomaliesCount = Math.floor(Math.random() * 2) + 3; // 3-4
      else if (peakTrauma > 50) anomaliesCount = Math.floor(Math.random() * 2) + 1; // 1-2
      else if (peakTrauma > 25 && baseScans > 50) anomaliesCount = 1;

      data.push({
        hourIndex,
        label,
        scansCount: baseScans,
        peakTrauma,
        anomaliesCount,
        timestamp: timeStr
      });
    }
    return data;
  }, [maxTraumaRating, refreshTrigger]);

  // Periodic automatic drift to make the UI look alive
  useEffect(() => {
    if (!anomalyDrift) return;
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, [anomalyDrift]);

  // Generate random spike incident
  const triggerForensicPeak = () => {
    const randomHour = Math.floor(Math.random() * 23); // spike some historic hour
    setRefreshTrigger(prev => prev + 1);
    const spikeHour = 23 - randomHour;
    addLog(`Neural delta simulated: Historical peak anomaly spike injected at T-${spikeHour}H with 97% fidelity register!`, 'warning');
    setSelectedHour(randomHour);
  };

  const currentSelectionDetails = selectedHour !== null ? hoursData[selectedHour] : null;

  // Determine cell styling helper
  const getCellColor = (item: HourData) => {
    const value = viewMode === 'trauma' ? item.peakTrauma : item.scansCount;
    const maxVal = viewMode === 'trauma' ? 100 : 95;
    const ratio = Math.min(1, Math.max(0, value / maxVal));

    if (terminalTheme === 'crimson') {
      if (ratio === 0) return 'bg-black/80 border-red-500/10';
      if (ratio < 0.2) return 'bg-red-950/20 border-red-900/10 text-red-500/45';
      if (ratio < 0.4) return 'bg-red-900/35 border-red-800/15 text-red-400/65';
      if (ratio < 0.6) return 'bg-red-800/50 border-red-700/25 text-red-300/85';
      if (ratio < 0.8) return 'bg-red-600/70 border-red-500/45 text-red-100 shadow-[0_0_8px_rgba(239,68,68,0.25)]';
      return 'bg-red-500 text-white border-red-400 font-bold shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse';
    } else {
      // Emerald theme
      if (ratio === 0) return 'bg-black/80 border-emerald-500/10';
      if (ratio < 0.2) return 'bg-emerald-950/20 border-emerald-900/10 text-emerald-500/45';
      if (ratio < 0.4) return 'bg-emerald-900/35 border-emerald-800/15 text-emerald-400/65';
      if (ratio < 0.6) return 'bg-emerald-800/50 border-emerald-700/25 text-emerald-300/85';
      if (ratio < 0.8) return 'bg-emerald-600/70 border-emerald-500/45 text-emerald-100 shadow-[0_0_8px_rgba(16,185,129,0.25)]';
      return 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse';
    }
  };

  return (
    <div className="bg-[#020617]/90 border border-emerald-500/20 rounded-md p-4 flex flex-col gap-3.5 scanline-glow relative select-none">
      {/* Decorative top header tag */}
      <div className="absolute top-0 right-4 -translate-y-1/2 bg-black px-2 py-0.5 border border-emerald-500/25 rounded text-[8px] font-mono text-emerald-400 font-black tracking-widest uppercase">
        TEMPORAL_LOG_V3
      </div>

      <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
        <h3 className="font-mono text-emerald-400 text-xs font-bold flex items-center gap-2 glow-text-emerald uppercase tracking-wider">
          <Activity className={`w-4 h-4 ${terminalTheme === 'crimson' ? 'text-red-400 animate-pulse' : 'text-emerald-400 animate-pulse'}`} />
          Forensic Scan Activity Heatmap
        </h3>
        <div className="flex items-center gap-1.5 font-mono">
          <button
            type="button"
            onClick={() => setAnomalyDrift(!anomalyDrift)}
            title="Toggle micro-fluctuating telemetry simulation"
            className={`p-1 rounded border transition-all duration-150 cursor-pointer flex items-center justify-center ${
              anomalyDrift 
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                : 'bg-black/40 text-emerald-500/30 border-emerald-500/10 hover:border-emerald-500/20'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${anomalyDrift ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
          </button>
        </div>
      </div>

      <p className="font-mono text-[9px] text-zinc-400 leading-relaxed -mt-1 select-text">
        Real-time temporal registry tracking audit cycles, high-risk trauma spikes, and mechanical integrity scans across 24 rolling interval blocks.
      </p>

      {/* Grid View Mode Selectors */}
      <div className="grid grid-cols-2 gap-1.5 bg-black/55 p-1 rounded border border-emerald-500/10 font-mono text-[9px] font-black uppercase">
        <button
          type="button"
          onClick={() => {
            setViewMode('trauma');
            addLog('Forensic matrix view: trauma distress spikes index.', 'info');
          }}
          className={`py-1 rounded text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
            viewMode === 'trauma'
              ? terminalTheme === 'crimson'
                ? 'bg-red-500/15 border border-red-500/30 text-red-400 font-bold'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold'
              : 'bg-transparent border border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Flame className="w-3 h-3 flex-shrink-0" />
          Trauma Spikes
        </button>
        <button
          type="button"
          onClick={() => {
            setViewMode('volume');
            addLog('Forensic matrix view: scanning iteration density.', 'info');
          }}
          className={`py-1 rounded text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
            viewMode === 'volume'
              ? terminalTheme === 'crimson'
                ? 'bg-red-500/15 border border-red-500/30 text-red-400 font-bold'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold'
              : 'bg-transparent border border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Cpu className="w-3 h-3 flex-shrink-0" />
          Sweep Volume
        </button>
      </div>

      {/* Heatmap Grid Matrix (24 cells total) */}
      <div className="flex flex-col gap-1 bg-black/45 p-2 rounded border border-emerald-500/15" id="heatmap-grid-container">
        <div className="grid grid-cols-6 gap-1.5" id="temporal-heatmap-matrix">
          {hoursData.map((item, idx) => {
            const isSelected = selectedHour === idx;
            const cellClass = getCellColor(item);
            
            return (
              <div
                key={item.hourIndex}
                onClick={() => setSelectedHour(isSelected ? null : idx)}
                className={`aspect-square rounded border cursor-pointer flex flex-col items-center justify-center relative group transition-all duration-300 select-none ${cellClass} ${
                  isSelected ? 'ring-2 ring-cyan-400 scale-[1.08] z-10 border-cyan-400' : 'hover:scale-[1.04]'
                }`}
                style={{
                  '--glow-color': terminalTheme === 'crimson' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'
                } as React.CSSProperties}
              >
                <span className="text-[7.5px] font-mono leading-none tracking-tighter opacity-80 uppercase select-none">
                  {item.label === 'CURRENT_INTERVAL' ? 'NOW' : `${23 - idx}H`}
                </span>
                <span className="text-[8.5px] font-mono font-black leading-none mt-1 select-none">
                  {viewMode === 'trauma' ? `${item.peakTrauma}%` : item.scansCount}
                </span>

                {item.peakTrauma > 75 && (
                  <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-red-500 animate-ping" />
                )}
                
                {/* Embedded HTML CSS Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-950 border border-emerald-500/40 text-[9.5px] text-white p-2.5 rounded shadow-2xl z-[150] min-w-[155px] pointer-events-none font-mono">
                  <div className="border-b border-emerald-500/25 pb-1 mb-1 font-bold text-[10px] text-emerald-400 flex justify-between items-center bg-black/40 px-1 py-0.5 rounded">
                    <span>{item.label}</span>
                    <span className="text-zinc-400 text-[8.5px]">{item.timestamp}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">MAX TRAUMA RATE:</span>
                      <span className={item.peakTrauma > 70 ? 'text-red-400 font-black' : 'text-emerald-400 font-bold'}>
                        {item.peakTrauma}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">SECTOR SWIPES:</span>
                      <span className="text-white font-bold">{item.scansCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">MUTATIONS FLAGGED:</span>
                      <span className="text-amber-400 font-bold">{item.anomaliesCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dense legend status visualizer */}
        <div className="flex justify-between items-center text-[7.5px] font-mono text-zinc-500 mt-2.5 px-0.5 border-t border-emerald-500/5 pt-1.5 select-none uppercase">
          <span>T-24H Delta</span>
          <div className="flex items-center gap-1 font-semibold">
            <span>Scan Weight:</span>
            <span className="w-1.5 h-1.5 bg-black border border-emerald-500/25 rounded" />
            <span className="w-1.5 h-1.5 bg-emerald-950/40 border border-emerald-500/10 rounded" />
            <span className="w-1.5 h-1.5 bg-emerald-800/50 border border-emerald-500/20 rounded" />
            <span className="w-1.5 h-1.5 bg-emerald-600/70 border border-emerald-500/30 rounded" />
            <span className="w-1.5 h-1.5 bg-emerald-500 border border-emerald-400 rounded animate-pulse" />
            <span className="text-[7px]">High Alert</span>
          </div>
          <span>Active Tick</span>
        </div>
      </div>

      {/* Selected Hour Telemetry Detail Window */}
      <div className="min-h-[105px] bg-[#01040f]/60 backdrop-blur-sm rounded border border-emerald-500/10 p-3 font-mono text-[10px] relative select-text">
        {currentSelectionDetails ? (
          <div className="flex flex-col gap-1.5 animate-[fadeIn_0.15s_ease-out]">
            <div className="flex items-center justify-between border-b border-emerald-500/10 pb-1.5 select-none">
              <span className="font-extrabold text-cyan-400 flex items-center gap-1 uppercase text-[9px] tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                INTELLIGENCE PROFILE: {currentSelectionDetails.label}
              </span>
              <span className="text-zinc-500 text-[8px] font-bold">INTERVAL SCORE {currentSelectionDetails.timestamp}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-zinc-300 mt-0.5 select-none font-sans">
              <div className="bg-slate-950/50 border border-emerald-500/5 p-1 rounded flex flex-col justify-center">
                <span className="text-[7.5px] text-zinc-500 font-mono uppercase tracking-wider">Peak Distort</span>
                <span className={`text-base font-black mt-0.5 ${
                  currentSelectionDetails.peakTrauma > 70 
                    ? 'text-red-400 font-black' 
                    : currentSelectionDetails.peakTrauma > 40 
                      ? 'text-amber-400' 
                      : 'text-emerald-400'
                }`}>
                  {currentSelectionDetails.peakTrauma}%
                </span>
              </div>
              <div className="bg-slate-950/50 border border-emerald-500/5 p-1 rounded flex flex-col justify-center">
                <span className="text-[7.5px] text-zinc-500 font-mono uppercase tracking-wider">Scans Outpace</span>
                <span className="text-base font-black text-white mt-0.5">{currentSelectionDetails.scansCount}</span>
              </div>
              <div className="bg-slate-950/50 border border-emerald-500/5 p-1 rounded flex flex-col justify-center">
                <span className="text-[7.5px] text-zinc-500 font-mono uppercase tracking-wider">Anomalies</span>
                <span className={`text-base font-black mt-0.5 ${
                  currentSelectionDetails.anomaliesCount > 0 ? 'text-red-400 animate-pulse font-black' : 'text-zinc-500'
                }`}>
                  {currentSelectionDetails.anomaliesCount} F
                </span>
              </div>
            </div>

            <div className="text-[9.5px] leading-relaxed text-zinc-400 border-t border-emerald-500/5 pt-1.5 mt-0.5 flex gap-1.5 items-start">
              <Info className="w-3.5 h-3.5 text-emerald-500/50 flex-shrink-0 mt-0.5" />
              <span>
                {currentSelectionDetails.peakTrauma > 75 
                  ? `ALERT: Forensic sweep detected critical distortion rate levels peak. High-threat vector verified.`
                  : currentSelectionDetails.peakTrauma > 40
                    ? `WARNING: High-level alignment scanning indicates elevated trauma index density in targeted directories.`
                    : `NOMINAL: Scan cycles processed successfully with standard forensic thresholds. File structure aligns with telemetry baseline.`
                }
              </span>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 select-none opacity-80">
            <span className="text-[9px] text-emerald-500/50 uppercase tracking-widest font-black flex items-center gap-1 justify-center">
              <Eye className="w-3 h-3 text-emerald-500/40 animate-pulse" />
              INSPECT HEATMAP CELLS
            </span>
            <span className="text-[8.5px] text-zinc-500 mt-1.5 select-none leading-normal">
              Click any individual hour block in the 24H matrix above to query full forensic telemetry registers.
            </span>
          </div>
        )}
      </div>

      {/* Exogenous Drift Simulator controls */}
      <div className="border border-red-500/10 hover:border-red-500/20 bg-red-950/5 p-2 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-none transition-all duration-150">
        <div className="flex flex-col font-mono text-[9px]">
          <span className="text-red-400 font-black flex items-center gap-1 uppercase leading-none">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            FORENSIC DISRUPTION DRIVER
          </span>
          <span className="text-zinc-500 mt-1 font-medium leading-normal">
            Simulate historical telemetry trauma spikes in the 24-hour log
          </span>
        </div>
        <button
          type="button"
          onClick={triggerForensicPeak}
          className="bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 hover:border-red-400 text-red-400 hover:text-red-300 transition-colors font-mono text-[8px] font-black uppercase px-2.5 py-1.5 rounded cursor-pointer flex-shrink-0 text-center select-none"
        >
          Spike Scan History
        </button>
      </div>
    </div>
  );
};
