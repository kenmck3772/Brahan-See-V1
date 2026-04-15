
import React, { useState } from 'react';
import { 
  Compass, Radar, Target, Flame, Database, 
  Map as MapIcon, ChevronRight, Activity, 
  ShieldAlert, Hash, Crosshair, AlertTriangle,
  Search, Loader2, Download // Added Loader2 and Download
} from 'lucide-react';
import { MissionTarget, ForensicWell } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import NDRCrawler from './NDRCrawler'; // Imported the new component
import MissionControl from './MissionControl';
import GhostSync from './GhostSync';
import TraumaNode from './TraumaNode';
import PulseAnalyzer from './PulseAnalyzer';
import ReportsScanner from './ReportsScanner';
import Vault from './Vault';
import LegacyRecovery from './LegacyRecovery';
import NorwaySovereign from './NorwaySovereign';
import ChanonryProtocol from './ChanonryProtocol';
import ProtocolManual from './ProtocolManual';
import NDRModernization from './NDRModernization';
import CerberusSimulator from './CerberusSimulator';
import WETEForensicScanner from './WETEForensicScanner';
import ForensicDeltaMap from './ForensicDeltaMap';
import ForensicDeltaSummary from './ForensicDeltaSummary';
import TimeTravelSlider from './TimeTravelSlider';
import SovereignTerminal from './SovereignTerminal';
import { MOCK_WELLS } from '../constants';

// Import Gemini service for AI insight
import { getForensicInsight } from '../services/geminiService';
// Import PDF generation service
import { generateSovereignAudit, AuditData } from '../reporting/pdfEngine';


const mockPulseData = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  pressure: 2500 + Math.sin(i * 0.8) * 200 + Math.random() * 50,
  limit: 2800
}));

const mockSubsidenceData = Array.from({ length: 15 }, (_, i) => ({
  dist: i * 10,
  error: 4.26 + Math.random() * 0.2,
  nominal: 0
}));

interface StageProps {
  engagedModules: Record<string, boolean>;
  selectedTargetId: string | null;
  userLocation: { lat: number; lon: number; error?: string } | null;
  onSelectTarget: (target: MissionTarget) => void;
}

const SovereignStage: React.FC<StageProps> = ({ engagedModules, selectedTargetId, userLocation, onSelectTarget }) => {
  const activeCount = Object.values(engagedModules).filter(Boolean).length;

  const [geminiInsight, setGeminiInsight] = useState<string>('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [isTraumaNodeFocused, setIsTraumaNodeFocused] = useState(false);
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null);

  // Placeholder for collected audit data (this would ideally come from context or props)
  const mockAuditData: AuditData = {
      uwi: "211/18-A45",
      projectName: "Thistle A7 Legacy",
      projectId: "THISTLE1978well0001",
      sha512: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      offset: 14.5,
      pulseDiagnosis: {
          status: "CRITICAL: RAPID FLOW BREACH",
          slope: 16.2345,
          rSquared: 0.999,
          diagnosis: "Extreme linear recharge at 16.23 PSI/unit. Direct high-pressure conduit confirmed."
      },
      traumaLog: [{ timestamp: new Date().toISOString(), layer: 'METAL_LOSS', depth: 1245.5, value: 22, unit: 'mm', severity: 'CRITICAL', description: 'Simulated metal loss at casing' }], // Mock a critical log entry
      tallyAudit: {
          reportId: "DDR-2024-002",
          discordance: 0.051,
          totalTally: 1245.449,
          reportedDepth: 1245.5
      },
      timestamp: new Date().toISOString(),
      forensicInsight: "Initial placeholder insight for Gemini."
  };

  const handleGenerateInsight = async () => {
      setIsGeneratingInsight(true);
      const summary = `UWI: ${mockAuditData.uwi}, Project: ${mockAuditData.projectName}, Datum Offset: ${mockAuditData.offset}m, Pulse Status: ${mockAuditData.pulseDiagnosis.status}, Trauma Events: ${mockAuditData.traumaLog.length}, Tally Discordance: ${mockAuditData.tallyAudit.discordance}m.`;
      const insight = await getForensicInsight("Full Forensic Audit", summary);
      setGeminiInsight(insight || "ANALYSIS_FAILURE: NO_INSIGHT_GENERATED");
      setIsGeneratingInsight(false);
  };

  const handleGeneratePdfAudit = async () => {
      // Before generating PDF, ensure the insight is the latest
      const finalAuditData = { ...mockAuditData, forensicInsight: geminiInsight || mockAuditData.forensicInsight };
      await generateSovereignAudit(finalAuditData);
  };

  if (activeCount === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center relative overflow-hidden rounded-2xl border border-slate-800/50 bg-[var(--slate-abyssal)] glass-panel cyber-border scanline-effect">
        <div className="absolute inset-0 flex items-center justify-center opacity-20 mix-blend-luminosity">
          <img src="/brahan-seer.jpg" alt="Brahan Seer" className="object-cover w-full h-full" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
          <Radar size={400} className="text-slate-500 animate-[spin_10s_linear_infinite] hidden absolute" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--slate-abyssal)] via-transparent to-[var(--slate-abyssal)]/80"></div>
        <div className="relative z-10 flex flex-col items-center opacity-90 backdrop-blur-md p-10 rounded-3xl border border-[var(--emerald-primary)]/20 bg-[var(--slate-abyssal)]/60 shadow-[0_0_50px_rgba(0,0,0,0.8)] glass-panel cyber-border">
          <div className="w-24 h-24 border-2 border-slate-700 rounded-full flex items-center justify-center mb-6 relative bg-[var(--slate-abyssal)]/80 shadow-[0_0_30px_rgba(234,179,8,0.2)] glass-panel">
            <div className="absolute inset-0 rounded-full border border-[var(--sovereign-gold)]/40 animate-ping"></div>
            <img src="/well-tegra-logo.jpg" alt="Well-Tegra Logo" className="w-16 h-16 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            <div className="w-2 h-2 bg-[var(--sovereign-gold)] rounded-full animate-pulse hidden absolute"></div>
          </div>
          <h3 className="text-3xl font-black uppercase tracking-[0.5em] text-[var(--sovereign-gold)] mb-2 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] text-glow-gold">System Standby</h3>
          <p className="text-[10px] font-terminal text-slate-300 uppercase tracking-widest bg-[var(--slate-abyssal)]/80 px-4 py-1.5 rounded border border-slate-700/50 glass-panel">Awaiting Module Engagement // Zero Active Feeds</p>
        </div>
      </div>
    );
  }

  const gridClass = activeCount === 1 
    ? 'grid-cols-1' 
    : activeCount === 2 
    ? 'grid-cols-1 lg:grid-cols-2' 
    : 'grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3'; // Adjusted for 3 columns on larger screens

  return (
    <div className={`grid ${gridClass} gap-6 transition-all duration-700 h-fit pb-12`}>
      
      {engagedModules.missionControl && (
        <div className="col-span-full">
           <MissionControl onSelectTarget={onSelectTarget} isAnalyzing={false} />
        </div>
      )}

      {engagedModules.globalScavenger && (
        <div className="h-96 bg-[var(--slate-abyssal)]/40 border border-[var(--emerald-primary)]/20 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 glass-panel cyber-border scanline-effect">
          <div className="p-4 bg-slate-900/50 border-b border-[var(--emerald-primary)]/20 flex items-center justify-between glass-panel">
            <div className="flex items-center space-x-3">
              <MapIcon size={16} className="text-[var(--emerald-primary)] text-glow-emerald" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Global Scavenger // OSINT</span>
            </div>
            <div className="flex space-x-1">
               <div className="w-1.5 h-1.5 rounded-full bg-[var(--emerald-primary)] animate-pulse shadow-[0_0_8px_var(--emerald-primary)]"></div>
            </div>
          </div>
          <div className="flex-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 relative">
             <div className="absolute inset-0 flex items-center justify-center border-4 border-[var(--emerald-primary)]/5">
                <Crosshair size={100} className="text-[var(--emerald-primary)]/20" />
             </div>
             <div className="absolute bottom-4 left-4 p-3 bg-slate-950/80 border border-[var(--emerald-primary)]/30 rounded-lg glass-panel">
                <span className="text-[8px] font-mono text-[var(--emerald-primary)] block">LAT: 58.12.44N</span>
                <span className="text-[8px] font-mono text-[var(--emerald-primary)] block">LON: 01.33.22E</span>
             </div>
          </div>
        </div>
      )}

      {engagedModules.scaleAbyss && (
        <div className="h-96 bg-[var(--slate-abyssal)]/40 border border-[var(--emerald-primary)]/20 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 glass-panel cyber-border scanline-effect">
          <div className="p-4 bg-slate-900/50 border-b border-[var(--emerald-primary)]/20 flex items-center justify-between glass-panel">
            <div className="flex items-center space-x-3">
              <Compass size={16} className="text-[var(--sovereign-gold)] text-glow-gold" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Scale Abyss // 4.26m Error</span>
            </div>
            <span className="text-[8px] font-black px-2 py-1 bg-[var(--sovereign-gold)]/10 text-[var(--sovereign-gold)] border border-[var(--sovereign-gold)]/30 rounded shadow-[0_0_10px_rgba(234,179,8,0.2)] glass-panel">Veto Active</span>
          </div>
          <div className="flex-1 p-4">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockSubsidenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--emerald-primary)" opacity={0.1} />
                  <XAxis dataKey="dist" hide />
                  <YAxis stroke="var(--emerald-primary)" opacity={0.4} fontSize={8} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid var(--emerald-primary)', opacity: 0.8 }} />
                  <Line type="step" dataKey="error" stroke="var(--alert-red)" strokeWidth={3} dot={{ r: 4, fill: 'var(--alert-red)' }} />
                  <Line type="monotone" dataKey="nominal" stroke="var(--emerald-primary)" strokeDasharray="5 5" opacity={0.5} />
                </LineChart>
             </ResponsiveContainer>
          </div>
        </div>
      )}

      {engagedModules.phantomSteel && (
        <div className="h-96 bg-[var(--slate-abyssal)]/40 border border-[var(--emerald-primary)]/20 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 glass-panel cyber-border scanline-effect">
          <div className="p-4 bg-slate-900/50 border-b border-[var(--emerald-primary)]/20 flex items-center justify-between glass-panel">
            <div className="flex items-center space-x-3">
              <Target size={16} className="text-[var(--alert-red)] text-glow-red" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Phantom Steel // Echo Pulse</span>
            </div>
            <Activity size={14} className="text-[var(--alert-red)] animate-bounce" />
          </div>
          <div className="flex-1 p-4">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockPulseData}>
                  <defs>
                    <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--alert-red)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--alert-red)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="1 5" stroke="var(--emerald-primary)" opacity={0.1} />
                  <XAxis dataKey="time" hide />
                  <YAxis stroke="var(--emerald-primary)" opacity={0.4} fontSize={8} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid var(--emerald-primary)', opacity: 0.8 }} />
                  <Area type="monotone" dataKey="pressure" stroke="var(--alert-red)" fillOpacity={1} fill="url(#colorPulse)" strokeWidth={2} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>
      )}

      {engagedModules.chemicalRot && (
        <div className="h-96 bg-[var(--slate-abyssal)]/40 border border-[var(--emerald-primary)]/20 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 glass-panel cyber-border scanline-effect">
          <div className="p-4 bg-slate-900/50 border-b border-[var(--emerald-primary)]/20 flex items-center justify-between glass-panel">
            <div className="flex items-center space-x-3">
              <Flame size={16} className="text-orange-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Chemical Rot // Casing Pressure</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-8 grid-rows-8 gap-1 p-4">
             {Array.from({ length: 64 }).map((_, i) => (
               <div 
                 key={i} 
                 className="rounded-sm border border-slate-800 transition-colors duration-1000"
                 style={{ backgroundColor: `rgba(249, 115, 22, ${Math.random() * 0.4})` }}
               ></div>
             ))}
          </div>
        </div>
      )}

      {engagedModules.ghostReserve && (
        <div className="h-96 bg-[var(--slate-abyssal)]/40 border border-[var(--emerald-primary)]/20 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 glass-panel cyber-border scanline-effect">
          <div className="p-4 bg-slate-900/50 border-b border-[var(--emerald-primary)]/20 flex items-center justify-between glass-panel">
            <div className="flex items-center space-x-3">
              <Database size={16} className="text-[var(--emerald-primary)] text-glow-emerald" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Ghost Reserve // PVT Audit</span>
            </div>
          </div>
          <div className="flex-1 p-6 flex flex-col space-y-4">
             {[1, 2, 3].map(i => (
               <div key={i} className="p-3 bg-slate-900/80 border border-[var(--emerald-primary)]/20 rounded-lg flex items-center justify-between glass-panel">
                  <div className="flex items-center space-x-3">
                    <ShieldAlert size={14} className="text-[var(--alert-red)]" />
                    <span className="text-[9px] font-mono text-slate-400 uppercase">ANOMALY_TRX_{i}0042</span>
                  </div>
                  <span className="text-[10px] font-black text-[var(--emerald-primary)]">+14.2% Delta</span>
               </div>
             ))}
             <div className="mt-auto p-4 bg-[var(--alert-red)]/5 border border-[var(--alert-red)]/20 rounded-xl flex items-start space-x-3">
                <AlertTriangle size={16} className="text-[var(--alert-red)] mt-0.5" />
                <p className="text-[9px] text-[var(--alert-red)]/80 font-bold uppercase leading-tight">
                  Mass-balance discordance detected in Sector 4. Re-calculating PVT Reconstitution...
                </p>
             </div>
          </div>
        </div>
      )}
      
      {engagedModules.ghostSync && <GhostSync />}
      {engagedModules.traumaNode && (
        <div className={isTraumaNodeFocused ? "col-span-full h-[800px]" : "h-[600px]"}>
          <TraumaNode 
            isFocused={isTraumaNodeFocused} 
            onToggleFocus={() => setIsTraumaNodeFocused(!isTraumaNodeFocused)} 
          />
        </div>
      )}
      {engagedModules.pulseAnalyzer && <PulseAnalyzer />}
      {engagedModules.reportsScanner && <ReportsScanner />}
      {engagedModules.vault && <Vault />}
      {engagedModules.legacyRecovery && <LegacyRecovery />}
      {engagedModules.norwaySovereign && <NorwaySovereign />}
      {engagedModules.chanonryProtocol && <ChanonryProtocol />}
      {engagedModules.protocolManual && <ProtocolManual />}
      {engagedModules.ndrModernization && <NDRModernization />}
      {engagedModules.cerberusSimulator && <CerberusSimulator />}
      {engagedModules.weteForensicScanner && <WETEForensicScanner />}
      {engagedModules.forensicDeltaMap && (
        <ForensicDeltaMap 
          highlightedField={selectedTargetId} 
          userLocation={userLocation} 
          selectedWellId={selectedWellId}
          onSelectWell={(wellId: string) => {
            setSelectedWellId(wellId);
            const well = MOCK_WELLS.find((w: ForensicWell) => w.id === wellId);
            if (well) {
              onSelectTarget({ 
                ASSET: well.field, 
                REGION: 'North Sea', 
                BLOCKS: [], 
                ANOMALY_TYPE: 'Forensic Discordance', 
                DATA_PORTAL: 'NSTA', 
                PRIORITY: well.status === 'critical' ? 'CRITICAL' : 'HIGH' 
              });
            }
          }}
        />
      )}
      {engagedModules.forensicDeltaSummary && (
        <div className="col-span-full">
          <ForensicDeltaSummary selectedWellId={selectedWellId} />
        </div>
      )}

      {engagedModules.ndrCrawler && (
        <div className="col-span-full"> {/* Allow NDRCrawler to take full width */}
          <NDRCrawler />
        </div>
      )}

      {engagedModules.sovereignTerminal && (
        <div className="col-span-full h-[500px]">
          <SovereignTerminal />
        </div>
      )}

      {engagedModules.timeTravelSlider && (
        <div className="col-span-full">
          <TimeTravelSlider />
        </div>
      )}

      {activeCount > 0 && ( // Show this only if at least one module is engaged
          <div className="col-span-full glass-panel p-6 rounded-2xl border border-[var(--emerald-primary)]/30 bg-slate-900/60 shadow-2xl animate-in zoom-in-95 duration-700 cyber-border">
              <div className="flex items-center justify-between border-b border-emerald-900/30 pb-4 mb-4">
                  <div className="flex items-center space-x-4">
                      <ShieldAlert size={24} className="text-[var(--emerald-primary)] shadow-[0_0_10px_var(--emerald-primary)]" />
                      <div>
                          <h3 className="text-xl font-black text-[var(--emerald-primary)] uppercase tracking-tighter text-glow-emerald">Sovereign_Veto_Protocol</h3>
                          <span className="text-[10px] text-emerald-800 uppercase tracking-widest font-black">Final Forensic Insight & Audit Generation</span>
                      </div>
                  </div>
                  <button 
                      onClick={handleGenerateInsight}
                      disabled={isGeneratingInsight}
                      className="flex items-center space-x-2 px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest transition-all bg-[var(--emerald-primary)] text-slate-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50"
                  >
                      {isGeneratingInsight ? <Loader2 size={14} className="animate-spin" /> : <Hash size={14} />}
                      <span>{isGeneratingInsight ? 'Generating Insight...' : 'Generate Gemini Insight'}</span>
                  </button>
              </div>

              <div className="p-4 bg-slate-950 rounded border border-emerald-900/40 font-terminal text-[11px] text-emerald-100/80 leading-relaxed mb-6 glass-panel">
                  <div className="text-[8px] font-black uppercase text-emerald-900 mb-2">Architect_Insight_Log</div>
                  <p data-testid="gemini-insight-text">
                      {geminiInsight || "Awaiting Gemini Forensic Architect analysis..."}
                  </p>
              </div>

              <button 
                  onClick={handleGeneratePdfAudit}
                  className="w-full py-4 bg-[var(--emerald-primary)] text-slate-950 rounded font-black text-[12px] uppercase tracking-[0.4em] hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                  data-testid="sovereign-veto-btn"
              >
                  <Download size={18} className="mr-3" />
                  <span>EXECUTE SOVEREIGN VETO (Generate PDF Audit)</span>
              </button>
          </div>
      )}

    </div>
  );
};

export default SovereignStage;
