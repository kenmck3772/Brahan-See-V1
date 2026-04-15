
import React, { useState } from 'react';
import { 
  ResponsiveContainer, ComposedChart, CartesianGrid, 
  XAxis, YAxis, Tooltip, Area, Line, ReferenceLine, ReferenceArea, Legend,
  Cell
} from 'recharts';
import { Target, Crosshair, AlertOctagon, Info, AlertTriangle } from 'lucide-react';
import { SignalMetadata, SyncAnomaly } from './GhostSync';

interface SyncMonitorChartProps {
  combinedData: any[];
  signals: SignalMetadata[];
  viewMode: 'OVERLAY' | 'DIFFERENTIAL';
  ghostLabel: string;
  validationError: string | null;
  offset: number;
  anomalies?: SyncAnomaly[];
  onToggleSignal: (dataKey: string) => void;
  onAnomalyClick?: (anomaly: SyncAnomaly) => void;
  selectedAnomalyId?: string | null;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 border border-[var(--emerald-primary)]/30 bg-slate-950/90 shadow-[0_0_20px_rgba(0,0,0,0.5)] cyber-border min-w-[140px] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[var(--emerald-primary)]/20 pb-1.5 mb-2">
          <span className="text-[10px] font-black text-[var(--emerald-primary)] uppercase tracking-widest text-glow-emerald">Depth_Locus</span>
          <span className="text-[10px] font-terminal font-black text-white">{label.toFixed(2)}m</span>
        </div>
        <div className="space-y-1.5">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: item.color }}></div>
                <span className="text-[9px] font-black text-emerald-100/60 uppercase tracking-tighter truncate max-w-[80px]">{item.name}</span>
              </div>
              <span className="text-[10px] font-terminal font-black text-white">{item.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-1.5 border-t border-[var(--emerald-primary)]/10 flex items-center justify-between opacity-40">
          <span className="text-[7px] font-black uppercase tracking-widest">Status:</span>
          <span className="text-[7px] font-black uppercase tracking-widest">Nominal</span>
        </div>
      </div>
    );
  }
  return null;
};

const SyncMonitorChart: React.FC<SyncMonitorChartProps> = ({ 
  combinedData, 
  signals, 
  viewMode, 
  ghostLabel, 
  validationError,
  offset,
  anomalies = [],
  onToggleSignal,
  onAnomalyClick,
  selectedAnomalyId
}) => {
  const [activeDepth, setActiveDepth] = useState<number | null>(null);
  const [activePayload, setActivePayload] = useState<any>(null);

  const handleLegendClick = (e: any) => {
    if (e && e.dataKey) {
      onToggleSignal(e.dataKey);
    }
  };

  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    
    // Check if this point is within any anomaly
    const anomaly = anomalies.find(a => payload.depth >= a.startDepth && payload.depth <= a.endDepth);

    if (anomaly) {
      const isSelected = selectedAnomalyId === anomaly.id;
      const isCritical = anomaly.severity === 'CRITICAL';
      const isValid = anomaly.status === 'VALID';
      const isInvalid = anomaly.status === 'INVALID';
      
      let color = isCritical ? '#ef4444' : '#f97316';
      if (isValid) color = '#10b981';
      if (isInvalid) color = '#64748b'; // Muted slate for invalid
      
      return (
        <g 
          key={`dot-${payload.depth}`}
          className={`cursor-pointer group transition-all duration-300 ${isSelected ? 'scale-125' : ''} ${isInvalid ? 'opacity-40' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onAnomalyClick && onAnomalyClick(anomaly);
          }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          {/* Pinging ring */}
          {!isInvalid && (
            <circle 
              cx={cx} 
              cy={cy} 
              r={isSelected ? (isCritical ? 12 : 10) : (isCritical ? 8 : 6)} 
              fill="none"
              stroke={color} 
              strokeWidth={isSelected ? 3 : 2} 
              className={isCritical ? 'animate-ping duration-1000' : 'animate-pulse duration-1000'}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          )}
          {/* Static center dot */}
          <circle 
            cx={cx} 
            cy={cy} 
            r={isSelected ? 6 : 4} 
            fill={isSelected ? '#ffffff' : color} 
            stroke={isSelected ? color : "#ffffff"} 
            strokeWidth={1.5} 
            className="group-hover:r-6 transition-all duration-200"
          />
        </g>
      );
    }
    
    return null;
  };

  const minDepth = combinedData.length > 0 ? Math.min(...combinedData.map(d => d.depth)) : 0;
  const maxDepth = combinedData.length > 0 ? Math.max(...combinedData.map(d => d.depth)) : 100;

  return (
    <div className="flex-1 min-h-0 bg-[var(--slate-abyssal)]/40 rounded-xl border border-[var(--emerald-primary)]/10 p-4 relative group overflow-hidden flex flex-col shadow-inner cyber-border glass-panel hover:bg-[var(--slate-abyssal)]/60 transition-colors duration-500">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--emerald-primary)]/20 to-transparent opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--emerald-primary)]/20 to-transparent opacity-50"></div>
      
      <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2">
        <div className="flex items-center space-x-2 bg-slate-900/90 border border-[var(--emerald-primary)]/20 px-3 py-1 rounded shadow-lg glass-panel cyber-border">
          <Target size={12} className="text-[var(--emerald-primary)] animate-pulse text-glow-emerald" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--emerald-primary)] text-glow-emerald">Trace_Lock_Active</span>
        </div>
        {validationError && (
          <div className="text-[9px] font-black text-orange-500 bg-orange-500/10 border border-orange-500/30 px-3 py-1 uppercase animate-in fade-in slide-in-from-left-4 backdrop-blur-md glass-panel shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            {validationError}
          </div>
        )}
        {anomalies.length > 0 && (
          <div className="text-[9px] font-black text-[var(--alert-red)] bg-[var(--alert-red)]/10 border border-[var(--alert-red)]/30 px-3 py-1 uppercase animate-in fade-in slide-in-from-left-4 duration-500 backdrop-blur-md glass-panel shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            {anomalies.length} Forensic Anomalies Identified
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-20 flex flex-col items-end space-y-1">
        {activeDepth && (
          <div className="bg-[var(--emerald-primary)]/90 border border-emerald-400 px-3 py-1 rounded shadow-2xl animate-in fade-in slide-in-from-right-4 glass-panel cyber-border">
            <span className="text-[10px] font-terminal font-black text-slate-950 tracking-widest uppercase flex items-center">
              <Crosshair size={10} className="mr-1.5" /> DEPTH: {activeDepth.toFixed(2)}m
            </span>
          </div>
        )}
        {activeDepth && Math.abs(offset) > 0.01 && (
          <div className="bg-orange-500/90 border border-orange-400 px-3 py-1 rounded shadow-2xl animate-in fade-in slide-in-from-right-4 delay-75 glass-panel cyber-border">
            <span className="text-[10px] font-terminal font-black text-slate-950 tracking-widest uppercase">GHOST_REF: {(activeDepth + offset).toFixed(2)}m</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 relative min-h-[200px] mt-12">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={combinedData} 
            onMouseMove={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                setActiveDepth(state.activePayload[0].payload.depth);
                setActivePayload(state.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => {
              setActiveDepth(null);
              setActivePayload(null);
            }}
            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
          >
            <defs>
              <linearGradient id="dataFlowGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--emerald-primary)" stopOpacity={0}>
                  <animate attributeName="stop-opacity" values="0;0.1;0" dur="6s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="var(--emerald-primary)" stopOpacity={0.08}>
                  <animate attributeName="stop-opacity" values="0.04;0.12;0.04" dur="6s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="var(--emerald-primary)" stopOpacity={0}>
                  <animate attributeName="stop-opacity" values="0;0.1;0" dur="6s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
              <linearGradient id="ghostFlowGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FF5F1F" stopOpacity={0}>
                  <animate attributeName="stop-opacity" values="0;0.08;0" dur="8s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#FF5F1F" stopOpacity={0.05}>
                  <animate attributeName="stop-opacity" values="0.02;0.1;0.02" dur="8s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#FF5F1F" stopOpacity={0}>
                  <animate attributeName="stop-opacity" values="0;0.08;0" dur="8s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--emerald-primary)" opacity={0.05} vertical={false} />
            <XAxis 
              dataKey="depth" 
              stroke="var(--emerald-primary)" 
              fontSize={9} 
              axisLine={{stroke: 'var(--emerald-primary)', strokeOpacity: 0.2}} 
              tickLine={{stroke: 'var(--emerald-primary)', strokeOpacity: 0.2}} 
              tick={{fill: 'var(--emerald-primary)', opacity: 0.5, fontWeight: 900, fontFamily: 'JetBrains Mono'}}
              label={{ value: 'DEPTH (m)', position: 'bottom', offset: 0, fill: 'var(--emerald-primary)', opacity: 0.3, fontSize: 8, fontWeight: 'black', letterSpacing: 2 }}
            />
            <YAxis 
              stroke="var(--emerald-primary)" 
              fontSize={9} 
              axisLine={{stroke: 'var(--emerald-primary)', strokeOpacity: 0.2}} 
              tickLine={{stroke: 'var(--emerald-primary)', strokeOpacity: 0.2}} 
              tick={{fill: 'var(--emerald-primary)', opacity: 0.5, fontWeight: 900, fontFamily: 'JetBrains Mono'}}
              label={{ value: 'GAMMA RAY (API)', angle: -90, position: 'insideLeft', fill: 'var(--emerald-primary)', opacity: 0.3, fontSize: 8, fontWeight: 'black', letterSpacing: 2 }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: 'var(--emerald-primary)', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.5 }} 
            />
            <Legend 
              onClick={handleLegendClick}
              verticalAlign="bottom" 
              align="center" 
              iconType="plainline"
              wrapperStyle={{ paddingTop: '20px', fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', cursor: 'pointer', letterSpacing: '1px' }}
            />
            
            {/* Background Flow Gradient */}
            <ReferenceArea 
              x1={minDepth} 
              x2={maxDepth} 
              fill="url(#dataFlowGradient)" 
              fillOpacity={1}
              stroke="none"
            />

            {Math.abs(offset) > 0.05 && combinedData.length > 0 && (
              <ReferenceArea 
                x1={combinedData[0].depth} 
                x2={combinedData[0].depth + offset} 
                fill="url(#ghostFlowGradient)" 
                fillOpacity={1}
                stroke="#FF5F1F"
                strokeOpacity={0.1}
                strokeDasharray="4 2"
              />
            )}

            {/* Anomaly Highlight Areas */}
            {anomalies.map(anomaly => {
              const isSelected = selectedAnomalyId === anomaly.id;
              const isCritical = anomaly.severity === 'CRITICAL';
              const isValid = anomaly.status === 'VALID';
              const isInvalid = anomaly.status === 'INVALID';
              
              let color = isCritical ? 'var(--alert-red)' : '#f97316';
              if (isValid) color = '#10b981';
              if (isInvalid) color = '#64748b';

              const labelText = isInvalid ? 'INVALIDATED' : isValid ? 'VALIDATED_TRUTH' : (isCritical ? 'CRITICAL_ANOMALY' : 'FORENSIC_WARNING');
              const labelWidth = isInvalid ? 70 : isValid ? 90 : (isCritical ? 80 : 70);
              
              return (
                <React.Fragment key={anomaly.id}>
                  <ReferenceArea
                    x1={anomaly.startDepth}
                    x2={anomaly.endDepth}
                    fill={color}
                    fillOpacity={isInvalid ? 0.05 : (isSelected ? 0.4 : 0.15)}
                    stroke={color}
                    strokeOpacity={isInvalid ? 0.2 : (isSelected ? 1 : 0.4)}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeDasharray={isInvalid ? "5 5" : (isSelected ? "none" : "3 3")}
                    onClick={() => onAnomalyClick && onAnomalyClick(anomaly)}
                    style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                  />
                  
                  {/* Vertical Marker Line at Start */}
                  <ReferenceLine 
                    x={anomaly.startDepth} 
                    stroke={color} 
                    strokeWidth={isSelected ? 3 : 1}
                    strokeOpacity={isInvalid ? 0.3 : 0.8}
                    label={({ viewBox }) => {
                      if (!viewBox) return null;
                      const { x, y } = viewBox;
                      const topY = y + 15;
                      
                      return (
                        <g 
                          className={`cursor-pointer group ${isInvalid ? 'opacity-50' : ''}`} 
                          onClick={(e) => {
                            e.stopPropagation();
                            onAnomalyClick && onAnomalyClick(anomaly);
                          }}
                        >
                          {/* Marker Flag */}
                          <path 
                            d={`M${x},${topY} L${x + 10},${topY - 5} L${x + labelWidth + 20},${topY - 5} L${x + labelWidth + 20},${topY + 15} L${x + 10},${topY + 15} Z`} 
                            fill={color} 
                            fillOpacity={0.9}
                            stroke="#ffffff"
                            strokeWidth={isSelected ? 2 : 1}
                            className="filter drop-shadow-lg"
                          />
                          <text 
                            x={x + 15} 
                            y={topY + 7} 
                            fill="#ffffff" 
                            fontSize="8" 
                            fontWeight="black" 
                            className="uppercase tracking-tighter pointer-events-none"
                          >
                            {labelText}
                          </text>
                          {isSelected && !isInvalid && (
                            <circle cx={x} cy={topY + 5} r="4" fill="#ffffff" className="animate-ping" />
                          )}
                        </g>
                      );
                    }}
                  />
                </React.Fragment>
              );
            })}

            {/* Forensic Crosshair - Vertical (Current Depth) */}
            {activeDepth !== null && (
              <ReferenceLine 
                x={activeDepth} 
                stroke="var(--emerald-primary)" 
                strokeWidth={1}
                strokeOpacity={0.6}
                label={{ value: 'LOCUS', position: 'top', fill: 'var(--emerald-primary)', fontSize: 8, fontWeight: 'bold' }}
              />
            )}

            {viewMode === 'DIFFERENTIAL' && (
              <Area type="monotone" dataKey="diff" stroke="none" fill="var(--alert-red)" fillOpacity={0.1} isAnimationActive={false} />
            )}

            {signals.find(s => s.id === 'SIG-001')?.visible && (
              <Line 
                type="monotone" 
                dataKey="baseGR" 
                name="BASE_LOG" 
                stroke="var(--emerald-primary)" 
                dot={renderCustomDot} 
                strokeWidth={2} 
                isAnimationActive={false}
                activeDot={{ r: 6, fill: 'var(--emerald-primary)', stroke: '#ffffff', strokeWidth: 2 }}
                filter="url(#glow)"
              />
            )}
            {signals.find(s => s.id === 'SIG-002')?.visible && (
              <Line 
                key={ghostLabel}
                type="monotone" 
                dataKey="ghostGR" 
                name={ghostLabel} 
                stroke="#FF5F1F" 
                dot={renderCustomDot} 
                strokeWidth={2} 
                strokeDasharray="5 3" 
                isAnimationActive={false}
                activeDot={{ r: 6, fill: '#FF5F1F', stroke: '#ffffff', strokeWidth: 2 }}
                filter="url(#glow)"
              />
            )}
            {signals.map(sig => {
              if (sig.id !== 'SIG-001' && sig.id !== 'SIG-002' && sig.visible) {
                return (
                  <Line 
                    key={sig.id} 
                    type="monotone" 
                    dataKey={sig.id} 
                    name={sig.name}
                    stroke={sig.color} 
                    dot={renderCustomDot} 
                    strokeWidth={1.5} 
                    isAnimationActive={false}
                    activeDot={{ r: 5, fill: sig.color, stroke: '#ffffff', strokeWidth: 1.5 }}
                    filter="url(#glow)"
                  />
                );
              }
              return null;
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="absolute bottom-4 left-4 flex items-center space-x-4 pointer-events-none opacity-40">
        <div className="flex items-center space-x-2">
           <div className="w-3 h-0.5 bg-[var(--emerald-primary)] shadow-[0_0_5px_var(--emerald-primary)]"></div>
           <span className="text-[8px] font-black uppercase text-[var(--emerald-primary)] text-glow-emerald">BASE_TRACE</span>
        </div>
        <div className="flex items-center space-x-2">
           <div className="w-3 h-0.5 bg-orange-500 border-t border-dashed border-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]"></div>
           <span className="text-[8px] font-black uppercase text-orange-400 text-glow-gold">SHIFTED_ARTIFACT</span>
        </div>
      </div>

      {/* Decorative Corner Accents */}
      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
        <div className="absolute top-2 right-2 w-8 h-[1px] bg-[var(--emerald-primary)]/30"></div>
        <div className="absolute top-2 right-2 w-[1px] h-8 bg-[var(--emerald-primary)]/30"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none overflow-hidden">
        <div className="absolute bottom-2 left-2 w-8 h-[1px] bg-[var(--emerald-primary)]/30"></div>
        <div className="absolute bottom-2 left-2 w-[1px] h-8 bg-[var(--emerald-primary)]/30"></div>
      </div>
    </div>
  );
};

export default SyncMonitorChart;
