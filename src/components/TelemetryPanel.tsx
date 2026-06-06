import React, { useState, useEffect, useRef } from 'react';
import { AcousticLeakVisualizer } from './AcousticLeakVisualizer';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  ReferenceDot,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  Activity, 
  Gauge, 
  Thermometer, 
  Play, 
  Pause, 
  ShieldAlert, 
  Zap, 
  SlidersHorizontal,
  FileDown,
  Eye,
  History,
  Pin,
  MessageSquare,
  Check,
  X,
  BarChart2,
  Tag,
  Cpu,
  Camera,
  Trash2
} from 'lucide-react';
import { DirectoryNode } from '../types';

interface TelemetryPanelProps {
  terminalTheme?: 'emerald' | 'crimson';
  addLog: (message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  selectedFile?: DirectoryNode | null;
}

interface TelemetryDataPoint {
  timeSnapshot: string;
  pressure: number;
  temperature: number;
  flowRate: number;
  stressIndex: number;
  timestampMs?: number;
}

interface FrequencyDataPoint {
  frequencyHz: string;
  frequencyVal: number;
  amplitudeDb: number;
  bandName: string;
  desc: string;
  status: 'nominal' | 'elevated' | 'critical';
}

interface FrequencySnapshot {
  id: string;
  index: number;
  timestamp: string;
  data: FrequencyDataPoint[];
  pressureSnapshot: number;
  temperatureSnapshot: number;
  flowRateSnapshot: number;
  leakTypeSnapshot: 'pressure' | 'temperature' | 'none';
}

export interface ForensicEvent {
  id: string;
  timestamp: string;
  type: 'casing_trauma' | 'datum_shift';
  message: string;
  depthM?: number;
  defectId: string;
  severity: 'warning' | 'critical' | 'info';
  tags?: string[];
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  terminalTheme = 'emerald',
  addLog,
  selectedFile
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [updateIntervalMs, setUpdateIntervalMs] = useState(1500);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const [showPressure, setShowPressure] = useState(true);
  const [showTemperature, setShowTemperature] = useState(true);
  const [customPressureThreshold, setCustomPressureThreshold] = useState(7800);
  const [customTempThreshold, setCustomTempThreshold] = useState(230);
  const [showStatsPanel, setShowStatsPanel] = useState(true);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showPredictiveProjection, setShowPredictiveProjection] = useState(false);
  const [chartDomain, setChartDomain] = useState<'time' | 'frequency'>('time');
  const [frequencyData, setFrequencyData] = useState<FrequencyDataPoint[]>([]);
  const [frequencySnapshots, setFrequencySnapshots] = useState<FrequencySnapshot[]>([]);
  const [selectedComparisonSnapshotId, setSelectedComparisonSnapshotId] = useState<string | null>(null);

  const spectralMetrics = React.useMemo(() => {
    if (!frequencyData || frequencyData.length === 0) {
      return {
        rms: 0,
        peakToPeak: 0,
        snr: 0,
        crestFactor: 0,
        dominantFreq: '0 Hz',
        dominantBand: 'None',
        totalPower: 0,
        signalStatus: 'nominal' as 'nominal' | 'elevated' | 'critical'
      };
    }

    // 1. RMS (Root Mean Square)
    const sumSquares = frequencyData.reduce((acc, pt) => acc + pt.amplitudeDb * pt.amplitudeDb, 0);
    const rms = Math.sqrt(sumSquares / frequencyData.length);

    // 2. Peak-to-Peak
    const amplitudes = frequencyData.map(pt => pt.amplitudeDb);
    const maxDb = Math.max(...amplitudes);
    const minDb = Math.min(...amplitudes);
    const peakToPeak = maxDb - minDb;

    // 3. SNR (Signal-To-Noise Ratio)
    // Signal level: top 3 highest peaks. Noise floor: remaining bands.
    const sortedAmps = [...amplitudes].sort((a, b) => b - a);
    const topPeaks = sortedAmps.slice(0, 3);
    const baselineNoise = sortedAmps.slice(3);
    const signalAvg = topPeaks.reduce((acc, v) => acc + v, 0) / (topPeaks.length || 1);
    const noiseAvg = baselineNoise.reduce((acc, v) => acc + v, 0) / (baselineNoise.length || 1);
    const snr = Math.max(0, signalAvg - noiseAvg);

    // 4. Crest Factor (Decibel Spikiness representation)
    const crestFactor = maxDb - rms;

    // 5. Dominant Frequency
    const dominantPt = frequencyData.reduce((max, pt) => pt.amplitudeDb > max.amplitudeDb ? pt : max, frequencyData[0]);
    const dominantFreq = dominantPt?.frequencyHz || '0 Hz';
    const dominantBand = dominantPt?.bandName || 'None';

    // 6. Total integrated power
    const totalPower = frequencyData.reduce((sum, pt) => sum + pt.amplitudeDb, 0);

    let signalStatus: 'nominal' | 'elevated' | 'critical' = 'nominal';
    if (maxDb > 70 || rms > 50) {
      signalStatus = 'critical';
    } else if (maxDb > 50 || rms > 30) {
      signalStatus = 'elevated';
    }

    return {
      rms,
      peakToPeak,
      snr,
      crestFactor,
      dominantFreq,
      dominantBand,
      totalPower,
      signalStatus
    };
  }, [frequencyData]);

  const frequencyBands: { freq: number; name: string; desc: string }[] = [
    { freq: 15, name: 'Tectonic Infrasound', desc: 'Bedding layer friction' },
    { freq: 30, name: 'Pneumatic Sub-Harmonics', desc: 'Fluid column oscillation' },
    { freq: 45, name: 'Reciprocating Pumps', desc: 'Rotary torque harmonics' },
    { freq: 65, name: 'Casing Ringing Resonance', desc: 'Symmetrical pipe humming' },
    { freq: 90, name: 'Liner Lap Vibrations', desc: 'Joint seal acoustics' },
    { freq: 120, name: 'Turbulent Pipe Flow', desc: 'Localized fluid velocity' },
    { freq: 160, name: 'Gas Slug Ingress', desc: 'Void passage acoustics' },
    { freq: 210, name: 'Shear Strata Sticking', desc: 'Microbore compression waves' },
    { freq: 280, name: 'Sulfide Corrosive Crackles', desc: 'Cavitation whispering' },
    { freq: 360, name: 'Cryo-Gas Venting', desc: 'Joule-Thomson thermal expansion' },
    { freq: 450, name: 'Cement Annulus Channelling', desc: 'Adhesion boundary buzz' },
    { freq: 550, name: 'High-Frequency Whistles', desc: 'Narrow stress fissure escape' },
    { freq: 680, name: 'Acoustic Leak Sigh', desc: 'Erosion jet friction' },
    { freq: 820, name: 'Ultra-seismic Screech', desc: 'Gas jet venting hiss' },
    { freq: 1000, name: 'Digital Transceiver Interference', desc: 'Telemetry ping crosstalk' }
  ];

  // Background Potential Leak Analysis Engine Settings
  const [isLeakScannerEnabled, setIsLeakScannerEnabled] = useState(true);
  const [leakPressureThreshold, setLeakPressureThreshold] = useState(250);
  const [leakTempDropThreshold, setLeakTempDropThreshold] = useState(2.0);
  const [lastLeakDetectedTime, setLastLeakDetectedTime] = useState<string | null>(null);

  // Sensory audio acoustic alarm states
  const [isAcousticAlarmActive, setIsAcousticAlarmActive] = useState(false);
  const [activeLeakType, setActiveLeakType] = useState<'pressure' | 'temperature' | null>(null);

  const handleDismissAlarm = () => {
    setIsAcousticAlarmActive(false);
    setActiveLeakType(null);
    addLog('[ACOUSTIC COMMAND] Alarm sirens silenced status manually.', 'info');
  };

  // States for pinning annotation markers on the chart for collaborative reporting
  const [pinnedPins, setPinnedPins] = useState<{
    id: string;
    timeSnapshot: string;
    pressure: number;
    temperature: number;
    comment: string;
    category: 'casing_trauma' | 'datum_shift' | 'info';
  }[]>([]);

  const [pendingAnnotation, setPendingAnnotation] = useState<{
    timeSnapshot: string;
    pressure: number;
    temperature: number;
    flowRate: number;
    stressIndex: number;
  } | null>(null);

  const [annotationComment, setAnnotationComment] = useState('');
  const [annotationCategory, setAnnotationCategory] = useState<'casing_trauma' | 'datum_shift' | 'info'>('info');

  const handleCommitPin = () => {
    if (!pendingAnnotation) return;
    const commentText = annotationComment.trim() || 'Manual patholgical point inspection';
    const pinId = `pin-${Date.now()}`;
    const newPin = {
      id: pinId,
      timeSnapshot: pendingAnnotation.timeSnapshot,
      pressure: pendingAnnotation.pressure,
      temperature: pendingAnnotation.temperature,
      comment: commentText,
      category: annotationCategory
    };

    setPinnedPins(prev => [...prev, newPin]);

    // Build the Forensic Event Log item reflecting the cooperative marker!
    const newEvent: ForensicEvent = {
      id: `fe-pinned-${pinId}`,
      timestamp: pendingAnnotation.timeSnapshot,
      type: annotationCategory === 'casing_trauma' ? 'casing_trauma' : 'datum_shift',
      message: `[COLLABORATIVE PIN] ${commentText} (Casing Pressure: ${pendingAnnotation.pressure} PSI, Wellbore Temperature: ${pendingAnnotation.temperature}°F).`,
      defectId: annotationCategory === 'casing_trauma' ? 'def-01' : 'def-04', // provide dynamic jump coordinates triggers
      severity: annotationCategory === 'casing_trauma' ? 'critical' : annotationCategory === 'datum_shift' ? 'warning' : 'info',
      depthM: annotationCategory === 'casing_trauma' ? 140 : 910,
      tags: [annotationCategory === 'casing_trauma' ? 'Casing Integrity' : 'Thermal Influx']
    };

    setForensicEvents(prev => [newEvent, ...prev]);
    addLog(`[FORENSIC CONTROL] Drop annotation marker at ${pendingAnnotation.timeSnapshot}. Collaborative pathololy records synced.`, 'success');

    // Reset state inputs
    setPendingAnnotation(null);
    setAnnotationComment('');
  };

  const handleCaptureSnapshot = () => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Create new snapshot
    const currentActivePoint = dataPoints[dataPoints.length - 1];
    const pressureSnapshot = currentActivePoint ? currentActivePoint.pressure : 6800;
    const temperatureSnapshot = currentActivePoint ? currentActivePoint.temperature : 205;
    const flowRateSnapshot = currentActivePoint ? currentActivePoint.flowRate : 38.5;
    const leakTypeSnapshot = activeLeakType || 'none';
    
    const newSnapshot: FrequencySnapshot = {
      id: `snap-${Date.now()}`,
      index: frequencySnapshots.length + 1,
      timestamp,
      data: JSON.parse(JSON.stringify(frequencyData)),
      pressureSnapshot,
      temperatureSnapshot,
      flowRateSnapshot,
      leakTypeSnapshot
    };
    
    setFrequencySnapshots(prev => [...prev, newSnapshot]);
    addLog(`[FORENSIC SPECTRAL] Captured and saved Trace Snapshot #${newSnapshot.index} for comparative analysis.`, 'success');
  };

  const handleClearSnapshots = () => {
    setFrequencySnapshots([]);
    setSelectedComparisonSnapshotId(null);
    addLog('[FORENSIC SPECTRAL] Cleared all saved spectral snapshots.', 'info');
  };

  const handleToggleOverlay = (id: string) => {
    setSelectedComparisonSnapshotId(prev => (prev === id ? null : id));
  };

  const handleRemoveSnapshot = (id: string) => {
    setFrequencySnapshots(prev => prev.filter(snap => snap.id !== id));
    setSelectedComparisonSnapshotId(prev => (prev === id ? null : prev));
    addLog('[FORENSIC SPECTRAL] Removed spectral trace snapshot.', 'info');
  };

  // Pre-load historic casing trauma events mapping exactly to our 3D model seams
  const [forensicEvents, setForensicEvents] = useState<ForensicEvent[]>(() => {
    const now = new Date();
    const makeTimeString = (offsetMinutes: number) => {
      const time = new Date(now.getTime() - offsetMinutes * 60 * 1000);
      return time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return [
      {
        id: 'fe-01',
        timestamp: makeTimeString(22),
        type: 'casing_trauma',
        message: 'Tectonic strata shifting load peak: abnormal metal stress near bedding layer.',
        depthM: 380,
        defectId: 'def-02',
        severity: 'critical',
        tags: ['Casing Integrity', 'Strata Deformation']
      },
      {
        id: 'fe-02',
        timestamp: makeTimeString(15),
        type: 'datum_shift',
        message: 'Scour thinning trace registered on downhole pneumatic sweep telemetry.',
        depthM: 140,
        defectId: 'def-01',
        severity: 'warning',
        tags: ['Thermal Influx']
      },
      {
        id: 'fe-03',
        timestamp: makeTimeString(8),
        type: 'casing_trauma',
        message: 'Compaction cross-section pinch: casing experienced minor roundness ovality.',
        depthM: 650,
        defectId: 'def-03',
        severity: 'warning',
        tags: ['Casing Integrity']
      },
      {
        id: 'fe-04',
        timestamp: makeTimeString(3),
        type: 'datum_shift',
        message: 'Microbiological sulfate sulfur corrosion identified near connection joint.',
        depthM: 910,
        defectId: 'def-04',
        severity: 'info',
        tags: ['Thermal Influx']
      }
    ];
  });

  // Event log visual filter query
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Raise quick jump trigger down to the D3-powered canvas
  const triggerQuickJump = (defectId: string) => {
    addLog(`[FORENSIC CONTROL] Dispatched target alignment event to lock 3D scan coordinates on defect #${defectId}.`, 'info');
    const customEvent = new CustomEvent('jump-to-casing-defect', {
      detail: { artifactId: defectId }
    });
    window.dispatchEvent(customEvent);
  };

  // Derived state to maintain compatibility with preset tabs
  const displayMode = showPressure && showTemperature 
    ? 'all' 
    : showPressure 
      ? 'pressure' 
      : 'temperature';

  const togglePressure = () => {
    const nextVal = !showPressure;
    if (!nextVal && !showTemperature) {
      addLog(`[TELEMETRY] Terminal requires at least one active telemetry stream for diagnostic tracking. Action rejected.`, 'warning');
      return;
    }
    setShowPressure(nextVal);
    addLog(`[TELEMETRY] Dynamic casing pressure stream toggled ${nextVal ? 'ON' : 'OFF'} for trends isolation.`, 'info');
  };

  const toggleTemperature = () => {
    const nextVal = !showTemperature;
    if (!showPressure && !nextVal) {
      addLog(`[TELEMETRY] Terminal requires at least one active telemetry stream for diagnostic tracking. Action rejected.`, 'warning');
      return;
    }
    setShowTemperature(nextVal);
    addLog(`[TELEMETRY] Wellbore temperature stream toggled ${nextVal ? 'ON' : 'OFF'} for trends isolation.`, 'info');
  };

  const handleSetDisplayMode = (mode: 'all' | 'pressure' | 'temperature') => {
    if (mode === 'all') {
      setShowPressure(true);
      setShowTemperature(true);
      addLog('[TELEMETRY] Synced display mode: DUAL monitors active.', 'info');
    } else if (mode === 'pressure') {
      setShowPressure(true);
      setShowTemperature(false);
      addLog('[TELEMETRY] Synced display mode: Casing pressure isolated.', 'info');
    } else if (mode === 'temperature') {
      setShowPressure(false);
      setShowTemperature(true);
      addLog('[TELEMETRY] Synced display mode: Internal temperature isolated.', 'info');
    }
  };

  // Buffer holding rolling simulation data (max 25 points)
  const [dataPoints, setDataPoints] = useState<TelemetryDataPoint[]>(() => {
    // Generate initial beautiful 18 points
    const initialData: TelemetryDataPoint[] = [];
    const now = new Date();
    for (let i = 17; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5000);
      const timeStr = time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const waveVal = Math.sin((17 - i) * 0.4);
      const cosVal = Math.cos((17 - i) * 0.6);
      
      initialData.push({
        timeSnapshot: timeStr,
        pressure: Math.round(6200 + waveVal * 450 + cosVal * 150),
        temperature: Math.round(195 + waveVal * 8 + cosVal * 3),
        flowRate: Math.round(38.5 + waveVal * 2.5 + cosVal * 1.5),
        stressIndex: Math.round(35 + waveVal * 12 + cosVal * 5),
        timestampMs: time.getTime()
      });
    }
    return initialData;
  });

  // 10-second forward-looking trend estimate projection calculation
  const chartData = React.useMemo(() => {
    if (!showPredictiveProjection) {
      return dataPoints;
    }
    const n = dataPoints.length;
    if (n < 2) {
      return dataPoints;
    }

    // Determine the average time interval in milliseconds between active dataPoints
    let avgStepMs = 1500;
    const lastPt = dataPoints[n - 1];
    const firstPt = dataPoints[0];
    if (lastPt?.timestampMs && firstPt?.timestampMs) {
      avgStepMs = (lastPt.timestampMs - firstPt.timestampMs) / (n - 1);
    }
    
    // We want a 10s lookahead, generating 5 projection points (e.g. 2s, 4s, 6s, 8s, 10s)
    const lookaheadMs = 10000;
    const stepsCount = 5;
    const stepOffsetMs = lookaheadMs / stepsCount;

    // Linear regression on the last 12 points to compute trend slopes
    const recentPoints = dataPoints.slice(-12);
    const mRegression = recentPoints.length;

    let sumX = 0;
    let sumXX = 0;
    let sumY_press = 0;
    let sumY_temp = 0;
    let sumXY_press = 0;
    let sumXY_temp = 0;

    recentPoints.forEach((pt, idx) => {
      sumX += idx;
      sumXX += idx * idx;
      sumY_press += pt.pressure;
      sumXY_press += idx * pt.pressure;
      sumY_temp += pt.temperature;
      sumXY_temp += idx * pt.temperature;
    });

    const denominator = (mRegression * sumXX) - (sumX * sumX);

    let slopePress = 0;
    let interceptPress = dataPoints[n - 1].pressure;
    if (denominator !== 0) {
      slopePress = (mRegression * sumXY_press - sumX * sumY_press) / denominator;
      interceptPress = (sumY_press - slopePress * sumX) / mRegression;
    }

    let slopeTemp = 0;
    let interceptTemp = dataPoints[n - 1].temperature;
    if (denominator !== 0) {
      slopeTemp = (mRegression * sumXY_temp - sumX * sumY_temp) / denominator;
      interceptTemp = (sumY_temp - slopeTemp * sumX) / mRegression;
    }

    // Historical points mapping
    const chartPoints = dataPoints.map((pt, idx) => {
      const isLast = idx === n - 1;
      return {
        ...pt,
        pressureProjected: isLast ? pt.pressure : undefined,
        temperatureProjected: isLast ? pt.temperature : undefined,
      };
    }) as any[];

    // Generate projected future data points
    const lastTimestampMs = dataPoints[n - 1].timestampMs || Date.now();
    for (let i = 1; i <= stepsCount; i++) {
      const futureTimeMs = lastTimestampMs + i * stepOffsetMs;
      const futureDate = new Date(futureTimeMs);
      const timeStr = futureDate.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (p)';

      // X correspond to (mRegression - 1) + normalized steps
      const indexOffset = (i * stepOffsetMs) / avgStepMs;
      const futureX = (mRegression - 1) + indexOffset;

      const projPress = Math.round(interceptPress + slopePress * futureX);
      const projTemp = parseFloat((interceptTemp + slopeTemp * futureX).toFixed(1));

      // Limit extrapolation to reasonable dynamic ranges
      const constrainedPress = Math.min(10500, Math.max(4000, projPress));
      const constrainedTemp = Math.min(275, Math.max(130, projTemp));

      chartPoints.push({
        timeSnapshot: timeStr,
        pressure: undefined as any,
        temperature: undefined as any,
        flowRate: dataPoints[n - 1].flowRate,
        stressIndex: dataPoints[n - 1].stressIndex,
        timestampMs: futureTimeMs,
        pressureProjected: constrainedPress,
        temperatureProjected: constrainedTemp,
        isProjection: true,
      });
    }

    return chartPoints;
  }, [dataPoints, showPredictiveProjection]);

  // Synchronize scrubIndex changes to 3D Casing model spatial scanning visualizer
  useEffect(() => {
    if (scrubIndex !== null && dataPoints[scrubIndex]) {
      const idx = scrubIndex;
      const pointsLength = dataPoints.length || 1;
      const depthM = Math.round(100 + (idx / (pointsLength - 1 || 1)) * 800);
      const customEvent = new CustomEvent('telemetry-hover-timestamp', {
        detail: {
          timeSnapshot: dataPoints[idx].timeSnapshot,
          depthM: depthM
        }
      });
      window.dispatchEvent(customEvent);
    }
  }, [scrubIndex, dataPoints]);

  const [lastAnomalyTime, setLastAnomalyTime] = useState<string | null>(null);
  const isCloggingRef = useRef(false);
  const clogTimerRef = useRef<number | null>(null);

  // Determine theme synchronizer logic mapped to active selected Diagnostic Profile
  const themeSynchronizer = React.useMemo(() => {
    let state: 'nominal' | 'warning' | 'severe' = 'nominal';
    let profileName = 'SYSTEM DEFAULT MONITOR';
    let traumaPercent = 0;

    if (selectedFile) {
      traumaPercent = selectedFile.traumaRating ?? 0;
      profileName = selectedFile.name;
      if (traumaPercent > 70) {
        state = 'severe';
      } else if (traumaPercent > 30) {
        state = 'warning';
      } else {
        state = 'nominal';
      }
    }

    let mainStroke = '';
    let pressureGradient = '';
    let gridStroke = '';
    let tickColor = '';
    let tickLineColor = '';
    let ambientShadow = '';
    let statusLabel = '';
    let statusBg = '';
    let statusBorder = '';

    if (state === 'severe') {
      mainStroke = '#dc2626'; // Deep crimson for high-severity trauma events
      pressureGradient = '#ef4444';
      gridStroke = 'rgba(239, 68, 68, 0.28)'; // High intensity grid
      tickColor = 'rgba(239, 68, 68, 0.7)';
      tickLineColor = 'rgba(239, 68, 68, 0.35)';
      ambientShadow = '0 0 15px rgba(220, 38, 38, 0.35)';
      statusLabel = 'SEVERE TRAUMA STABILIZATION';
      statusBg = 'bg-red-950/40';
      statusBorder = 'border-red-500/40 text-red-400';
    } else if (state === 'warning') {
      mainStroke = '#f59e0b'; // Amber warning
      pressureGradient = '#d97706';
      gridStroke = 'rgba(245, 158, 11, 0.16)'; // Moderate intensity grid
      tickColor = 'rgba(245, 158, 11, 0.55)';
      tickLineColor = 'rgba(245, 158, 11, 0.22)';
      ambientShadow = '0 0 10px rgba(245, 158, 11, 0.2)';
      statusLabel = 'DEGRADED PROFILE WARNING';
      statusBg = 'bg-amber-950/30';
      statusBorder = 'border-amber-500/30 text-amber-400';
    } else {
      // Nominal - defaults based on terminalTheme
      if (terminalTheme === 'crimson') {
        mainStroke = '#f87171'; // Crimson red-400
        pressureGradient = '#ef4444';
        gridStroke = 'rgba(248, 113, 113, 0.08)'; // Subtler grid for standard
        tickColor = 'rgba(248, 113, 113, 0.45)';
        tickLineColor = 'rgba(248, 113, 113, 0.15)';
        ambientShadow = '0 0 6px rgba(248, 113, 113, 0.05)';
        statusLabel = 'CRIMSON PROFILE MODE';
        statusBg = 'bg-red-950/10';
        statusBorder = 'border-red-500/20 text-red-500/80';
      } else {
        mainStroke = '#34d399'; // Emerald green-400
        pressureGradient = '#10b981';
        gridStroke = 'rgba(16, 185, 129, 0.06)'; // Standard low-intensity grid
        tickColor = 'rgba(16, 185, 129, 0.45)';
        tickLineColor = 'rgba(16, 185, 129, 0.15)';
        ambientShadow = '0 0 6px rgba(16, 185, 129, 0.05)';
        statusLabel = 'EMERALD NOMINAL MODE';
        statusBg = 'bg-emerald-950/10';
        statusBorder = 'border-emerald-500/20 text-emerald-400/85';
      }
    }

    return {
      state,
      profileName,
      traumaPercent,
      mainStroke,
      pressureGradient,
      gridStroke,
      tickColor,
      tickLineColor,
      ambientShadow,
      statusLabel,
      statusBg,
      statusBorder
    };
  }, [selectedFile, terminalTheme]);

  // Determine standard theme accent colors
  const mainColor = themeSynchronizer.mainStroke;
  const secondaryColor = '#06b6d4'; // cyan-500

  // Synchronizer diagnostic logging on profile switch
  const addLogRef = useRef(addLog);
  useEffect(() => {
    addLogRef.current = addLog;
  }, [addLog]);

  const lastLoggedPathRef = useRef<string | undefined>(undefined);
  const lastLoggedRatingRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const currentPath = selectedFile?.path;
    const currentRating = selectedFile?.traumaRating;

    if (currentPath === lastLoggedPathRef.current && currentRating === lastLoggedRatingRef.current) {
      return;
    }
    lastLoggedPathRef.current = currentPath;
    lastLoggedRatingRef.current = currentRating;

    if (selectedFile) {
      const activeRating = selectedFile.traumaRating ?? 0;
      if (activeRating > 70) {
        addLogRef.current(`[THEME SYNCHRONIZER] Diagnostic profile switched to HIGH-SEVERITY trauma: [${selectedFile.name}]. Rescaled grid to maximum intensity and aligned telemetry sensors to dangerous Crimson palette.`, 'error');
      } else if (activeRating > 30) {
        addLogRef.current(`[THEME SYNCHRONIZER] Diagnostic profile mapped to DEGRADED system state: [${selectedFile.name}]. Recalibrated grid contrast and optimized amber line tracing.`, 'warning');
      } else {
        addLogRef.current(`[THEME SYNCHRONIZER] Diagnostic profile aligned to NOMINAL conditions: [${selectedFile.name}]. Reset telemetry charts to baseline standards.`, 'success');
      }
    } else {
      addLogRef.current(`[THEME SYNCHRONIZER] Diagnostic profile cleared. Telemetry chart restored to current workspace defaults.`, 'info');
    }
  }, [selectedFile?.path, selectedFile?.traumaRating]);

  // Compute stats overlay values (Mean, Min, Max of current sensor buffer)
  const stats = React.useMemo(() => {
    if (dataPoints.length === 0) {
      return {
        pressure: { mean: 0, min: 0, max: 0 },
        temperature: { mean: 0, min: 0, max: 0 },
        flowRate: { mean: 0, min: 0, max: 0 },
        stressIndex: { mean: 0, min: 0, max: 0 },
      };
    }
    const extractStats = (key: 'pressure' | 'temperature' | 'flowRate' | 'stressIndex') => {
      const vals = dataPoints.map(d => d[key]);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const sum = vals.reduce((acc, v) => acc + v, 0);
      const mean = sum / vals.length;
      return { mean, min, max };
    };

    return {
      pressure: extractStats('pressure'),
      temperature: extractStats('temperature'),
      flowRate: extractStats('flowRate'),
      stressIndex: extractStats('stressIndex'),
    };
  }, [dataPoints]);

  // Core Simulation interval: inject fluctuation metrics
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setDataPoints(prev => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Base values
        let pressureBase = 6200;
        let tempBase = 195;
        let flowBase = 38.5;

        // Introduce temporary petrophysical wellbore clogging or tectonic drift behavior
        if (isCloggingRef.current) {
          // Surge values during simulated clogging
          pressureBase = 8100;
          tempBase = 242;
          flowBase = 15.2; // Flow drops as pressure rises!
        }

        const waveVal = Math.sin(now.getTime() * 0.0003);
        const randVal = (Math.random() - 0.5) * 80;
        const tempRand = (Math.random() - 0.5) * 2;
        const flowRand = (Math.random() - 0.5) * 1.2;

        const newPressure = Math.round(pressureBase + waveVal * 350 + randVal);
        const newTemp = Math.round(tempBase + waveVal * 12 + tempRand);
        const newFlow = Math.round(flowBase + waveVal * 3 + flowRand);
        const stress = Math.round(((newPressure - 4500) / 4500) * 100 + (newTemp - 160) * 0.5);
        const constrainedStress = Math.min(100, Math.max(0, stress));

        // Alarm validations
        if (newPressure > customPressureThreshold) {
          addLog(`[TELEMETRY WARNING] Critical hydraulic overpressure registered: ${newPressure} psi exceeds nominal safety thresholds. Vector recalibration advised.`, 'error');
          setLastAnomalyTime(timeStr);

          setForensicEvents(prev => {
            // Prevent spamming identical logs by checking the last few seconds
            const duplicate = prev.slice(0, 3).some(e => e.message.includes('overpressure threshold') && e.severity === 'critical');
            if (duplicate) return prev;

            const newEv: ForensicEvent = {
              id: `fe-dyn-pres-${Date.now()}`,
              timestamp: timeStr,
              type: 'datum_shift',
              message: `Telemetry alert: casing overpressure threshold breached at ${newPressure} PSI. Seam #1 stress load peak recorded.`,
              depthM: 380,
              defectId: 'def-02',
              severity: 'critical'
            };
            return [newEv, ...prev].slice(0, 20);
          });
        } else if (newTemp > customTempThreshold) {
          addLog(`[TELEMETRY INFO] Dynamic wellbore expansion detected thermal climb: ${newTemp}°F. Temperature logs exceed limit thresholds.`, 'warning');
          setLastAnomalyTime(timeStr);

          setForensicEvents(prev => {
            const duplicate = prev.slice(0, 3).some(e => e.message.includes('thermal limit'));
            if (duplicate) return prev;

            const newEv: ForensicEvent = {
              id: `fe-dyn-temp-${Date.now()}`,
              timestamp: timeStr,
              type: 'datum_shift',
              message: `Geothermal anomaly: casing thermal limit breached at ${newTemp}°F. Joint Pit connection expansion detected.`,
              depthM: 910,
              defectId: 'def-04',
              severity: 'warning'
            };
            return [newEv, ...prev].slice(0, 20);
          });
        }

        const newPoint: TelemetryDataPoint = {
          timeSnapshot: timeStr,
          pressure: newPressure,
          temperature: newTemp,
          flowRate: newFlow,
          stressIndex: constrainedStress,
          timestampMs: Date.now()
        };

        const nowMs = Date.now();
        const cutoffMs = nowMs - 60000;
        let copy = prev.filter(pt => !pt.timestampMs || pt.timestampMs >= cutoffMs);
        if (copy.length < 25) {
          copy = prev.slice(-30);
        }
        copy.push(newPoint);
        return copy;
      });
    }, updateIntervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, updateIntervalMs, customPressureThreshold, customTempThreshold, addLog]);

  // Publish telemetry and forensic events to the window object for PDF reporting
  useEffect(() => {
    (window as any).wellTegraTelemetryReportData = {
      dataPoints,
      forensicEvents,
      isLeakScannerEnabled,
      leakPressureThreshold,
      leakTempDropThreshold,
      lastLeakDetectedTime
    };
  }, [dataPoints, forensicEvents, isLeakScannerEnabled, leakPressureThreshold, leakTempDropThreshold, lastLeakDetectedTime]);

  // Generate or update diagnostic frequency-domain spectral data points in real-time (FFT placeholder)
  useEffect(() => {
    const updateSpectrum = () => {
      const activePoint = dataPoints[dataPoints.length - 1];
      const flowVal = activePoint ? activePoint.flowRate : 38.5;
      const isSevere = themeSynchronizer.state === 'severe';
      const isWarning = themeSynchronizer.state === 'warning';

      const newData = frequencyBands.map((band) => {
        let baseDb = 10 + Math.random() * 8; // default background noise

        // 1. Reciprocating pumps at 45Hz
        if (band.freq === 45) {
          baseDb = 68 + Math.random() * 6;
        }

        // 2. Localized pump sub-harmonics at 30Hz
        if (band.freq === 30) {
          baseDb = 42 + Math.random() * 5;
        }

        // 3. Fluid line velocities (Turbulent flow at 120Hz proportional to flow rates)
        if (band.freq === 120) {
          const flowFactor = Math.min(60, flowVal * 1.2);
          baseDb = 25 + flowFactor + Math.random() * 8;
        }

        // 4. Injected overpressure/Mud Volumetric Shocks (low-to-mid frequency saturation, 15Hz to 210Hz)
        if (isCloggingRef.current || activeLeakType === 'pressure') {
          if (band.freq >= 15 && band.freq <= 210) {
            baseDb += 40 + Math.random() * 15;
          }
        }

        // 5. Cryo-Gas temperature drop leakage (intense high frequency whistle whistle, 550Hz to 820Hz)
        if (activeLeakType === 'temperature') {
          if (band.freq >= 550 && band.freq <= 820) {
            baseDb += 55 + Math.random() * 12;
          }
        }

        // 6. Theme distress/seasons profiles
        if (isSevere) {
          baseDb += 15 + Math.random() * 8;
        } else if (isWarning) {
          baseDb += 6 + Math.random() * 4;
        }

        // Constrain amplitude between 0 and 100 dB
        const amplitudeDb = Math.round(Math.min(100, Math.max(5, baseDb)));

        let status: 'nominal' | 'elevated' | 'critical' = 'nominal';
        if (amplitudeDb > 80) {
          status = 'critical';
        } else if (amplitudeDb > 55) {
          status = 'elevated';
        }

        return {
          frequencyHz: `${band.freq} Hz`,
          frequencyVal: band.freq,
          amplitudeDb,
          bandName: band.name,
          desc: band.desc,
          status
        } as FrequencyDataPoint;
      });

      setFrequencyData(newData);
    };

    updateSpectrum(); // initial execution

    if (!isPlaying) return;

    const interval = setInterval(updateSpectrum, 450);
    return () => clearInterval(interval);
  }, [dataPoints, activeLeakType, isPlaying, themeSynchronizer.state]);

  // Ref to track which timestamps of the telemetry buffer have already been scanned to prevent double-logging
  const flaggedSnapshotsRef = useRef<Set<string>>(new Set());

  // Background Analysis Worker: Scans the incoming telemetry buffer for sudden spikes or drops
  useEffect(() => {
    if (!isLeakScannerEnabled || dataPoints.length < 2) return;

    const latestPoint = dataPoints[dataPoints.length - 1];
    const prevPoint = dataPoints[dataPoints.length - 2];
    
    // Safety guard: skip if we've already evaluated this timestamp
    if (flaggedSnapshotsRef.current.has(latestPoint.timeSnapshot)) return;

    const pressureRise = latestPoint.pressure - prevPoint.pressure;
    const tempDrop = prevPoint.temperature - latestPoint.temperature;

    let flagDetected = false;
    let alarmMessage = '';
    let categoryType: 'pressure_spike' | 'temp_drop' | null = null;

    if (pressureRise >= leakPressureThreshold) {
      flagDetected = true;
      categoryType = 'pressure_spike';
      alarmMessage = `Sudden pressure spike detected: +${pressureRise} PSI deviation (Threshold: +${leakPressureThreshold} PSI). Fluid kick risk.`;
    } else if (tempDrop >= leakTempDropThreshold) {
      flagDetected = true;
      categoryType = 'temp_drop';
      alarmMessage = `Sudden temperature drop detected: -${tempDrop.toFixed(1)}°F deviation (Threshold: -${leakTempDropThreshold.toFixed(1)}°F). Fluid expansion leak (Joule-Thomson effect).`;
    }

    if (flagDetected && categoryType) {
      // Mark as flagged
      flaggedSnapshotsRef.current.add(latestPoint.timeSnapshot);
      setLastLeakDetectedTime(latestPoint.timeSnapshot);

      // Create a Forensic Event in the local log
      const newEventId = `fe-leak-${latestPoint.timeSnapshot}-${Date.now()}`;
      const newEvent: ForensicEvent = {
        id: newEventId,
        timestamp: latestPoint.timeSnapshot,
        type: 'casing_trauma',
        message: `[LEAK ALERT] ${alarmMessage}`,
        depthM: 540, // standard location of middle physical cement seam #2
        defectId: categoryType === 'pressure_spike' ? 'def-02' : 'def-01',
        severity: 'critical',
        tags: ['Potential Leak', categoryType === 'pressure_spike' ? 'Pressure Spike' : 'Temp Drop']
      };

      setForensicEvents(prev => {
        // Prevent duplicate forensic logs of the same message in close succession
        const isDuplicate = prev.slice(0, 3).some(ev => ev.timestamp === latestPoint.timeSnapshot && ev.tags?.includes('Potential Leak'));
        if (isDuplicate) return prev;
        return [newEvent, ...prev].slice(0, 30);
      });

      // Also append to the main sovereign terminal black box log via addLog props
      addLog(`[POTENTIAL LEAK] ${alarmMessage}`, 'error');

      // Trigger the real-time acoustic signal frequency alarm sirens
      setIsAcousticAlarmActive(true);
      setActiveLeakType(categoryType === 'pressure_spike' ? 'pressure' : 'temperature');
    }
  }, [dataPoints, isLeakScannerEnabled, leakPressureThreshold, leakTempDropThreshold, addLog]);

  // Command control action to spike logs
  const handleSpikeInjected = () => {
    isCloggingRef.current = true;
    addLog(`[TELEMETRY COMMAND] INJECTING HYDRAULIC PRESSURE OVERLOAD: Simulating wellbore kick profile...`, 'error');
    
    // Auto restore to nominal state after 8 seconds
    if (clogTimerRef.current) {
      window.clearTimeout(clogTimerRef.current);
    }
    
    clogTimerRef.current = window.setTimeout(() => {
      isCloggingRef.current = false;
      addLog(`[TELEMETRY SYSTEM] Hydraulic overpressure dissipating. Wellbore status recovered back to nominal baseline operations.`, 'success');
    }, 8000) as unknown as number;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Append standard custom event pointing to Seam #1 def-02
    setForensicEvents(prev => {
      const newEv: ForensicEvent = {
        id: `fe-shock-${Date.now()}`,
        timestamp: timeStr,
        type: 'datum_shift',
        message: 'Critical mud shockwave command executed. 8940 PSI shock forced stress overload on physical seam #1.',
        depthM: 380,
        defectId: 'def-02',
        severity: 'critical'
      };
      return [newEv, ...prev].slice(0, 20);
    });

    // Immediately trigger a customized surge in the dataset to show instantly on charts
    setDataPoints(prev => {
      const copy = [...prev];
      
      const surgePoint: TelemetryDataPoint = {
        timeSnapshot: timeStr,
        pressure: 8940,
        temperature: 254,
        flowRate: 9.8,
        stressIndex: 98,
        timestampMs: Date.now()
      };
      
      const cutoffMs = Date.now() - 60000;
      let trimmed = copy.filter(pt => !pt.timestampMs || pt.timestampMs >= cutoffMs);
      if (trimmed.length < 25) {
        trimmed = copy.slice(-30);
      }
      trimmed.push(surgePoint);
      return trimmed;
    });
   };

  // Command control action to inject a temperature drop (leak expansion cooling)
  const handleLeakTempDropInjected = () => {
    addLog(`[TELEMETRY COMMAND] INJECTING FLUID EXPANSION LEAK: Simulating localized cryogenic gas decompression...`, 'error');
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Append a custom event pointing to Seam #2 (where the leak scanning results focus)
    setForensicEvents(prev => {
      const newEv: ForensicEvent = {
        id: `fe-chill-${Date.now()}`,
        timestamp: timeStr,
        type: 'casing_trauma',
        message: 'Manual thermal pressure release test. Casing temperature dropped by -8.5°F.',
        depthM: 540,
        defectId: 'def-01',
        severity: 'critical'
      };
      return [newEv, ...prev].slice(0, 20);
    });

    // Inject the cold point into the charting timeline
    setDataPoints(prev => {
      if (prev.length === 0) return prev;
      const lastPt = prev[prev.length - 1];
      const copy = [...prev];
      const chilledPoint: TelemetryDataPoint = {
        timeSnapshot: timeStr,
        pressure: Math.max(4800, Math.round(lastPt.pressure - 400)), // Pressure drops with volume escape
        temperature: Math.max(120, Math.round(lastPt.temperature - 9)), // Sudden thermal plunge!
        flowRate: Math.round(lastPt.flowRate + 12), // Venting rates expand
        stressIndex: 72,
        timestampMs: Date.now()
      };

      const cutoffMs = Date.now() - 60000;
      let trimmed = copy.filter(pt => !pt.timestampMs || pt.timestampMs >= cutoffMs);
      if (trimmed.length < 25) {
        trimmed = copy.slice(-30);
      }
      trimmed.push(chilledPoint);
      return trimmed;
    });
  };

  // Export current simulated data to CSV
  const handleExportCSV = () => {
    try {
      const headers = ['Timestamp', 'Wellbore Pressure (psi)', 'Temperature (Deg F)', 'Venting Flow (bbl/min)', 'Seismic Stress Index (%)'];
      const csvRows = [
        headers.join(','),
        ...dataPoints.map(p => [
          p.timeSnapshot,
          p.pressure,
          p.temperature,
          p.flowRate,
          p.stressIndex
        ].join(','))
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `wellbore_telemetry_forensics_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addLog(`Wellbore sensor logs: Exported ${dataPoints.length} temporal datasets as raw telemetry CSV for forensics audit.`, 'success');
    } catch (e) {
      addLog(`Failed exporting petrophysical telemetry stream to CSV. Check permission frameworks.`, 'error');
    }
  };

  const filteredEvents = forensicEvents.filter(e => {
    if (!logSearchQuery) return true;
    const query = logSearchQuery.toLowerCase();
    const matchesQuery = e.message.toLowerCase().includes(query) || 
           e.type.toLowerCase().includes(query) || 
           e.timestamp.toLowerCase().includes(query) ||
           (e.depthM && e.depthM.toString().includes(query)) ||
           (e.tags && e.tags.some(t => t.toLowerCase().includes(query)));
    return matchesQuery;
  });

  const handleBatchTag = (tagToAssign: string) => {
    const trimmedTag = tagToAssign.trim();
    if (!trimmedTag) return;
    
    setForensicEvents(prev => prev.map(ev => {
      if (selectedEventIds.includes(ev.id)) {
        const currentTags = ev.tags || [];
        if (!currentTags.includes(trimmedTag)) {
          return { ...ev, tags: [...currentTags, trimmedTag] };
        }
      }
      return ev;
    }));
    
    addLog(`[FORENSIC] Assigned category '${trimmedTag}' to ${selectedEventIds.length} event records.`, 'success');
  };

  const handleBatchRemoveTags = () => {
    setForensicEvents(prev => prev.map(ev => {
      if (selectedEventIds.includes(ev.id)) {
        return { ...ev, tags: [] };
      }
      return ev;
    }));
    addLog(`[FORENSIC] Cleared all categorical tags from ${selectedEventIds.length} event records.`, 'info');
  };

  const handleToggleSelectAll = () => {
    const allFilteredIds = filteredEvents.map(e => e.id);
    const areAllSelected = allFilteredIds.every(id => selectedEventIds.includes(id));
    
    if (areAllSelected) {
      // Deselect all filtered
      setSelectedEventIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Select all filtered
      setSelectedEventIds(prev => {
        const union = new Set([...prev, ...allFilteredIds]);
        return Array.from(union);
      });
    }
  };

  // Quick helper to render custom tooltip inside Recharts
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-emerald-500/40 p-2.5 rounded shadow-[0_0_20px_rgba(0,0,0,0.8)] font-mono text-[9px] text-white/95 max-w-[190px]">
          <div className="border-b border-emerald-500/20 pb-1 mb-1 font-bold text-center text-emerald-400">
            TIMESTAMP: {label}
          </div>
          <div className="flex flex-col gap-1">
            {payload.map((pld: any) => (
              <div key={pld.name} className="flex justify-between items-center gap-4">
                <span className="text-zinc-500 text-[8.5px] uppercase font-bold tracking-wider">{pld.name}:</span>
                <span className="font-extrabold font-sans text-right" style={{ color: pld.stroke || pld.fill }}>
                  {pld.value.toLocaleString()} 
                  {pld.name.includes('Pressure') ? ' psi' : pld.name.includes('Temp') ? ' °F' : pld.name.includes('Rate') ? ' bbl/m' : ' %'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Render custom tooltip for frequency-domain FFT elements
  const renderFrequencyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as FrequencyDataPoint;
      let statusColor = 'text-emerald-400';
      if (data.status === 'critical') statusColor = 'text-red-400 font-extrabold animate-pulse';
      else if (data.status === 'elevated') statusColor = 'text-amber-400 font-bold';

      return (
        <div className="bg-slate-950/98 border border-cyan-500/40 p-2.5 rounded shadow-[0_0_20px_rgba(0,0,0,0.85)] font-mono text-[9px] text-white/95 p-3.5 max-w-[210px] select-none">
          <div className="border-b border-cyan-500/20 pb-1.5 mb-1.5 font-bold text-center text-cyan-400 uppercase tracking-widest text-[8.5px]">
            FFT SPECTRAL PROBE
          </div>
          <div className="flex flex-col gap-1.5 text-[8.5px]">
            <div className="flex justify-between items-center gap-4">
              <span className="text-zinc-500 font-bold uppercase">Frequency:</span>
              <span className="font-extrabold text-white text-right">{data.frequencyHz}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-zinc-500 font-bold uppercase">Amplitude:</span>
              <span className="font-extrabold text-cyan-400 text-right">{data.amplitudeDb} dB</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-zinc-500 font-bold uppercase">Filter Band:</span>
              <span className="text-white text-right font-medium truncate max-w-[110px]">{data.bandName}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-zinc-500 font-bold uppercase">Diagnostic:</span>
              <span className={`${statusColor} text-right uppercase text-[8px]`}>
                {data.status === 'critical' ? 'CRITICAL DISTRESS' : data.status === 'elevated' ? 'ELEVATED LEVEL' : 'NOMINAL BASELINE'}
              </span>
            </div>
            <div className="border-t border-zinc-850 pt-1.5 mt-1.5 text-[7.5px] text-zinc-400 italic font-sans leading-snug">
              {data.desc}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const currentActivePoint = (scrubIndex !== null && dataPoints[scrubIndex])
    ? dataPoints[scrubIndex]
    : dataPoints[dataPoints.length - 1];

  return (
    <div className="bg-[#020617]/90 border border-emerald-500/20 rounded-md p-4 flex flex-col gap-3.5 scanline-glow relative select-none" id="telemetry-panel">
      {/* Decorative cyber corner tag */}
      <div className="absolute top-0 right-4 -translate-y-1/2 bg-black px-2 py-0.5 border border-emerald-500/25 rounded text-[8px] font-mono text-emerald-400 font-bold tracking-widest uppercase">
        WELL_SENSOR_BETA
      </div>

      <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
        <h3 className="font-mono text-emerald-400 text-xs font-bold flex items-center gap-2 glow-text-emerald uppercase tracking-wider">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          Real-Time Petrophysical Wellbore Monitor
        </h3>
        
        <div className="flex items-center gap-1.5 font-mono text-[9px]">
          {/* Stats Overlay Toggle Button */}
          <button
            type="button"
            onClick={() => setShowStatsPanel(!showStatsPanel)}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 font-extrabold tracking-widest uppercase ${
              showStatsPanel 
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 hover:text-cyan-300' 
                : 'bg-black/50 border-emerald-500/10 text-zinc-400 hover:border-emerald-500/20 hover:text-white'
            }`}
            title="Toggle petrophysical statistics overlay info panel"
          >
            <BarChart2 className="w-2.5 h-2.5" />
            <span>STATS</span>
          </button>

          {/* Pause/Play Stream Button */}
          <button
            type="button"
            onClick={() => {
              setIsPlaying(!isPlaying);
              addLog(`Wellbore petrophysical sensor data feed ${!isPlaying ? 'RESUMED (Active polling)' : 'PAUSED'}`, 'info');
            }}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 font-extrabold tracking-widest uppercase ${
              isPlaying 
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                : 'bg-black/50 border-emerald-500/10 text-emerald-500/40 hover:border-emerald-500/20'
            }`}
            title={isPlaying ? "Pause real-time telemetry stream" : "Play real-time telemetry stream"}
          >
            {isPlaying ? (
              <>
                <Pause className="w-2.5 h-2.5 animate-pulse" />
                <span>LIVE</span>
              </>
            ) : (
              <>
                <Play className="w-2.5 h-2.5" />
                <span>PAUSE</span>
              </>
            )}
          </button>
        </div>
      </div>

      <p className="font-mono text-[9px] text-zinc-400 leading-relaxed -mt-1 select-text">
        Active downhole petrophysical stream profiling geothermal reservoirs, fluid density matrices, and pneumatic pressures.
      </p>

      {/* Theme Synchronizer Dynamics Panel */}
      <div className={`p-2 rounded border font-mono text-[9px] flex flex-col sm:flex-row items-center justify-between gap-2.5 transition-all duration-300 ${themeSynchronizer.statusBg} ${themeSynchronizer.statusBorder}`}>
        <div className="flex items-center gap-2">
          <Cpu className={`w-3.5 h-3.5 animate-pulse ${themeSynchronizer.state === 'severe' ? 'text-red-500' : themeSynchronizer.state === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`} />
          <div>
            <div className="font-bold tracking-wider text-[9px]">
              THEME SYNCHRONIZER: <span className="underline decoration-dotted">{themeSynchronizer.statusLabel}</span>
            </div>
            <div className="text-zinc-400 text-[8px] mt-0.5">
              Active Profile: <span className="text-cyan-400 font-bold">{themeSynchronizer.profileName}</span>
              {themeSynchronizer.traumaPercent > 0 && (
                <span> (Intrusive Distress Stress Rating: <span className={themeSynchronizer.state === 'severe' ? 'text-red-400 font-bold' : 'text-amber-400'}>{themeSynchronizer.traumaPercent}%</span>)</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[8px]">
          <span className="text-zinc-500 uppercase">Interactive Pairings:</span>
          
          {/* Telemetry Line Color Badge */}
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-black/60 rounded border border-white/5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeSynchronizer.mainStroke }} />
            <span className="text-zinc-400">LINE:</span>
            <span className="font-bold text-white uppercase">{themeSynchronizer.mainStroke}</span>
          </div>

          {/* Grid line Color Intensity Badge */}
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-black/60 rounded border border-white/5">
            <span className="w-1.5 h-1.5 rounded" style={{ backgroundColor: themeSynchronizer.gridStroke }} />
            <span className="text-zinc-400">GRID INTENSITY:</span>
            <span className="font-bold text-neutral-300">
              {themeSynchronizer.state === 'severe' ? 'HIGH (28%)' : themeSynchronizer.state === 'warning' ? 'MED (16%)' : 'NOMINAL (6%)'}
            </span>
          </div>
        </div>
      </div>

      {/* 60s Historic Playback Scrubber Bar */}
      <div className="bg-[#01040f]/90 border border-emerald-500/15 p-2 rounded-md font-mono text-[8.5px] items-center flex flex-col sm:flex-row gap-2.5 select-text">
        <div className="flex items-center gap-1.5 shrink-0 select-none">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={() => {
              setIsPlaying(!isPlaying);
              addLog(`Wellbore petrophysical sensor data feed ${!isPlaying ? 'RESUMED (Active polling)' : 'PAUSED'}`, 'info');
              if (!isPlaying) {
                setScrubIndex(null);
              }
            }}
            className={`p-1.5 rounded border transition-all cursor-pointer flex items-center justify-center ${
              isPlaying 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
            }`}
            title={isPlaying ? "Pause Stream" : "Resume Live Stream"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Mode Banner Indicator */}
          <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-extrabold border tracking-wider shrink-0 ${
            scrubIndex !== null 
              ? 'bg-cyan-950/40 border-cyan-500/35 text-cyan-400' 
              : isPlaying 
                ? 'bg-emerald-950/40 border-emerald-500/35 text-emerald-400 animate-pulse' 
                : 'bg-amber-950/45 border-amber-500/35 text-amber-500'
          }`}>
            {scrubIndex !== null ? 'PAST' : isPlaying ? 'LIVE FEED' : 'PAUSED'}
          </span>
        </div>

        {/* Playback Range Slider */}
        <div className="flex-1 flex items-center gap-2 w-full">
          <span className="text-zinc-500 text-[8px] font-bold select-none shrink-0 uppercase">60s BUFFER</span>
          <input
            type="range"
            min={0}
            max={dataPoints.length > 0 ? dataPoints.length - 1 : 0}
            value={scrubIndex !== null ? Math.min(scrubIndex, dataPoints.length - 1) : dataPoints.length - 1}
            disabled={dataPoints.length === 0}
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              setIsPlaying(false); // Pauses the live stream when scrubbing
              setScrubIndex(idx);
              addLog(`[PLAYBACK] Scrubbing sensor buffer. Point centered: ${dataPoints[idx]?.timeSnapshot}`, 'info');
            }}
            className="flex-grow accent-emerald-500 h-1 bg-zinc-900 border border-emerald-500/10 rounded-lg cursor-pointer max-w-none hover:accent-cyan-400 transition-colors"
          />
          
          <div className="flex gap-2 text-[8px] tracking-tight shrink-0 select-none">
            {/* Snap back to real-time live mode */}
            {scrubIndex !== null && (
              <button
                type="button"
                onClick={() => {
                  setScrubIndex(null);
                  setIsPlaying(true);
                  addLog('[PLAYBACK] Snap aligned back to live downhole telemetry stream.', 'success');
                }}
                className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 hover:border-cyan-400 text-cyan-400 hover:text-white font-extrabold uppercase animate-pulse cursor-pointer"
                title="Repool coordinates back to fresh real-time tracking"
              >
                Snap Live
              </button>
            )}
            
            {/* Timestamp status bubble */}
            <span className="bg-zinc-950/70 border border-white/5 px-1.5 py-0.5 rounded text-zinc-400">
              {scrubIndex !== null 
                ? `PTS: ${dataPoints[scrubIndex]?.timeSnapshot}` 
                : `LATEST: ${dataPoints[dataPoints.length - 1]?.timeSnapshot}`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Cyberpunk-themed Stats Overlay display */}
      {showStatsPanel && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#010912]/85 border border-cyan-500/30 p-2 rounded font-mono text-[8.5px] relative overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.12)] select-text" id="telemetry-stats-overlay">
          {/* Cyberpunk left-side indicator border strip */}
          <div className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-cyan-400" />
          
          {/* Item 1: PSI Stats */}
          <div className="flex flex-col gap-0.5 border-r border-[#10b981]/15 pr-1.5 pl-1.5">
            <div className="flex items-center gap-1 text-[#10b981] font-extrabold uppercase tracking-wider text-[7.5px] truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              Downhole PSI Stats
            </div>
            <div className="grid grid-cols-3 gap-0.5 mt-1 text-center bg-black/45 p-1 rounded border border-[#10b981]/10">
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[6px] uppercase leading-none pb-0.5">Mean</span>
                <span className="text-emerald-400 font-extrabold font-sans text-[9px] leading-none">{Math.round(stats.pressure.mean).toLocaleString()}</span>
              </div>
              <div className="flex flex-col border-x border-[#10b981]/15">
                <span className="text-zinc-500 text-[6px] uppercase leading-none pb-0.5">Min</span>
                <span className="text-zinc-400 font-bold font-sans text-[9px] leading-none">{stats.pressure.min.toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[6px] uppercase leading-none pb-0.5 font-bold text-red-500/90">Max</span>
                <span className="text-red-400 font-extrabold font-sans text-[9px] leading-none">{stats.pressure.max.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Item 2: Temperature Stats */}
          <div className="flex flex-col gap-0.5 border-r border-cyan-500/15 pr-1.5 pl-1">
            <div className="flex items-center gap-1 text-cyan-400 font-extrabold uppercase tracking-wider text-[7.5px] truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Thermal Temp Stats
            </div>
            <div className="grid grid-cols-3 gap-0.5 mt-1 text-center bg-black/45 p-1 rounded border border-cyan-500/10">
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[6px] uppercase leading-none pb-0.5">Mean</span>
                <span className="text-cyan-400 font-extrabold font-sans text-[9px] leading-none">{stats.temperature.mean.toFixed(1)}°</span>
              </div>
              <div className="flex flex-col border-x border-cyan-500/15">
                <span className="text-zinc-500 text-[6px] uppercase leading-none pb-0.5">Min</span>
                <span className="text-zinc-400 font-bold font-sans text-[9px] leading-none">{stats.temperature.min}°</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[6px] uppercase leading-none pb-0.5 font-bold text-amber-500/90">Max</span>
                <span className="text-amber-400 font-extrabold font-sans text-[9px] leading-none">{stats.temperature.max}°</span>
              </div>
            </div>
          </div>

          {/* Item 3: Flow Rate Stats */}
          <div className="flex flex-col gap-0.5 border-r border-amber-500/15 pr-1.5 pl-1">
            <div className="flex items-center gap-1 text-amber-500 font-extrabold uppercase tracking-wider text-[7.5px] truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Mud Flow Stats
            </div>
            <div className="grid grid-cols-3 gap-0.5 mt-1 text-center bg-black/45 p-1 rounded border border-amber-500/10">
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[6px] uppercase leading-none pb-0.5">Mean</span>
                <span className="text-amber-400 font-extrabold font-sans text-[9px] leading-none">{stats.flowRate.mean.toFixed(1)}</span>
              </div>
              <div className="flex flex-col border-x border-amber-500/15">
                <span className="text-zinc-500 text-[6px] uppercase leading-none pb-0.5">Min</span>
                <span className="text-zinc-400 font-bold font-sans text-[9px] leading-none">{stats.flowRate.min}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[6px] uppercase leading-none pb-0.5 font-bold text-rose-500/90">Max</span>
                <span className="text-rose-400 font-extrabold font-sans text-[9px] leading-none">{stats.flowRate.max}</span>
              </div>
            </div>
          </div>

          {/* Item 4: Stress Index Stats */}
          <div className="flex flex-col gap-0.5 pl-1 pr-1">
            <div className="flex items-center gap-1 text-rose-400 font-extrabold uppercase tracking-wider text-[7.5px] truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Dilatancy Stress
            </div>
            <div className="grid grid-cols-3 gap-0.5 mt-1 text-center bg-black/45 p-1 rounded border border-rose-500/10">
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[6px] uppercase leading-none pb-0.5">Mean</span>
                <span className="text-rose-400 font-extrabold font-sans text-[9px] leading-none">{Math.round(stats.stressIndex.mean)}%</span>
              </div>
              <div className="flex flex-col border-x border-rose-500/15">
                <span className="text-zinc-500 text-[6px] uppercase leading-none pb-0.5">Min</span>
                <span className="text-zinc-400 font-bold font-sans text-[9px] leading-none">{stats.stressIndex.min}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[6px] uppercase leading-none pb-0.5 font-bold text-red-500/90">Max</span>
                <span className="text-red-400 font-extrabold font-sans text-[9px] leading-none">{stats.stressIndex.max}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary HUD Dashboard Metrics */}
      <div className="grid grid-cols-4 gap-2 text-center font-mono">
        {/* Pressure Gauge Metric */}
        <div className="bg-[#01040f]/75 border border-emerald-500/10 p-1.5 rounded flex flex-col justify-between align-middle h-14 relative group">
          <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-0.5 justify-center">
            <Gauge className="w-2.5 h-2.5 text-zinc-500" />
            Downhole PSI
          </span>
          <span className={`text-[13px] font-black tracking-tight leading-none ${
            currentActivePoint?.pressure > customPressureThreshold 
              ? 'text-red-400 font-black animate-pulse' 
              : 'text-emerald-400'
          }`}>
            {currentActivePoint?.pressure ?? '6,200'}
          </span>
          <span className="text-[6.5px] text-zinc-600 block leading-none">LIMIT: {customPressureThreshold}</span>
        </div>

        {/* Temperature Thermal Metric */}
        <div className="bg-[#01040f]/75 border border-emerald-500/10 p-1.5 rounded flex flex-col justify-between align-middle h-14 relative group">
          <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-0.5 justify-center">
            <Thermometer className="w-2.5 h-2.5 text-zinc-500" />
            Thermal °F
          </span>
          <span className={`text-[13px] font-black tracking-tight leading-none ${
            currentActivePoint?.temperature > customTempThreshold 
              ? 'text-amber-400 font-bold animate-pulse' 
              : 'text-cyan-400'
          }`}>
            {currentActivePoint?.temperature ?? '195'}°
          </span>
          <span className="text-[6.5px] text-zinc-600 block leading-none">LIMIT: {customTempThreshold}</span>
        </div>

        {/* Mud Flow Rate Fluid Metric */}
        <div className="bg-[#01040f]/75 border border-emerald-500/10 p-1.5 rounded flex flex-col justify-between align-middle h-14 relative group">
          <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-0.5 justify-center">
            <Zap className="w-2.5 h-2.5 text-zinc-500" />
            Venting BBL
          </span>
          <span className={`text-[13px] font-black tracking-tight leading-none ${
            isCloggingRef.current ? 'text-red-400 font-bold' : 'text-amber-400'
          }`}>
            {currentActivePoint?.flowRate ?? '38.5'}
          </span>
          <span className="text-[6.5px] text-zinc-600 block leading-none">BBL/MIN</span>
        </div>

        {/* Stress & Tectonic Strain Index */}
        <div className="bg-[#01040f]/75 border border-emerald-500/10 p-1.5 rounded flex flex-col justify-between align-middle h-14 relative group">
          <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-0.5 justify-center">
            <Activity className="w-2.5 h-2.5 text-zinc-500" />
            Stress Index
          </span>
          <span className="text-[13px] font-black tracking-tight leading-none text-rose-400">
            {currentActivePoint?.stressIndex ?? '35'}%
          </span>
          <span className="text-[6.5px] text-zinc-600 block leading-none">DILATANCY</span>
        </div>
      </div>

      {/* Display Mode / Speed Tuning / CSV Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-black/55 p-1 px-2 rounded border border-emerald-500/10 font-mono text-[8.5px] font-extrabold uppercase">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-[8px]">DISPLAY:</span>
          <div className="flex bg-black/45 rounded border border-emerald-500/5 p-0.5">
            <button
              type="button"
              onClick={() => handleSetDisplayMode('all')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${displayMode === 'all' ? 'bg-emerald-500/15 text-emerald-400 font-black' : 'text-zinc-500'}`}
            >
              DUAL
            </button>
            <button
              type="button"
              onClick={() => handleSetDisplayMode('pressure')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${displayMode === 'pressure' ? 'bg-emerald-500/15 text-emerald-400 font-black' : 'text-zinc-500'}`}
            >
              PSI
            </button>
            <button
              type="button"
              onClick={() => handleSetDisplayMode('temperature')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${displayMode === 'temperature' ? 'bg-[#06b6d4]/15 text-[#06b6d4] font-black' : 'text-zinc-500'}`}
            >
              TEMP
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-[8px]">RATE:</span>
          <div className="flex bg-black/45 rounded border border-emerald-500/5 p-0.5">
            <button
              type="button"
              onClick={() => setUpdateIntervalMs(1000)}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${updateIntervalMs === 1000 ? 'bg-emerald-500/15 text-emerald-400 font-black' : 'text-zinc-500'}`}
              title="Poll every 1 second"
            >
              FAST
            </button>
            <button
              type="button"
              onClick={() => setUpdateIntervalMs(2500)}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${updateIntervalMs === 2500 ? 'bg-emerald-500/15 text-emerald-400 font-black' : 'text-zinc-500'}`}
              title="Poll every 2.5 seconds"
            >
              STBY
            </button>
          </div>
        </div>

        {/* CSV Exporter */}
        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1 text-[8px] border border-cyan-500/30 hover:border-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/20 text-cyan-400 hover:text-cyan-300 transition-colors uppercase cursor-pointer"
          title="Export current petrophysical telemetry as CSV"
        >
          <FileDown className="w-2.5 h-2.5" />
          CSV
        </button>
      </div>

      {/* Pinned Annotation Prompt HUD */}
      {pendingAnnotation && (
        <div className="bg-[#051524]/90 border border-cyan-500/40 p-2.5 rounded flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-[9px] relative overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-in fade-in slide-in-from-top-1 duration-200" id="telemetry-pin-annotation-form">
          {/* Cyberpunk left-side scanline highlights */}
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-400" />
          
          <div className="flex flex-col gap-1 select-text">
            <span className="font-extrabold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wide text-[9.5px]">
              <Pin className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
              CONFIGURE COLLABORATIVE ANNOTATION POINT
            </span>
            <div className="text-zinc-400 leading-normal">
              PINNING COORDINATES:{' '}
              <span className="text-cyan-400 font-extrabold bg-cyan-950 px-1 rounded">{pendingAnnotation.timeSnapshot}</span>
              {' '}&middot; PRESS:{' '}
              <span className="text-emerald-300 font-bold">{pendingAnnotation.pressure} PSI</span>
              {' '}&middot; TEMP:{' '}
              <span className="text-cyan-400 font-bold">{pendingAnnotation.temperature}°F</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dropdown for type classification to group the report */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[7.2px] text-zinc-500 uppercase tracking-wider font-extrabold">CLASSIFICATION</span>
              <select
                value={annotationCategory}
                onChange={(e) => setAnnotationCategory(e.target.value as any)}
                className="px-2 py-1 bg-black/60 border border-cyan-500/20 rounded text-cyan-400 font-black focus:outline-none focus:border-cyan-400 text-[8.5px] cursor-pointer"
              >
                <option value="info">INFO SHIFT</option>
                <option value="datum_shift">DATUM SHIFT ALERT</option>
                <option value="casing_trauma">CASING TRAUMA CRITICAL</option>
              </select>
            </div>

            {/* Input comment field */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[7.2px] text-zinc-500 uppercase tracking-wider font-extrabold">REPORTING MESSAGE</span>
              <input
                type="text"
                placeholder="Diagnostic pathology comment (e.g., localized deformation)..."
                value={annotationComment}
                onChange={(e) => setAnnotationComment(e.target.value)}
                className="px-2.5 py-1 bg-black/80 border border-cyan-500/25 rounded text-cyan-200 focus:outline-none focus:border-cyan-400 text-[8.5px] w-56 md:w-64 placeholder-zinc-600 font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommitPin();
                }}
              />
            </div>

            <div className="flex gap-1.5 self-end pt-1">
              <button
                type="button"
                onClick={handleCommitPin}
                className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/55 hover:border-cyan-400 text-cyan-300 hover:text-white font-black rounded uppercase cursor-pointer transition-all flex items-center gap-1 active:scale-95"
              >
                <Check className="w-3 h-3" />
                <span>PIN MARKER</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingAnnotation(null);
                  setAnnotationComment('');
                }}
                className="px-2 py-1 bg-black/40 hover:bg-black/80 border border-zinc-800 hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 rounded uppercase cursor-pointer transition-all flex items-center gap-1 active:scale-95"
              >
                <X className="w-3 h-3" />
                <span>CANCEL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telemetry Domain View Selector */}
      <div className="flex justify-between items-center border border-emerald-500/15 bg-[#01070e]/80 p-1.5 px-2.5 rounded-md font-mono text-[9px] -mb-1 shadow-[inset_0_0_10px_rgba(16,185,129,0.02)]">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-extrabold text-[#10b981] uppercase tracking-wider text-[8px]">Spectral Domain Analyzer:</span>
        </div>
        <div className="flex items-center gap-2">
          {chartDomain === 'frequency' && (
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              className="px-2 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/35 hover:border-cyan-400 text-cyan-300 hover:text-white font-black rounded text-[7.5px] uppercase cursor-pointer transition-all flex items-center gap-1 active:scale-95 shadow-[0_0_8px_rgba(6,182,212,0.15)] animate-pulse"
              title="Capture a forensic snapshot of the current frequency-domain data stream"
            >
              <Camera className="w-3 h-3 text-cyan-400" />
              <span>CAPTURE SPECTRUM</span>
            </button>
          )}
          <div className="flex border border-zinc-800/60 bg-black/80 rounded p-0.5">
            <button
              type="button"
              onClick={() => {
                setChartDomain('time');
                addLog('[TELEMETRY] Switched to TIME-DOMAIN: Monitoring continuous casing pressures & temperatures.', 'info');
              }}
              className={`px-3 py-1 text-[8px] font-bold uppercase tracking-wider transition-all rounded cursor-pointer ${
                chartDomain === 'time'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-black'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950 border border-transparent'
              }`}
            >
              Time Waveform
            </button>
            <button
              type="button"
              onClick={() => {
                setChartDomain('frequency');
                addLog('[TELEMETRY] Switched to FREQUENCY-DOMAIN (FFT Spectral Spectrum): Performing real-time diagnostic signal wave frequency decomposition.', 'success');
              }}
              className={`px-3 py-1 text-[8px] font-bold uppercase tracking-wider transition-all rounded cursor-pointer ${
                chartDomain === 'frequency'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 font-black'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950 border border-transparent'
              }`}
            >
              Spectral FFT Density
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Display Frame wrapper container */}
      <div className={`grid gap-3 ${chartDomain === 'frequency' ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'}`}>
        {/* Main Recharts Area Screen Frame */}
        <div className={`bg-black/85 rounded p-2 h-48 relative overflow-hidden ${
          chartDomain === 'frequency' ? 'lg:col-span-3' : 'w-full'
        } ${
          terminalTheme === 'crimson'
            ? 'border border-red-500/15 shadow-[0_0_10px_rgba(239,68,68,0.05)]'
            : 'border border-emerald-500/15 shadow-[0_0_10px_rgba(16,185,129,0.05)]'
        }`} id="telemetry-chart-viewport">
        {/* Neon horizontal ambient strip line across screen */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-emerald-500/15 shadow-[0_1px_15px_rgba(16,185,129,0.1)] z-10" />

        {/* Interactive Legend overlay */}
        {chartDomain === 'time' ? (
          <div className="absolute top-2 left-3 z-20 flex items-center gap-2 sm:gap-3.5 font-mono text-[8px] select-none" id="telemetry-interactive-legend">
            <span className="text-zinc-500 tracking-wider font-extrabold hidden xs:inline">LEGEND TOGGLES:</span>
            
            {/* Pressure Legend Tag */}
            <button
              type="button"
              onClick={togglePressure}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all duration-150 cursor-pointer text-[7.5px] ${
                showPressure 
                  ? 'bg-emerald-950/30 border-emerald-500/35 text-emerald-400 font-bold' 
                  : 'bg-black/80 border-white/5 text-zinc-600'
              }`}
              title="Toggle casing pressure stream visibility to isolate trend"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showPressure ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
              <span>PRESSURE (PSI)</span>
            </button>

            {/* Temperature Legend Tag */}
            <button
              type="button"
              onClick={toggleTemperature}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all duration-150 cursor-pointer text-[7.5px] ${
                showTemperature 
                  ? 'bg-cyan-950/30 border-cyan-500/35 text-cyan-400 font-bold' 
                  : 'bg-black/80 border-white/5 text-zinc-600'
              }`}
              title="Toggle temperature stream visibility to isolate trend"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showTemperature ? 'bg-cyan-400' : 'bg-zinc-700'}`} />
              <span>TEMPERATURE (°F)</span>
            </button>

            {/* Predictive Projection 10-Second Lookahead Toggle Tag */}
            <button
              type="button"
              onClick={() => {
                const nextVal = !showPredictiveProjection;
                setShowPredictiveProjection(nextVal);
                if (nextVal) {
                  addLog('[TELEMETRY] Predictive Projection ENABLED: Extrapolating 10-second forward-looking trend estimates for pressure and temperature.', 'success');
                } else {
                  addLog('[TELEMETRY] Predictive Projection DISABLED: Cleared custom forecasting overlays.', 'info');
                }
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all duration-150 cursor-pointer text-[7.5px] ${
                showPredictiveProjection 
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-400 font-bold shadow-[0_0_8px_rgba(245,158,11,0.15)] animate-pulse' 
                  : 'bg-black/80 border-white/5 text-zinc-600 hover:border-zinc-850'
              }`}
              title="Extrapolate and display a 10s forward-looking linear trend projection"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showPredictiveProjection ? 'bg-amber-400' : 'bg-zinc-700'}`} />
              <span>10S PROJECTION</span>
            </button>
          </div>
        ) : (
          <div className="absolute top-2 left-3 z-20 flex items-center gap-2 sm:gap-3.5 font-mono text-[8px] select-none" id="telemetry-fft-legend">
            <span className="text-zinc-500 tracking-wider font-extrabold hidden xs:inline">SPECTRUM ANALYSIS:</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-cyan-500/25 bg-cyan-950/35 text-cyan-400 font-bold text-[7.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>ACTIVE WAVE DECOMPOSITION</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-500/20 bg-black/60 text-emerald-400 text-[7.5px]">
              <span className="w-1.5 h-1.5 rounded bg-emerald-400" />
              <span>NOMINAL POWER BANDS</span>
            </div>
            {activeLeakType && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-red-500/35 bg-red-955/35 text-red-400 text-[7.5px] animate-pulse">
                <span className="w-1.5 h-1.5 rounded bg-red-500" />
                <span>LEAK HARMONIC ANOMALY ({activeLeakType.toUpperCase()})</span>
              </div>
            )}
          </div>
        )}

        {/* Click to Pin Telemetry Tag Marker Hint overlay */}
        {chartDomain === 'time' ? (
          <div className="absolute top-2 right-3 z-20 flex items-center gap-1.5 font-mono text-[7.2px] text-zinc-400 select-none bg-zinc-950/90 px-1.8 py-0.5 rounded border border-cyan-500/15">
            <MessageSquare className="w-2.5 h-2.5 text-[#06b6d4] animate-pulse" />
            <span>TAP STREAMS POINT TO PIN COLLABORATIVE ANNOTATION MARKER</span>
          </div>
        ) : (
          <div className="absolute top-2 right-3 z-20 flex items-center gap-1.5 font-mono text-[7.2px] text-zinc-400 select-none bg-zinc-950/90 px-1.8 py-0.5 rounded border border-cyan-500/15">
            <SlidersHorizontal className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
            <span>HOVER BARS TO INQUIRE SPECIFIC DEVIATION SPECTRAL BANDS</span>
          </div>
        )}

        {chartDomain === 'time' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData} 
              margin={{ top: 26, right: 6, left: -24, bottom: 0 }}
              className="cursor-crosshair"
              onMouseMove={(state: any) => {
                if (state && state.activeLabel) {
                  const pointsLength = chartData.length || 1;
                  const index = state.activeTooltipIndex !== undefined ? state.activeTooltipIndex : 0;
                  // Casing visualizer spans roughly 100m to 900m
                  const depthM = Math.round(100 + (index / (pointsLength - 1 || 1)) * 800);

                  const customEvent = new CustomEvent('telemetry-hover-timestamp', {
                    detail: { 
                      timeSnapshot: state.activeLabel,
                      depthM: depthM
                    }
                  });
                  window.dispatchEvent(customEvent);
                }
              }}
              onMouseLeave={() => {
                const customEvent = new CustomEvent('telemetry-hover-timestamp', {
                  detail: { timeSnapshot: null, depthM: null }
                });
                window.dispatchEvent(customEvent);
              }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  const clickedPoint = state.activePayload[0].payload;
                  setPendingAnnotation({
                    timeSnapshot: clickedPoint.timeSnapshot,
                    pressure: clickedPoint.pressure,
                    temperature: clickedPoint.temperature,
                    flowRate: clickedPoint.flowRate,
                    stressIndex: clickedPoint.stressIndex
                  });
                  setAnnotationComment(`Localized telemetry deviation verified`);
                  setTimeout(() => {
                    const inputEl = document.getElementById('telemetry-pin-annotation-form');
                    if (inputEl) {
                      inputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }, 100);
                }
              }}
            >
              <defs>
                <linearGradient id="pressureColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={mainColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={mainColor} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="temperatureColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                strokeDasharray="2 3" 
                stroke={themeSynchronizer.gridStroke} 
                vertical={false} 
              />

              <XAxis 
                dataKey="timeSnapshot" 
                tick={{ fill: themeSynchronizer.tickColor, fontSize: 7, fontFamily: 'monospace' }}
                tickLine={{ stroke: themeSynchronizer.tickLineColor }}
                axisLine={{ stroke: themeSynchronizer.tickLineColor }}
              />

              {/* Pressure Axis (PSI) */}
              {showPressure && (
                <YAxis 
                  yAxisId="left"
                  domain={[4500, 9500]}
                  tick={{ fill: themeSynchronizer.tickColor, fontSize: 7.5, fontFamily: 'monospace' }}
                  tickLine={{ stroke: themeSynchronizer.tickLineColor }}
                  axisLine={{ stroke: themeSynchronizer.tickLineColor }}
                />
              )}

              {/* Temperature Axis (Deg F) */}
              {showTemperature && (
                <YAxis 
                  yAxisId="right"
                  domain={[150, 260]}
                  orientation={showPressure ? "right" : "left"}
                  tick={{ fill: '#06b6d4', fontSize: 7.5, fontFamily: 'monospace' }}
                  tickLine={{ stroke: 'rgba(6, 182, 212, 0.15)' }}
                  axisLine={{ stroke: 'rgba(6, 182, 212, 0.15)' }}
                />
              )}

              <Tooltip content={renderCustomTooltip} />

              {/* Custom Limit alarm reference indicator lines */}
              {showPressure && (
                <ReferenceLine 
                  yAxisId="left" 
                  y={customPressureThreshold} 
                  stroke="#ef4444" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.2}
                  label={{ 
                    value: 'MAX PRESSURE PSI', 
                    position: 'insideBottomRight', 
                    fill: '#ef4444', 
                    fontSize: 6.5, 
                    fontFamily: 'monospace',
                    offset: 5
                  }} 
                />
              )}

              {showTemperature && (
                <ReferenceLine 
                  yAxisId="right" 
                  y={customTempThreshold} 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.2}
                  label={{ 
                    value: 'THERMAL CAP °F', 
                    position: 'insideBottomRight', 
                    fill: '#f59e0b', 
                    fontSize: 6.5, 
                    fontFamily: 'monospace',
                    offset: 15
                  }} 
                />
              )}

              {/* Scrubbed position playback marker line */}
              {scrubIndex !== null && dataPoints[scrubIndex] && (
                <ReferenceLine
                  x={dataPoints[scrubIndex].timeSnapshot}
                  stroke="#06b6d4"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  label={{
                    value: '◄ PLAYBACK SCRUB DETECTED',
                    position: 'insideTopLeft',
                    fill: '#06b6d4',
                    fontSize: 7,
                    fontFamily: 'monospace',
                    offset: 8
                  }}
                />
              )}

              {/* Pressure Plot */}
              {showPressure && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="pressure"
                  name="Wellbore Pressure"
                  stroke={mainColor}
                  strokeWidth={1.8}
                  fillOpacity={1}
                  fill="url(#pressureColor)"
                  activeDot={{ r: 4, stroke: mainColor, strokeWidth: 1.5, fill: '#020617' }}
                />
              )}

              {/* Pressure Predictive Projection */}
              {showPressure && showPredictiveProjection && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="pressureProjected"
                  name="Projected Pressure (10s Trend)"
                  stroke={mainColor}
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  fill="none"
                  activeDot={{ r: 4, stroke: mainColor, strokeWidth: 1.5, fill: '#020617' }}
                />
              )}

              {/* Temperature Plot */}
              {showTemperature && (
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="temperature"
                  name="Thermal Temp"
                  stroke={secondaryColor}
                  strokeWidth={1.8}
                  fillOpacity={1}
                  fill="url(#temperatureColor)"
                  activeDot={{ r: 4, stroke: secondaryColor, strokeWidth: 1.5, fill: '#020617' }}
                />
              )}

              {/* Temperature Predictive Projection */}
              {showTemperature && showPredictiveProjection && (
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="temperatureProjected"
                  name="Projected Temperature (10s Trend)"
                  stroke={secondaryColor}
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  fill="none"
                  activeDot={{ r: 4, stroke: secondaryColor, strokeWidth: 1.5, fill: '#020617' }}
                />
              )}

              {/* Dynamic Pinned Collaborative Annotation Markers */}
              {pinnedPins.map((pin) => {
                const markerColor = pin.category === 'casing_trauma' 
                  ? '#ef4444' 
                  : pin.category === 'datum_shift' 
                    ? '#f59e0b' 
                    : '#06b6d4';
                return (
                  <React.Fragment key={`pin-marker-${pin.id}`}>
                    {/* Vertical coordinate line */}
                    <ReferenceLine 
                      x={pin.timeSnapshot} 
                      stroke={markerColor} 
                      strokeDasharray="2 3" 
                      strokeWidth={1}
                    />
                    {/* Circle dot on Casing Pressure wave */}
                    {showPressure && (
                      <ReferenceDot
                        yAxisId="left"
                        x={pin.timeSnapshot}
                        y={pin.pressure}
                        r={4}
                        fill={markerColor}
                        stroke="#ffffff"
                        strokeWidth={1.2}
                      />
                    )}
                    {/* Circle dot on Wellbore Thermal wave when pressure is not shown */}
                    {!showPressure && showTemperature && (
                      <ReferenceDot
                        yAxisId="right"
                        x={pin.timeSnapshot}
                        y={pin.temperature}
                        r={4}
                        fill={markerColor}
                        stroke="#ffffff"
                        strokeWidth={1.2}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={frequencyData}
              margin={{ top: 26, right: 6, left: -26, bottom: 0 }}
              className="cursor-crosshair"
            >
              <defs>
                <linearGradient id="spectrumNominal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={mainColor} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={mainColor} stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="spectrumElevated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="spectrumCritical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                strokeDasharray="2 3" 
                stroke={themeSynchronizer.gridStroke} 
                vertical={false} 
              />

              <XAxis 
                dataKey="frequencyHz" 
                tick={{ fill: themeSynchronizer.tickColor, fontSize: 6.8, fontFamily: 'monospace' }}
                tickLine={{ stroke: themeSynchronizer.tickLineColor }}
                axisLine={{ stroke: themeSynchronizer.tickLineColor }}
              />

              <YAxis 
                domain={[0, 100]}
                tick={{ fill: themeSynchronizer.tickColor, fontSize: 7, fontFamily: 'monospace' }}
                tickLine={{ stroke: themeSynchronizer.tickLineColor }}
                axisLine={{ stroke: themeSynchronizer.tickLineColor }}
              />

              <Tooltip content={renderFrequencyTooltip} />

              <ReferenceLine 
                y={80} 
                stroke="#f43f5e" 
                strokeDasharray="3 3" 
                strokeWidth={1}
                label={{ 
                  value: 'CRITICAL SPECTRUM SETPOINT', 
                  position: 'insideBottomRight', 
                  fill: '#f43f5e', 
                  fontSize: 6.2, 
                  fontFamily: 'monospace',
                  offset: 5
                }} 
              />
              
              <ReferenceLine 
                y={55} 
                stroke="#fbbf24" 
                strokeDasharray="3 4" 
                strokeWidth={0.8}
                label={{ 
                  value: 'ELEVATED SEISMIC ACCENTS', 
                  position: 'insideBottomRight', 
                  fill: '#fbbf24', 
                  fontSize: 6.2, 
                  fontFamily: 'monospace',
                  offset: 5
                }} 
              />

              <Bar 
                dataKey="amplitudeDb"
                radius={[1.5, 1.5, 0, 0]}
              >
                {frequencyData.map((entry, index) => {
                  let fillGradient = 'url(#spectrumNominal)';
                  if (entry.status === 'critical') fillGradient = 'url(#spectrumCritical)';
                  else if (entry.status === 'elevated') fillGradient = 'url(#spectrumElevated)';
                  
                  return (
                    <Cell 
                      key={`freq-cell-${index}`} 
                      fill={fillGradient}
                      stroke={entry.status === 'critical' ? '#ef4444' : entry.status === 'elevated' ? '#fbbf24' : mainColor}
                      strokeWidth={0.5}
                      className={entry.status === 'critical' ? 'animate-pulse' : ''}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        </div>

        {chartDomain === 'frequency' && (
          <div className={`border rounded-lg p-3 h-48 flex flex-col justify-between font-mono select-none relative lg:col-span-1 shadow-md ${
            terminalTheme === 'crimson'
              ? 'bg-red-950/10 border-red-500/25 shadow-[inset_0_0_12px_rgba(239,68,68,0.03)] text-red-100'
              : 'bg-[#010813]/90 border-cyan-500/25 shadow-[inset_0_0_12px_rgba(6,182,212,0.03)] text-cyan-100'
          }`} id="realtime-signal-dsp-calculations">
            {/* Ambient scan lines */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/10 via-black to-black opacity-45 pointer-events-none" />

            {/* Header */}
            <div className={`flex items-center justify-between border-b pb-1.5 z-10 ${
              terminalTheme === 'crimson' ? 'border-red-500/15' : 'border-cyan-500/15'
            }`}>
              <div className="flex items-center gap-1.5">
                <Cpu className={`w-3.5 h-3.5 animate-pulse ${
                  terminalTheme === 'crimson' ? 'text-red-400' : 'text-cyan-400'
                }`} />
                <span className={`text-[8px] font-extrabold uppercase tracking-widest ${
                  terminalTheme === 'crimson' ? 'text-red-300' : 'text-cyan-300'
                }`}>
                  DSP PARAMETERS
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${terminalTheme === 'crimson' ? 'bg-red-400' : 'bg-cyan-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${terminalTheme === 'crimson' ? 'bg-red-500' : 'bg-cyan-500'}`}></span>
                </span>
                <span className="text-[6.5px] text-zinc-500 uppercase font-bold tracking-widest">LIVE</span>
              </div>
            </div>

            {/* Content stats grid */}
            <div className="grid grid-cols-2 gap-1.5 my-1 z-10">
              {/* RMS Display */}
              <div className={`p-1.5 rounded border ${
                terminalTheme === 'crimson' ? 'bg-red-955/10 border-red-500/10' : 'bg-cyan-955/10 border-cyan-500/10'
              }`}>
                <div className="text-[6.5px] text-zinc-500 uppercase font-black tracking-wider leading-none">RMS Amplitude</div>
                <div className="flex items-baseline gap-0.5 mt-0.5">
                  <span className={`text-[11.5px] font-black tracking-tight leading-none ${
                    spectralMetrics.signalStatus === 'critical' ? 'text-red-400 font-extrabold animate-pulse' : spectralMetrics.signalStatus === 'elevated' ? 'text-amber-400' : 'text-zinc-200'
                  }`}>
                    {spectralMetrics.rms.toFixed(1)}
                  </span>
                  <span className="text-[6.5px] text-zinc-500 font-bold">dB</span>
                </div>
              </div>

              {/* Peak-to-Peak Display */}
              <div className={`p-1.5 rounded border ${
                terminalTheme === 'crimson' ? 'bg-red-955/10 border-red-500/10' : 'bg-cyan-955/10 border-cyan-500/10'
              }`}>
                <div className="text-[6.5px] text-zinc-500 uppercase font-black tracking-wider leading-none">Peak-to-Peak</div>
                <div className="flex items-baseline gap-0.5 mt-0.5">
                  <span className="text-[11.5px] font-black text-zinc-200 tracking-tight leading-none animate-pulse">
                    {spectralMetrics.peakToPeak.toFixed(1)}
                  </span>
                  <span className="text-[6.5px] text-zinc-500 font-bold">dB</span>
                </div>
              </div>

              {/* SNR Display */}
              <div className={`p-1.5 rounded border ${
                terminalTheme === 'crimson' ? 'bg-red-955/10 border-red-500/10' : 'bg-cyan-955/10 border-cyan-500/10'
              }`}>
                <div className="text-[6.5px] text-zinc-500 uppercase font-black tracking-wider leading-none">SNR Quotient</div>
                <div className="flex items-baseline gap-0.5 mt-0.5">
                  <span className={`text-[11.5px] font-black tracking-tight leading-none ${
                    spectralMetrics.snr > 35 ? 'text-emerald-400' : spectralMetrics.snr > 15 ? 'text-amber-400' : 'text-red-400 animate-pulse'
                  }`}>
                    {spectralMetrics.snr.toFixed(1)}
                  </span>
                  <span className="text-[6.5px] text-zinc-500 font-bold">dB</span>
                </div>
              </div>

              {/* Dominant Peak Display */}
              <div className={`p-1.5 rounded border ${
                terminalTheme === 'crimson' ? 'bg-red-955/10 border-red-500/10' : 'bg-cyan-955/10 border-cyan-500/10'
              }`}>
                <div className="text-[6.5px] text-zinc-500 uppercase font-black tracking-wider leading-none">Dominant Peak</div>
                <div className="flex flex-col mt-0.5 justify-center leading-none">
                  <span className={`text-[9px] font-black tracking-wider truncate leading-tight ${
                    terminalTheme === 'crimson' ? 'text-red-400' : 'text-cyan-400'
                  }`} title={spectralMetrics.dominantBand}>
                    {spectralMetrics.dominantFreq}
                  </span>
                  <span className="text-[5.5px] text-zinc-500 font-black tracking-widest uppercase truncate max-w-[65px] mt-0.5 leading-none" title={spectralMetrics.dominantBand}>
                    {spectralMetrics.dominantBand}
                  </span>
                </div>
              </div>
            </div>

            {/* Calculations Status Indicator Footer */}
            <div className={`flex items-center justify-between p-1 px-1.5 rounded text-[7.2px] font-extrabold tracking-wider z-10 leading-none ${
              spectralMetrics.signalStatus === 'critical'
                ? 'bg-red-950/20 border border-red-500/35 text-red-400 animate-pulse'
                : spectralMetrics.signalStatus === 'elevated'
                  ? 'bg-amber-950/20 border border-amber-500/25 text-amber-400'
                  : terminalTheme === 'crimson'
                    ? 'bg-black/60 border border-red-500/10 text-red-400/80'
                    : 'bg-black/60 border border-cyan-500/10 text-cyan-400/80'
            }`}>
              <div className="flex items-center gap-1 truncate max-w-[125px]">
                <span className={`w-1 h-1 rounded-full flex-shrink-0 ${
                  spectralMetrics.signalStatus === 'critical'
                    ? 'bg-red-400 animate-ping'
                    : spectralMetrics.signalStatus === 'elevated'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                }`} />
                <span className="truncate">
                  {spectralMetrics.signalStatus === 'critical' 
                    ? 'CRITICAL SPECTRUM' 
                    : spectralMetrics.signalStatus === 'elevated' 
                      ? 'ELEVATED FLOW' 
                      : 'NOMINAL HARMONICS'}
                </span>
              </div>
              <span className="text-[6.5px] opacity-60 flex-shrink-0">CRST: {spectralMetrics.crestFactor.toFixed(1)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Spectral Frequency Snapshots Comparison History List */}
      {chartDomain === 'frequency' && (
        <div className={`border rounded p-3 flex flex-col gap-2.5 font-mono text-[9px] -mt-1 select-none ${
          terminalTheme === 'crimson'
            ? 'bg-red-950/10 border-red-500/15 shadow-[inset_0_0_12px_rgba(239,68,68,0.03)]'
            : 'bg-[#010813]/90 border-cyan-500/15 shadow-[inset_0_0_12px_rgba(6,182,212,0.03)]'
        }`}>
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
            <span className={`font-extrabold flex items-center gap-1.5 uppercase text-[8.5px] tracking-wider leading-none ${
              terminalTheme === 'crimson' ? 'text-red-400 animate-pulse' : 'text-cyan-400'
            }`}>
              <History className="w-3.5 h-3.5" />
              FORENSIC SPECTRAL COMPARATIVE ARCHIVE ({frequencySnapshots.length})
            </span>
            {frequencySnapshots.length > 0 && (
              <button
                type="button"
                onClick={handleClearSnapshots}
                className="text-red-400 hover:text-red-300 transition-colors uppercase font-bold text-[7.5px] border border-red-500/20 hover:border-red-500/40 bg-red-950/10 px-2 py-0.5 rounded cursor-pointer animate-pulse"
              >
                CLEAR ARCHIVE
              </button>
            )}
          </div>

          {frequencySnapshots.length === 0 ? (
            <div className="text-zinc-500 text-center py-2.5 italic text-[8.5px] leading-relaxed">
              No historical FFT traces recorded. Capture spectral snapshots above to establish comparative baselines.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
              {frequencySnapshots.map((snap) => {
                const isSelected = selectedComparisonSnapshotId === snap.id;
                
                return (
                  <div
                    key={snap.id}
                    className={`border transition-all duration-150 p-2.5 rounded flex flex-col gap-2 ${
                      isSelected
                        ? terminalTheme === 'crimson'
                          ? 'border-red-500/45 bg-red-955/15 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                          : 'border-cyan-500/40 bg-cyan-955/15'
                        : 'border-zinc-800 bg-black/45 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`font-extrabold tracking-wider text-[8px] uppercase ${
                          terminalTheme === 'crimson' ? 'text-red-400' : 'text-cyan-400'
                        }`}>
                          TRACE #{snap.index}
                        </span>
                        <span className="text-zinc-500 text-[7.5px]">[{snap.timestamp}]</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleOverlay(snap.id)}
                          className={`px-2 py-0.5 rounded text-[7.5px] font-black uppercase transition-all cursor-pointer border ${
                            isSelected
                              ? terminalTheme === 'crimson'
                                ? 'bg-red-500/15 border-red-400 text-red-300'
                                : 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                          title="Overlay this baseline with active real-time telemetry to visually compare power peak levels"
                        >
                          {isSelected ? '■ CLEAR OVERLAY' : '▲ COMPARE OVERLAY'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSnapshot(snap.id)}
                          className="text-zinc-500 hover:text-red-400 font-bold text-[8.5px] transition-colors p-0.5 px-1.5 bg-black/60 border border-zinc-800/60 hover:border-red-500/25 rounded cursor-pointer flex items-center justify-center"
                          title="Purge trace record"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-zinc-400 text-[8px] bg-black/30 p-1.5 rounded font-mono">
                      <div>Pressure: <span className="text-emerald-400 font-extrabold">{snap.pressureSnapshot} PSI</span></div>
                      <div>Temp: <span className="text-cyan-400 font-extrabold">{snap.temperatureSnapshot}°F</span></div>
                      <div>Flow Rate: <span className="text-white font-bold">{snap.flowRateSnapshot.toFixed(1)} m³/h</span></div>
                      <div>Distress Harmonic: <span className={`${snap.leakTypeSnapshot !== 'none' ? 'text-red-400 font-bold animate-pulse' : 'text-zinc-500'}`}>{snap.leakTypeSnapshot.toUpperCase()}</span></div>
                    </div>

                    {/* Miniature horizontal bar alignment comparing each band to current real-time */}
                    {isSelected && (
                      <div className={`border-t pt-2 mt-1 flex flex-col gap-1.5 ${
                        terminalTheme === 'crimson' ? 'border-red-500/10' : 'border-cyan-500/10'
                      }`}>
                        <div className={`text-[7.5px] font-bold mb-1 uppercase tracking-wider flex items-center justify-between ${
                          terminalTheme === 'crimson' ? 'text-red-300/80' : 'text-cyan-300/80'
                        }`}>
                          <span>FFT Baseline vs Real-Time Deviation Spectrum:</span>
                          <span className="text-[6.5px] text-zinc-500 italic">Values = Snap vs Live (dB)</span>
                        </div>
                        <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5 bg-[#01060e]/50 p-2 rounded">
                          {snap.data.map((bandBand, idx) => {
                            const liveBand = frequencyData.find(b => b.frequencyVal === bandBand.frequencyVal);
                            const liveDb = liveBand ? liveBand.amplitudeDb : 0;
                            const diff = liveDb - bandBand.amplitudeDb;
                            let diffColor = 'text-zinc-400';
                            if (diff > 15) diffColor = 'text-red-400 font-extrabold animate-pulse';
                            else if (diff > 5) diffColor = 'text-amber-400 font-bold';
                            else if (diff < -5) diffColor = 'text-emerald-400 font-medium';
                            
                            return (
                              <div key={`compare-${idx}`} className="flex justify-between items-center text-[7.5px] border-b border-zinc-900/60 pb-1">
                                <span className="text-zinc-500 truncate max-w-[55px] font-sans" title={bandBand.bandName}>{bandBand.frequencyHz}:</span>
                                <div className="flex items-center gap-1 font-bold">
                                  <span className={`${terminalTheme === 'crimson' ? 'text-red-400/80' : 'text-cyan-400/80'}`}>{bandBand.amplitudeDb}</span>
                                  <span className="text-zinc-600">/</span>
                                  <span className="text-white">{liveDb}</span>
                                  <span className={`text-[6.5px] font-black ${diffColor}`}>
                                    ({diff >= 0 ? `+${diff}` : diff} dB)
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Threshold Sliders and Critical Injector Driver */}
      <div className="bg-[#01040f]/60 rounded border border-emerald-500/10 p-3 flex flex-col gap-3 font-mono text-[9px] relative select-text">
        <div className="flex items-center justify-between border-b border-emerald-500/10 pb-1.5">
          <span className="font-extrabold text-cyan-400 flex items-center gap-1.5 uppercase text-[9.5px] tracking-wider leading-none">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            VULNERABILITY CALIBRATION PANEL
          </span>
          {lastAnomalyTime && (
            <span className="text-red-400 font-extrabold animate-pulse text-[8px] border border-red-500/20 rounded px-1 py-0.2 bg-red-950/20">
              ALARM OVERRIDE @ {lastAnomalyTime}
            </span>
          )}
        </div>

        {/* Alarm Thresholds Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between font-bold text-zinc-300">
              <span>Pressure Ceiling:</span>
              <span className="text-emerald-400">{customPressureThreshold} psi</span>
            </div>
            <input 
              type="range"
              min={5500}
              max={8500}
              step={100}
              value={customPressureThreshold}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setCustomPressureThreshold(val);
                addLog(`[TELEMETRY] Custom pressure safety threshold adjusted to ${val} psi`, 'info');
              }}
              className="w-full h-1 bg-zinc-950 border border-emerald-500/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between font-bold text-zinc-300">
              <span>Thermal Limit:</span>
              <span className="text-cyan-400">{customTempThreshold}°F</span>
            </div>
            <input 
              type="range"
              min={180}
              max={250}
              step={5}
              value={customTempThreshold}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setCustomTempThreshold(val);
                addLog(`[TELEMETRY] Geothermal limit setpoint adjusted to ${val}°F`, 'info');
              }}
              className="w-full h-1 bg-zinc-950 border border-emerald-500/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Background Leak Analysis Engine Core HUD */}
        <div className="border border-purple-500/20 bg-purple-950/5 p-2 rounded flex flex-col gap-2 relative">
          <div className="flex items-center justify-between border-b border-purple-500/10 pb-1">
            <span className="font-extrabold text-purple-400 flex items-center gap-1.5 uppercase text-[8.5px] tracking-wider leading-none">
              <Cpu className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
              Real-Time Leak Scanning Agent (Background Worker)
            </span>
            <div className="flex items-center gap-2">
              {lastLeakDetectedTime && (
                <span className="text-amber-400 font-extrabold animate-pulse text-[7.5px] uppercase">
                  LEAK WARN @ {lastLeakDetectedTime}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsLeakScannerEnabled(!isLeakScannerEnabled);
                  addLog(`Background leak scanning worker ${!isLeakScannerEnabled ? 'ACTIVATED (Direct buffer probe online)' : 'DEACTIVATED'}`, 'info');
                }}
                className={`px-1.5 py-0.5 rounded text-[7.5px] font-black tracking-widest uppercase transition-all cursor-pointer ${
                  isLeakScannerEnabled 
                    ? 'bg-purple-500/20 border border-purple-400 text-purple-300' 
                    : 'bg-zinc-900 border border-zinc-700 text-zinc-500'
                }`}
              >
                {isLeakScannerEnabled ? 'ONLINE' : 'OFFLINE'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-bold text-zinc-400 text-[8px]">
                <span>Pressure Spike Trigger (Step Rise):</span>
                <span className="text-purple-400 font-black">+{leakPressureThreshold} PSI</span>
              </div>
              <input 
                type="range"
                min={100}
                max={600}
                step={25}
                value={leakPressureThreshold}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setLeakPressureThreshold(val);
                }}
                className="w-full h-1 bg-zinc-950 rounded appearance-none cursor-pointer accent-purple-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-bold text-zinc-400 text-[8px]">
                <span>Cryo-Drop Trigger (Step Fall):</span>
                <span className="text-purple-400 font-black">-{leakTempDropThreshold.toFixed(1)}°F</span>
              </div>
              <input 
                type="range"
                min={1.0}
                max={5.0}
                step={0.2}
                value={leakTempDropThreshold}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setLeakTempDropThreshold(val);
                }}
                className="w-full h-1 bg-zinc-950 rounded appearance-none cursor-pointer accent-purple-400"
              />
            </div>
          </div>
        </div>

        {/* Acoustic Dynamic Leak Signal Frequency Visualizer */}
        <AcousticLeakVisualizer
          terminalTheme={terminalTheme}
          isAlarmActive={isAcousticAlarmActive}
          leakType={activeLeakType}
          onDismissAlarm={handleDismissAlarm}
          addLog={addLog}
        />

        {/* Simulation Control Ingestors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Mud Kick Driver simulation button */}
          <div className="border border-red-500/10 hover:border-red-500/30 bg-red-950/5 hover:bg-red-950/10 p-2 rounded flex items-center justify-between gap-1.5 transition-all duration-150">
            <div className="flex flex-col text-[8px] min-w-0">
              <span className="text-red-400 font-extrabold flex items-center gap-1 uppercase leading-none truncate">
                <ShieldAlert className="w-3 h-3 text-red-500 animate-pulse" />
                Mud Volumetric Shockwave
              </span>
              <span className="text-zinc-500 font-medium leading-none mt-1 truncate">
                Force pressure spike scenario
              </span>
            </div>

            <button
              type="button"
              onClick={handleSpikeInjected}
              className="bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 hover:border-red-400 text-red-400 hover:text-red-300 transition-colors text-[8px] font-black uppercase px-2 py-1 rounded cursor-pointer text-center whitespace-nowrap shrink-0"
            >
              Spike PSI
            </button>
          </div>

          {/* Cryo-Drop liquid venting leak simulation button */}
          <div className="border border-cyan-500/10 hover:border-cyan-500/30 bg-cyan-950/5 hover:bg-cyan-950/10 p-2 rounded flex items-center justify-between gap-1.5 transition-all duration-150">
            <div className="flex flex-col text-[8px] min-w-0">
              <span className="text-cyan-400 font-extrabold flex items-center gap-1 uppercase leading-none truncate">
                <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
                Cryo-Venting Bleeder
              </span>
              <span className="text-zinc-500 font-medium leading-none mt-1 truncate">
                Force temperature drop leak
              </span>
            </div>

            <button
              type="button"
              onClick={handleLeakTempDropInjected}
              className="bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 transition-colors text-[8px] font-black uppercase px-2 py-1 rounded cursor-pointer text-center whitespace-nowrap shrink-0"
            >
              Drop Temp
            </button>
          </div>
        </div>
      </div>

      {/* Forensic Event Log Section */}
      <div className="bg-[#01040f]/75 rounded border border-emerald-500/20 p-3.5 flex flex-col gap-3 font-mono text-[9px] relative select-text" id="forensic-event-log-container">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/10 pb-2">
          <span className="font-extrabold text-emerald-400 flex items-center gap-1.5 uppercase text-[9.5px] tracking-wider leading-none">
            <History className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Forensic Event & Pathology Log
          </span>
          <span className="text-zinc-500 text-[8px] font-bold">
            HISTORIC CASING TRAUMA & DATUM SHIFT DETECTIONS
          </span>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col xs:flex-row gap-2 justify-between items-stretch">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search box */}
            <input
              type="text"
              placeholder="Search forensic logs (by msg, depth or tag)..."
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              className="px-2 py-1 bg-black/60 border border-emerald-500/15 rounded text-emerald-300 focus:outline-none focus:border-emerald-500/40 text-[8.5px] w-full xs:w-52 placeholder-zinc-600 font-mono"
            />
            {filteredEvents.length > 0 && (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className={`px-2 py-1 rounded border transition-all cursor-pointer font-bold text-[8px] flex items-center gap-1 font-mono uppercase ${
                  filteredEvents.every(ev => selectedEventIds.includes(ev.id))
                    ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-450 hover:text-white'
                    : 'bg-black/60 border-emerald-500/15 text-zinc-400 hover:text-white'
                }`}
                title="Select or deselect all current filtered rows"
              >
                <span>Select All Visible</span>
              </button>
            )}
          </div>
          
          <div className="text-zinc-500 text-[7.5px] shrink-0 font-bold self-center">
            ANOMALIES RECORDED: {forensicEvents.length} {selectedEventIds.length > 0 && `| SELECTED: ${selectedEventIds.length}`}
          </div>
        </div>

        {/* Cyberpunk-themed Batch Tagging Control Bar */}
        {selectedEventIds.length > 0 && (
          <div className="bg-cyan-950/20 border border-cyan-500/35 p-2 rounded flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5 text-[8.5px] font-mono shadow-[0_0_10px_rgba(6,182,212,0.1)]">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded bg-cyan-400 animate-pulse shrink-0" />
              <span className="text-zinc-200">
                <strong className="text-cyan-400 font-extrabold">{selectedEventIds.length}</strong> event{selectedEventIds.length > 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedEventIds([])}
                className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1 select-none font-bold uppercase text-[7px]"
              >
                Clear Selection
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-zinc-500 font-bold uppercase tracking-tight text-[7.5px] mr-1 shrink-0">BATCH TAGS:</span>
              <div className="flex flex-wrap gap-1">
                {['Casing Integrity', 'Thermal Influx', 'Pressure Spike', 'Sensor Outlier'].map((presetTag) => (
                  <button
                    key={presetTag}
                    type="button"
                    onClick={() => handleBatchTag(presetTag)}
                    className="px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-500/35 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white transition-all cursor-pointer font-extrabold uppercase text-[7.5px]"
                  >
                    + {presetTag}
                  </button>
                ))}
              </div>

              {/* Custom Tag Continuous Typing input */}
              <div className="flex items-center border border-cyan-500/30 rounded bg-black/60 overflow-hidden h-[20px]">
                <input
                  type="text"
                  placeholder="Custom tag..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBatchTag(customTagInput);
                      setCustomTagInput('');
                    }
                  }}
                  className="bg-transparent border-none text-cyan-300 placeholder-zinc-700 font-mono text-[8px] px-1.5 py-0.5 outline-none w-24 focus:ring-0 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleBatchTag(customTagInput);
                    setCustomTagInput('');
                  }}
                  className="bg-cyan-500/15 hover:bg-cyan-500/30 border-l border-cyan-500/30 px-1.5 py-1 text-cyan-400 hover:text-white uppercase font-bold text-[7.5px] cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Wipe Tags */}
              <button
                type="button"
                onClick={handleBatchRemoveTags}
                className="px-1.5 py-1 rounded bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/30 hover:border-rose-400 text-rose-400 hover:text-rose-300 uppercase font-black text-[7px] cursor-pointer"
                title="Wipe out all categories currently assigned to the selection"
              >
                Clear tags
              </button>
            </div>
          </div>
        )}

        {/* Event List Wrapper */}
        <div className="border border-emerald-500/5 rounded bg-black/30 overflow-y-auto max-h-[160px] custom-scrollbar flex flex-col divide-y divide-emerald-500/10">
          {filteredEvents.length === 0 ? (
            <div className="p-6 text-center text-zinc-600 italic">
              No matching downhole telemetry anomalies found in current directory records.
            </div>
          ) : (
            filteredEvents.map((event) => {
              // Color map based on severity
              const severityStyles = event.severity === 'critical'
                ? 'text-red-400 border-red-500/15 bg-red-950/25'
                : event.severity === 'warning'
                  ? 'text-amber-500 border-amber-500/15 bg-amber-950/25'
                  : 'text-cyan-400 border-cyan-500/15 bg-cyan-950/25';

              const isChecked = selectedEventIds.includes(event.id);

              return (
                <div 
                  key={event.id} 
                  className={`p-2 hover:bg-emerald-500/5 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                    isChecked ? 'bg-cyan-950/10 border-l-[3px] border-cyan-400 pl-[5px]' : ''
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-1.5 flex-wrap min-w-0">
                    {/* Multi-select check block */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventIds(prev => 
                          prev.includes(event.id) 
                            ? prev.filter(id => id !== event.id) 
                            : [...prev, event.id]
                        );
                      }}
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center cursor-pointer transition-all shrink-0 mr-0.5 select-none ${
                        isChecked
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                          : 'bg-black/40 border-zinc-700 hover:border-zinc-500 text-transparent'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </button>

                    {/* Timestamp */}
                    <span className="text-zinc-400 font-extrabold tracking-tight bg-zinc-950 px-1 py-0.5 rounded text-[8px] border border-white/5 shrink-0">
                      {event.timestamp}
                    </span>

                    {/* Event Type Badge */}
                    <span className={`px-1 py-0.5 rounded border text-[7.5px] font-bold tracking-widest shrink-0 ${severityStyles}`}>
                      {event.type === 'casing_trauma' ? 'CASING TRAUMA' : 'DATUM SHIFT'}
                    </span>

                    {/* Depth tag */}
                    {event.depthM && (
                      <span className="text-emerald-400 font-extrabold bg-emerald-950/20 border border-emerald-500/10 px-1 py-0.2 rounded text-[8px] shrink-0">
                        {event.depthM}m
                      </span>
                    )}

                    {/* Event Cats / Tags Pills */}
                    {event.tags && event.tags.map((tg) => (
                      <span
                        key={tg}
                        className="text-[7.5px] font-extrabold px-1.5 py-0.2 rounded bg-cyan-950/30 text-cyan-300 border border-cyan-500/25 tracking-wide flex items-center gap-0.5 shrink-0 uppercase"
                      >
                        <Tag className="w-2 h-2 text-cyan-400/80" />
                        {tg}
                      </span>
                    ))}

                    {/* Message */}
                    <span className="text-zinc-300 font-normal leading-relaxed text-[8.5px] truncate max-w-sm xs:max-w-md sm:max-w-lg">
                      {event.message}
                    </span>
                  </div>

                  {/* Quick-Jump Button */}
                  <button
                    type="button"
                    onClick={() => triggerQuickJump(event.defectId)}
                    className="self-end sm:self-center px-1.5 py-0.5 rounded bg-cyan-950/30 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 font-bold uppercase text-[7px] cursor-pointer flex items-center gap-1 transition-all shrink-0 active:scale-95"
                    title={`Instantly rotate wellbore scanner and focus camera on defect segment`}
                  >
                    <Eye className="w-2.5 h-2.5" />
                    <span>Focus Segment</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
