
import React, { useState, useEffect } from 'react';
import { 
  Globe, ShieldCheck, Target, Activity, 
  Database, Zap, TrendingUp, Coins, 
  Anchor, Waves, ArrowRight, ShieldAlert,
  Loader2, Scan, Info, Binary, Radar,
  History, Download, FileCheck, Layers,
  ChevronRight
} from 'lucide-react';

const NorwaySovereign: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedWells, setScannedWells] = useState<string[]>([]);
  const [fiscalReclaim, setFiscalReclaim] = useState(0);
  const [activeStrategy, setActiveStrategy] = useState('MICA_MASKING_RECOVERY');

  const triggerFactpagesScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedWells(['STATFJORD_33/9_A-12', 'GULLFAKS_34/10_C-42', 'SNORRE_34/7_P-11']);
      setFiscalReclaim(12.45); // in Million NOK
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-6 bg-slate-950/40 relative overflow-hidden font-terminal">
      {/* Background HUD Decorations */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Globe size={400} className="text-blue-500 animate-spin-slow" />
      </div>

      <div className="flex flex-col space-y-6 max-w-6xl mx-auto w-full relative z-10 h-full">
        {/* Module Header */}
        <div className="flex items-center justify-between border-b border-blue-900/30 pb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/40 rounded shadow-lg shadow-blue-500/5">
              <Anchor size={24} className="text-blue-400 animate-bounce-slow" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-blue-400 uppercase tracking-tighter">{">>>"} NODE_LOAD: NORWAY_SOVEREIGN (Sodir)</h2>
              <p className="text-xs text-blue-800 font-black uppercase tracking-[0.4em]">Auth: NPD_FACTPAGES_UPLINK // Fiscal_Hook: 78_PERCENT_TAX_REFUND</p>
            </div>
          </div>
          <div className="flex items-center space-x-6 text-right">
             <div className="flex flex-col">
                <span className="text-[8px] text-blue-900 uppercase font-black">Fiscal_Reclaim_Target</span>
                <span className="text-xl font-black text-blue-500">{fiscalReclaim.toFixed(2)}M NOK</span>
             </div>
             <div className="flex flex-col">
                <span className="text-[8px] text-blue-900 uppercase font-black">Node_Status</span>
                <span className="text-xl font-black text-blue-500">AUTHORIZED</span>
             </div>
          </div>
        </div>

        {/* Main Interface Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0 overflow-hidden">
          
          {/* Left Column: Forensic Intel & Controls */}
          <div className="lg:col-span-1 flex flex-col space-y-4">
            <div className="glass-panel p-5 rounded-lg border border-blue-900/40 bg-slate-900/60 relative overflow-hidden h-fit">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <ShieldCheck size={32} className="text-blue-500" />
              </div>
              <h3 className="text-[10px] font-black text-blue-400 mb-3 uppercase tracking-widest flex items-center">
                <Radar size={14} className="mr-2" /> Data Card 1: Mica Ghosting
              </h3>
              
              <div className="p-3 bg-slate-950/80 rounded border border-blue-900/30 font-mono text-[9px] leading-tight mb-4">
                <div className="mb-2 text-blue-900 text-[7px] uppercase font-black">{">>"} NPD_ARCHIVE_ANALYTICS</div>
                <div className="space-y-1">
                   <div className="flex justify-between">
                      <span className="text-blue-700">STRATEGY:</span>
                      <span className="text-blue-400">{activeStrategy}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-blue-700">HOOK:</span>
                      <span className="text-blue-400">78%_TAX_RECLAIM</span>
                   </div>
                </div>
              </div>

              <p className="text-[9px] text-blue-200/70 leading-relaxed font-mono italic">
                ANALYSIS: Norwegian offshore wells drilled prior to 2012 frequently masked radioactive sand packages behind Mica interference. Veto recovery algorithm targeting 78% fiscal rebate on abandoned wellbores.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-lg border border-blue-900/40 bg-slate-900/80 flex flex-col space-y-4 shadow-xl">
              <button 
                onClick={triggerFactpagesScan}
                disabled={isScanning}
                className={`w-full py-4 rounded font-black text-[10px] uppercase tracking-[0.3em] transition-all border ${
                  isScanning 
                    ? 'bg-blue-500/20 text-blue-500 border-blue-500/40 cursor-wait' 
                    : 'bg-blue-500 text-slate-950 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:bg-blue-400'
                }`}
              >
                {isScanning ? 'CRAWLING_FACTPAGES...' : 'INITIATE_NPD_CRAWL'}
              </button>
            </div>

            <div className="flex-1 glass-panel p-5 rounded-lg border border-blue-500/20 bg-blue-500/5 relative overflow-hidden group">
               <h3 className="text-[10px] font-black text-blue-100 mb-4 uppercase tracking-widest flex items-center">
                 <Coins size={14} className="mr-2" /> Data Card 3: Fiscal Hook
               </h3>
               <div className="space-y-4">
                 <div className="p-3 bg-slate-950/80 border border-blue-500/20 rounded">
                    <div className="text-[7px] text-blue-900 font-black uppercase mb-1">Tax_Incentive_Veto</div>
                    <div className="text-2xl font-black text-blue-400">78.00%</div>
                    <div className="mt-2 text-[7px] text-blue-700 uppercase font-black">Potential_Credit: NO_RISK_CAPITAL</div>
                 </div>
               </div>
            </div>
          </div>

          {/* Middle Column: Seismic Artifact Visualizer */}
          <div className="lg:col-span-2 glass-panel rounded-lg bg-slate-950 border border-blue-900/40 relative overflow-hidden flex flex-col p-4 shadow-2xl">
            <div className="absolute top-6 left-6 z-20 space-y-2">
              <div className="flex items-center space-x-2 bg-slate-900/90 border border-blue-500/30 px-3 py-1.5 rounded shadow-xl">
                 <Scan size={14} className="text-blue-500" />
                 <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">NPD_Seismic_Artifact_Scan</span>
              </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center">
              {isScanning ? (
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <Loader2 size={120} className="text-blue-500 animate-spin" />
                    <Radar size={60} className="absolute inset-0 m-auto text-blue-400 animate-pulse" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-blue-500 animate-pulse uppercase tracking-[0.5em]">Syncing Factpages Meta-Graph</span>
                    <span className="text-[7px] text-blue-900 font-mono mt-2">ACCESSING_API: factpages.sodir.no/flow/well/v1</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col p-4">
                  <div className="flex-1 border border-blue-900/20 rounded bg-slate-900/20 relative overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-10">
                      {[...Array(144)].map((_, i) => <div key={i} className="border-[0.5px] border-blue-500"></div>)}
                    </div>
                    {/* Simulated Seismic Trace View */}
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Waves size={300} className="text-blue-900/40" />
                       <div className="absolute w-full h-px bg-blue-500/20 top-1/2"></div>
                       <div className="absolute h-full w-px bg-blue-500/20 left-1/2"></div>
                       
                       <div className="absolute top-1/4 left-1/3 p-2 bg-blue-500/10 border border-blue-500/40 rounded backdrop-blur-md animate-bounce-slow">
                          <span className="text-[8px] font-black text-blue-400 uppercase">Artifact: RADIOACTIVE_SAND_GHOST</span>
                       </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                     <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-2"><Activity size={10} className="text-blue-500" /><span className="text-[8px] text-blue-900 font-black uppercase">Trace: STATFJORD_B7</span></span>
                        <span className="flex items-center space-x-2"><Binary size={10} className="text-blue-500" /><span className="text-[8px] text-blue-900 font-black uppercase">Veto_Locked: YES</span></span>
                     </div>
                     <span className="text-[8px] text-blue-950 font-mono">0X_FACTPAGES_UPLINK_STABLE</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Scanned Targets */}
          <div className="lg:col-span-1 flex flex-col space-y-4">
            <div className="glass-panel p-5 rounded-lg border border-blue-900/40 bg-slate-900/80 flex flex-col flex-1 shadow-xl">
              <h3 className="text-[10px] font-black text-blue-400 mb-4 uppercase tracking-widest flex items-center">
                <History size={16} className="mr-2" /> Scanned Targets
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {scannedWells.length > 0 ? scannedWells.map(well => (
                  <div key={well} className="p-3 bg-slate-950 rounded border border-blue-900/40 hover:border-blue-500 transition-all group cursor-pointer">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-blue-100 uppercase">{well}</span>
                      <ChevronRight size={12} className="text-blue-900 group-hover:text-blue-400" />
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[7px] text-blue-700 uppercase font-black">Status: GHOST_IDENTIFIED</span>
                       <Download size={10} className="text-blue-900 group-hover:text-blue-400" />
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-20">
                    <Scan size={32} className="text-blue-500 mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Awaiting Factpages Crawl</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-blue-900/20">
                <button className="w-full py-3 bg-blue-500/10 border border-blue-500/40 text-blue-400 rounded font-black text-[9px] uppercase tracking-widest hover:bg-blue-500 hover:text-slate-950 flex items-center justify-center space-x-2 group">
                   <Download size={12} className="group-hover:animate-bounce" />
                   <span>Batch Archive NPD Meta</span>
                </button>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-lg border border-blue-900/40 bg-slate-950/90 text-[8px] space-y-2 opacity-60">
               <div className="flex items-center space-x-2 text-blue-500 font-black mb-1">
                 <ShieldAlert size={12} />
                 <span>FISCAL_HOOK_LOG</span>
               </div>
               <p className="font-mono text-blue-700 leading-tight">
                {">"} TARGETING_MICA_INTERFERENCE...<br/>
                {">"} RECOVERY_STRATEGY: TAX_VETO<br/>
                {">"} NODE_ID: SODIR_MASTER_V1
               </p>
            </div>
          </div>
        </div>

        {/* Global Module Footer */}
        <div className="pt-4 border-t border-blue-900/20 flex items-center justify-between text-[8px] font-black text-blue-900 uppercase tracking-[0.2em] mt-auto">
           <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-2">
                <Database size={12} />
                <span>NPD_FACTPAGES_SECURE</span>
              </span>
              <span className="flex items-center space-x-2">
                <Target size={12} />
                <span>DATUM_SYNC: NORWAY_GRID</span>
              </span>
           </div>
           <div className="flex items-center space-x-4">
              <span className="text-blue-950">NORWAY_SOVEREIGN_SYSTEM_ACTIVE</span>
              <div className="flex items-center space-x-1">
                 <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></div>
                 <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default NorwaySovereign;
