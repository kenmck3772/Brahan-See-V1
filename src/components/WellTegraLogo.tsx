import React from 'react';

interface WellTegraLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'cyan' | 'emerald' | 'default' | 'monochrome';
  showText?: boolean;
}

export const WellTegraLogo: React.FC<WellTegraLogoProps> = ({
  className = '',
  size = 100,
  variant = 'default',
  showText = false
}) => {
  // Determine color palettes based on variant
  const getColors = () => {
    switch (variant) {
      case 'cyan':
        return {
          networkNode: 'rgba(34, 211, 238, 0.85)', // cyan-400
          networkLine: 'rgba(34, 211, 238, 0.25)',
          rigFill: '#0e7490', // cyan-700
          rigStroke: 'rgba(34, 211, 238, 0.4)',
          glowColor: 'rgba(34, 211, 238, 0.4)'
        };
      case 'emerald':
        return {
          networkNode: 'rgba(52, 211, 153, 0.85)', // emerald-400
          networkLine: 'rgba(52, 211, 153, 0.25)',
          rigFill: '#047857', // emerald-700
          rigStroke: 'rgba(52, 211, 153, 0.4)',
          glowColor: 'rgba(52, 211, 153, 0.4)'
        };
      case 'monochrome':
        return {
          networkNode: '#ffffff',
          networkLine: 'rgba(255, 255, 255, 0.2)',
          rigFill: '#cccccc',
          rigStroke: 'rgba(255, 255, 255, 0.5)',
          glowColor: 'rgba(255, 255, 255, 0.3)'
        };
      case 'default':
      default:
        // High fidelity cyber-emerald and cyan combo from the uploading visuals
        return {
          networkNode: 'rgba(56, 189, 248, 0.9)', // sky-400
          networkLine: 'rgba(56, 189, 248, 0.3)',
          rigFill: '#06172e', // Very deep navy
          rigStroke: 'rgba(16, 185, 129, 0.75)', // emerald-500
          glowColor: 'rgba(16, 185, 129, 0.3)'
        };
    }
  };

  const colors = getColors();

  // Define network nodes (x, y, r) for the side profile neural head
  const nodes = [
    { id: 'n1', x: 75, y: 12, r: 4 },   // top back
    { id: 'n2', x: 92, y: 17, r: 4.5 }, // top front
    { id: 'n3', x: 108, y: 38, r: 5 },  // forehead
    { id: 'n4', x: 112, y: 48, r: 3.5 }, // nose bridge
    { id: 'n5', x: 118, y: 52, r: 4 },  // nose tip
    { id: 'n6', x: 110, y: 58, r: 3.5 }, // under nose
    { id: 'n7', x: 114, y: 63, r: 4 },  // lips
    { id: 'n8', x: 109, y: 72, r: 5 },  // chin
    { id: 'n9', x: 95, y: 84, r: 4.5 }, // jaw line
    { id: 'n10', x: 84, y: 94, r: 4 },  // neck front
    
    // Internal brain nodes
    { id: 'n11', x: 58, y: 28, r: 4.5 }, // back head
    { id: 'n12', x: 50, y: 50, r: 5 },   // middle back
    { id: 'n13', x: 55, y: 72, r: 4 },   // lower back
    { id: 'n14', x: 76, y: 32, r: 3.5 }, // cerebral
    { id: 'n15', x: 92, y: 34, r: 4 },   // frontal l.
    { id: 'n16', x: 70, y: 50, r: 5 },   // mid core
    { id: 'n17', x: 90, y: 52, r: 4.5 }, // sensory
    { id: 'n18', x: 82, y: 68, r: 4 },   // lower core
    { id: 'n19', x: 98, y: 66, r: 4.5 }  // lower front
  ];

  // Interconnection matrix for network connections mapping
  const connections = [
    ['n1', 'n2'], ['n2', 'n3'], ['n3', 'n4'], ['n4', 'n5'], ['n5', 'n6'], 
    ['n6', 'n7'], ['n7', 'n8'], ['n8', 'n9'], ['n9', 'n10'],
    ['n1', 'n11'], ['n11', 'n12'], ['n12', 'n13'], ['n13', 'n9'],
    ['n14', 'n1'], ['n14', 'n2'], ['n14', 'n15'], ['n15', 'n3'],
    ['n16', 'n11'], ['n16', 'n12'], ['n16', 'n14'], ['n16', 'n18'],
    ['n17', 'n15'], ['n17', 'n16'], ['n17', 'n19'], ['n19', 'n8'],
    ['n18', 'n13'], ['n18', 'n19'], ['n18', 'n10']
  ];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 135 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="select-none filter drop-shadow-[0_0_8px_rgba(16,185,129,0.15)]"
      >
        <defs>
          {/* Flame gradient */}
          <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="1" />
          </linearGradient>

          {/* Network gradient fill */}
          <linearGradient id="netJointGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. COGNITIVE FACE LAYER - INTERCONNECTED NEURAL NET (Behind Rig) */}
        <g id="face-network" className="opacity-80">
          {/* Wireframe connections */}
          {connections.map(([fromId, toId], idx) => {
            const start = nodes.find(n => n.id === fromId);
            const end = nodes.find(n => n.id === toId);
            if (!start || !end) return null;
            return (
              <line
                key={`c-${idx}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={colors.networkLine}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            );
          })}

          {/* Glowing Neural Joints / Nodes */}
          {nodes.map((node) => (
            <g key={node.id} className="transition-all duration-300">
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r + 1.5}
                fill="url(#netJointGrad)"
                className="opacity-20 animate-pulse"
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill="url(#netJointGrad)"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="0.5"
              />
            </g>
          ))}
        </g>

        {/* 2. OFFSHORE DRILLING OIL RIG SILHOUETTE (Foreground overlaid) */}
        <g id="oil-rig" className="transition-all duration-300">
          {/* Sea / Water baseline ripples */}
          <path
            d="M 12 94 C 30 92, 50 95, 70 93 C 90 92, 110 95, 125 93"
            stroke={colors.rigStroke}
            strokeWidth="1.5"
            fill="none"
            opacity="0.45"
            strokeDasharray="4 3"
          />
          <path
            d="M 18 97 C 40 96, 65 98, 90 96 C 110 97, 120 95, 128 97"
            stroke={colors.rigStroke}
            strokeWidth="1.0"
            fill="none"
            opacity="0.25"
            strokeDasharray="2 2"
          />

          {/* Substructure Columns/Pillars */}
          {/* Middle pillar */}
          <rect x="58" y="70" width="8" height="24" fill={colors.rigFill} stroke={colors.rigStroke} strokeWidth="1" />
          {/* Left pillar */}
          <rect x="36" y="70" width="6" height="24" fill={colors.rigFill} stroke={colors.rigStroke} strokeWidth="1" />
          {/* Right pillar */}
          <rect x="80" y="70" width="6" height="24" fill={colors.rigFill} stroke={colors.rigStroke} strokeWidth="1" />

          {/* Structural X-Bracing beams */}
          <line x1="42" y1="71" x2="58" y2="93" stroke={colors.rigStroke} strokeWidth="1" />
          <line x1="58" y1="71" x2="42" y2="93" stroke={colors.rigStroke} strokeWidth="1" />
          <line x1="66" y1="71" x2="80" y2="93" stroke={colors.rigStroke} strokeWidth="1" />
          <line x1="80" y1="71" x2="66" y2="93" stroke={colors.rigStroke} strokeWidth="1" />

          {/* Main Deck Horizontal Platform */}
          <rect x="22" y="64" width="78" height="7" rx="1.5" fill={colors.rigFill} stroke={colors.rigStroke} strokeWidth="1.2" />
          
          {/* Deck Handrails */}
          <line x1="24" y1="60" x2="98" y2="60" stroke={colors.rigStroke} strokeWidth="0.8" opacity="0.6" />
          {getVerticalRailings(24, 98, 60, 64)}

          {/* Central Derrick Tower (Derrick structure) */}
          <path
            d="M 45 64 L 49 18 L 55 18 L 59 64 Z"
            fill={colors.rigFill}
            stroke={colors.rigStroke}
            strokeWidth="1.2"
          />
          {/* Derrick internal cross lines */}
          <line x1="49" y1="18" x2="55" y2="18" stroke={colors.rigStroke} strokeWidth="1" />
          <line x1="45" y1="64" x2="59" y2="64" stroke={colors.rigStroke} strokeWidth="1" />
          
          {/* Inner lattices */}
          <line x1="48" y1="28" x2="56" y2="28" stroke={colors.rigStroke} strokeWidth="0.8" />
          <line x1="47" y1="40" x2="57" y2="40" stroke={colors.rigStroke} strokeWidth="0.8" />
          <line x1="46" y1="52" x2="58" y2="52" stroke={colors.rigStroke} strokeWidth="0.8" />

          {/* X cross brace lattice tower */}
          <line x1="49" y1="18" x2="56" y2="28" stroke={colors.rigStroke} strokeWidth="0.8" />
          <line x1="55" y1="18" x2="48" y2="28" stroke={colors.rigStroke} strokeWidth="0.8" />
          <line x1="48" y1="28" x2="57" y2="40" stroke={colors.rigStroke} strokeWidth="0.8" />
          <line x1="56" y1="28" x2="47" y2="40" stroke={colors.rigStroke} strokeWidth="0.8" />
          <line x1="47" y1="40" x2="58" y2="52" stroke={colors.rigStroke} strokeWidth="0.8" />
          <line x1="57" y1="40" x2="46" y2="52" stroke={colors.rigStroke} strokeWidth="0.8" />
          <line x1="46" y1="52" x2="59" y2="64" stroke={colors.rigStroke} strokeWidth="0.8" />
          <line x1="58" y1="52" x2="45" y2="64" stroke={colors.rigStroke} strokeWidth="0.8" />

          {/* Derrick Crown flare tip */}
          <circle cx="52" cy="18" r="1.5" fill={colors.networkNode} />
          
          {/* High-tech Gas flare emission stack & Flame animation */}
          <line x1="52" y1="18" x2="52" y2="10" stroke={colors.rigStroke} strokeWidth="1.2" />
          <path
            d="M 52 10 Q 48 5, 52 0 Q 56 5, 52 10 Z"
            fill="url(#flameGrad)"
            className="animate-pulse origin-bottom"
            style={{ transformBox: 'fill-box', transformOrigin: 'bottom center' }}
          />

          {/* Left Outrigger Crane Assembly */}
          <path
            d="M 30 64 L 10 44 L 14 42 L 34 64 Z"
            fill={colors.rigFill}
            stroke={colors.rigStroke}
            strokeWidth="1"
          />
          {/* Crane cable line */}
          <line x1="12" y1="43" x2="12" y2="68" stroke={colors.rigStroke} strokeWidth="0.8" />
          <rect x="10" y="68" width="4" height="3" fill={colors.rigStroke} />

          {/* Right Superstructure cabin housing & silos */}
          <rect x="66" y="47" width="12" height="13" fill={colors.rigFill} stroke={colors.rigStroke} strokeWidth="1" />
          <rect x="78" y="52" width="16" height="8" fill={colors.rigFill} stroke={colors.rigStroke} strokeWidth="1" />
          
          {/* Storage Silos */}
          <rect x="68" y="37" width="4" height="10" rx="1" fill={colors.rigFill} stroke={colors.rigStroke} strokeWidth="0.8" />
          <rect x="73" y="37" width="4" height="10" rx="1" fill={colors.rigFill} stroke={colors.rigStroke} strokeWidth="0.8" />

          {/* Heliport landing circular wing */}
          <line x1="94" y1="56" x2="108" y2="56" stroke={colors.rigStroke} strokeWidth="1.2" />
          <path d="M 98 56 L 103 62 L 107 56" fill="none" stroke={colors.rigStroke} strokeWidth="0.8" />
          <rect x="101" y="54" width="4" height="2" fill="currentColor" opacity="0.8" />
        </g>
      </svg>

      {/* Embedded Title Branding Text underneath the logo */}
      {showText && (
        <div className="text-center font-sans tracking-wide mt-2">
          <div className="font-extrabold text-sm text-white select-all tracking-widest uppercase">
            Well-Tegra
          </div>
          <div className="text-[7.5px] text-cyan-400 font-bold tracking-widest uppercase opacity-85 select-none mt-0.5">
            DATA SOLUTIONS
          </div>
        </div>
      )}
    </div>
  );
};

// Helper inside file for vertical railing bars
function getVerticalRailings(start: number, end: number, y1: number, y2: number) {
  const rails = [];
  const count = 10;
  const step = (end - start) / count;
  for (let i = 0; i <= count; i++) {
    const x = start + i * step;
    rails.push(
      <line
        key={`rail-${i}`}
        x1={x}
        y1={y1}
        x2={x}
        y2={y2}
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.5"
      />
    );
  }
  return <>{rails}</>;
}
