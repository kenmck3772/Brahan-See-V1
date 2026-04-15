import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import Plotly from 'plotly.js-dist-min';
import { MOCK_TRAUMA_DATA } from '../constants';
import { TraumaLayer, TraumaEvent, TraumaData } from '../types';
import { 
  Scan, Maximize2, Minimize2, Navigation, 
  Target, Info, AlertCircle, Crosshair,
  Search, Trash2, Clock, MapPin, Activity,
  ShieldAlert, ChevronRight, Zap, Loader2, Download,
  Thermometer, Flame, Droplets, Gauge,
  CircleDot, Layers, BoxSelect, Cpu,
  Compass, Ruler, MinusSquare, Percent,
  SlidersHorizontal, Settings, Sun,
  Binary, Terminal, ShieldCheck,
  Lock, ArrowRight, CornerDownRight,
  Database, Share2, Activity as StressIcon,
  X, ZoomIn, ZoomOut, RotateCcw, RotateCw, ArrowUp, ArrowDown, RefreshCw
} from 'lucide-react';

const layerToKey: Record<TraumaLayer, keyof Omit<TraumaData, 'fingerId' | 'depth'>> = {
  [TraumaLayer.DEVIATION]: 'deviation',
  [TraumaLayer.CORROSION]: 'corrosion',
  [TraumaLayer.TEMPERATURE]: 'temperature',
  [TraumaLayer.WALL_LOSS]: 'wallLoss',
  [TraumaLayer.WATER_LEAKAGE]: 'waterLeakage',
  [TraumaLayer.STRESS]: 'stress',
  [TraumaLayer.ICI]: 'ici',
  [TraumaLayer.METAL_LOSS]: 'metalLoss',
  [TraumaLayer.OVALITY]: 'ovality',
  [TraumaLayer.UV_INDEX]: 'uvIndex'
};

const layerToUnit: Record<TraumaLayer, string> = {
  [TraumaLayer.DEVIATION]: 'deg',
  [TraumaLayer.CORROSION]: '%',
  [TraumaLayer.TEMPERATURE]: '°C',
  [TraumaLayer.WALL_LOSS]: 'mm',
  [TraumaLayer.WATER_LEAKAGE]: '%',
  [TraumaLayer.STRESS]: 'kpsi',
  [TraumaLayer.ICI]: 'idx',
  [TraumaLayer.METAL_LOSS]: 'mm',
  [TraumaLayer.OVALITY]: '%',
  [TraumaLayer.UV_INDEX]: 'uv'
};

const layerToIcon: Record<TraumaLayer, React.ReactNode> = {
  [TraumaLayer.DEVIATION]: React.createElement(Compass, { size: 14 }),
  [TraumaLayer.CORROSION]: React.createElement(Flame, { size: 14 }),
  [TraumaLayer.TEMPERATURE]: React.createElement(Thermometer, { size: 14 }),
  [TraumaLayer.WALL_LOSS]: React.createElement(MinusSquare, { size: 14 }),
  [TraumaLayer.WATER_LEAKAGE]: React.createElement(Droplets, { size: 14 }),
  [TraumaLayer.STRESS]: React.createElement(StressIcon, { size: 14 }),
  [TraumaLayer.ICI]: React.createElement(Ruler, { size: 14 }),
  [TraumaLayer.METAL_LOSS]: React.createElement(Zap, { size: 14 }),
  [TraumaLayer.OVALITY]: React.createElement(Percent, { size: 14 }),
  [TraumaLayer.UV_INDEX]: React.createElement(Sun, { size: 14 })
};

const getLayerColor = (layer: TraumaLayer) => {
  switch (layer) {
    case TraumaLayer.STRESS: return 'text-red-500';
    case TraumaLayer.UV_INDEX: return 'text-amber-500';
    case TraumaLayer.TEMPERATURE: return 'text-blue-400';
    default: return 'text-emerald-400';
  }
};

const getSliderAccent = (layer: TraumaLayer) => {
  switch (layer) {
    case TraumaLayer.STRESS: return 'accent-red-600';
    case TraumaLayer.UV_INDEX: return 'accent-amber-600';
    default: return 'accent-emerald-500';
  }
};

interface TraumaNodeProps {
  isFocused?: boolean;
  onToggleFocus?: () => void;
}

const TraumaNode: React.FC<TraumaNodeProps> = ({ isFocused: isFocusedProp, onToggleFocus: onToggleFocusProp }) => {
  const [internalIsFocused, setInternalIsFocused] = useState(false);
  
  const isFocused = isFocusedProp !== undefined ? isFocusedProp : internalIsFocused;
  const onToggleFocus = useCallback(() => {
    if (onToggleFocusProp) {
      onToggleFocusProp();
    } else {
      setInternalIsFocused(prev => !prev);
    }
  }, [onToggleFocusProp]);

  const plotContainerRef = useRef<HTMLDivElement>(null);
  const [highlightedDepth, setHighlightedDepth] = useState<number | null>(null);
  const [hoveredDepth, setHoveredDepth] = useState<number | null>(null);
  const [selectedLog, setSelectedLog] = useState<TraumaEvent | null>(null);
  const [flashDepth, setFlashDepth] = useState<number | null>(null);
  const [isTargeting, setIsTargeting] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<TraumaLayer>>(new Set([TraumaLayer.STRESS]));
  const [isScanning, setIsScanning] = useState(false);
  const [isCrossSectionView, setIsCrossSectionView] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [pingCoord, setPingCoord] = useState<{ x: number, y: number, id: string } | null>(null);
  const [scanSweepDepth, setScanSweepDepth] = useState<number | null>(null);
  const [pulseScale, setPulseScale] = useState(1);
  const [hoverPulseScale, setHoverPulseScale] = useState(1);
  const [uiRevision, setUiRevision] = useState<string>('initial');
  const [isGlitching, setIsGlitching] = useState(false);
  const [stressPulseIntensity, setStressPulseIntensity] = useState(2.8);
  const [stressThreshold, setStressThreshold] = useState(90);
  const [stressWireframeOpacity, setStressWireframeOpacity] = useState(30);
  const [stressSurfaceOpacity, setStressSurfaceOpacity] = useState(80);
  const [anomalyIntensity, setAnomalyIntensity] = useState(1.5);

  const [layerOpacities, setLayerOpacities] = useState<Record<TraumaLayer, number>>(
    Object.values(TraumaLayer).reduce((acc, layer) => ({ ...acc, [layer]: layer === TraumaLayer.STRESS ? 80 : 90 }), {} as Record<TraumaLayer, number>)
  );

  const allDepths = useMemo(() => Array.from(new Set(MOCK_TRAUMA_DATA.map(d => d.depth))).sort((a, b) => a - b), []);
  const fingerIds = useMemo(() => Array.from(new Set(MOCK_TRAUMA_DATA.map(d => d.fingerId))).sort((a, b) => a - b), []);

  const [loadError, setLoadError] = useState<string | null>(null);

  // Mount-time forensic data integrity check
  useEffect(() => {
    console.log('[TraumaNode:System] Initializing forensic data integrity check...');
    try {
      if (typeof MOCK_TRAUMA_DATA === 'undefined') {
        throw new Error("Forensic data source (MOCK_TRAUMA_DATA) is undefined. Check system constants.");
      }
      if (!MOCK_TRAUMA_DATA) {
        throw new Error("Forensic data source (MOCK_TRAUMA_DATA) is null. System integrity compromised.");
      }
      if (!Array.isArray(MOCK_TRAUMA_DATA)) {
        throw new Error("Forensic data source is not an array. Data format mismatch.");
      }
      if (MOCK_TRAUMA_DATA.length === 0) {
        throw new Error("Forensic data source is empty. No records available for analysis.");
      }
      
      // Check for required fields in first record
      const first = MOCK_TRAUMA_DATA[0];
      if (typeof first.depth !== 'number') {
        throw new Error("Forensic data schema violation: 'depth' field missing or invalid type.");
      }

      console.log(`[TraumaNode:System] Forensic data source validated. ${MOCK_TRAUMA_DATA.length} records online.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown data integrity fault.";
      console.error(`[TraumaNode:DataFault] CRITICAL: ${msg}`);
      setLoadError(`DATA_INTEGRITY_FAULT: ${msg}`);
    }
  }, []);

  useEffect(() => {
    if (hoveredDepth === null) {
      setHoverPulseScale(1);
      return;
    }

    let frameId: number;
    const startTime = performance.now();
    
    const animate = (time: number) => {
      const elapsed = time - startTime;
      // Oscillate between 1.0 and 1.2 every 1 second
      const scale = 1 + 0.1 * Math.sin(elapsed / 150);
      setHoverPulseScale(scale);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [hoveredDepth]);

  const [blackBoxLogs, setBlackBoxLogs] = useState<TraumaEvent[]>(() => {
    try {
      const saved = localStorage.getItem('BRAHAN_BLACK_BOX_LOGS');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        console.warn('[TraumaNode:Storage] Saved logs are not an array, resetting local cache.');
        return [];
      }
      return parsed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown storage fault.";
      console.error('[TraumaNode:StorageFault] Failed to load black box logs from localStorage:', err);
      // We set loadError here to inform the user about the storage issue
      setLoadError(`STORAGE_FAULT: Failed to retrieve forensic history. ${msg}`);
      return [];
    }
  });

  const currentStressValue = useMemo(() => {
     if (!highlightedDepth) return 0;
     const entry = MOCK_TRAUMA_DATA.find(d => d.depth === highlightedDepth);
     return entry ? entry.stress : 0;
  }, [highlightedDepth]);

  // Fix: The `clearLogs` function was referenced before it was defined in the `React.createElement` scope.
  // Ensured it's properly defined within the component scope.
  const exportLogs = useCallback((format: 'json' | 'csv') => {
    if (blackBoxLogs.length === 0) return;

    let content = '';
    let mimeType = '';
    let fileName = `brahan_black_box_logs_${new Date().toISOString().split('T')[0]}`;

    if (format === 'json') {
      content = JSON.stringify(blackBoxLogs, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    } else {
      const headers = ['id', 'timestamp', 'layer', 'depth', 'value', 'unit', 'severity', 'description'];
      const rows = blackBoxLogs.map(log => 
        headers.map(header => {
          const val = log[header as keyof TraumaEvent];
          return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(',')
      );
      content = [headers.join(','), ...rows].join('\n');
      mimeType = 'text/csv';
      fileName += '.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [blackBoxLogs]);

  const clearLogs = () => {
    setShowClearConfirm(true);
  };

  const executeClearLogs = () => {
    setBlackBoxLogs([]);
    setSelectedLog(null);
    setHighlightedDepth(null);
    setIsTargeting(false); // Clear targeting HUD
    setFlashDepth(null);
    setScanSweepDepth(null);
    setPulseScale(1);
    setUiRevision(Date.now().toString()); // Force Plotly update
    localStorage.removeItem('BRAHAN_BLACK_BOX_LOGS');
    setShowClearConfirm(false);
  };

  const handleOpacityChange = (layer: TraumaLayer, value: number) => {
    const validatedValue = Math.min(Math.max(value, 0), 100);
    setLayerOpacities(prev => ({ ...prev, [layer]: validatedValue }));
  };

  const handleLayerChange = (layer: TraumaLayer) => {
    setIsGlitching(true);
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) {
        if (next.size > 1) next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
    setUiRevision(Date.now().toString());
    setTimeout(() => setIsGlitching(false), 300);
  };

  const triggerFlashAtDepth = useCallback((depth: number, log?: TraumaEvent) => {
    // Reset previous targeting state before new one
    setIsTargeting(false); 
    setFlashDepth(null);
    setScanSweepDepth(null);

    setHighlightedDepth(depth);
    if (log) {
      setSelectedLog(log);
    } else {
      // If clicked on 3D model, try to find a relevant log, or just set a mock one
      const foundLog = blackBoxLogs.find(l => Math.abs(l.depth - depth) < 0.1);
      if (foundLog) {
        setSelectedLog(foundLog);
      } else {
        // Create a temporary log for the HUD
        const primaryLayer = Array.from(activeLayers)[0];
        setSelectedLog({
          id: `TRX_${Math.random().toString(36).substring(7).toUpperCase()}_MANUAL`,
          timestamp: new Date().toISOString(),
          layer: primaryLayer,
          depth: depth,
          value: 0, 
          unit: layerToUnit[primaryLayer],
          severity: 'INFO',
          description: `Manual forensic inspection initiated at depth ${depth.toFixed(3)}m. No automated triggers detected at this coordinate.`
        });
      }
    }
    
    setFlashDepth(depth); // Trigger the pulse
    setIsTargeting(true); // Show HUD
    setIsGlitching(true); // Small glitch effect on chart
    setUiRevision(Date.now().toString()); // Force Plotly to update camera if needed

    // Localized Cylinder Pulse animation
    setPulseScale(stressPulseIntensity);
    setTimeout(() => setPulseScale(1.0), 300);
    setTimeout(() => setPulseScale(stressPulseIntensity * 0.5), 600);
    setTimeout(() => setPulseScale(1.0), 900);
    setTimeout(() => setIsGlitching(false), 500); // Clear glitch

    // Dynamic Sweep Animation
    const startDepth = scanSweepDepth || allDepths[0]; // Start from current sweep or top
    const duration = 1400;
    const startTime = performance.now();
    
    const animateSweep = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const currentSweep = startDepth + (depth - startDepth) * easedProgress;
      setScanSweepDepth(currentSweep);
      
      if (progress < 1) requestAnimationFrame(animateSweep);
      else setTimeout(() => setScanSweepDepth(null), 1200); // Clear sweep line
    };
    requestAnimationFrame(animateSweep);

    // Camera Autopilot zoom to Target
    if (plotContainerRef.current && !isCrossSectionView) {
      const zRange = allDepths[allDepths.length-1] - allDepths[0];
      const normalizedZ = (depth - allDepths[0]) / zRange;
      const cameraCenterZ = normalizedZ * 2 - 1; // Normalize depth to Plotly's -1 to 1 range for camera.center.z

      Plotly.relayout(plotContainerRef.current, {
        'scene.camera.center': { x: 0, y: 0, z: cameraCenterZ },
        'scene.camera.eye': { x: 1.5, y: 1.5, z: cameraCenterZ + 0.7 } // Move eye to look at center + slightly above
      });
    }

    // Clear flash after a certain period
    setTimeout(() => setFlashDepth(null), 2500);
  }, [blackBoxLogs, activeLayers, scanSweepDepth, allDepths, isCrossSectionView]);

  const runForensicScan = () => {
    console.log('[TraumaNode:Scan] Initiating automated forensic sweep...');
    setIsScanning(true);
    setLoadError(null);
    
    // Animate scan sweep from top to bottom
    const startDepth = allDepths[0];
    const endDepth = allDepths[allDepths.length - 1];
    const duration = 1200;
    const startTime = performance.now();

    const animateSweep = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setScanSweepDepth(startDepth + (endDepth - startDepth) * progress);
      
      if (progress < 1) {
        requestAnimationFrame(animateSweep);
      } else {
        // Keep it at the bottom for a moment then clear
        setTimeout(() => setScanSweepDepth(null), 500);
      }
    };
    requestAnimationFrame(animateSweep);
    
    try {
      if (!MOCK_TRAUMA_DATA || !Array.isArray(MOCK_TRAUMA_DATA) || MOCK_TRAUMA_DATA.length === 0) {
        throw new Error("Forensic data source is unavailable or contains no records. Scan aborted.");
      }

      if (activeLayers.size === 0) {
        throw new Error("No active forensic modalities selected. Please activate at least one layer in the calibration array.");
      }

      setTimeout(() => {
        try {
          let allNewEvents: TraumaEvent[] = [];
          
          activeLayers.forEach(layer => {
            const key = layerToKey[layer];
            const unit = layerToUnit[layer];
            
            if (!key) {
              console.warn(`[TraumaNode:Scan] No data key mapping for layer: ${layer}`);
              return;
            }

            const depthGroups = MOCK_TRAUMA_DATA.reduce((acc, curr) => {
              const val = curr[key] as number;
              // Thresholds for anomaly detection
              if (val > 15 || (layer === TraumaLayer.UV_INDEX && val > 8) || (layer === TraumaLayer.STRESS && val > stressThreshold * 0.6)) {
                if (!acc[curr.depth] || (acc[curr.depth][key] as number) < val) {
                  acc[curr.depth] = curr;
                }
              }
              return acc;
            }, {} as Record<number, TraumaData>);

            const newEvents: TraumaEvent[] = Object.values(depthGroups).map(a => {
              const val = a[key] as number;
              let severity: 'CRITICAL' | 'WARNING' | 'INFO' = 'INFO';
              if (val > 40 || (layer === TraumaLayer.UV_INDEX && val > 10) || (layer === TraumaLayer.STRESS && val > stressThreshold * 0.8)) severity = 'CRITICAL';
              else if (val > 20 || (layer === TraumaLayer.UV_INDEX && val > 5) || (layer === TraumaLayer.STRESS && val > stressThreshold * 0.4)) severity = 'WARNING';

              const traceId = `TRX_${Math.random().toString(36).substring(7).toUpperCase()}_AUTO`;
              return {
                id: traceId,
                timestamp: new Date().toISOString(),
                layer: layer,
                depth: a.depth,
                value: val,
                unit: unit,
                severity,
                description: `Anomalous ${layer.toLowerCase()} detected at ${a.depth}m. Trace ID: ${traceId}. Deviation exceeds threshold for forensic validation.`
              };
            });
            
            allNewEvents = [...allNewEvents, ...newEvents];
          });

          if (allNewEvents.length === 0) {
            console.log('[TraumaNode:Scan] Sweep complete. No anomalous signatures detected.');
          } else {
            console.log(`[TraumaNode:Scan] Sweep complete. ${allNewEvents.length} anomalous signatures isolated.`);
          }

          const updated = [...allNewEvents, ...blackBoxLogs].slice(0, 100);
          setBlackBoxLogs(updated);
          
          try {
            localStorage.setItem('BRAHAN_BLACK_BOX_LOGS', JSON.stringify(updated));
          } catch (storageErr) {
            console.error('[TraumaNode:StorageFault] Failed to save logs to localStorage:', storageErr);
            if (storageErr instanceof Error && (storageErr.name === 'QuotaExceededError' || storageErr.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
              setLoadError("STORAGE_FAULT: Local history quota exceeded. Clear logs to restore persistence.");
            }
          }

          setIsScanning(false);
          
          if (allNewEvents.length > 0) {
            const topEvent = allNewEvents.sort((a, b) => b.value - a.value)[0];
            setTimeout(() => {
              triggerFlashAtDepth(topEvent.depth, topEvent);
            }, 300);
          }
        } catch (innerErr) {
          const errMsg = innerErr instanceof Error ? innerErr.message : String(innerErr);
          console.error('[TraumaNode:ScanFault] Forensic scan processing failed:', innerErr);
          setLoadError(`PROCESSING_ERROR: ${errMsg}`);
          setIsScanning(false);
        }
      }, 1200);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[TraumaNode:ScanFault] Forensic scan failed to initiate:', err);
      setLoadError(`SCAN_INIT_ERROR: ${errMsg}`);
      setIsScanning(false);
    }
  };

  const adjustCamera = (action: string) => {
    if (!plotContainerRef.current) return;
    
    const plotEl = plotContainerRef.current as any;
    const currentCamera = plotEl.layout?.scene?.camera || {
      eye: { x: 2.2, y: 2.2, z: 1.5 },
      center: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 0, z: 1 }
    };

    const newCamera = JSON.parse(JSON.stringify(currentCamera));
    const step = 0.2;

    switch (action) {
      case 'ZOOM_IN':
        newCamera.eye.x *= 0.85;
        newCamera.eye.y *= 0.85;
        newCamera.eye.z *= 0.85;
        break;
      case 'ZOOM_OUT':
        newCamera.eye.x *= 1.15;
        newCamera.eye.y *= 1.15;
        newCamera.eye.z *= 1.15;
        break;
      case 'ROTATE_LEFT':
        {
          const x = newCamera.eye.x;
          const y = newCamera.eye.y;
          const angle = 0.2;
          newCamera.eye.x = x * Math.cos(angle) - y * Math.sin(angle);
          newCamera.eye.y = x * Math.sin(angle) + y * Math.cos(angle);
        }
        break;
      case 'ROTATE_RIGHT':
        {
          const x = newCamera.eye.x;
          const y = newCamera.eye.y;
          const angle = -0.2;
          newCamera.eye.x = x * Math.cos(angle) - y * Math.sin(angle);
          newCamera.eye.y = x * Math.sin(angle) + y * Math.cos(angle);
        }
        break;
      case 'PAN_UP':
        newCamera.center.z += step;
        newCamera.eye.z += step;
        break;
      case 'PAN_DOWN':
        newCamera.center.z -= step;
        newCamera.eye.z -= step;
        break;
      case 'RESET':
        newCamera.eye = { x: 2.2, y: 2.2, z: 1.5 };
        newCamera.center = { x: 0, y: 0, z: 0 };
        newCamera.up = { x: 0, y: 0, z: 1 };
        break;
    }

    Plotly.relayout(plotContainerRef.current, {
      'scene.camera': newCamera
    });
  };

  useEffect(() => {
    if (!plotContainerRef.current) return;

    if (!MOCK_TRAUMA_DATA || !Array.isArray(MOCK_TRAUMA_DATA)) {
      console.error('[TraumaNode:VizFault] Forensic data source is unavailable or malformed.');
      setLoadError("VISUALIZATION_FAULT: Forensic data source is missing or corrupt.");
      return;
    }

    const baseRadius = 50; 
    let traces: any[] = [];
    let layout: any = {};

    const getColorScale = (layer: TraumaLayer) => {
      switch(layer) {
        case TraumaLayer.STRESS:
          return [
            [0, '#0f172a'], [0.1, '#450a0a'], [0.5, '#991b1b'], [0.8, '#ef4444'], 
            [0.9, '#fca5a5'], [1.0, '#ffffff']
          ];
        case TraumaLayer.TEMPERATURE:
          return [
            [0, '#082f49'], [0.3, '#0ea5e9'], [0.7, '#fde047'], [0.9, '#ffffff'], [1.0, '#fbbf24']
          ];
        case TraumaLayer.UV_INDEX:
          return [
            [0, '#2e1065'], [0.2, '#5b21b6'], [0.5, '#f59e0b'], [0.8, '#fffbeb'], [1.0, '#ffffff']
          ];
        default:
          return [
            [0, '#010409'], [0.3, '#064e3b'], [0.6, '#10b981'], [0.9, '#34d399'], [1.0, '#ffffff']
          ];
      }
    };

    if (isCrossSectionView) {
      const targetDepth = highlightedDepth || allDepths[0];
      const dataAtDepth = MOCK_TRAUMA_DATA.filter(d => d.depth === targetDepth);
      
      // For radial view, we show all active layers as separate traces
      activeLayers.forEach(layer => {
        const key = layerToKey[layer];
        const rValues: number[] = [];
        const thetaValues: number[] = [];
        const colorValues: number[] = [];

        fingerIds.forEach((fId, idx) => {
          const entry = dataAtDepth.find(d => d.fingerId === fId);
          const val = entry ? (entry[key] as number) : 0;
          const isFlashed = flashDepth === targetDepth;
          const r = baseRadius + (isFlashed ? (val + 20) * pulseScale : val);
          
          rValues.push(r);
          thetaValues.push((idx / fingerIds.length) * 360);
          colorValues.push(isFlashed ? 100 : val);
        });

        rValues.push(rValues[0]);
        thetaValues.push(thetaValues[0]);
        colorValues.push(colorValues[0]);

        traces.push({
          type: 'scatterpolar',
          r: rValues,
          theta: thetaValues,
          mode: 'lines+markers',
          fill: 'toself',
          fillcolor: layer === TraumaLayer.STRESS ? `rgba(239, 68, 68, ${layerOpacities[layer] / 500})` : layer === TraumaLayer.UV_INDEX ? `rgba(245, 158, 11, ${layerOpacities[layer] / 500})` : `rgba(16, 185, 129, ${layerOpacities[layer] / 500})`,
          line: { color: layer === TraumaLayer.STRESS ? '#ef4444' : layer === TraumaLayer.UV_INDEX ? '#f59e0b' : '#10b981', width: 3 },
          marker: {
            color: colorValues,
            colorscale: getColorScale(layer),
            cmin: 0,
            cmax: 100,
            size: 6,
            line: { color: '#010409', width: 1.5 }
          },
          name: `${layer}_${targetDepth}m`,
          opacity: layerOpacities[layer] / 100
        });
      });

      traces.push({
        type: 'scatterpolar',
        r: Array(fingerIds.length + 1).fill(baseRadius),
        theta: [...fingerIds.map((_, i) => (i / fingerIds.length) * 360), 0],
        mode: 'lines',
        line: { color: 'rgba(16, 185, 129, 0.3)', width: 1, dash: 'dot' },
        name: 'NOMINAL_ID'
      });

      layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 20, r: 20, b: 20, t: 40 },
        polar: {
          bgcolor: 'rgba(2, 6, 23, 0.8)',
          angularaxis: {
            tickfont: { size: 8, color: '#10b981', family: 'Fira Code' },
            gridcolor: 'rgba(16, 185, 129, 0.15)',
            linecolor: 'rgba(16, 185, 129, 0.4)'
          },
          radialaxis: {
            tickfont: { size: 8, color: '#10b981', family: 'Fira Code' },
            gridcolor: 'rgba(16, 185, 129, 0.15)',
            linecolor: 'rgba(16, 185, 129, 0.4)',
            range: [0, 150]
          }
        },
        showlegend: false,
        title: {
          text: `RADIAL_INSPECTOR // MODALITIES: ${Array.from(activeLayers).join(', ')}`,
          font: { color: '#10b981', size: 12, family: 'Fira Code' },
          y: 0.95
        }
      };
    } else {
      // 3D View: Render each active layer as a surface
      activeLayers.forEach(layer => {
        const xData: number[][] = [];
        const yData: number[][] = [];
        const zData: number[][] = [];
        const colorData: number[][] = [];

        allDepths.forEach((depth) => {
          const xRow: number[] = [];
          const yRow: number[] = [];
          const zRow: number[] = [];
          const cRow: number[] = [];
          const dataAtDepth = MOCK_TRAUMA_DATA.filter(d => d.depth === depth);

          fingerIds.forEach((fId, fIdx) => {
            const theta = (fIdx / fingerIds.length) * 2 * Math.PI;
            const entry = dataAtDepth.find(d => d.fingerId === fId);
            let val = entry ? (entry[layerToKey[layer]] as number) : 0;
            const isFlashed = flashDepth === depth;
            const isNearSweep = scanSweepDepth !== null && Math.abs(depth - scanSweepDepth) < 0.2;
            
            const r = baseRadius + (isFlashed ? (val + 30) * pulseScale : val);
            
            xRow.push(r * Math.cos(theta));
            yRow.push(r * Math.sin(theta));
            zRow.push(depth);
            
            if (isFlashed) cRow.push(100 * anomalyIntensity); 
            else if (isNearSweep) cRow.push(80 * anomalyIntensity); 
            else cRow.push(val);
          });

          xRow.push(xRow[0]);
          yRow.push(yRow[0]);
          zRow.push(zRow[0]);
          cRow.push(cRow[0]);

          xData.push(xRow);
          yData.push(yRow);
          zData.push(zRow);
          colorData.push(cRow);
        });

        traces.push({
          type: 'surface',
          x: xData,
          y: yData,
          z: zData,
          surfacecolor: colorData,
          colorscale: getColorScale(layer),
          cmin: 0,
          cmax: 100,
          showscale: false,
          lighting: { 
            ambient: 0.35,
            diffuse: 0.45,
            specular: 2.8,
            roughness: 0.04,
            fresnel: 1.2
          },
          lightposition: { x: 1000, y: 1000, z: 1300 },
          opacity: layer === TraumaLayer.STRESS ? stressSurfaceOpacity / 100 : layerOpacities[layer] / 100,
          name: layer
        });

        // Add wireframe for STRESS layer if it's active
        if (layer === TraumaLayer.STRESS) {
          traces.push({
            type: 'surface',
            x: xData,
            y: yData,
            z: zData,
            surfacecolor: colorData,
            colorscale: getColorScale(layer),
            cmin: 0,
            cmax: 100,
            showscale: false,
            hidesurface: true,
            contours: {
              x: { show: true, color: '#ef4444', width: 1 },
              y: { show: true, color: '#ef4444', width: 1 },
              z: { show: false }
            },
            opacity: stressWireframeOpacity / 100,
            name: `${layer}_WIREFRAME`
          });
        }
      });

      // Vertical Axis Center Line
      traces.push({
        type: 'scatter3d',
        mode: 'lines',
        x: [0, 0], y: [0, 0], z: [allDepths[0], allDepths[allDepths.length-1]],
        line: { color: 'rgba(16, 185, 129, 0.4)', width: 3, dash: 'dot' },
        name: 'AXIS'
      });

      const vaneLen = 250;
      if (highlightedDepth !== null) {
        const primaryLayer = Array.from(activeLayers)[0];
        const ringColor = selectedLog 
          ? (selectedLog.severity === 'CRITICAL' ? '#ef4444' : selectedLog.severity === 'WARNING' ? '#f59e0b' : '#10b981')
          : (primaryLayer === TraumaLayer.STRESS ? '#ef4444' : primaryLayer === TraumaLayer.UV_INDEX ? '#f59e0b' : '#10b981');
        
        // Highlight Plane (Semi-transparent horizontal disk)
        const planeX: number[] = [0];
        const planeY: number[] = [0];
        const planeZ: number[] = [highlightedDepth];
        const planeI: number[] = [];
        const planeJ: number[] = [];
        const planeK: number[] = [];

        const segments = 32;
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * 2 * Math.PI;
          planeX.push(baseRadius * 2.5 * Math.cos(theta));
          planeY.push(baseRadius * 2.5 * Math.sin(theta));
          planeZ.push(highlightedDepth);
          
          if (i > 0) {
            planeI.push(0);
            planeJ.push(i);
            planeK.push(i + 1);
          }
        }
        traces.push({
          type: 'mesh3d',
          x: planeX, y: planeY, z: planeZ,
          i: planeI, j: planeJ, k: planeK,
          opacity: 0.1,
          color: ringColor,
          name: 'HIGHLIGHT_PLANE',
          hoverinfo: 'none'
        });

        // Targeting Rings
        [1.2, 1.5, 2.0].forEach(scale => {
          const ringX: number[] = [];
          const ringY: number[] = [];
          const ringZ: number[] = [];
          for (let i = 0; i <= 64; i++) {
            const theta = (i / 64) * 2 * Math.PI;
            const pulseAdjustment = flashDepth === highlightedDepth ? (pulseScale - 1) * 0.15 + 1 : 1;
            ringX.push(baseRadius * scale * pulseAdjustment * Math.cos(theta));
            ringY.push(baseRadius * scale * pulseAdjustment * Math.sin(theta));
            ringZ.push(highlightedDepth);
          }
          traces.push({
            type: 'scatter3d',
            mode: 'lines',
            x: ringX, y: ringY, z: ringZ,
            line: { 
              color: ringColor, 
              width: scale === 1.2 ? 6 : scale === 1.5 ? 3 : 1, 
              dash: scale === 2.0 ? 'dash' : 'solid', 
              opacity: 0.8
            },
            name: `TARGET_LOCK_${scale}`
          });
        });

        // 3D Targeting Vanes (Crosshair)
        traces.push({
          type: 'scatter3d',
          mode: 'lines',
          x: [-vaneLen, vaneLen, null, 0, 0],
          y: [0, 0, null, -vaneLen, vaneLen],
          z: [highlightedDepth, highlightedDepth, null, highlightedDepth, highlightedDepth],
          line: { color: ringColor, width: 2, opacity: 0.4 },
          name: 'TARGET_VANES'
        });

        // 3D POI Label
        traces.push({
          type: 'scatter3d',
          mode: 'text',
          x: [0], y: [0], z: [highlightedDepth + 1.5],
          text: [`[ ! ] ANOMALY_LOCK @ ${highlightedDepth.toFixed(3)}M`],
          textfont: { family: 'Fira Code', size: 10, color: '#ffffff' },
          name: 'POI_LABEL'
        });
      }

      // Visual Scanning Ring for runForensicScan
      if (scanSweepDepth !== null && !isTargeting) {
        const sweepX: number[] = [];
        const sweepY: number[] = [];
        const sweepZ: number[] = [];
        for (let i = 0; i <= 64; i++) {
          const theta = (i / 64) * 2 * Math.PI;
          sweepX.push(baseRadius * 2.2 * Math.cos(theta));
          sweepY.push(baseRadius * 2.2 * Math.sin(theta));
          sweepZ.push(scanSweepDepth);
        }
        traces.push({
          type: 'scatter3d',
          mode: 'lines',
          x: sweepX, y: sweepY, z: sweepZ,
          line: { color: '#10b981', width: 5, opacity: 0.9 },
          name: 'SCAN_SWEEP_RING'
        });

        // Add a secondary glow ring
        const glowX: number[] = [];
        const glowY: number[] = [];
        const glowZ: number[] = [];
        for (let i = 0; i <= 64; i++) {
          const theta = (i / 64) * 2 * Math.PI;
          glowX.push(baseRadius * 2.5 * Math.cos(theta));
          glowY.push(baseRadius * 2.5 * Math.sin(theta));
          glowZ.push(scanSweepDepth);
        }
        traces.push({
          type: 'scatter3d',
          mode: 'lines',
          x: glowX, y: glowY, z: glowZ,
          line: { color: '#10b981', width: 2, opacity: 0.3, dash: 'dot' },
          name: 'SCAN_SWEEP_GLOW'
        });
      }

      if (hoveredDepth !== null && hoveredDepth !== highlightedDepth) {
        const hoverColor = 'rgba(16, 185, 129, 0.6)';
        
        // Hover Ring (with subtle pulse)
        const ringX: number[] = [];
        const ringY: number[] = [];
        const ringZ: number[] = [];
        for (let i = 0; i <= 64; i++) {
          const theta = (i / 64) * 2 * Math.PI;
          ringX.push(baseRadius * 1.1 * hoverPulseScale * Math.cos(theta));
          ringY.push(baseRadius * 1.1 * hoverPulseScale * Math.sin(theta));
          ringZ.push(hoveredDepth);
        }
        traces.push({
          type: 'scatter3d',
          mode: 'lines',
          x: ringX, y: ringY, z: ringZ,
          line: { color: hoverColor, width: 3, dash: 'dot' },
          name: 'HOVER_RING'
        });

        // Hover Vanes (Crosshair style)
        traces.push({
          type: 'scatter3d',
          mode: 'lines',
          x: [-vaneLen, vaneLen, null, 0, 0],
          y: [0, 0, null, -vaneLen, vaneLen],
          z: [hoveredDepth, hoveredDepth, null, hoveredDepth, hoveredDepth],
          line: { color: hoverColor, width: 1, dash: 'dash', opacity: 0.3 },
          name: 'HOVER_VANES'
        });

        // Hover Label
        const isSnapped = blackBoxLogs.some(l => l.depth === hoveredDepth);
        traces.push({
          type: 'scatter3d',
          mode: 'text',
          x: [0], y: [0], z: [hoveredDepth + 0.8],
          text: [isSnapped ? `[ LOG_ENTRY ] @ ${hoveredDepth.toFixed(3)}M` : `DEPTH: ${hoveredDepth.toFixed(3)}M`],
          textfont: { family: 'Fira Code', size: 9, color: isSnapped ? '#10b981' : 'rgba(255, 255, 255, 0.8)' },
          name: 'HOVER_LABEL'
        });
      }

      if (scanSweepDepth !== null) {
        const sweepX: number[] = [];
        const sweepY: number[] = [];
        const sweepZ: number[] = [];
        for (let i = 0; i <= 60; i++) {
          const theta = (i / 60) * 2 * Math.PI;
          sweepX.push(180 * Math.cos(theta));
          sweepY.push(180 * Math.sin(theta));
          sweepZ.push(scanSweepDepth);
        }
        traces.push({
          type: 'scatter3d',
          mode: 'lines',
          x: sweepX, y: sweepY, z: sweepZ,
          line: { color: '#10b981', width: 10, opacity: 0.6 },
          name: 'SCAN_SWEEP'
        });
      }

      layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 0, r: 0, b: 0, t: 0 },
        uirevision: uiRevision,
        scene: {
          xaxis: { visible: false },
          yaxis: { visible: false },
          zaxis: { 
            title: 'DEPTH (m)', 
            backgroundcolor: '#010409', gridcolor: '#064e3b', zerolinecolor: '#10b981',
            tickfont: { color: '#10b981', size: 10, family: 'Fira Code' }
          },
          dragmode: 'orbit',
          aspectmode: 'manual',
          aspectratio: { x: 1, y: 1, z: 2.2 },
          camera: uiRevision === 'initial' ? {
            eye: { x: 2.2, y: 2.2, z: 1.5 },
            center: { x: 0, y: 0, z: 0 },
            projection: { type: 'perspective' }
          } : undefined
        },
        autosize: true
      };
    }

    if (!Plotly) {
      console.error('[TraumaNode:VizFault] Plotly engine is missing from the environment.');
      setLoadError("VISUALIZATION_FAULT: Plotly engine failed to load. Check network connection or script availability.");
      return;
    }

    if (!plotContainerRef.current) {
      console.warn('[TraumaNode:VizWarning] Plot container ref is null. Skipping render cycle.');
      return;
    }

    try {
      Plotly.react(plotContainerRef.current, traces, layout, { 
        responsive: true, 
        displayModeBar: false,
        displaylogo: false
      }).then(() => {
        const plotEl = plotContainerRef.current as any;
        if (plotEl) {
          plotEl.removeAllListeners('plotly_click');
          plotEl.on('plotly_click', (data: any) => {
            if (data && data.points && data.points.length > 0) {
              const point = data.points[0];
              const depth = isCrossSectionView ? highlightedDepth : point.z;
              if (depth !== undefined && depth !== null) {
                 triggerFlashAtDepth(depth);
              }
            }
          });

          plotEl.on('plotly_hover', (data: any) => {
            if (data && data.points && data.points.length > 0) {
              const point = data.points[0];
              if (point.z !== undefined && point.z !== null) {
                const depth = point.z;
                const nearestLog = blackBoxLogs.find(l => Math.abs(l.depth - depth) < 0.5);
                if (nearestLog) {
                  setHoveredDepth(nearestLog.depth);
                } else {
                  setHoveredDepth(depth);
                }
              }
            }
          });

          plotEl.on('plotly_unhover', () => {
            setHoveredDepth(null);
          });
        }
      }).catch((plotlyErr: any) => {
        console.error('[TraumaNode:VizFault] Plotly async rendering failed:', plotlyErr);
        setLoadError(`VISUALIZATION_ERROR: ${plotlyErr.message || 'Failed to update 3D reconstruction'}`);
      });
    } catch (err) {
      console.error('[TraumaNode:VizFault] Plotly sync initialization failed:', err);
      setLoadError("VISUALIZATION_FAULT: Failed to initialize 3D rendering engine.");
    }

    return () => {
      if (plotContainerRef.current) {
        try {
          Plotly.purge(plotContainerRef.current);
        } catch (purgeErr) {
          console.warn('[TraumaNode:Viz] Failed to purge Plotly instance during cleanup:', purgeErr);
        }
      }
    };
  }, [allDepths, fingerIds, activeLayers, highlightedDepth, flashDepth, scanSweepDepth, pulseScale, hoverPulseScale, uiRevision, isCrossSectionView, layerOpacities, triggerFlashAtDepth, isFocused, hoveredDepth, selectedLog]);

  // Fix: The `handleLogClick` function was referenced before it was defined in the `React.createElement` scope.
  // Ensured it's properly defined within the component scope.
  const handleLogClick = (e: React.MouseEvent, log: TraumaEvent) => {
    // Click pulse effect on the log entry itself
    const rect = e.currentTarget.getBoundingClientRect();
    setPingCoord({ 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top, 
      id: Math.random().toString(36).substring(7) 
    });
    
    // Clear the ping effect after a short duration
    setTimeout(() => setPingCoord(null), 1000);

    triggerFlashAtDepth(log.depth, log);
  };

  return (
    // Converted JSX to React.createElement for the TraumaNode component
    React.createElement("div", { className: "flex flex-col h-full space-y-3 p-4 bg-[var(--slate-abyssal)]/40 border border-[var(--emerald-primary)]/30 rounded-lg transition-all relative overflow-hidden font-terminal cyber-border scanline-effect glass-panel" },
      // Hovered Depth Marker
      hoveredDepth && !isTargeting
        ? React.createElement("div", { className: "absolute top-6 left-6 z-50 pointer-events-none animate-in fade-in slide-in-from-left-4 duration-300" },
            React.createElement("div", { className: "bg-slate-900/90 border border-[var(--emerald-primary)]/30 px-4 py-2 rounded-lg shadow-2xl backdrop-blur-md flex items-center space-x-3 cyber-border glass-panel" },
              React.createElement(Crosshair, { size: 14, className: blackBoxLogs.some(l => l.depth === hoveredDepth) ? "text-[var(--emerald-primary)] animate-spin-slow" : "text-[var(--emerald-primary)] animate-pulse" }),
              React.createElement("div", { className: "flex flex-col" },
                React.createElement("span", { className: "text-[8px] font-black text-emerald-900 uppercase tracking-widest" }, 
                  blackBoxLogs.some(l => l.depth === hoveredDepth) ? "Log_Entry_Detected" : "Current_Depth"
                ),
                React.createElement("span", { className: "text-[14px] font-terminal font-black text-emerald-100 text-glow-emerald" }, hoveredDepth.toFixed(3) + "M")
              )
            )
          )
        : null,
      // Fix: Conditional rendering block for `isTargeting` and `highlightedDepth`.
      // Changed from `&& (...)` to `? React.createElement(...) : null` to fix syntax.
      // Removed pre-calculated `pulsatingBgClass`, `iconDivBorderShadowClass`, `crosshairClass` to ensure direct scope.
      isTargeting && highlightedDepth
        ? React.createElement("div", { className: "absolute inset-0 pointer-events-none z-[100] flex items-center justify-center animate-in fade-in duration-700" },
            // Removed trailing comma from `pulsatingBgClass` element, and embedded logic directly.
            React.createElement("div", { className: "absolute inset-0 animate-pulse " + 
              (activeLayers.has(TraumaLayer.STRESS) ? 'bg-fuchsia-500/10' : 
               activeLayers.has(TraumaLayer.UV_INDEX) ? 'bg-orange-500/10' : 
               'bg-emerald-500/5') 
            }),
            React.createElement("div", { className: "absolute top-10 right-10 p-6 border border-[var(--emerald-primary)]/50 bg-slate-950/95 backdrop-blur-3xl rounded-xl animate-in slide-in-from-right-8 shadow-[0_0_80px_rgba(0,0,0,0.8)] border-l-4 cyber-border glass-panel" },
              React.createElement("div", { className: "flex items-center justify-between mb-4 border-b border-emerald-900/40 pb-3" },
                React.createElement("div", { className: "flex items-center space-x-4" },
                  React.createElement(Target, { size: 20, className: "text-[var(--emerald-primary)] animate-spin-slow" }),
                  React.createElement("span", { className: "text-[12px] font-black text-[var(--emerald-primary)] tracking-[0.4em] uppercase text-glow-emerald" }, "Voxel_Lock_Engaged")
                ),
                React.createElement("button", { onClick: (e) => { e.stopPropagation(); setIsTargeting(false); }, className: "pointer-events-auto p-1 text-emerald-900 hover:text-[var(--emerald-primary)]" },
                  React.createElement(X, { size: 14 })
                )
              ),
              React.createElement("div", { className: "space-y-4" },
                React.createElement("div", { className: "flex justify-between items-center space-x-16" },
                  React.createElement("span", { className: "text-[9px] text-emerald-900 font-black uppercase" }, "Depth_Artifact"),
                  React.createElement("span", { className: "text-[18px] font-terminal font-black text-emerald-100 text-glow-emerald" }, highlightedDepth.toFixed(3) + "M")
                ),
                React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                  React.createElement("div", { className: "p-3 bg-slate-900/80 rounded border border-emerald-900/30 glass-panel" },
                    React.createElement("span", { className: "text-[7px] text-emerald-900 font-black uppercase block mb-1" }, "Observation"),
                    React.createElement("span", { className: `text-[11px] font-black uppercase ${selectedLog?.severity === 'CRITICAL' ? 'text-[var(--alert-red)]' : 'text-[var(--emerald-primary)]'}` },
                      selectedLog?.severity
                    )
                  ),
                  React.createElement("div", { className: "p-3 bg-slate-900/80 rounded border border-emerald-900/30 glass-panel" },
                    React.createElement("span", { className: "text-[7px] text-emerald-900 font-black uppercase block mb-1" }, "Value_Delta"),
                    React.createElement("span", { className: "text-[11px] font-black text-emerald-100" },
                      `${selectedLog?.value.toFixed(2)} ${selectedLog?.unit}`
                    )
                  )
                ),
                activeLayers.has(TraumaLayer.STRESS) && (
                  React.createElement("div", { className: "p-3 bg-fuchsia-500/10 rounded border border-fuchsia-500/30 animate-in zoom-in-95 glass-panel" },
                    React.createElement("span", { className: "text-[7px] text-fuchsia-400 font-black uppercase block mb-1" }, "Structural_Fatigue_Status"),
                    React.createElement("div", { className: "flex items-center justify-between" },
                      React.createElement("span", { className: `text-[12px] font-black ${currentStressValue > 80 ? 'text-[var(--alert-red)]' : 'text-fuchsia-300'}` },
                        currentStressValue > 80 ? 'YIELD_BREACHED' : 'NOMINAL_STRESS'
                      ),
                      React.createElement("span", { className: "text-[9px] font-mono text-fuchsia-500" }, `${((currentStressValue / 90) * 100).toFixed(1)}% YIELD`)
                    )
                  )
                ),
                React.createElement("div", { className: "p-3 bg-slate-900/80 rounded border border-emerald-900/30 glass-panel" },
                  React.createElement("span", { className: "text-[7px] text-emerald-900 font-black uppercase block mb-1" }, "Forensic_Trace_ID"),
                  React.createElement("span", { className: "text-[10px] font-mono text-[var(--emerald-primary)] truncate block" },
                    selectedLog?.id
                  )
                ),
                React.createElement("div", { className: "p-3 bg-slate-900/80 rounded border border-emerald-900/30 glass-panel" },
                  React.createElement("span", { className: "text-[7px] text-emerald-900 font-black uppercase block mb-1" }, "Anomaly_Description"),
                  React.createElement("p", { className: "text-[10px] text-emerald-100/70 leading-relaxed font-terminal" },
                    selectedLog?.description
                  )
                )
              )
            ),
            React.createElement("div", { className: `p-12 border-2 border-dashed rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] ${activeLayers.has(TraumaLayer.STRESS) ? 'border-fuchsia-500/30' : 'border-[var(--emerald-primary)]/30'}` },
              React.createElement("div", { className: "bg-slate-950/90 p-8 rounded-2xl border border-[var(--emerald-primary)]/40 flex flex-col items-center space-y-4 shadow-2xl backdrop-blur-md cyber-border glass-panel" },
                // Embedded crosshairClass logic directly
                React.createElement(Crosshair, { size: 40, className: activeLayers.has(TraumaLayer.STRESS) ? "text-fuchsia-500 animate-pulse" : 
                  activeLayers.has(TraumaLayer.UV_INDEX) ? "text-orange-500 animate-pulse" : 
                  "text-[var(--emerald-primary)] animate-pulse" }),
                React.createElement("span", { className: "text-[14px] font-black tracking-[0.6em] text-white uppercase drop-shadow-lg text-glow-emerald" }, `Locked: ${highlightedDepth.toFixed(3)}M`)
              )
            )
          )
        : null,

      !isFocused && React.createElement("div", { className: "flex flex-col space-y-4 mb-2" },
        React.createElement("div", { className: "flex items-center justify-between" },
          React.createElement("div", { className: "flex items-center space-x-4" },
            // Embedded iconDivBorderShadowClass logic directly
            React.createElement("div", { className: "p-3 bg-emerald-950/80 border rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all cyber-border " + 
              (activeLayers.has(TraumaLayer.STRESS) ? 'border-fuchsia-500/60 shadow-fuchsia-500/30' : 
               activeLayers.has(TraumaLayer.UV_INDEX) ? 'border-orange-500/60 shadow-orange-500/30' : 
               'border-[var(--emerald-primary)]/60 shadow-[var(--emerald-primary)]/20') },
              layerToIcon[Array.from(activeLayers)[0]]
            ),
            React.createElement("div", null,
              React.createElement("h2", { className: "text-3xl font-black text-[var(--emerald-primary)] font-terminal uppercase tracking-tighter text-glow-emerald" }, "Trauma_Node_Forensics"),
              React.createElement("div", { className: "flex items-center space-x-3" },
                React.createElement(Binary, { size: 14, className: "text-emerald-800" }),
                React.createElement("span", { className: "text-[10px] text-emerald-800 uppercase tracking-widest font-black" }, isCrossSectionView ? "Radial Inspector" : "Cylinder Voxel Autopsy Array"),
                React.createElement("div", { className: "w-1 h-1 bg-[var(--emerald-primary)] rounded-full animate-pulse shadow-[0_0_10px_var(--emerald-primary)]" })
              )
            )
          ),
          React.createElement("div", { className: "flex items-center space-x-3" },
            React.createElement("button", { 
              onClick: () => setIsCrossSectionView(!isCrossSectionView),
              className: `flex items-center space-x-2 px-5 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all ${isCrossSectionView ? 'bg-orange-500 text-slate-950 shadow-[0_0_25px_rgba(249,115,22,0.5)]' : 'bg-slate-900 border border-emerald-900/50 text-emerald-400 hover:border-emerald-400'}`
            },
              React.createElement(Layers, { size: 16 }),
              React.createElement("span", null, isCrossSectionView ? 'Switch to 3D View' : 'Switch to Cross-Section')
            ),
            React.createElement("button", { 
              onClick: runForensicScan,
              disabled: isScanning,
              className: `flex items-center space-x-2 px-5 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all ${isScanning ? 'bg-orange-500/20 text-orange-500 border border-orange-500/40' : 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`
            },
              isScanning ? React.createElement(Loader2, { size: 16, className: "animate-spin" }) : React.createElement(Scan, { size: 16 }),
              React.createElement("span", null, "Scan_Sector")
            ),
            React.createElement("button", { onClick: onToggleFocus, className: "p-2.5 text-emerald-800 hover:text-emerald-400 transition-colors" },
              isFocused ? React.createElement(Minimize2, { size: 28 }) : React.createElement(Maximize2, { size: 28 })
            )
          )
        ),
      ),
      React.createElement("div", { className: "flex-1 min-h-0 flex space-x-4 relative" },
        React.createElement("div", { ref: plotContainerRef, className: `flex-1 bg-slate-950 rounded-2xl border border-emerald-900/40 overflow-hidden relative transition-all duration-500 shadow-inner glass-panel cyber-border ${isGlitching ? 'blur-[6px] brightness-150' : ''}` },
           isFocused && React.createElement("div", { className: "absolute top-6 right-6 z-50 flex flex-col space-y-3" },
             React.createElement("button", { 
               onClick: onToggleFocus, 
               className: "p-3 bg-slate-900/80 border border-emerald-500/30 rounded-xl text-emerald-400 hover:text-white transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md group glass-panel cyber-border" 
             },
               React.createElement(Minimize2, { size: 24, className: "group-hover:scale-110 transition-transform" })
             ),
             React.createElement("button", { 
               onClick: runForensicScan,
               disabled: isScanning,
               className: "p-3 bg-slate-900/80 border border-emerald-500/30 rounded-xl text-emerald-400 hover:text-white transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md group glass-panel cyber-border" 
             },
               isScanning ? React.createElement(Loader2, { size: 24, className: "animate-spin" }) : React.createElement(Scan, { size: 24, className: "group-hover:scale-110 transition-transform" })
             ),
             React.createElement("button", { 
               onClick: () => setIsCrossSectionView(!isCrossSectionView),
               className: `p-3 border rounded-xl transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md group glass-panel cyber-border ${isCrossSectionView ? 'bg-orange-500 text-slate-950 border-orange-400' : 'bg-slate-900/80 border-emerald-500/30 text-emerald-400 hover:text-white'}` 
             },
               React.createElement(Layers, { size: 24, className: "group-hover:scale-110 transition-transform" }),
               React.createElement("span", { className: "sr-only" }, isCrossSectionView ? 'Switch to 3D View' : 'Switch to Cross-Section')
             )
           ),
           !isCrossSectionView && React.createElement("div", { className: "absolute bottom-6 right-6 z-50 flex flex-col space-y-2" },
             React.createElement("div", { className: "flex space-x-2" },
               React.createElement("button", { onClick: () => adjustCamera('ROTATE_LEFT'), className: "p-2 bg-slate-900/80 border border-emerald-500/30 rounded-lg text-emerald-400 hover:text-white transition-all shadow-lg backdrop-blur-md glass-panel cyber-border", title: "Rotate Left" },
                 React.createElement(RotateCcw, { size: 18 })
               ),
               React.createElement("button", { onClick: () => adjustCamera('ROTATE_RIGHT'), className: "p-2 bg-slate-900/80 border border-emerald-500/30 rounded-lg text-emerald-400 hover:text-white transition-all shadow-lg backdrop-blur-md glass-panel cyber-border", title: "Rotate Right" },
                 React.createElement(RotateCw, { size: 18 })
               )
             ),
             React.createElement("div", { className: "flex space-x-2" },
               React.createElement("button", { onClick: () => adjustCamera('ZOOM_IN'), className: "p-2 bg-slate-900/80 border border-emerald-500/30 rounded-lg text-emerald-400 hover:text-white transition-all shadow-lg backdrop-blur-md glass-panel cyber-border", title: "Zoom In" },
                 React.createElement(ZoomIn, { size: 18 })
               ),
               React.createElement("button", { onClick: () => adjustCamera('ZOOM_OUT'), className: "p-2 bg-slate-900/80 border border-emerald-500/30 rounded-lg text-emerald-400 hover:text-white transition-all shadow-lg backdrop-blur-md glass-panel cyber-border", title: "Zoom Out" },
                 React.createElement(ZoomOut, { size: 18 })
               )
             ),
             React.createElement("div", { className: "flex space-x-2" },
               React.createElement("button", { onClick: () => adjustCamera('PAN_UP'), className: "p-2 bg-slate-900/80 border border-emerald-500/30 rounded-lg text-emerald-400 hover:text-white transition-all shadow-lg backdrop-blur-md glass-panel cyber-border", title: "Pan Up" },
                 React.createElement(ArrowUp, { size: 18 })
               ),
               React.createElement("button", { onClick: () => adjustCamera('PAN_DOWN'), className: "p-2 bg-slate-900/80 border border-emerald-500/30 rounded-lg text-emerald-400 hover:text-white transition-all shadow-lg backdrop-blur-md glass-panel cyber-border", title: "Pan Down" },
                 React.createElement(ArrowDown, { size: 18 })
               )
             ),
             React.createElement("button", { onClick: () => adjustCamera('RESET'), className: "p-2 bg-slate-900/80 border border-emerald-500/30 rounded-lg text-emerald-400 hover:text-white transition-all shadow-lg backdrop-blur-md glass-panel cyber-border", title: "Reset Camera" },
               React.createElement(RefreshCw, { size: 18 })
             )
           ),
           isScanning && (
              React.createElement("div", { className: "absolute inset-0 pointer-events-none z-20 bg-emerald-500/5 overflow-hidden" },
                 React.createElement("div", { className: "h-2 w-full absolute top-0 animate-[scanline_2s_linear_infinite] bg-emerald-400/60 shadow-[0_0_40px_rgba(52,211,153,0.6)]" })
              )
           ),
           React.createElement("div", { className: "absolute inset-0 pointer-events-none bg-gradient-to-t from-emerald-500/5 to-transparent mix-blend-overlay" })
        ),
        !isFocused && (
          React.createElement("div", { className: "w-80 bg-slate-950/90 border border-emerald-900/30 rounded-2xl p-5 flex flex-col space-y-4 shadow-2xl animate-in slide-in-from-right-6 duration-700 backdrop-blur-md glass-panel cyber-border" },
             React.createElement("div", { className: "flex items-center space-x-3 border-b border-emerald-900/40 pb-4 mb-1" },
                React.createElement(SlidersHorizontal, { size: 18, className: "text-emerald-500" }),
                React.createElement("span", { className: "text-[12px] font-black text-emerald-400 uppercase tracking-widest" }, "Calibration_Array")
             ),
             React.createElement("div", { className: "flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2" },
                isCrossSectionView && (
                  React.createElement("div", { className: "p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl mb-4 space-y-2 glass-panel" },
                    React.createElement("div", { className: "flex items-center justify-between" },
                      React.createElement("span", { className: "text-[7px] font-black text-orange-900 uppercase" }, "INSPECTION_DEPTH"),
                      React.createElement("span", { className: "text-[9px] font-terminal font-black text-orange-400" }, `${(highlightedDepth || allDepths[0]).toFixed(3)}m`)
                    ),
                    React.createElement("input", { 
                      type: "range", 
                      min: allDepths[0], 
                      max: allDepths[allDepths.length-1], 
                      step: (allDepths[1] - allDepths[0]) || 0.1,
                      value: highlightedDepth || allDepths[0], 
                      onChange: (e) => setHighlightedDepth(parseFloat(e.target.value)),
                      className: "w-full h-1 bg-slate-800 appearance-none rounded-full cursor-pointer accent-orange-500" 
                    })
                  )
                ),
                React.createElement("div", { className: "grid grid-cols-2 gap-2 mb-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl" },
                   React.createElement("div", { className: "space-y-1" },
                      React.createElement("div", { className: "flex items-center justify-between" },
                         React.createElement("span", { className: "text-[7px] font-black text-emerald-900 uppercase" }, "STRESS_THRESHOLD"),
                         React.createElement("span", { className: "text-[9px] font-terminal font-black text-emerald-400" }, `${stressThreshold} kpsi`)
                      ),
                      React.createElement("input", { 
                        type: "range", 
                        min: "50", 
                        max: "150", 
                        value: stressThreshold, 
                        onChange: (e) => setStressThreshold(parseInt(e.target.value)),
                        className: "w-full h-1 bg-slate-800 appearance-none rounded-full cursor-pointer accent-emerald-500" 
                      })
                   ),
                   React.createElement("div", { className: "space-y-1" },
                      React.createElement("div", { className: "flex items-center justify-between" },
                         React.createElement("span", { className: "text-[7px] font-black text-emerald-900 uppercase" }, "ANOMALY_INTENSITY"),
                         React.createElement("span", { className: "text-[9px] font-terminal font-black text-emerald-400" }, `${anomalyIntensity.toFixed(1)}x`)
                      ),
                      React.createElement("input", { 
                        type: "range", 
                        min: "1", 
                        max: "3", 
                        step: "0.1",
                        value: anomalyIntensity, 
                        onChange: (e) => setAnomalyIntensity(parseFloat(e.target.value)),
                        className: "w-full h-1 bg-slate-800 appearance-none rounded-full cursor-pointer accent-emerald-500" 
                      })
                   )
                ),
                Object.values(TraumaLayer).map((layer) => {
                  const isActive = activeLayers.has(layer);
                  const opacity = layerOpacities[layer];
                  const layerColor = getLayerColor(layer);
                  const accent = getSliderAccent(layer);
                  
                  return (
                    React.createElement("div", { 
                      key: layer, 
                      onClick: () => handleLayerChange(layer),
                      className: `group flex flex-col space-y-2 p-3.5 rounded-xl transition-all duration-300 border cursor-pointer glass-panel ${isActive ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] scale-[1.02]' : 'bg-slate-900/40 border-transparent hover:border-emerald-900/50 hover:bg-slate-900/60 opacity-60 hover:opacity-100'}`
                    },
                      React.createElement("div", { className: "flex items-center justify-between" },
                         React.createElement("div", { className: "flex items-center space-x-3" },
                            React.createElement("span", { className: isActive ? layerColor : 'text-emerald-900' }, layerToIcon[layer]),
                            React.createElement("span", { className: `text-[9px] font-black uppercase tracking-tight ${isActive ? 'text-emerald-100' : 'text-emerald-900'}` }, layer)
                         ),
                         React.createElement("div", { className: "flex items-center space-x-2" },
                            React.createElement("span", { className: "text-[7px] text-emerald-900 font-black uppercase" }, "OPACITY:"),
                            React.createElement("span", { className: `text-[10px] font-terminal font-black ${isActive ? layerColor : 'text-emerald-950'}` }, `${opacity}%`)
                         )
                      ),
                      React.createElement("input", { 
                        type: "range", 
                        min: "0", 
                        max: "100", 
                        value: opacity, 
                        onClick: (e) => e.stopPropagation(),
                        onChange: (e) => handleOpacityChange(layer, parseInt(e.target.value)),
                        className: `w-full h-1 bg-slate-800 appearance-none rounded-full cursor-pointer transition-all ${isActive ? accent : 'accent-emerald-950 opacity-30'}` 
                      })
                    )
                  );
                })
             ),
             activeLayers.has(TraumaLayer.STRESS) && (
               React.createElement("div", { className: "p-3 bg-red-500/5 border border-red-500/20 rounded-xl animate-in fade-in zoom-in-95 space-y-4 glass-panel" },
                  React.createElement("div", { className: "grid grid-cols-2 gap-3" },

                    React.createElement("div", { className: "space-y-1" },
                      React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("span", { className: "text-[7px] font-black text-red-900 uppercase" }, "Surface_Opacity"),
                        React.createElement("span", { className: "text-[9px] font-terminal font-black text-red-400" }, `${stressSurfaceOpacity}%`)
                      ),
                      React.createElement("input", { 
                        type: "range", 
                        min: "0", 
                        max: "100", 
                        value: stressSurfaceOpacity, 
                        onChange: (e) => setStressSurfaceOpacity(parseInt(e.target.value)),
                        className: "w-full h-1 bg-slate-800 appearance-none rounded-full cursor-pointer accent-red-500" 
                      })
                    ),
                    React.createElement("div", { className: "space-y-1" },
                      React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("span", { className: "text-[7px] font-black text-red-900 uppercase" }, "Wireframe"),
                        React.createElement("span", { className: "text-[9px] font-terminal font-black text-red-400" }, `${stressWireframeOpacity}%`)
                      ),
                      React.createElement("input", { 
                        type: "range", 
                        min: "0", 
                        max: "100", 
                        value: stressWireframeOpacity, 
                        onChange: (e) => setStressWireframeOpacity(parseInt(e.target.value)),
                        className: "w-full h-1 bg-slate-800 appearance-none rounded-full cursor-pointer accent-red-500" 
                      })
                    )
                  ),
                    React.createElement("div", { className: "space-y-1" },
                      React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("span", { className: "text-[7px] font-black text-red-900 uppercase" }, "Pulse_Intensity"),
                        React.createElement("span", { className: "text-[9px] font-terminal font-black text-red-400" }, `${stressPulseIntensity.toFixed(1)}x`)
                      ),
                      React.createElement("input", { 
                        type: "range", 
                        min: "1", 
                        max: "5", 
                        step: "0.1",
                        value: stressPulseIntensity, 
                        onChange: (e) => setStressPulseIntensity(parseFloat(e.target.value)),
                        className: "w-full h-1 bg-slate-800 appearance-none rounded-full cursor-pointer accent-red-500" 
                      })
                    )
                  )
               )
             ),
             React.createElement("div", { className: "pt-4 border-t border-emerald-900/20 text-[9px] text-emerald-900 font-black uppercase flex items-center justify-between" },
                React.createElement("span", { className: "flex items-center space-x-2" }, React.createElement(ShieldCheck, { size: 12 }), " ", React.createElement("span", null, "Veto_Control: Sector_Alpha")),
                React.createElement(Settings, { size: 14, className: "animate-spin-slow" })
             )
          )
        ),
      loadError && React.createElement("div", { className: "absolute bottom-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4" },
        React.createElement("div", { className: "bg-red-950/90 border border-red-500/50 px-6 py-3 rounded-xl shadow-2xl backdrop-blur-xl flex items-center space-x-4 cyber-border" },
          React.createElement(AlertCircle, { size: 20, className: "text-red-500 animate-pulse" }),
          React.createElement("div", { className: "flex flex-col" },
            React.createElement("span", { className: "text-[10px] font-black text-red-900 uppercase tracking-widest" }, "System_Error_Detected"),
            React.createElement("span", { className: "text-[12px] font-terminal text-red-100" }, loadError)
          ),
          React.createElement("button", { 
            onClick: () => setLoadError(null),
            className: "ml-4 p-1 text-red-900 hover:text-red-400 transition-colors"
          }, React.createElement(X, { size: 14 }))
        )
      ),
      !isFocused && React.createElement("div", { className: "h-80 bg-slate-950/95 border border-emerald-900/40 rounded-2xl flex flex-col overflow-hidden shadow-2xl glass-panel cyber-border" },
        React.createElement("div", { className: "bg-slate-900/95 border-b border-emerald-900/60 p-4 flex items-center justify-between" },
          React.createElement("div", { className: "flex items-center space-x-4" },
            React.createElement(ShieldAlert, { size: 22, className: "text-emerald-500" }),
            React.createElement("span", { className: "text-[12px] font-black text-emerald-400 uppercase tracking-[0.3em]" }, "Forensic_Black_Box_Logs")
          ),
          React.createElement("div", { className: "flex items-center space-x-3" },
             React.createElement("span", { className: "text-[9px] font-mono tracking-[0.2em] uppercase text-emerald-900 mr-2" }, "Archive_Nodes: " + blackBoxLogs.length),
             React.createElement("button", { 
               onClick: () => exportLogs('json'), 
               className: "p-2 text-emerald-900 hover:text-emerald-400 transition-colors bg-black/40 rounded-lg",
               title: "Export_JSON"
             },
               React.createElement(Download, { size: 16 })
             ),
             React.createElement("button", { 
               onClick: () => exportLogs('csv'), 
               className: "p-2 text-emerald-900 hover:text-amber-400 transition-colors bg-black/40 rounded-lg",
               title: "Export_CSV"
             },
               React.createElement(Share2, { size: 16 })
             ),
             React.createElement("button", { onClick: clearLogs, className: "p-2 text-emerald-900 hover:text-red-500 transition-colors bg-black/40 rounded-lg" },
               React.createElement(Trash2, { size: 16 })
             )
          )
        ),
        // Fix: Use an array for children to correctly handle `map` and conditional rendering.
        // Fix: Ensure `blackBoxLogs` and `highlightedDepth` are correctly accessed in scope.
        React.createElement("div", { className: "flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-950/20" },
          // Fix: Spread operator to correctly include elements returned by map as children.
          ...blackBoxLogs.map((log, idx) => {
            const isSelected = highlightedDepth === log.depth;
            const severityBg = log.severity === 'CRITICAL' ? 'bg-red-500/20 border-red-500 text-red-400' : 
                               log.severity === 'WARNING' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 
                               'bg-emerald-500/20 border-emerald-500 text-emerald-400';

            return (
              React.createElement("div", { 
                key: `${log.timestamp}-${idx}`, 
                onClick: (e) => handleLogClick(e, log),
                className: `flex flex-col border-l-4 rounded-xl p-5 transition-all cursor-pointer relative group overflow-hidden glass-panel ${isSelected ? 'bg-emerald-500/10 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'bg-slate-900/40 border-emerald-900/30 hover:bg-slate-900/80 hover:border-emerald-700'}`
              },
                // Fix: Conditional rendering for `pingCoord`
                isSelected && pingCoord
                   ? React.createElement("div", { 
                    className: "absolute rounded-full bg-emerald-500/40 animate-[ping_0.8s_ease-out_infinite] pointer-events-none",
                    style: { left: pingCoord.x - 20, top: pingCoord.y - 20, width: 40, height: 40 }
                   })
                   : null,
                React.createElement("div", { className: "flex items-center justify-between mb-3" },
                  React.createElement("div", { className: "flex items-center space-x-5" },
                    React.createElement("span", { className: `px-3 py-1 rounded-md text-[9px] font-black tracking-widest border ${severityBg}` },
                      log.severity
                    ),
                    React.createElement("span", { className: "text-[13px] font-black text-emerald-100 uppercase tracking-tight" }, `${log.layer} @ `, React.createElement("span", { className: "text-emerald-400 underline decoration-emerald-500/40 underline-offset-4" }, `${log.depth.toFixed(3)}m`))
                  ),
                  React.createElement("div", { className: "flex items-center space-x-3 text-[10px] font-mono text-emerald-900" },
                    React.createElement(Clock, { size: 12 }),
                    React.createElement("span", null, new Date(log.timestamp).toLocaleTimeString())
                  )
                ),
                React.createElement("p", { className: "text-[11px] text-emerald-100/80 font-mono italic leading-relaxed pr-12" }, log.description),
                React.createElement("div", { className: "flex items-center justify-between mt-4 pt-4 border-t border-emerald-900/30" },
                   React.createElement("div", { className: "flex items-center space-x-6" },
                      React.createElement("div", { className: "flex items-center space-x-2" },
                         React.createElement(Zap, { size: 14, className: "text-emerald-500" }),
                         React.createElement("span", { className: "text-[13px] font-black text-emerald-400" }, `${log.value.toFixed(2)}`, React.createElement("span", { className: "text-[9px] opacity-60 ml-1.5 uppercase font-mono" }, log.unit))
                      ),
                      React.createElement("div", { className: "h-5 w-px bg-emerald-900/50" }),
                      React.createElement("div", { className: "flex items-center space-x-2" },
                         React.createElement(MapPin, { size: 12, className: isSelected ? 'text-emerald-400' : 'text-emerald-900' }),
                         React.createElement("span", { className: `text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-emerald-400' : 'text-emerald-900'}` }, isSelected ? 'LOCATED_ON_RECONSTRUCTION' : 'AWAITING_RELOCATION')
                      )
                   ),
                   React.createElement("div", { className: "flex items-center space-x-3" },
                      React.createElement(ChevronRight, { size: 22, className: `transition-all duration-500 ${isSelected ? 'translate-x-3 text-emerald-400' : 'text-emerald-900 group-hover:text-emerald-600'}` })
                   )
                )
              )
            );
          }),
          // Fix: Conditional rendering for empty logs state.
          // Changed from `&& (...)` to `? React.createElement(...) : null` to fix syntax.
          blackBoxLogs.length === 0
            ? React.createElement("div", { className: "h-full flex flex-col items-center justify-center opacity-10" },
                React.createElement(Terminal, { size: 64, className: "mb-6" }),
                React.createElement("span", { className: "text-[14px] font-black uppercase tracking-[0.5em]" }, "Audit_Vault_Empty")
              )
            : null
        )
      ),
      showClearConfirm && React.createElement("div", { className: "fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" },
        React.createElement("div", { className: "w-96 bg-slate-950 border border-red-500/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.3)] cyber-border glass-panel" },
          React.createElement("div", { className: "flex items-center space-x-4 mb-6" },
            React.createElement(AlertCircle, { size: 32, className: "text-red-500 animate-pulse" }),
            React.createElement("h3", { className: "text-xl font-black text-red-100 uppercase tracking-tighter" }, "Wipe_Trace_History")
          ),
          React.createElement("p", { className: "text-[11px] text-slate-400 font-terminal leading-relaxed mb-8 uppercase tracking-widest" }, 
            "CONFIRM: This action will permanently delete all forensic trace history from the local black box. This operation is irreversible."
          ),
          React.createElement("div", { className: "flex space-x-4" },
            React.createElement("button", { 
              onClick: () => setShowClearConfirm(false),
              className: "flex-1 py-3 bg-slate-900 border border-slate-700 text-slate-400 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
            }, "Abort_Operation"),
            React.createElement("button", { 
              onClick: executeClearLogs,
              className: "flex-1 py-3 bg-red-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
            }, "Confirm_Wipe")
          )
        )
      ),
      React.createElement("style", null, `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1100%); }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Custom Ping animation for log click feedback */
        @keyframes ping {
          0% {
            transform: scale(0.2);
            opacity: 0.8;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `)
    )
  );
};

export default TraumaNode;