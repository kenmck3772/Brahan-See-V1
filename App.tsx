
import React, { useState, useEffect } from 'react';
import { 
  Activity, Database, ShieldAlert, Cpu, Wifi, 
  Settings2, Power, Fingerprint, Menu, 
  Map as MapIcon, Layers, Zap, Flame, Compass, 
  Radar, Target, ShieldCheck, AlertCircle, Loader2,
  Search, BarChart3,
  Ghost, Box, FileSearch, Lock, Anchor, Globe, Beaker, BookOpen, Scale, Terminal // NEW ICONS
} from 'lucide-react';
import SovereignStage from './components/SovereignStage';

const App: React.FC = () => {
  const [uptime, setUptime] = useState("00:00:00");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // New state for sidebar toggle
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; error?: string } | null>(null);
  const [engagedModules, setEngagedModules] = useState<Record<string, boolean>>({
    missionControl: false,
    ghostSync: false,
    traumaNode: false,
    pulseAnalyzer: false,
    reportsScanner: false,
    vault: false,
    legacyRecovery: false,
    norwaySovereign: false,
    chanonryProtocol: false,
    protocolManual: false,
    ndrModernization: false,
    cerberusSimulator: false,
    weteForensicScanner: false,
    ndrCrawler: true, // NDRCrawler enabled by default as per test flow
    sovereignTerminal: false,
    forensicDeltaMap: false,
    forensicDeltaSummary: false,
    timeTravelSlider: false,
  });

  // Session Persistence: Load modules on mount
  useEffect(() => {
    const saved = localStorage.getItem('WELL_TEGRA_ENGAGED_MODULES');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          setEngagedModules(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.warn('[App:Persistence] Failed to restore engaged modules:', e);
      }
    }
  }, []);

  // Session Persistence: Save modules on change
  useEffect(() => {
    localStorage.setItem('WELL_TEGRA_ENGAGED_MODULES', JSON.stringify(engagedModules));
  }, [engagedModules]);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: 0, lon: 0, error: "Geolocation not supported" });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        setUserLocation({ lat: 0, lon: 0, error: error.message });
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const toggleModule = (id: string) => {
    setEngagedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const moduleDefinitions = [
    { id: 'missionControl', label: 'Mission Control', icon: <Radar size={16} />, desc: 'Global Mission Hub' },
    { id: 'ghostSync', label: 'Ghost Sync Engine', icon: <Ghost size={16} />, desc: 'Datum Correlation Array' },
    { id: 'traumaNode', label: 'Trauma Node', icon: <Activity size={16} />, desc: '3D Structural Autopsy' },
    { id: 'pulseAnalyzer', label: 'Pulse Analyzer', icon: <Zap size={16} />, desc: 'Sawtooth Pressure Scavenger' },
    { id: 'reportsScanner', label: 'Reports Scanner', icon: <FileSearch size={16} />, desc: 'DDR Tally Audit' },
    { id: 'vault', label: 'Sovereign Vault', icon: <Lock size={16} />, desc: 'Truth-Rights & Records' },
    { id: 'legacyRecovery', label: 'Legacy Recovery', icon: <Anchor size={16} />, desc: 'Offshore Pay Recovery' },
    { id: 'norwaySovereign', label: 'Norway Sovereign', icon: <Globe size={16} />, desc: 'NPD Factpages Uplink' },
    { id: 'chanonryProtocol', label: 'Chanonry Protocol', icon: <Beaker size={16} />, desc: 'Asphaltene Stability Logic' },
    { id: 'protocolManual', label: 'Protocol Manual', icon: <BookOpen size={16} />, desc: 'Authorized Instructions' },
    { id: 'ndrModernization', label: 'NDR Modernization', icon: <Database size={16} />, desc: 'Forensic Modernization' },
    { id: 'cerberusSimulator', label: 'Cerberus Simulator', icon: <ShieldCheck size={16} />, desc: 'Tri-Head Survival Engine' },
    { id: 'weteForensicScanner', label: 'WETE Scanner', icon: <Scale size={16} />, desc: 'Fact Science Reconciliation' },
    { id: 'ndrCrawler', label: 'Local Data Importer', icon: <Search size={16} />, desc: 'Import .LAS / .CSV Files' },
    { id: 'sovereignTerminal', label: 'Sovereign Terminal', icon: <Terminal size={16} />, desc: 'Brahan Personal Terminal' },
    { id: 'forensicDeltaMap', label: 'Forensic Delta Map', icon: <MapIcon size={16} />, desc: 'Public vs Forensic Truth' },
    { id: 'forensicDeltaSummary', label: 'Forensic Delta Summary', icon: <BarChart3 size={16} />, desc: 'Report vs Real-Time Audit' },
    { id: 'timeTravelSlider', label: 'Time-Travel Slider', icon: <Activity size={16} />, desc: 'Temporal State Manager' },
  ];

  // Derived system health: Nominal if all active modules are healthy.
  // For demo purposes, we'll assume modules are healthy unless they are 'traumaNode' and 'pulseAnalyzer' simultaneously (conflict)
  const isSystemHealthy = !(engagedModules.traumaNode && engagedModules.pulseAnalyzer);

  return (
    <div className="flex flex-col h-screen bg-[var(--slate-abyssal)] text-slate-300 font-sans overflow-hidden select-none">
      
      {/* Sovereign Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--emerald-primary)]/20 glass-panel z-[100] relative shadow-[0_4px_30px_rgba(0,0,0,0.7)] group/header">
        <div className="flex items-center space-x-6">
          {/* Sidebar toggle button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-400 hover:text-[var(--emerald-primary)] transition-all duration-300 border border-slate-800 rounded hover:border-[var(--emerald-primary)]/50 hover:bg-[var(--emerald-primary)]/5 group"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} className="group-hover:scale-110 transition-transform" />
          </button>

          <div className="flex items-center space-x-3 group-hover/header:translate-x-1 transition-transform">
             <div className="p-1 bg-[var(--sovereign-gold)]/10 rounded border border-[var(--sovereign-gold)]/30 flex items-center justify-center w-10 h-10 overflow-hidden shadow-[0_0_15px_rgba(234,179,8,0.2)] cyber-border group-hover/header:shadow-[0_0_25px_rgba(234,179,8,0.4)] transition-all">
                <img src="/well-tegra-logo.jpg" alt="Well-Tegra Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                <Fingerprint size={20} className="text-[var(--sovereign-gold)] hidden" />
             </div>
             <div className="flex flex-col">
               <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white text-glow-emerald group-hover/header:tracking-[0.35em] transition-all">Well-Tegra [WETE]</span>
               <span className="text-[9px] font-bold text-[var(--sovereign-gold)] uppercase tracking-widest text-glow-gold">Sovereign Audit Terminal // NSTA NDR API</span>
             </div>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className="hidden xl:flex items-center space-x-6 text-[10px] font-bold text-slate-400 uppercase font-terminal">
            <span className="flex items-center"><Cpu size={14} className="mr-2 text-[var(--emerald-primary)] animate-pulse" /> Uptime: {uptime}</span>
            <span className="flex items-center text-[var(--emerald-primary)] text-glow-emerald"><Wifi size={14} className="mr-2" /> Connection: Verified</span>
          </div>
          <div className="h-8 w-px bg-slate-800/50"></div>
          <button className="p-2 text-[var(--alert-red)]/60 hover:text-[var(--alert-red)] transition-all duration-300 border border-[var(--alert-red)]/20 rounded hover:bg-[var(--alert-red)]/10 hover:border-[var(--alert-red)]/50 group relative overflow-hidden">
            <div className="absolute inset-0 bg-[var(--alert-red)]/0 group-hover:bg-[var(--alert-red)]/5 transition-colors"></div>
            <Power size={18} className="group-hover:scale-110 group-hover:rotate-12 transition-transform relative z-10" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Global Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(var(--emerald-primary) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        {/* Engagement Sidebar */}
        <aside className={`flex-shrink-0 ${isSidebarOpen ? 'w-72' : 'w-16'} border-r border-[var(--emerald-primary)]/10 glass-panel flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out relative group/sidebar`}>
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--emerald-primary)]/5 to-transparent opacity-0 group-hover/sidebar:opacity-100 transition-opacity pointer-events-none"></div>
          <div className={`p-6 border-b border-[var(--emerald-primary)]/10 bg-[var(--slate-abyssal)]/30 relative z-10 ${!isSidebarOpen ? 'hidden' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-3">
                <Layers size={18} className="text-[var(--sovereign-gold)] animate-pulse" />
                <span className="font-black uppercase tracking-widest text-white text-[11px] text-glow-gold">Active Modules</span>
              </div>
              <button 
                onClick={() => setEngagedModules(Object.keys(engagedModules).reduce((acc, key) => ({ ...acc, [key]: false }), {}))}
                className="text-[9px] font-bold text-slate-400 hover:text-[var(--alert-red)] uppercase tracking-widest transition-all px-2 py-1 border border-slate-800 hover:border-[var(--alert-red)]/30 rounded bg-slate-900/50 hover:bg-[var(--alert-red)]/5"
              >
                Clear All
              </button>
            </div>
            <span className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">Physical Engagement Switches</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative z-10">
            {moduleDefinitions.map((mod) => (
              <div 
                key={mod.id} 
                onClick={() => toggleModule(mod.id)}
                className={`p-4 border rounded-xl transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                  engagedModules[mod.id] 
                    ? 'bg-[var(--emerald-primary)]/10 border-[var(--emerald-primary)]/50 shadow-[0_0_20px_rgba(34,197,94,0.15)] cyber-border scale-[1.02]' 
                    : 'bg-slate-900/40 border-slate-800/50 hover:border-[var(--emerald-primary)]/30 hover:bg-slate-900/60 hover:scale-[1.01]'
                }`}
                data-testid={`module-toggle-${mod.id}`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg transition-all duration-300 ${engagedModules[mod.id] ? 'bg-[var(--emerald-primary)] text-slate-950 shadow-[0_0_15px_var(--emerald-primary)]' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'}`}>
                      {mod.icon}
                    </div>
                    {isSidebarOpen && (
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-tight transition-colors ${engagedModules[mod.id] ? 'text-white text-glow-emerald' : 'text-slate-500 group-hover:text-slate-400'}`}>
                          {mod.label}
                        </span>
                        <span className="text-[8px] font-bold text-slate-600 uppercase font-terminal">{mod.desc}</span>
                      </div>
                    )}
                  </div>
                  
                  {isSidebarOpen ? (
                    <div className={`w-8 h-4 rounded-full relative transition-colors duration-500 ${engagedModules[mod.id] ? 'bg-[var(--emerald-primary)]' : 'bg-slate-800'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 ${engagedModules[mod.id] ? 'left-4.5' : 'left-0.5'}`}></div>
                    </div>
                  ) : (
                    engagedModules[mod.id] && (
                      <div className="absolute top-1/2 right-1 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--emerald-primary)] shadow-[0_0_8px_var(--emerald-primary)]"></div>
                    )
                  )}
                </div>
                {engagedModules[mod.id] && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--emerald-primary)]/10 to-transparent pointer-events-none scanline-effect"></div>
                )}
              </div>
            ))}
          </div>

          <div className={`p-6 glass-panel border-t border-[var(--emerald-primary)]/10 relative z-10 ${!isSidebarOpen ? 'hidden' : ''}`}>
             <div className="flex items-center justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest mb-4">
                <span>System Health</span>
                <span className={isSystemHealthy ? "text-[var(--emerald-primary)] text-glow-emerald" : "text-[var(--alert-red)] text-glow-red animate-pulse"}>
                  {isSystemHealthy ? "98% Nominal" : "Critical Alert"}
                </span>
             </div>
             <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full transition-all duration-500 ${isSystemHealthy ? 'bg-[var(--emerald-primary)] w-[98%] shadow-[0_0_10px_var(--emerald-primary)]' : 'bg-[var(--alert-red)] w-[40%] shadow-[0_0_15px_var(--alert-red)]'}`}></div>
             </div>
          </div>
        </aside>

        {/* Main Stage Grid */}
        <div className="flex-1 relative bg-[var(--slate-abyssal)] overflow-hidden scanline-effect">
          <div className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar z-10">
             <SovereignStage 
               engagedModules={engagedModules} 
               selectedTargetId={selectedTargetId}
               userLocation={userLocation}
               onSelectTarget={(target) => setSelectedTargetId(target.ASSET)}
             />
          </div>
          
          {/* Subtle Scanning Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-10 border-[20px] border-[var(--emerald-primary)]/5 mix-blend-overlay z-20"></div>
          
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[var(--emerald-primary)]/40 pointer-events-none z-30"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[var(--emerald-primary)]/40 pointer-events-none z-30"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[var(--emerald-primary)]/40 pointer-events-none z-30"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[var(--emerald-primary)]/40 pointer-events-none z-30"></div>
        </div>
      </main>

      {/* Persistent Taskbar */}
      <footer className="h-14 border-t border-[var(--emerald-primary)]/20 glass-panel flex items-center justify-between px-6 z-[100] relative shadow-[0_-10px_40px_rgba(0,0,0,0.7)]">
        <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar max-w-[70%] py-2">
          <div className="flex items-center space-x-2 border-r border-slate-800/50 pr-4 mr-2 flex-shrink-0">
            <Layers size={14} className="text-slate-600" />
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Active_Array</span>
          </div>
          
          {moduleDefinitions.filter(m => engagedModules[m.id]).map(m => (
            <div key={m.id} className="flex items-center space-x-3 px-3 py-1.5 bg-slate-900/60 border border-[var(--emerald-primary)]/20 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-300 flex-shrink-0 hover:border-[var(--emerald-primary)]/50 transition-all hover:bg-slate-900/80 group">
              <div className="text-[var(--emerald-primary)] group-hover:scale-110 transition-transform">{m.icon}</div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white uppercase tracking-tighter leading-none mb-0.5 text-glow-emerald">{m.label}</span>
                <span className="text-[7px] font-bold text-slate-500 uppercase truncate max-w-[100px] leading-none font-terminal">{m.desc}</span>
              </div>
            </div>
          ))}
          
          {Object.values(engagedModules).every(v => !v) && (
            <span className="text-[9px] font-bold text-slate-700 uppercase italic tracking-widest">No Active Modules Engaged</span>
          )}
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4 px-4 py-1.5 bg-slate-900/80 border border-[var(--emerald-primary)]/10 rounded-xl shadow-inner cyber-border">
            <div className="flex flex-col items-end">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em] mb-0.5">System_Health</span>
              <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isSystemHealthy ? 'text-[var(--emerald-primary)] text-glow-emerald' : 'text-[var(--alert-red)] text-glow-red animate-pulse'}`}>
                {isSystemHealthy ? 'Nominal' : 'Alert_Detected'}
              </span>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${isSystemHealthy ? 'bg-[var(--emerald-primary)] shadow-[0_0_12px_var(--emerald-primary)]' : 'bg-[var(--alert-red)] shadow-[0_0_12px_var(--alert-red)] animate-pulse'}`}></div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6 border-l border-slate-800/50 pl-6">
             <div className="flex flex-col items-end">
               <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest">Temporal_Sync</span>
               <span className="text-[10px] font-mono text-slate-500">{new Date().toLocaleTimeString()}</span>
             </div>
             <div className="flex items-center space-x-1.5">
                <div className={`w-1 h-4 rounded-full transition-all duration-300 ${isSystemHealthy ? 'bg-[var(--emerald-primary)]/20' : 'bg-[var(--alert-red)]/20'}`}></div>
                <div className={`w-1 h-4 rounded-full transition-all duration-300 ${isSystemHealthy ? 'bg-[var(--emerald-primary)]/40' : 'bg-[var(--alert-red)]/40'}`}></div>
                <div className={`w-1 h-4 rounded-full transition-all duration-300 ${isSystemHealthy ? 'bg-[var(--emerald-primary)]/60' : 'bg-[var(--alert-red)]/60'}`}></div>
                <div className={`w-1 h-4 rounded-full transition-all duration-300 ${isSystemHealthy ? 'bg-[var(--emerald-primary)] shadow-[0_0_8px_var(--emerald-primary)]' : 'bg-[var(--alert-red)] shadow-[0_0_8px_var(--alert-red)]'}`}></div>
             </div>
          </div>
        </div>
      </footer>

      <style>{`
        :root {
          --emerald-primary: #22c55e;
          --alert-red: #ef4444;
          --sovereign-gold: #eab308;
          --slate-abyssal: #0f172a;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--emerald-primary); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .font-terminal { font-family: 'Fira Code', monospace; }
        
        /* Global Cyber-Forensic Theme Overrides */
        .glass-panel {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(16px) saturate(180%);
          border: 1px solid rgba(34, 197, 94, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        }

        .cyber-border {
          border: 1px solid rgba(34, 197, 94, 0.3);
          position: relative;
        }

        .cyber-border::before {
          content: "";
          position: absolute;
          top: -2px;
          left: -2px;
          width: 12px;
          height: 12px;
          border-top: 3px solid var(--emerald-primary);
          border-left: 3px solid var(--emerald-primary);
          pointer-events: none;
          z-index: 10;
        }

        .cyber-border::after {
          content: "";
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          border-bottom: 3px solid var(--emerald-primary);
          border-right: 3px solid var(--emerald-primary);
          pointer-events: none;
          z-index: 10;
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .scanline-effect {
          position: relative;
          overflow: hidden;
        }

        .scanline-effect::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, transparent 0%, rgba(34, 197, 94, 0.1) 50%, transparent 100%);
          opacity: 0.05;
          pointer-events: none;
          animation: scanline 10s linear infinite;
          z-index: 5;
        }

        /* High contrast text utilities */
        .text-glow-emerald { text-shadow: 0 0 10px rgba(34, 197, 94, 0.6); }
        .text-glow-gold { text-shadow: 0 0 10px rgba(234, 179, 8, 0.6); }
        .text-glow-red { text-shadow: 0 0 10px rgba(239, 68, 68, 0.6); }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; border: 1px solid rgba(34, 197, 94, 0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--emerald-primary); box-shadow: 0 0 10px var(--emerald-primary); }
      `}</style>
    </div>
  );
};

export default App;
