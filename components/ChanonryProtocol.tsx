
import React, { useState, useMemo } from 'react';
import { 
  Skull, AlertOctagon, Terminal, Activity, 
  Flame, Droplets, Zap, ShieldAlert, Play,
  Loader2, Info, Beaker, ShieldCheck
} from 'lucide-react';

const ChanonryProtocol: React.FC = () => {
  const [sara, setSara] = useState({
    saturates: 35.5,
    aromatics: 25.0,
    resins: 20.0,
    asphaltenes: 19.5
  });
  const [fluid, setFluid] = useState('15% HCl Acid');
  const [pressure, setPressure] = useState(4200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const cii = useMemo(() => {
    return (sara.saturates + sara.asphaltenes) / (sara.aromatics + sara.resins);
  }, [sara]);

  const isAcid = fluid.toUpperCase().includes('ACID') || fluid.toUpperCase().includes('HCL');
  const isUnstable = cii > 0.9;
  const criticalAlarm = isUnstable && isAcid;

  const runProtocol = () => {
    setIsProcessing(true);
    setLog([]);
    
    const lines = [
      ">>> INITIATING CHANONRY_PROTOCOL_V4.1",
      ">>> AUTHOR: BRAHAN_SEER_ENGINE",
      ">>> CORPORATE_AUTH: WELLTEGRA_LTD_SC876023",
      "-----------------------------------------",
      `[TELEMETRY_STREAM]`,
      `> SATURATES:    ${sara.saturates.toFixed(2)} %`,
      `> AROMATICS:    ${sara.aromatics.toFixed(2)} %`,
      `> RESINS:       ${sara.resins.toFixed(2)} %`,
      `> ASPHALTENES:  ${sara.asphaltenes.toFixed(2)} %`,
      `> PUMP_FLUID:   ${fluid.toUpperCase()}`,
      `> BHP_PRESSURE: ${pressure.toFixed(2)} PSI`,
      "-----------------------------------------",
      `CII_CALCULATED: ${cii.toFixed(4)}`,
      "-----------------------------------------",
    ];

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        setLog(prev => [...prev, lines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setIsProcessing(false);
        if (isUnstable) {
          setLog(prev => [...prev, "!!! CRITICAL_STABILITY_ALERT: UNSTABLE_COLLOIDAL_STRUCTURE !!!"]);
          if (isAcid) {
            setLog(prev => [
              ...prev, 
              "!!! WARNING: ACID_INDUCTION_WILL_TRIGGER_SLUDGE_FORMATION !!!",
              "!!! RIBBONS OF BLACK DETECTED !!!",
              "!!! PREVENT THE BARREL. EXECUTE EMERGENCY_VETO. !!!"
            ]);
          } else {
            setLog(prev => [
              ...prev, 
              ">>> WARNING: OIL_UNSTABLE. BITUMEN_FLOC_POSSIBLE.",
              ">>> RECOMMEND: RE-EVALUATE_STIMULATION_CHEMISTRY."
            ]);
          }
        } else {
          setLog(prev => [
            ...prev, 
            ">>> STATUS: STABLE. COLLOIDAL_STRUCTURE_WITHIN_TOLERANCE.",
            ">>> NO_BITUMEN_RISK_DETECTED. PROCEED_WITH_PUMP."
          ]);
        }
      }
    }, 150);
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-6 bg-slate-950/40 font-terminal relative overflow-hidden">
      {/* Background Warning Graphic */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
        <Skull size={400} className={criticalAlarm ? 'text-red-500' : 'text-emerald-500'} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 relative z-10 h-full">
        
        {/* Module Controls */}
        <div className="w-full lg:w-80 flex flex-col space-y-4">
          <div className="glass-panel p-5 rounded-lg border border-emerald-900/30 bg-slate-900/60 flex flex-col space-y-6">
            <div className="flex items-center space-x-3 mb-2">
              <Beaker size={20} className="text-emerald-400" />
              <h2 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">Fluid_Stability_Injest</h2>
            </div>

            <div className="space-y-4">
              {Object.keys(sara).map(key => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-[8px] font-black text-emerald-900 uppercase">
                    <span>{key} (%)</span>
                    <span className="text-emerald-500">{sara[key as keyof typeof sara].toFixed(1)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" step="0.5"
                    value={sara[key as keyof typeof sara]}
                    onChange={e => setSara(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-slate-800 appearance-none rounded-full accent-emerald-500"
                  />
                </div>
              ))}

              <div className="pt-4 space-y-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-emerald-900 uppercase">Treatment_Fluid</span>
                  <select 
                    value={fluid}
                    onChange={e => setFluid(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-900/40 rounded px-2 py-1.5 text-[10px] text-emerald-400 outline-none focus:border-emerald-500"
                  >
                    <option>15% HCl Acid</option>
                    <option>Mud Acid (HCl/HF)</option>
                    <option>Produced Water</option>
                    <option>Inhibitor Brine</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-black text-emerald-900 uppercase">BHP_Pressure (PSI)</span>
                  <input 
                    type="number"
                    value={pressure}
                    onChange={e => setPressure(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-emerald-900/40 rounded px-2 py-1.5 text-[10px] text-emerald-400 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={runProtocol}
              disabled={isProcessing}
              className={`w-full py-4 rounded font-black text-[10px] uppercase tracking-[0.3em] transition-all border ${
                isProcessing 
                  ? 'bg-orange-500/20 text-orange-500 border-orange-500/40 cursor-wait' 
                  : 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              }`}
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              <span>{isProcessing ? 'Executing_Logic...' : 'Run_Seer_Protocol'}</span>
            </button>
          </div>
        </div>

        {/* Main Terminal Output */}
        <div className="flex-1 flex flex-col space-y-4">
          <div className="flex-1 bg-slate-950/90 border border-emerald-900/30 rounded-xl p-6 relative overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-emerald-900/20 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <Terminal size={18} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Brahan_Seer_CLI v4.1</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${criticalAlarm ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`}></div>
                <span className={`text-[8px] font-black uppercase ${criticalAlarm ? 'text-red-500' : 'text-emerald-900'}`}>
                  {criticalAlarm ? 'VETO_REQUIRED' : 'SYSTEM_NOMINAL'}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-1">
              {log.map((line, i) => {
                const isCritical = line.includes('!!!');
                const isWarning = line.includes('>>> WARNING');
                return (
                  <div key={i} className={`
                    ${isCritical ? 'text-red-500 font-black animate-pulse' : 
                      isWarning ? 'text-orange-400' : 
                      line.includes('---') ? 'text-emerald-900 opacity-30' : 
                      'text-emerald-500/80'}
                  `}>
                    {line}
                  </div>
                );
              })}
              {isProcessing && <div className="text-emerald-500 animate-pulse">_</div>}
              {log.length === 0 && !isProcessing && (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                   <Skull size={100} className="mb-4" />
                   <span className="text-[12px] font-black uppercase tracking-[0.5em]">Awaiting_Input_Data</span>
                </div>
              )}
            </div>

            {/* Live Indicator Graphic */}
            <div className="mt-4 flex items-center justify-between border-t border-emerald-900/10 pt-4">
               <div className="flex items-center space-x-6">
                  <div className="flex flex-col">
                     <span className="text-[7px] text-emerald-900 font-black uppercase">Colloidal_Index</span>
                     <span className={`text-xl font-black ${isUnstable ? 'text-red-500' : 'text-emerald-400'}`}>{cii.toFixed(4)}</span>
                  </div>
                  <div className="h-8 w-px bg-emerald-900/20"></div>
                  <div className="flex flex-col">
                     <span className="text-[7px] text-emerald-900 font-black uppercase">Bitumen_Risk</span>
                     <span className={`text-xl font-black ${isUnstable ? 'text-red-500' : 'text-emerald-400'}`}>
                       {isUnstable ? 'CRITICAL' : 'MINIMAL'}
                     </span>
                  </div>
               </div>
               <div className="flex items-center space-x-4">
                  {criticalAlarm && (
                    <div className="flex items-center space-x-2 text-red-500 bg-red-500/10 border border-red-500/40 px-3 py-1.5 rounded animate-bounce">
                       <ShieldAlert size={14} />
                       <span className="text-[9px] font-black uppercase tracking-widest">Execute_Veto</span>
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-[7px] text-emerald-900 font-black uppercase">Node_Authorization</div>
                    <div className="text-[9px] text-emerald-700 font-mono">SC876023_BRAHAN</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChanonryProtocol;
