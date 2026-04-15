
import React from 'react';
import { 
  BarChart3, TrendingDown, TrendingUp, AlertTriangle, 
  ShieldCheck, Info, ArrowRightLeft, Activity,
  Zap, Database, Globe, Scale
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend } from 'recharts';

const MOCK_SUMMARY_DATA = [
  { name: 'Stella-001', reported: 10000, audited: 8500, delta: -15, status: 'conflict' },
  { name: 'Gannet-A', reported: 15000, audited: 14800, delta: -1.3, status: 'nominal' },
  { name: 'Viking-X', reported: 5000, audited: 3200, delta: -36, status: 'critical' },
  { name: 'Viking-Y', reported: 4500, audited: 4550, delta: 1.1, status: 'nominal' },
  { name: 'Stella-002', reported: 8000, audited: 7200, delta: -10, status: 'conflict' },
];

interface SummaryProps {
  selectedWellId?: string | null;
}

const ForensicDeltaSummary: React.FC<SummaryProps> = ({ selectedWellId }) => {
  const totalReported = MOCK_SUMMARY_DATA.reduce((acc: number, curr: any) => acc + curr.reported, 0);
  const totalAudited = MOCK_SUMMARY_DATA.reduce((acc: number, curr: any) => acc + curr.audited, 0);
  const totalDelta = ((totalAudited - totalReported) / totalReported) * 100;

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* High-Level Comparison Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 cyber-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Database size={48} className="text-slate-400" />
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <Info size={14} className="text-slate-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Truth Level 0: Public Report</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {totalReported.toLocaleString()} <span className="text-xs text-slate-500">bbl/d</span>
          </div>
          <div className="text-[9px] text-slate-500 mt-1 uppercase font-bold">Aggregated NSTA/OPRED Submissions</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-[var(--emerald-primary)]/30 bg-[var(--emerald-primary)]/5 cyber-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck size={48} className="text-[var(--emerald-primary)]" />
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <ShieldCheck size={14} className="text-[var(--emerald-primary)]" />
            <span className="text-[10px] font-black text-[var(--emerald-primary)] uppercase tracking-widest">Truth Level 1: WellTegra Forensic</span>
          </div>
          <div className="text-2xl font-black text-[var(--emerald-primary)] font-mono text-glow-emerald">
            {totalAudited.toLocaleString()} <span className="text-xs text-emerald-700">bbl/d</span>
          </div>
          <div className="text-[9px] text-emerald-700 mt-1 uppercase font-bold">Physics-Anchored Mass-Balance Audit</div>
        </div>

        <div className={`glass-panel p-6 rounded-2xl border ${totalDelta < -5 ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-500/30 bg-emerald-500/5'} cyber-border relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Scale size={48} className={totalDelta < -5 ? 'text-red-500' : 'text-emerald-500'} />
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <ArrowRightLeft size={14} className={totalDelta < -5 ? 'text-red-500' : 'text-emerald-500'} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${totalDelta < -5 ? 'text-red-500' : 'text-emerald-500'}`}>Forensic Delta (Conflict)</span>
          </div>
          <div className={`text-2xl font-black font-mono ${totalDelta < -5 ? 'text-red-500 text-glow-red' : 'text-emerald-500 text-glow-emerald'}`}>
            {totalDelta.toFixed(2)}%
          </div>
          <div className={`text-[9px] mt-1 uppercase font-bold ${totalDelta < -5 ? 'text-red-700' : 'text-emerald-700'}`}>
            {totalDelta < -5 ? 'CRITICAL DISCORDANCE DETECTED' : 'NOMINAL VARIANCE'}
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 cyber-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 size={18} className="text-[var(--emerald-primary)]" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Asset-Level Truth Comparison</h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-slate-700 rounded-sm"></div>
              <span className="text-[8px] font-bold text-slate-500 uppercase">Reported</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[var(--emerald-primary)] rounded-sm"></div>
              <span className="text-[8px] font-bold text-[var(--emerald-primary)] uppercase">Forensic</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_SUMMARY_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#94a3b8', fontWeight: 'bold' }}
              />
              <YAxis 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                labelStyle={{ color: '#fff', marginBottom: '4px', fontSize: '12px', fontWeight: 'black' }}
              />
              <Bar dataKey="reported" fill="#334155" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="audited" radius={[4, 4, 0, 0]} barSize={40}>
                {MOCK_SUMMARY_DATA.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.status === 'critical' ? '#ef4444' : entry.status === 'conflict' ? '#eab308' : '#22c55e'} 
                    stroke={selectedWellId === entry.name.toUpperCase() ? '#fff' : 'none'}
                    strokeWidth={2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-Time Conflict Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 cyber-border">
          <div className="flex items-center space-x-3 mb-6">
            <Activity size={18} className="text-red-500 animate-pulse" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Real-Time Conflict Stream</h3>
          </div>
          <div className="space-y-3">
            {MOCK_SUMMARY_DATA.filter((d: any) => d.status !== 'nominal').map((item: any, i: number) => (
              <div key={i} className={`p-4 bg-slate-950/50 border rounded-xl flex items-center justify-between group hover:border-red-500/30 transition-all ${selectedWellId === item.name.toUpperCase() ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800'}`}>
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${item.status === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white uppercase">{item.name} // Discordance</div>
                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Physics-Calculated: {item.audited} bbl/d vs Reported: {item.reported} bbl/d</div>
                  </div>
                </div>
                <div className={`text-xs font-black font-mono ${item.status === 'critical' ? 'text-red-500' : 'text-yellow-500'}`}>
                  {item.delta}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 cyber-border relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <img src="/brahan-seer.jpg" alt="Brahan Seer" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <Zap size={18} className="text-[var(--sovereign-gold)]" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Forensic Logic Engine</h3>
            </div>
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl font-terminal text-[10px] text-slate-400 leading-relaxed">
              <div className="flex items-center space-x-2 mb-2 text-[var(--emerald-primary)]">
                <ShieldCheck size={12} />
                <span className="font-black uppercase tracking-widest">Validation_Active</span>
              </div>
              <p>
                System is currently cross-referencing NSTA ArcGIS portal data with WellTegra Harvester v2.5 physics models. 
                <br /><br />
                <span className="text-white">Current Findings:</span> Aggregated production reports show a systematic over-reporting of ~10.2% across the Stella and Viking fields. Geolocation drift in Viking-X exceeds 15m, suggesting a potential datum-shift error in the operator's 2024 submission.
                <br /><br />
                <span className="text-[var(--sovereign-gold)]">Recommendation:</span> Initiate Sovereign Veto Protocol for Viking-X and Stella-001.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForensicDeltaSummary;
