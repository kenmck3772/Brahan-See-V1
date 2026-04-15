import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface ProvenanceTooltipProps {
  source: string;
  validator: string;
  timestamp: string;
  children: React.ReactNode;
}

const ProvenanceTooltip: React.FC<ProvenanceTooltipProps> = ({ source, validator, timestamp, children }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center group cursor-help"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 border border-emerald-500/30 rounded-lg shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center space-x-2 mb-2 border-b border-slate-800 pb-2">
            <Info size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Data Provenance</span>
          </div>
          <div className="space-y-1.5 font-mono text-[9px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Source:</span>
              <span className="text-slate-300">{source}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Validator:</span>
              <span className="text-emerald-500">{validator}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Timestamp:</span>
              <span className="text-slate-400">{timestamp}</span>
            </div>
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-emerald-500/30 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default ProvenanceTooltip;
