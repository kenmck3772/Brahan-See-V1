import React, { useState } from 'react';
import { Map as MapIcon, AlertTriangle, Crosshair, Target, Info, ShieldCheck, ArrowRightLeft, Compass } from 'lucide-react';
import ProvenanceTooltip from './ProvenanceTooltip';
import { MOCK_WELLS } from '../constants';
import { ForensicWell } from '../types';

interface ForensicDeltaMapProps {
  highlightedField?: string | null;
  userLocation?: { lat: number; lon: number; error?: string } | null;
  onSelectWell?: (wellId: string) => void;
  selectedWellId?: string | null;
}

const ForensicDeltaMap: React.FC<ForensicDeltaMapProps> = ({ highlightedField, userLocation, onSelectWell, selectedWellId: externalSelectedWellId }) => {
  const [internalSelectedWell, setInternalSelectedWell] = useState<string | null>(null);
  const [showOffsets, setShowOffsets] = useState(true);

  const selectedWell = externalSelectedWellId || internalSelectedWell;

  const handleWellClick = (wellId: string) => {
    setInternalSelectedWell(wellId);
    if (onSelectWell) {
      onSelectWell(wellId);
    }
  };

  return (
    <div className="h-[500px] bg-[#0b1120] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500 glass-panel cyber-border">
      <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between z-10 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <MapIcon size={16} className="text-fuchsia-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Forensic Geolocation Audit</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowOffsets(!showOffsets)}
            className={`flex items-center space-x-2 text-[8px] font-black px-3 py-1.5 rounded-lg border transition-all duration-300 ${
              showOffsets 
                ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.2)]' 
                : 'bg-slate-800 text-slate-500 border-slate-700 grayscale'
            }`}
          >
            <ArrowRightLeft size={12} className={showOffsets ? 'animate-pulse' : ''} />
            <span>{showOffsets ? 'HIDE_TRUTH_OFFSETS' : 'SHOW_TRUTH_OFFSETS'}</span>
          </button>
          <span className="text-[8px] font-black px-2 py-1 bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30 rounded flex items-center">
            <AlertTriangle size={10} className="mr-1" /> Slot Drift Detected
          </span>
        </div>
      </div>
      
      {/* Map Background Simulation */}
      <div className="flex-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 relative overflow-hidden bg-slate-950">
        {/* Grid lines */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(30, 41, 59, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 41, 59, 0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Mock Map Features */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="M 200 0 C 300 200, 100 400, 400 600 S 800 800, 1000 1000" fill="none" stroke="#334155" strokeWidth="2" />
          <path d="M 0 300 C 200 300, 400 100, 600 400 S 800 600, 1000 500" fill="none" stroke="#334155" strokeWidth="2" />
        </svg>

        {/* Well Markers */}
        <div className="absolute inset-0 p-8">
          {MOCK_WELLS.map((well: ForensicWell, idx: number) => {
            // Simulation coordinates
            const baseTop = 20 + (idx * 25);
            const baseLeft = 30 + (idx * 20);
            
            // Offset simulation (scaled for visibility)
            const offsetTop = (well.actualLat - well.reportedLat) * 1000;
            const offsetLeft = (well.actualLon - well.reportedLon) * 1000;
            
            const isSelected = selectedWell === well.id;
            const isHighlighted = highlightedField && well.field.toUpperCase() === highlightedField.toUpperCase();
            const isConflict = well.status !== 'nominal';
            
            return (
              <div key={well.id} className={`absolute transition-all duration-1000 ${isHighlighted ? 'z-50' : 'z-10'}`} style={{ top: `${baseTop}%`, left: `${baseLeft}%` }}>
                {/* Highlight Ring */}
                {isHighlighted && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-emerald-500/30 bg-emerald-500/5 animate-pulse -z-50"></div>
                )}
                
                {/* Offset Line */}
                {showOffsets && (
                  <svg className="absolute overflow-visible pointer-events-none" style={{ top: 0, left: 0 }}>
                    <line 
                      x1="0" y1="0" 
                      x2={offsetLeft} y2={-offsetTop} 
                      stroke={well.status === 'critical' ? '#ef4444' : '#d946ef'} 
                      strokeWidth="1" 
                      strokeDasharray="2 2"
                      className="animate-pulse"
                    />
                  </svg>
                )}

                {/* Reported Location (NSTA) */}
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                  onClick={() => handleWellClick(well.id)}
                >
                  <div className={`w-3 h-3 rounded-full border border-slate-500 bg-slate-800 flex items-center justify-center ${isSelected ? 'scale-125 border-white' : ''}`}>
                    <Crosshair size={8} className="text-slate-400" />
                  </div>
                  {!isSelected && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[6px] font-mono bg-slate-900 px-1 rounded text-slate-500">REPORTED</span>
                    </div>
                  )}
                </div>

                {/* Actual Location (WellTegra Forensic) */}
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                  style={{ top: `${-offsetTop}px`, left: `${offsetLeft}px` }}
                  onClick={() => handleWellClick(well.id)}
                >
                  {/* Highlight Label */}
                  {isHighlighted && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest animate-bounce shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                      Mission_Target
                    </div>
                  )}

                  {/* Heatmap Glow */}
                  {isConflict && (
                    <div className={`absolute inset-0 rounded-full blur-xl -z-10 transition-all duration-1000 ${well.status === 'critical' ? 'bg-red-500/40 w-24 h-24 -left-12 -top-12' : 'bg-fuchsia-500/30 w-16 h-16 -left-8 -top-8 animate-pulse'}`}></div>
                  )}
                  
                  <div className={`relative w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'scale-150' : 'group-hover:scale-125'} ${well.status === 'critical' ? 'bg-red-500 border-red-300' : well.status === 'conflict' ? 'bg-fuchsia-500 border-fuchsia-300' : 'bg-emerald-500 border-emerald-300'}`}>
                    <Target size={10} className="text-white" />
                    {isSelected && <div className="absolute inset-0 rounded-full border border-white animate-ping"></div>}
                  </div>
                  
                  {/* Label */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-slate-950/90 border shadow-xl ${well.status === 'critical' ? 'text-red-400 border-red-500/50' : well.status === 'conflict' ? 'text-fuchsia-400 border-fuchsia-500/50' : 'text-emerald-400 border-emerald-500/50'}`}>
                      {well.id}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* User Location (Harvester Position) */}
          {userLocation && !userLocation.error && (
            <div className="absolute transition-all duration-1000 z-[60]" style={{ top: '50%', left: '50%' }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-blue-500/10 bg-blue-500/5 animate-pulse -z-50"></div>
              <div className="relative w-5 h-5 rounded-full bg-blue-500 border-2 border-blue-300 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)]">
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(59,130,246,0.4)]">
                  Harvester_Pos
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Geolocation Status Bar */}
        <div className="absolute bottom-4 left-40 z-20 flex items-center space-x-3 bg-slate-950/90 border border-slate-800 p-2 rounded-lg glass-panel shadow-2xl">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${userLocation?.error ? 'bg-red-500 animate-pulse' : userLocation ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-slate-700'}`}></div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Harvester_GPS:</span>
          </div>
          <div className="flex items-center space-x-4">
            {userLocation?.error ? (
              <span className="text-[8px] font-mono text-red-400 uppercase">{userLocation.error}</span>
            ) : userLocation ? (
              <>
                <div className="flex flex-col">
                  <span className="text-[7px] text-slate-500 font-bold uppercase">LAT</span>
                  <span className="text-[9px] font-mono text-blue-400">{userLocation.lat.toFixed(6)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] text-slate-500 font-bold uppercase">LON</span>
                  <span className="text-[9px] font-mono text-blue-400">{userLocation.lon.toFixed(6)}</span>
                </div>
              </>
            ) : (
              <span className="text-[8px] font-mono text-slate-600 uppercase">Awaiting_Signal...</span>
            )}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedWell && (
        <div className="absolute bottom-4 right-4 w-80 bg-slate-950/98 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-8 duration-300 z-30 overflow-hidden cyber-border">
          {MOCK_WELLS.filter((w: ForensicWell) => w.id === selectedWell).map((well: ForensicWell) => {
            const latDiff = Math.abs(well.actualLat - well.reportedLat);
            const lonDiff = Math.abs(well.actualLon - well.reportedLon);
            const driftMeters = Math.sqrt(latDiff**2 + lonDiff**2) * 111320; // Rough conversion to meters
            
            return (
              <div key={well.id} className="flex flex-col">
                <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-black text-white font-mono flex items-center">
                      {well.id}
                      <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{well.field}</span>
                    </h4>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest">Forensic Geolocation Audit</span>
                  </div>
                  <button onClick={() => setInternalSelectedWell(null)} className="text-slate-500 hover:text-white p-1">×</button>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Truth Levels */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
                      <div className="flex items-center space-x-1 mb-1">
                        <Info size={10} className="text-slate-500" />
                        <span className="text-[7px] font-black text-slate-500 uppercase">Public_Report</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-300">
                        {well.reportedLat.toFixed(3)}N / {well.reportedLon.toFixed(3)}E
                      </div>
                    </div>
                    <div className="p-2 bg-emerald-500/5 rounded border border-emerald-500/20">
                      <div className="flex items-center space-x-1 mb-1">
                        <ShieldCheck size={10} className="text-emerald-500" />
                        <span className="text-[7px] font-black text-emerald-500 uppercase">Forensic_Truth</span>
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 font-bold">
                        {well.actualLat.toFixed(3)}N / {well.actualLon.toFixed(3)}E
                      </div>
                    </div>
                  </div>

                  {/* Slot Drift */}
                  <div className={`p-3 rounded-lg border ${well.status === 'nominal' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${well.status === 'nominal' ? 'text-emerald-500' : 'text-red-500'}`}>
                        Slot_Offset_Drift
                      </span>
                      <span className={`text-sm font-mono font-bold ${well.status === 'nominal' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {driftMeters.toFixed(1)}m
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1 mt-2 overflow-hidden">
                      <div className={`h-full ${well.status === 'nominal' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (driftMeters / 2000) * 100)}%` }}></div>
                    </div>
                    <div className="text-right mt-1">
                      <span className={`text-[8px] font-mono ${well.status === 'nominal' ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                        {well.status === 'nominal' ? 'WITHIN_TOLERANCE' : 'CRITICAL_DISCORDANCE'}
                      </span>
                    </div>
                  </div>

                  {/* Production Delta (Existing) */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">Reported Prod</span>
                      <span className="text-[10px] font-mono text-slate-300">{well.reportedProd.toLocaleString()} bbl/d</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-emerald-500 uppercase tracking-wider font-bold">Audited Prod</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">{well.auditedProd.toLocaleString()} bbl/d</span>
                    </div>
                  </div>

                  {/* Forensic Integrity Score */}
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[7px] font-black text-slate-500 uppercase block">Forensic_Integrity</span>
                      <span className={`text-xs font-black ${well.status === 'nominal' ? 'text-emerald-500' : well.status === 'conflict' ? 'text-yellow-500' : 'text-red-500'}`}>
                        {well.status === 'nominal' ? '98.2%' : well.status === 'conflict' ? '74.5%' : '32.1%'}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((i: number) => (
                        <div key={i} className={`w-1.5 h-3 rounded-sm ${i <= (well.status === 'nominal' ? 5 : well.status === 'conflict' ? 3 : 1) ? (well.status === 'nominal' ? 'bg-emerald-500' : well.status === 'conflict' ? 'bg-yellow-500' : 'bg-red-500') : 'bg-slate-800'}`}></div>
                      ))}
                    </div>
                  </div>

                  {/* Deviation & Forensic Notes */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div className="flex items-start space-x-3">
                      <Compass size={14} className="text-fuchsia-500 mt-0.5" />
                      <div>
                        <span className="text-[8px] font-black text-slate-500 uppercase block">Deviation_Audit</span>
                        <span className="text-[10px] font-terminal text-fuchsia-300">{well.deviationAudit}</span>
                      </div>
                    </div>
                    <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                      <span className="text-[7px] font-black text-slate-600 uppercase block mb-1">Forensic_Note // {well.lastAudit}</span>
                      <p className="text-[9px] text-slate-400 leading-relaxed italic">"{well.forensicNote}"</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 p-2 bg-slate-950/80 border border-slate-800 rounded-lg backdrop-blur-sm z-10 flex space-x-4">
        <div className="flex items-center space-x-1.5">
          <Crosshair size={10} className="text-slate-500" />
          <span className="text-[8px] font-black text-slate-400 uppercase">Reported</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Target size={10} className="text-emerald-500" />
          <span className="text-[8px] font-black text-emerald-400 uppercase">Forensic</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-0.5 border-t border-dashed border-fuchsia-500"></div>
          <span className="text-[8px] font-black text-fuchsia-400 uppercase">Drift</span>
        </div>
      </div>
    </div>
  );
};

export default ForensicDeltaMap;
