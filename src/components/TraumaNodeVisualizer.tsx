import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Radio, RefreshCw, Zap, History } from 'lucide-react';

interface TraumaNodeVisualizerProps {
  currentNodeName: string;
  traumaLevel: number; // 0 to 100
  anomalies: string[];
}

export const TraumaNodeVisualizer: React.FC<TraumaNodeVisualizerProps> = ({
  currentNodeName,
  traumaLevel,
  anomalies
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [showThreshold, setShowThreshold] = useState(true);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [pulseScale, setPulseScale] = useState(1.0);
  const angleRef = useRef(0);
  const sweepRingYRef = useRef(0);

  const [nodeHistories, setNodeHistories] = useState<Record<string, number[]>>({});

  // Core historic sync and baseline generator on node load
  useEffect(() => {
    if (!currentNodeName) return;

    setNodeHistories(prev => {
      if (prev[currentNodeName]) {
        const existing = prev[currentNodeName];
        if (existing[existing.length - 1] !== traumaLevel) {
          const updated = [...existing, traumaLevel].slice(-15);
          return { ...prev, [currentNodeName]: updated };
        }
        return prev;
      }

      // Generate seed trauma levels leading up to the current level
      const baseline = [];
      const count = 12;
      for (let i = 0; i < count; i++) {
        const progression = (i / (count - 1)); // 0 to 1
        const noise = (Math.sin(i * 1.8) * 4) + (Math.cos(i * 1.1) * 2);
        // Smooth transition towards current trauma value
        const val = Math.min(100, Math.max(0, Math.round(
          traumaLevel * (0.7 + progression * 0.3) + noise
        )));
        baseline.push(val);
      }
      baseline[baseline.length - 1] = traumaLevel;

      return {
        ...prev,
        [currentNodeName]: baseline
      };
    });
  }, [currentNodeName, traumaLevel]);

  // Periodic stress fluctuations simulation to make the dashboard live & vibrant
  useEffect(() => {
    if (!currentNodeName) return;

    const interval = setInterval(() => {
      setNodeHistories(prev => {
        const existing = prev[currentNodeName] || [traumaLevel];
        const lastVal = existing[existing.length - 1];
        
        // Dynamic regression toward current nominal level, plus telemetry jitter
        const delta = (traumaLevel - lastVal) * 0.18;
        const drift = (Math.random() - 0.5) * 5;
        const nextVal = Math.min(100, Math.max(0, Math.round(lastVal + delta + drift)));
        
        const updated = [...existing, nextVal].slice(-15);
        return {
          ...prev,
          [currentNodeName]: updated
        };
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [currentNodeName, traumaLevel]);

  // Historical calculations
  const currentHistory = nodeHistories[currentNodeName] || [];
  const peakStress = currentHistory.length > 0 ? Math.max(...currentHistory) : traumaLevel;
  const avgStress = currentHistory.length > 0 ? Math.round(currentHistory.reduce((a, b) => a + b, 0) / currentHistory.length) : traumaLevel;

  // Chart setup
  const chartWidth = 330;
  const chartHeight = 70;
  const padLeft = 24;
  const padRight = 8;
  const padTop = 10;
  const padBottom = 16;
  const graphW = chartWidth - padLeft - padRight;
  const graphH = chartHeight - padTop - padBottom;
  
  const chartPoints = useMemo(() => {
    if (currentHistory.length === 0) return [];
    return currentHistory.map((val, idx) => {
      const x = padLeft + (idx / Math.max(1, currentHistory.length - 1)) * graphW;
      const y = padTop + (1 - val / 100) * graphH;
      return { x, y, value: val };
    });
  }, [currentHistory, graphW, graphH, padLeft, padTop]);

  const linePathString = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return chartPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }, [chartPoints]);

  const areaPathString = useMemo(() => {
    if (chartPoints.length === 0 || !linePathString) return '';
    const lastX = chartPoints[chartPoints.length - 1].x;
    const firstX = chartPoints[0].x;
    const bottomY = padTop + graphH;
    return `${linePathString} L ${lastX.toFixed(1)} ${bottomY.toFixed(1)} L ${firstX.toFixed(1)} ${bottomY.toFixed(1)} Z`;
  }, [chartPoints, linePathString, padTop, graphH]);

  // Animate pulse scale using requestAnimationFrame loop
  useEffect(() => {
    let animId: number;
    let tickCount = 0;

    const animatePulse = () => {
      tickCount += 0.05 + (traumaLevel / 1000); // Shakes/pulses faster at high trauma
      const breathingScale = 1.0 + Math.sin(tickCount) * (0.05 + (traumaLevel / 600));
      setPulseScale(breathingScale);
      animId = requestAnimationFrame(animatePulse);
    };

    animatePulse();
    return () => cancelAnimationFrame(animId);
  }, [traumaLevel]);

  // Main Canvas Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      // Clear canvas with trace tail (to create a trails effect)
      ctx.fillStyle = 'rgba(2, 6, 23, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Node coordinates (central holographic sphere)
      const centerX = width / 2;
      const centerY = height / 2;
      const coreRadius = 45 * pulseScale;

      // Draw scanner grid lines in the background
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Rotate angle multiplier
      if (isRotating) {
        angleRef.current += 0.008 + (traumaLevel / 5000);
      }

      // Calculate Trauma color scheme
      const isCritical = traumaLevel > 70;
      const themeColor = isCritical ? 'rgba(239, 68, 68,' : 'rgba(16, 185, 129,';

      // 1. Draw Orbit Elements / Electron Rings
      const ringCount = 3;
      for (let i = 0; i < ringCount; i++) {
        const radiusX = 100 + i * 25;
        const radiusY = 30 + i * 10;
        const rollAngle = (angleRef.current + (i * Math.PI / ringCount)) % (2 * Math.PI);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(i * Math.PI / ringCount + (angleRef.current * 0.1));
        
        ctx.strokeStyle = `${themeColor} ${0.1 + (i * 0.08)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw node orbiting markers on the ring
        const dotX = radiusX * Math.cos(rollAngle);
        const dotY = radiusY * Math.sin(rollAngle);
        
        // Draw specular orb
        const glow = ctx.createRadialGradient(dotX, dotY, 1, dotX, dotY, 8);
        glow.addColorStop(0, '#ffffff');
        glow.addColorStop(0.3, isCritical ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 2. Draw automated scan sweep rings (SCAN_SWEEP_RING) that pass vertically
      sweepRingYRef.current += 1.8;
      if (sweepRingYRef.current > height) {
        sweepRingYRef.current = 0;
      }
      
      const sweepY = sweepRingYRef.current;
      const distanceToCenter = Math.abs(sweepY - centerY);
      
      if (distanceToCenter < 140) {
        // Calculate elastic distortion on sweep line
        const sweepW = Math.sqrt(Math.max(0, 140 * 140 - distanceToCenter * distanceToCenter)) * 1.5;
        ctx.strokeStyle = isCritical ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX - sweepW, sweepY);
        ctx.bezierCurveTo(centerX - sweepW / 2, sweepY + 12, centerX + sweepW / 2, sweepY - 12, centerX + sweepW, sweepY);
        ctx.stroke();

        // Subtly illuminate sweep contact zone
        ctx.fillStyle = isCritical ? 'rgba(239, 68, 68, 0.02)' : 'rgba(16, 185, 129, 0.02)';
        ctx.beginPath();
        ctx.ellipse(centerX, sweepY, sweepW, 8, 0, 0, 2 * Math.PI);
        ctx.fill();
      }

      // 3. Central TraumaNode Core Sphere
      // Base radial gradient with Fresnel specular illumination effect
      const grad = ctx.createRadialGradient(
        centerX - coreRadius * 0.3,
        centerY - coreRadius * 0.3,
        2,
        centerX,
        centerY,
        coreRadius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.2, isCritical ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)');
      grad.addColorStop(0.8, isCritical ? 'rgba(220, 38, 38, 0.25)' : 'rgba(4, 120, 87, 0.2)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 0.9)');

      ctx.fillStyle = grad;
      ctx.strokeStyle = isCritical ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Core details / internal mesh wireframe simulation inside sphere
      ctx.strokeStyle = isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 1;
      const countMesh = 8;
      for (let i = 0; i < countMesh; i++) {
        const factor = Math.sin(angleRef.current + i * (Math.PI / countMesh)) * coreRadius;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, coreRadius, Math.abs(factor), 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Pulsing external range shield
      ctx.strokeStyle = isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius * 1.5, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw technical coordinates overlays on overlay
      ctx.font = '9px monospace';
      ctx.fillStyle = isCritical ? 'rgba(239, 30, 30, 0.4)' : 'rgba(16, 185, 129, 0.4)';
      ctx.fillText(`VECTOR: +[(x:${centerX}, y:${centerY})]`, 15, 20);
      ctx.fillText(`STRESS: ${(traumaLevel).toFixed(1)}%`, 15, 32);
      ctx.fillText(`REFRESH_FREQ: 60Hz`, width - 110, 20);

      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrame);
  }, [currentNodeName, traumaLevel, isRotating, pulseScale]);

  return (
    <div className="bg-[#020617]/90 border border-emerald-500/20 rounded-md p-4 flex flex-col gap-3 scanline-glow relative flex-1">
      <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
        <h3 className="font-mono text-emerald-400 text-sm font-bold flex items-center gap-2 glow-text-emerald">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          TRAUMANODE 3D SCAN
        </h3>
        <button
          type="button"
          onClick={() => setIsRotating(!isRotating)}
          className={`p-1 rounded border border-emerald-500/20 hover:bg-emerald-500/15 text-xs text-emerald-400 font-mono flex items-center gap-1 transition-all ${
            isRotating ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : ''
          }`}
          title="Toggle Rig Rotation"
        >
          <RefreshCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
          {isRotating ? 'ROT_ACTIVE' : 'ROT_LOCK'}
        </button>
      </div>

      <div className="relative bg-black/50 border border-emerald-500/10 rounded flex-1 flex items-center justify-center overflow-hidden min-h-[220px]">
        <canvas
          ref={canvasRef}
          width={360}
          height={260}
          className="w-full h-full max-w-[360px] max-h-[260px] block"
        />

        {/* HUD Overlay details */}
        <div className="absolute top-2 right-2 pointer-events-none flex flex-col items-end font-mono">
          <span className="text-[10px] text-white/50">NODE_ID</span>
          <span className="text-[11px] text-emerald-400 glow-text-emerald font-semibold uppercase">{currentNodeName}</span>
        </div>

        <div className="absolute bottom-2 left-2 pointer-events-none flex items-center gap-2 font-mono">
          <div className={`w-2.5 h-2.5 rounded-full ${traumaLevel > 70 ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
          <span className={`text-[10px] ${traumaLevel > 70 ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
            STATUS: {traumaLevel > 70 ? 'HIGH_DISTRESS_ANOMALY' : 'DYNAMICS_STANDBY'}
          </span>
        </div>
      </div>

      {/* Historical trauma trend chart */}
      <div className="flex flex-col gap-1.5 font-mono bg-black/45 p-2 rounded border border-emerald-500/10 shadow-[inset_0_0_12px_rgba(16,185,129,0.02)]">
        <div className="flex items-center justify-between border-b border-emerald-500/10 pb-1.5">
          <span className="text-[10px] text-emerald-500/55 uppercase font-bold tracking-wider flex items-center gap-1">
            <History className="w-3.5 h-3.5 text-emerald-500/70" />
            TRAUMA STRESS COMPILATION
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowThreshold(!showThreshold)}
              className={`px-1.5 py-0.5 rounded border text-[8px] font-bold leading-none transition-all cursor-pointer uppercase ${
                showThreshold 
                  ? 'border-red-500/45 bg-red-950/20 text-red-400 hover:bg-red-950/35 hover:border-red-500/60' 
                  : 'border-emerald-500/20 bg-transparent text-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-500/70'
              }`}
              title="Toggle 70% distress limit threshold visuals"
            >
              LIMIT_70%: {showThreshold ? 'ACTIVE' : 'MUTED'}
            </button>
            <button
              type="button"
              onClick={() => setHighContrastMode(!highContrastMode)}
              className={`px-1.5 py-0.5 rounded border text-[8px] font-bold leading-none transition-all cursor-pointer uppercase ${
                highContrastMode 
                  ? 'border-cyan-400 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-950/50 hover:border-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)]' 
                  : 'border-emerald-500/20 bg-transparent text-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-500/70'
              }`}
              title="Toggle high-contrast neon visual mode"
              id="high-contrast-toggle"
            >
              HI-CONTRAST: {highContrastMode ? 'ACTIVE' : 'MUTED'}
            </button>
            <div className="flex items-center gap-1.5 text-[8px] bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/15">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400/80 font-bold uppercase tracking-wider">LIVE_INDEXING</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Metadata Stats bar */}
        <div className="grid grid-cols-3 gap-2 text-center text-[9px] py-1 border-b border-emerald-500/5 select-none text-emerald-500/80">
          <div className="flex flex-col items-center">
            <span className="text-white/40 uppercase text-[7.5px] scale-95 origin-center">PEAK_STRESS</span>
            <span className={`font-bold font-mono ${peakStress > 70 ? 'text-red-400' : 'text-emerald-400'}`}>{peakStress}%</span>
          </div>
          <div className="flex flex-col items-center border-l border-emerald-500/10">
            <span className="text-white/40 uppercase text-[7.5px] scale-95 origin-center">AVG_STRESS</span>
            <span className={`font-bold font-mono ${avgStress > 70 ? 'text-red-400' : 'text-emerald-400'}`}>{avgStress}%</span>
          </div>
          <div className="flex flex-col items-center border-l border-emerald-500/10">
            <span className="text-white/40 uppercase text-[7.5px] scale-95 origin-center">STABILITY</span>
            <span className={`font-bold font-mono ${traumaLevel > 70 ? 'text-red-400' : 'text-emerald-400'}`}>
              {traumaLevel > 70 ? 'UNSTABLE' : 'STABLE'}
            </span>
          </div>
        </div>

        {/* SVG historical graph */}
        <div className="relative pt-1 overflow-hidden select-none">
          <svg className="w-full h-[70px]" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="trendAreaGradGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.2)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0.0)" />
              </linearGradient>
              <linearGradient id="trendAreaGradRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(239, 68, 68, 0.2)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0.0)" />
              </linearGradient>
              <linearGradient id="trendAreaGradNeonCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(6, 182, 212, 0.45)" />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0.0)" />
              </linearGradient>
              <linearGradient id="trendAreaGradNeonPink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(236, 72, 153, 0.45)" />
                <stop offset="100%" stopColor="rgba(236, 72, 153, 0.0)" />
              </linearGradient>
            </defs>

            {/* Visual zones of safety and compromise */}
            {showThreshold && (
              <>
                {/* Compromised Zone (Above 70% stress) */}
                <rect 
                  x={padLeft}
                  y={padTop}
                  width={graphW}
                  height={graphH * 0.3}
                  fill={highContrastMode ? "rgba(236, 72, 153, 0.08)" : "rgba(239, 68, 68, 0.03)"}
                />
                {/* Safe Zone (Below 70% stress) */}
                <rect 
                  x={padLeft}
                  y={padTop + graphH * 0.3}
                  width={graphW}
                  height={graphH * 0.1}
                  fill={highContrastMode ? "rgba(6, 182, 212, 0.06)" : "rgba(16, 185, 129, 0.01)"}
                />
              </>
            )}

            {/* Threshold gridlines */}
            <line 
              x1={padLeft} 
              y1={padTop + graphH} 
              x2={chartWidth - padRight} 
              y2={padTop + graphH} 
              stroke={highContrastMode ? "rgba(34, 211, 238, 0.2)" : "rgba(16, 185, 129, 0.08)"} 
              strokeWidth="1" 
            />
            <line 
              x1={padLeft} 
              y1={padTop + graphH * 0.5} 
              x2={chartWidth - padRight} 
              y2={padTop + graphH * 0.5} 
              stroke={highContrastMode ? "rgba(34, 211, 238, 0.2)" : "rgba(16, 185, 129, 0.08)"} 
              strokeWidth="1" 
              strokeDasharray="2 3" 
            />
            {/* Warning threshold at 70% */}
            {showThreshold && (
              <>
                <line 
                  x1={padLeft} 
                  y1={padTop + graphH * 0.3} 
                  x2={chartWidth - padRight} 
                  y2={padTop + graphH * 0.3} 
                  stroke={highContrastMode ? "#ec4899" : "rgba(239, 68, 68, 0.5)"} 
                  strokeWidth={highContrastMode ? "1.5" : "1.2"} 
                  strokeDasharray="3 3" 
                />
                <text 
                  x={chartWidth - padRight - 4} 
                  y={padTop + graphH * 0.3 - 3} 
                  className={`${highContrastMode ? 'fill-pink-400 font-extrabold' : 'fill-red-400 font-bold'} text-[6px] font-mono select-none tracking-wider opacity-90`}
                  textAnchor="end"
                >
                  [ CRITICAL LIMIT 70% ]
                </text>
                <text 
                  x={padLeft + 4} 
                  y={padTop + graphH * 0.3 + 6} 
                  className={highContrastMode ? "fill-cyan-400 text-[5.5px] font-mono select-none tracking-wider font-bold" : "fill-emerald-400/40 text-[5.5px] font-mono select-none tracking-wider"}
                >
                  SECURE ZONE
                </text>
                <text 
                  x={padLeft + 4} 
                  y={padTop + graphH * 0.3 - 3} 
                  className={highContrastMode ? "fill-pink-400 text-[5.5px] font-mono select-none tracking-wider font-extrabold" : "fill-red-400/45 text-[5.5px] font-mono select-none tracking-wider font-bold"}
                >
                  COMPROMISE ZONE
                </text>
              </>
            )}
            <line 
              x1={padLeft} 
              y1={padTop} 
              x2={chartWidth - padRight} 
              y2={padTop} 
              stroke={highContrastMode ? "rgba(34, 211, 238, 0.2)" : "rgba(16, 185, 129, 0.08)"} 
              strokeWidth="1" 
            />

            {/* Y-axis scale value labels */}
            <text x="4" y={padTop + 3} className={highContrastMode ? "fill-cyan-400 font-bold text-[7px]" : "fill-emerald-500/35 text-[7px]"} fontFamily="monospace">100</text>
            <text x="4" y={padTop + graphH * 0.5 + 3} className={highContrastMode ? "fill-cyan-400 font-bold text-[7px]" : "fill-emerald-500/35 text-[7px]"} fontFamily="monospace">50</text>
            <text x="4" y={padTop + graphH + 3} className={highContrastMode ? "fill-cyan-400 font-bold text-[7px]" : "fill-emerald-500/35 text-[7px]"} fontFamily="monospace">0</text>

            {/* Main filled area */}
            {areaPathString && (
              <path 
                d={areaPathString} 
                fill={
                  highContrastMode
                    ? `url(#${traumaLevel > 70 ? 'trendAreaGradNeonPink' : 'trendAreaGradNeonCyan'})`
                    : `url(#${traumaLevel > 70 ? 'trendAreaGradRed' : 'trendAreaGradGreen'})`
                } 
              />
            )}

            {/* Main plotting line */}
            {linePathString && (
              <path 
                d={linePathString} 
                fill="none" 
                stroke={
                  highContrastMode
                    ? (traumaLevel > 70 ? '#f43f5e' : '#06b6d4')
                    : (traumaLevel > 70 ? 'rgba(239, 68, 68, 0.85)' : 'rgba(16, 185, 129, 0.85)')
                } 
                strokeWidth={highContrastMode ? "2.2" : "1.5"} 
                strokeLinecap="round"
                strokeLinejoin="round" 
              />
            )}

            {/* Telemetry coordinate indicators (Interactive) */}
            {chartPoints.map((p, idx) => {
              const isLast = idx === chartPoints.length - 1;
              let pointColorClass = "";
              let pointStyles = {};

              if (highContrastMode) {
                const neonColor = p.value > 70 ? '#f43f5e' : '#06b6d4';
                pointStyles = {
                  fill: neonColor,
                  stroke: '#ffffff',
                  strokeWidth: '1.2px',
                  filter: `drop-shadow(0px 0px 3px ${neonColor})`
                };
              } else {
                pointColorClass = p.value > 70 
                  ? 'fill-red-400 stroke-red-500' 
                  : 'fill-emerald-400 stroke-emerald-500';
              }

              return (
                <g key={idx} className="group/trend-point">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isLast ? (highContrastMode ? 4 : 3) : (highContrastMode ? 2.5 : 1.8)}
                    className={highContrastMode ? 'transition-all duration-150 cursor-crosshair hover:r-[5]' : `${pointColorClass} stroke-[0.5px] transition-all duration-150 cursor-crosshair hover:r-[4.5]`}
                    style={pointStyles}
                  />
                  {/* Native tooltip metadata display */}
                  <title>{`Tick T-${(chartPoints.length - idx - 1) * 4}s | Stress: ${p.value}%`}</title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Anomalies Log */}
      <div className="flex flex-col gap-1.5 font-mono text-xs text-white/80 select-text max-h-24 overflow-y-auto bg-black/40 p-2 rounded border border-emerald-500/10">
        <div className="text-[10px] text-emerald-500/60 uppercase font-bold border-b border-emerald-500/10 pb-1">
          ANOMALIES LOG COMPILATION
        </div>
        {anomalies.length === 0 ? (
          <div className="text-[10px] text-emerald-500/40 italic py-1">
            No structural anomalies indexed. Nominally aligned.
          </div>
        ) : (
          anomalies.map((anom, idx) => (
            <div key={idx} className="flex gap-1.5 items-start text-red-400">
              <Zap className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-[11px] font-mono leading-tight">{anom}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
