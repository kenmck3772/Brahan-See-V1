
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Binary, Ghost, Loader2, Zap, 
  Play, RotateCw, CheckCircle2, 
  AlertTriangle, Activity, ScanLine, Target, 
  Globe2, Send, ShieldAlert, AlertOctagon, Search,
  Eye, Filter, Lock, Unlock, ShieldX, ShieldCheck,
  Link, Info, X, Calendar, SlidersHorizontal
} from 'lucide-react';
import { MOCK_BASE_LOG, MOCK_GHOST_LOG } from '../constants';
import { TraumaEvent } from '../types';
import SyncMonitorChart from './SyncMonitorChart';

export interface SignalMetadata {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

export interface SyncAnomaly {
  id: string;
  startDepth: number;
  endDepth: number;
  avgDiff: number;
  severity: 'CRITICAL' | 'WARNING';
  detectedAt: string;
  description: string;
  status: 'PENDING' | 'VALID' | 'INVALID';
}

const OFFSET_SAFE_LIMIT = 10;
const OFFSET_HARD_LIMIT = 20;
const AUTO_SYNC_TARGET = 14.5;

const GhostSync: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [viewMode, setViewMode] = useState<'OVERLAY' | 'DIFFERENTIAL'>('OVERLAY');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  
  // Remote Data Fetching State
  const [showFetchInput, setShowFetchInput] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  // Anomaly Detection State
  const [anomalyThreshold, setAnomalyThreshold] = useState(25);
  const [isScanningAnomalies, setIsScanningAnomalies] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedAnomalies, setDetectedAnomalies] = useState<SyncAnomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<SyncAnomaly | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'LAST_7_DAYS' | 'LAST_30_DAYS'>('ALL');
  const [isDetectingShift, setIsDetectingShift] = useState(false);
  const [bestShift, setBestShift] = useState<number | null>(null);
  const [isAnomalyPanelOpen, setIsAnomalyPanelOpen] = useState(true);
  const [selectedSourceType, setSelectedSourceType] = useState<'ALL' | 'BASE_LOG' | 'GHOST_LOG' | 'REMOTE_LOGS'>('ALL');

  const [signals, setSignals] = useState<SignalMetadata[]>([
    { id: 'SIG-001', name: 'BASE_LOG', color: 'var(--emerald-primary)', visible: true },
    { id: 'SIG-002', name: 'GHOST_LOG', color: '#FF5F1F', visible: true }
  ]);

  const [remoteLogs, setRemoteLogs] = useState<Record<string, Record<number, number>>>({});

  // Persistence: Load state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('BRAHAN_GHOST_SYNC_STATE');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.offset !== undefined) setOffset(state.offset);
        if (state.viewMode !== undefined) setViewMode(state.viewMode);
        if (state.anomalyThreshold !== undefined) setAnomalyThreshold(state.anomalyThreshold);
        if (state.severityFilter !== undefined) setSeverityFilter(state.severityFilter);
        if (state.dateFilter !== undefined) setDateFilter(state.dateFilter);
        if (state.selectedSourceType !== undefined) setSelectedSourceType(state.selectedSourceType);
        if (state.remoteLogs !== undefined) setRemoteLogs(state.remoteLogs);
        if (state.signals !== undefined) setSignals(state.signals);
      } catch (e) {
        console.warn('[GhostSync:Persistence] Failed to restore session state:', e);
      }
    }
  }, []);

  // Persistence: Save state on changes
  useEffect(() => {
    const stateToSave = {
      offset,
      viewMode,
      anomalyThreshold,
      severityFilter,
      dateFilter,
      selectedSourceType,
      remoteLogs,
      signals
    };
    localStorage.setItem('BRAHAN_GHOST_SYNC_STATE', JSON.stringify(stateToSave));
  }, [offset, viewMode, anomalyThreshold, severityFilter, dateFilter, selectedSourceType, remoteLogs, signals]);

  const filteredAnomalies = useMemo(() => {
    return detectedAnomalies.filter(a => {
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      if (dateFilter !== 'ALL') {
        const anomalyDate = new Date(a.detectedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - anomalyDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        if (dateFilter === 'LAST_7_DAYS' && diffDays > 7) return false;
        if (dateFilter === 'LAST_30_DAYS' && diffDays > 30) return false;
      }
      return true;
    });
  }, [detectedAnomalies, severityFilter, dateFilter]);

  const filteredSignals = useMemo(() => {
    if (selectedSourceType === 'ALL') return signals;
    return signals.filter(sig => {
      if (selectedSourceType === 'BASE_LOG') return sig.id === 'SIG-001';
      if (selectedSourceType === 'GHOST_LOG') return sig.id === 'SIG-002';
      if (selectedSourceType === 'REMOTE_LOGS') return sig.id.startsWith('SIG-REMOTE-');
      return true;
    });
  }, [signals, selectedSourceType]);

  const combinedData = useMemo(() => {
    return MOCK_BASE_LOG.map((base) => {
      const ghost = MOCK_GHOST_LOG.find(g => Math.abs(g.depth - (base.depth + offset)) < 0.1);
      const row: any = {
        depth: base.depth,
        baseGR: base.gr,
        ghostGR: ghost ? ghost.gr : null,
        diff: ghost ? Math.abs(base.gr - ghost.gr) : 0
      };
      // Inject remote logs
      Object.keys(remoteLogs).forEach(sigId => {
        if (remoteLogs[sigId][base.depth] !== undefined) {
          row[sigId] = remoteLogs[sigId][base.depth];
        }
      });
      return row;
    });
  }, [offset, remoteLogs]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleOffsetChange = (val: number) => {
    if (typeof val !== 'number' || isNaN(val)) return;

    let newVal = val;
    let error: string | null = null;

    if (Math.abs(newVal) >= OFFSET_HARD_LIMIT) {
      newVal = Math.sign(newVal) * OFFSET_HARD_LIMIT;
      error = `CRITICAL VETO: MAX LIMIT ±${OFFSET_HARD_LIMIT}M REACHED`;
      triggerShake();
    } else if (Math.abs(newVal) > OFFSET_SAFE_LIMIT) {
      error = `WARNING: EXTREME SHIFT ENVELOPE ACTIVATED`;
    }

    setOffset(newVal);
    setValidationError(error);
  };

  const handleToggleSignal = useCallback((keyOrId: string) => {
    // Map Recharts dataKey back to internal Signal ID
    let targetId = keyOrId;
    if (keyOrId === 'baseGR') targetId = 'SIG-001';
    if (keyOrId === 'ghostGR') targetId = 'SIG-002';

    setSignals(prev => prev.map(s => s.id === targetId ? { ...s, visible: !s.visible } : s));
  }, []);

  const animateSync = useCallback(() => {
    if (isSyncing) return;
    setIsSyncing(true);
    setIsAdjusting(true);
    setValidationError(null);
    const startOffset = offset;
    const startTime = performance.now();
    const duration = 2000;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentOffset = startOffset + (AUTO_SYNC_TARGET - startOffset) * easeProgress;
      setOffset(currentOffset);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setOffset(AUTO_SYNC_TARGET);
        setIsSyncing(false);
        setIsAdjusting(false);
      }
    };
    requestAnimationFrame(step);
  }, [offset, isSyncing]);

  const autoLineup = useCallback(() => {
    setIsSyncing(true);
    setIsAdjusting(true);
    setValidationError(null);
    setTimeout(() => {
      setOffset(AUTO_SYNC_TARGET);
      setIsSyncing(false);
      setIsAdjusting(false);
    }, 1500);
  }, []);

  const runAnomalyScan = useCallback(() => {
    setIsScanningAnomalies(true);
    setDetectedAnomalies([]);
    setSelectedAnomaly(null);
    setScanProgress(0);

    const totalRows = combinedData.length;
    if (totalRows === 0) {
      setIsScanningAnomalies(false);
      return;
    }

    const anomalies: SyncAnomaly[] = [];
    let currentAnomaly: { start: number, sum: number, count: number } | null = null;
    let currentIndex = 0;
    const chunkSize = Math.max(1, Math.floor(totalRows / 50)); // More chunks for smoother progress

    const processChunk = () => {
      const end = Math.min(currentIndex + chunkSize, totalRows);
      
      for (let i = currentIndex; i < end; i++) {
        const row = combinedData[i];
        if (row.ghostGR !== null && row.diff > anomalyThreshold) {
          if (!currentAnomaly) {
            currentAnomaly = { start: row.depth, sum: row.diff, count: 1 };
          } else {
            currentAnomaly.sum += row.diff;
            currentAnomaly.count += 1;
          }
        } else if (currentAnomaly) {
          const avgDiff = currentAnomaly.sum / currentAnomaly.count;
          const severity = avgDiff > anomalyThreshold * 1.5 ? 'CRITICAL' : 'WARNING';
          const randomDaysAgo = Math.floor(Math.random() * 30);
          const date = new Date();
          date.setDate(date.getDate() - randomDaysAgo);
          anomalies.push({
            id: `ANOM-${Math.random().toString(36).substring(7).toUpperCase()}`,
            startDepth: currentAnomaly.start,
            endDepth: combinedData[i - 1].depth,
            avgDiff,
            severity,
            detectedAt: date.toISOString().split('T')[0],
            description: severity === 'CRITICAL' ? 'Severe deviation detected between base and ghost logs. Possible structural anomaly or data corruption.' : 'Moderate deviation detected. Requires manual review.',
            status: 'PENDING'
          });
          currentAnomaly = null;
        }
      }

      currentIndex = end;
      const progress = Math.floor((currentIndex / totalRows) * 100);
      setScanProgress(progress);

      if (currentIndex < totalRows) {
        requestAnimationFrame(processChunk);
      } else {
        // Finalize
        if (currentAnomaly) {
          const avgDiff = currentAnomaly.sum / currentAnomaly.count;
          const severity = avgDiff > anomalyThreshold * 1.5 ? 'CRITICAL' : 'WARNING';
          const randomDaysAgo = Math.floor(Math.random() * 30);
          const date = new Date();
          date.setDate(date.getDate() - randomDaysAgo);
          anomalies.push({
            id: `ANOM-${Math.random().toString(36).substring(7).toUpperCase()}`,
            startDepth: currentAnomaly.start,
            endDepth: combinedData[totalRows - 1].depth,
            avgDiff,
            severity,
            detectedAt: date.toISOString().split('T')[0],
            description: severity === 'CRITICAL' ? 'Severe deviation detected between base and ghost logs. Possible structural anomaly or data corruption.' : 'Moderate deviation detected. Requires manual review.',
            status: 'PENDING'
          });
        }
        
        setDetectedAnomalies(anomalies);
        setIsScanningAnomalies(false);
        setTimeout(() => setScanProgress(0), 500);

        // Log detected anomalies to the black box
        if (anomalies.length > 0) {
          try {
            const existingLogsStr = localStorage.getItem('BRAHAN_BLACK_BOX_LOGS');
            const existingLogs: TraumaEvent[] = existingLogsStr ? JSON.parse(existingLogsStr) : [];
            
            const newEvents: TraumaEvent[] = [];
            
            anomalies.forEach(anomaly => {
              const traceId = `TRX_${Math.random().toString(36).substring(7).toUpperCase()}_SYNC`;
              newEvents.push({
                id: traceId,
                timestamp: new Date().toISOString(),
                layer: 'GHOST_SYNC' as any,
                depth: Math.round((anomaly.startDepth + anomaly.endDepth) / 2),
                value: Number(anomaly.avgDiff.toFixed(2)),
                unit: 'API',
                severity: anomaly.severity,
                description: `GhostSync discrepancy detected between ${anomaly.startDepth}m and ${anomaly.endDepth}m. Trace ID: ${anomaly.id}`
              });

              if (anomaly.severity === 'CRITICAL') {
                const traumaId = `TRX_${Math.random().toString(36).substring(7).toUpperCase()}_TRAUMA`;
                newEvents.push({
                  id: traumaId,
                  timestamp: new Date().toISOString(),
                  layer: 'CASING_TRAUMA' as any,
                  depth: Math.round((anomaly.startDepth + anomaly.endDepth) / 2),
                  value: Number(anomaly.avgDiff.toFixed(2)),
                  unit: 'API',
                  severity: anomaly.severity,
                  description: `Potential casing trauma detected due to severe datum shift anomaly between ${anomaly.startDepth}m and ${anomaly.endDepth}m. Delta: ${anomaly.avgDiff.toFixed(2)} API. Trace ID: ${anomaly.id}`
                });
              }
            });

            localStorage.setItem('BRAHAN_BLACK_BOX_LOGS', JSON.stringify([...newEvents, ...existingLogs].slice(0, 100)));
            window.dispatchEvent(new Event('storage'));
          } catch (e) {
            console.error('Failed to log to black box:', e);
          }
        }
      }
    };

    requestAnimationFrame(processChunk);
  }, [combinedData, anomalyThreshold]);

  const handleUpdateAnomalyStatus = useCallback((id: string, status: 'VALID' | 'INVALID') => {
    setDetectedAnomalies(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    if (selectedAnomaly?.id === id) {
      setSelectedAnomaly(prev => prev ? { ...prev, status } : null);
    }
  }, [selectedAnomaly]);

  const detectDatumShift = () => {
    setIsDetectingShift(true);
    setTimeout(() => {
      // Simple cross-correlation simulation
      const simulatedBestShift = 14.5; 
      setBestShift(simulatedBestShift);
      setIsDetectingShift(false);
    }, 1500);
  };

  const handleFetchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteUrl) return;

    setIsFetching(true);
    // Simulated fetch logic
    setTimeout(() => {
      const fileName = remoteUrl.split('/').pop() || 'REMOTE_LOG';
      const newSigId = `SIG-REMOTE-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      // Generate some mock matching data for the chart
      const newLogData: Record<number, number> = {};
      MOCK_BASE_LOG.forEach(base => {
        // Create slightly different but correlated data
        newLogData[base.depth] = base.gr + (Math.random() - 0.5) * 35;
      });

      setRemoteLogs(prev => ({ ...prev, [newSigId]: newLogData }));
      setSignals(prev => [
        ...prev, 
        { 
          id: newSigId, 
          name: fileName.toUpperCase().replace('.LAS', '').replace('.CSV', ''), 
          color: `hsl(${Math.random() * 360}, 70%, 50%)`, 
          visible: true 
        }
      ]);

      setIsFetching(false);
      setShowFetchInput(false);
      setRemoteUrl('');
    }, 1800);
  };

  const ghostLabel = isAdjusting ? "OFFSET_LOG" : "GHOST_LOG"; // Dynamically set the ghost label
  const isWarning = Math.abs(offset) > OFFSET_SAFE_LIMIT;
  const isCritical = Math.abs(offset) >= OFFSET_HARD_LIMIT;

  const offsetIntensity = isCritical 
    ? 'text-[var(--alert-red)]' 
    : isWarning 
      ? 'text-orange-500' 
      : 'text-[var(--emerald-primary)]';

  return (
    <div className="flex flex-col h-full p-4 space-y-4 font-terminal bg-[var(--slate-abyssal)]/20 scanline-effect relative overflow-hidden glass-panel cyber-border">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center space-x-4">
          <div className={`p-2 bg-[var(--emerald-primary)]/10 border border-[var(--emerald-primary)]/30 rounded transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] glass-panel ${isWarning ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : ''} ${isCritical ? 'border-[var(--alert-red)] shadow-[0_0_20px_rgba(239,68,68,0.5)]' : ''}`}>
            {isCritical ? <ShieldX size={24} className="text-[var(--alert-red)] animate-pulse" /> : <Ghost size={24} className={`${isWarning ? 'text-orange-500' : 'text-[var(--emerald-primary)]'} ${isWarning ? 'warning-glow' : 'text-glow-emerald'}`} />}
          </div>
          <div>
            <h2 className={`text-xl font-black uppercase tracking-tighter transition-all duration-300 ${isWarning ? 'text-orange-500 warning-glow' : 'text-[var(--emerald-primary)] text-glow-emerald'}`}>Ghost_Sync_Engine</h2>
            <div className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-widest">
              <ScanLine size={10} className={`animate-pulse ${isWarning ? 'text-orange-400' : 'text-[var(--emerald-primary)]/50'}`} />
              <span className={`${isWarning ? 'text-orange-400' : 'text-[var(--emerald-primary)]/50'} ${isWarning ? 'warning-glow' : 'text-glow-emerald'}`}>Datum_Correlation_Array</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowFetchInput(!showFetchInput)}
            className={`flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border glass-panel hover:scale-105 active:scale-95 ${showFetchInput ? 'bg-cyan-500/20 border-cyan-500 text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-slate-900/60 border-cyan-900/40 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/5'}`}
          >
            <Globe2 size={14} />
            <span>Fetch_Remote_Data</span>
          </button>

          <button 
            onClick={runAnomalyScan}
            disabled={isScanningAnomalies || isSyncing}
            className={`relative overflow-hidden flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border glass-panel hover:scale-105 active:scale-95 ${isScanningAnomalies ? 'bg-orange-500/20 border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-slate-900/60 border-orange-900/40 text-orange-400 hover:border-orange-400 hover:bg-orange-500/5'}`}
          >
            {isScanningAnomalies && (
              <div 
                className="absolute left-0 top-0 bottom-0 bg-orange-500/30 transition-all duration-100"
                style={{ width: `${scanProgress}%` }}
              />
            )}
            <div className="relative z-10 flex items-center space-x-2">
              {isScanningAnomalies ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              <span>{isScanningAnomalies ? `Scanning... ${scanProgress}%` : 'Forensic_Scan'}</span>
            </div>
          </button>

          <button 
            onClick={() => setViewMode(prev => prev === 'OVERLAY' ? 'DIFFERENTIAL' : 'OVERLAY')}
            className={`px-4 py-2 border rounded text-[10px] font-black uppercase transition-all glass-panel hover:scale-105 active:scale-95 ${viewMode === 'DIFFERENTIAL' ? 'bg-orange-500 border-orange-400 text-slate-950 shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'bg-slate-900/60 border-[var(--emerald-primary)]/20 text-[var(--emerald-primary)] hover:border-[var(--emerald-primary)]/50 hover:bg-[var(--emerald-primary)]/5'}`}
          >
            {viewMode}
          </button>

          <div className="flex items-center bg-slate-900/80 border border-[var(--emerald-primary)]/20 rounded px-2 py-1 glass-panel cyber-border">
            <span className="text-[8px] font-black text-[var(--emerald-primary)]/40 uppercase mr-2">Source:</span>
            <select 
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value as any)}
              className="bg-transparent text-[var(--emerald-primary)] text-[10px] font-black uppercase outline-none cursor-pointer hover:text-white transition-colors"
            >
              <option value="ALL" className="bg-slate-900">ALL_SOURCES</option>
              <option value="BASE_LOG" className="bg-slate-900">BASE_LOG</option>
              <option value="GHOST_LOG" className="bg-slate-900">GHOST_LOG</option>
              <option value="REMOTE_LOGS" className="bg-slate-900">REMOTE_LOGS</option>
            </select>
          </div>
          
          <button 
            onClick={autoLineup}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-6 py-2 bg-[var(--emerald-primary)] text-slate-950 rounded font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] disabled:opacity-50 glass-panel hover:scale-105 active:scale-95 transition-all"
          >
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
            <span>Auto_Lineup</span>
          </button>
        </div>
      </div>

      {/* Remote Data Fetch Input Form */}
      {showFetchInput && (
        <div className="bg-slate-950/80 border border-cyan-500/30 p-4 rounded-lg animate-in slide-in-from-top-2 duration-300 shadow-2xl glass-panel cyber-border">
          <form onSubmit={handleFetchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 w-full relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-cyan-900">
                <Link size={14} />
              </div>
              <input 
                type="text" 
                placeholder="Enter URL for .LAS or .CSV log file (e.g., https://ndr.archive/well/thistle.las)"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                autoFocus
                className="w-full bg-slate-900 border border-cyan-900/40 rounded px-10 py-2 text-[10px] text-cyan-100 outline-none focus:border-cyan-500 transition-all font-terminal glass-panel"
              />
            </div>
            <button 
              type="submit" 
              disabled={isFetching || !remoteUrl}
              className="w-full md:w-auto px-6 py-2 bg-cyan-600 text-slate-950 rounded font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] glass-panel"
            >
              {isFetching ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{isFetching ? 'Injecting_Signal...' : 'Submit_Fetch'}</span>
            </button>
          </form>
          <div className="mt-2 flex items-center space-x-3 text-[7px] text-cyan-800 uppercase font-black tracking-widest px-1">
            <Info size={10} className="text-cyan-700" />
            <span>Format Support: LAS 2.0/3.0, Tally CSV // Metadata Integrity Check Active</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col xl:flex-row gap-4 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          <SyncMonitorChart 
            combinedData={combinedData} 
            signals={filteredSignals} 
            viewMode={viewMode} 
            ghostLabel={ghostLabel} 
            validationError={validationError}
            offset={offset}
            anomalies={filteredAnomalies}
            onToggleSignal={handleToggleSignal}
            onAnomalyClick={setSelectedAnomaly}
            selectedAnomalyId={selectedAnomaly?.id}
          />

          {selectedAnomaly && (
            <div className={`glass-panel rounded-lg border transition-all duration-300 overflow-hidden flex flex-col shadow-2xl ${selectedAnomaly.severity === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' : 'border-orange-500/30 bg-orange-500/5'}`}>
              <div 
                onClick={() => setIsAnomalyPanelOpen(!isAnomalyPanelOpen)}
                className="flex items-center justify-between p-3 bg-slate-900/80 border-b border-slate-800/50 group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded ${selectedAnomaly.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    <ShieldAlert size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Anomaly_Forensic_Report</span>
                    <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest">Trace_ID: {selectedAnomaly.id}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${selectedAnomaly.severity === 'CRITICAL' ? 'bg-red-500 text-slate-950' : 'bg-orange-500 text-slate-950'}`}>
                    {selectedAnomaly.severity}
                  </span>
                  <div className="flex items-center space-x-2 border-l border-slate-800/50 pl-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsAnomalyPanelOpen(!isAnomalyPanelOpen); }}
                      className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
                      title={isAnomalyPanelOpen ? "Collapse" : "Expand"}
                    >
                      <SlidersHorizontal size={14} className={`transition-transform duration-300 ${isAnomalyPanelOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedAnomaly(null); }}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      title="Close Report"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {isAnomalyPanelOpen && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col space-y-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Anomaly_ID</span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">{selectedAnomaly.id}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Severity_Level</span>
                    <span className={`text-[11px] font-black uppercase ${selectedAnomaly.severity === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'}`}>
                      {selectedAnomaly.severity}
                    </span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Depth_Range</span>
                    <span className="text-[11px] font-mono text-slate-200 font-bold">
                      {selectedAnomaly.startDepth.toFixed(1)}m — {selectedAnomaly.endDepth.toFixed(1)}m
                    </span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Avg_Delta_API</span>
                    <span className="text-[11px] font-mono text-slate-200 font-bold">{selectedAnomaly.avgDiff.toFixed(2)} API</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Detected_At</span>
                    <div className="flex items-center space-x-2">
                      <Calendar size={12} className="text-slate-600" />
                      <span className="text-[11px] font-mono text-slate-200 font-bold">{selectedAnomaly.detectedAt}</span>
                    </div>
                  </div>
                  <div className="md:col-span-2 lg:col-span-5 pt-3 border-t border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <p className="text-[10px] text-slate-400 font-terminal leading-relaxed italic flex-1">
                      {selectedAnomaly.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleUpdateAnomalyStatus(selectedAnomaly.id, 'VALID')}
                        className={`px-3 py-1.5 rounded text-[8px] font-black uppercase transition-all flex items-center space-x-2 border ${selectedAnomaly.status === 'VALID' ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-900/60 border-emerald-900/40 text-emerald-500 hover:border-emerald-400 hover:bg-emerald-500/10'}`}
                      >
                        <ShieldCheck size={12} />
                        <span>Mark_Valid</span>
                      </button>
                      <button 
                        onClick={() => handleUpdateAnomalyStatus(selectedAnomaly.id, 'INVALID')}
                        className={`px-3 py-1.5 rounded text-[8px] font-black uppercase transition-all flex items-center space-x-2 border ${selectedAnomaly.status === 'INVALID' ? 'bg-red-500 border-red-400 text-slate-950 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-slate-900/60 border-red-900/40 text-red-500 hover:border-red-400 hover:bg-red-500/10'}`}
                      >
                        <ShieldX size={12} />
                        <span>Mark_Invalid</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full xl:w-80 flex flex-col space-y-4">
          {/* Main Control Panel with Strike Feedback */}
          <div className={`glass-panel p-5 rounded-lg border bg-slate-900/40 flex flex-col space-y-5 shadow-2xl transition-all duration-300 cyber-border ${isShaking ? 'animate-shake border-[var(--alert-red)] bg-[var(--alert-red)]/5' : 'border-[var(--emerald-primary)]/20'}`}>
            <div className="flex items-center justify-between border-b border-[var(--emerald-primary)]/10 pb-2">
              <h3 className="text-[10px] font-black text-[var(--emerald-primary)] uppercase tracking-widest flex items-center text-glow-emerald">
                <span>Engage_Controls</span>
                <Target size={12} className="ml-2 text-[var(--emerald-primary)]/40 animate-pulse" />
              </h3>
              <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all duration-300 ${
                Math.abs(offset) >= OFFSET_HARD_LIMIT 
                  ? 'bg-[var(--alert-red)] text-slate-950 shadow-[0_0_15px_var(--alert-red)]' 
                  : Math.abs(offset) > OFFSET_SAFE_LIMIT 
                    ? 'bg-orange-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.6)]' 
                    : 'bg-[var(--emerald-primary)]/20 text-[var(--emerald-primary)] border border-[var(--emerald-primary)]/30 text-glow-emerald'
              }`}>
                {Math.abs(offset) >= OFFSET_HARD_LIMIT 
                  ? 'VETO_STATE' 
                  : Math.abs(offset) > OFFSET_SAFE_LIMIT 
                    ? 'WARNING_ZONE' 
                    : 'NOMINAL'}
              </div>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded border bg-slate-950/60 transition-all duration-300 glass-panel ${validationError ? (Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'border-[var(--alert-red)] shadow-[0_0_25px_rgba(239,68,68,0.3)]' : 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]') : 'border-[var(--emerald-primary)]/20'}`}>
                <div className="flex justify-between items-center mb-3">
                   <div className="flex items-center space-x-2">
                      <Lock size={12} className={isCritical ? 'text-[var(--alert-red)] animate-pulse' : isWarning ? 'text-orange-400' : 'text-[var(--emerald-primary)]/40'} />
                      <span className={`text-[8px] font-black uppercase tracking-widest ${isWarning ? 'text-orange-400' : 'text-[var(--emerald-primary)]/50'}`}>Shift_Veto_Input</span>
                   </div>
                   <span className={`text-[16px] font-black font-terminal transition-colors duration-300 drop-shadow-md ${offsetIntensity}`}>
                     {offset.toFixed(3)}m
                   </span>
                </div>
                
                <div className="flex space-x-2">
                  <input 
                    type="number"
                    step="0.001"
                    min={-OFFSET_HARD_LIMIT}
                    max={OFFSET_HARD_LIMIT}
                    value={offset === 0 && isAdjusting ? '' : offset}
                    onFocus={() => setIsAdjusting(true)}
                    onBlur={() => setIsAdjusting(false)}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      if (rawValue === '') {
                        setOffset(0);
                        setValidationError(null);
                        return;
                      }
                      const val = parseFloat(rawValue);
                      if (!isNaN(val)) {
                        handleOffsetChange(val);
                      }
                    }}
                    className={`flex-1 bg-slate-900/80 border rounded px-3 py-2 text-[11px] font-terminal outline-none transition-all duration-300 glass-panel ${isCritical ? 'border-[var(--alert-red)] text-[var(--alert-red)] shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-shake' : isWarning ? 'border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'border-[var(--emerald-primary)]/30 text-emerald-100 focus:border-[var(--emerald-primary)] focus:shadow-[0_0_10px_rgba(34,197,94,0.25)]'}`}
                  />
                  <button 
                    onClick={detectDatumShift}
                    disabled={isDetectingShift}
                    title="Auto-Detect Best Shift"
                    className={`px-3 rounded transition-all duration-300 flex items-center justify-center glass-panel hover:scale-110 active:scale-90 ${bestShift ? 'bg-orange-500 text-slate-950 hover:bg-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-slate-800 text-[var(--emerald-primary)] hover:bg-slate-700 hover:text-white'}`}
                  >
                    {isDetectingShift ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  </button>
                  <button 
                    onClick={animateSync}
                    disabled={isSyncing}
                    title="Animate Alignment"
                    className="px-3 bg-[var(--emerald-primary)] text-slate-950 hover:bg-emerald-400 rounded transition-all duration-300 disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.4)] glass-panel hover:scale-110 active:scale-90"
                  >
                    {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                  </button>
                  <button 
                    onClick={() => {
                      handleOffsetChange(0);
                      setBestShift(null);
                    }}
                    title="Reset Offset"
                    className="px-3 bg-slate-800 text-[var(--emerald-primary)]/40 hover:text-[var(--emerald-primary)] rounded transition-all duration-300 glass-panel hover:bg-slate-700"
                  >
                    <RotateCw size={14} />
                  </button>
                </div>
              </div>
              
              {bestShift !== null && (
                <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/40 rounded flex items-center justify-between animate-in slide-in-from-top-2 glass-panel cyber-border">
                  <div className="flex items-center space-x-2">
                    <Target size={10} className="text-orange-400 animate-pulse" />
                    <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest text-glow-gold">Best_Fit_Detected: {bestShift.toFixed(3)}m</span>
                  </div>
                  <button 
                    onClick={() => {
                      handleOffsetChange(bestShift);
                      setBestShift(null);
                    }}
                    className="text-[8px] font-black text-orange-400 hover:text-white uppercase underline decoration-orange-500/50 hover:decoration-white transition-all"
                  >
                    Apply_Shift
                  </button>
                </div>
              )}

              {Math.abs(offset) >= OFFSET_SAFE_LIMIT && (
                <div className={`mt-2 p-2 rounded border flex items-center space-x-2 animate-pulse glass-panel ${Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'bg-red-500/10 border-red-500/60 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-orange-500/10 border-orange-500/60 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]'}`}>
                  <AlertOctagon size={12} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-glow-red">
                    {Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'CRITICAL_VETO: HARD_LIMIT_EXCEEDED' : 'WARNING: SAFE_LIMIT_EXCEEDED'}
                  </span>
                </div>
              )}

              <div className="space-y-2 px-1">
                <div className="flex justify-between text-[8px] font-black text-[var(--emerald-primary)]/50 uppercase tracking-widest">
                  <span className="text-glow-emerald">Manual_Override</span>
                  <span className={`${Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'text-[var(--alert-red)] text-glow-red' : ''} transition-colors duration-300`}>HARD_LIMIT: ±{OFFSET_HARD_LIMIT}m</span>
                </div>
                {/* Visual Danger Zone Slider */}
                <div className="relative h-6 flex items-center">
                  <div className="absolute inset-0 h-1.5 my-auto rounded-full bg-slate-800/50 overflow-hidden pointer-events-none border border-slate-700/30">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 via-emerald-400 to-emerald-400 via-orange-500 to-red-600 opacity-30"></div>
                  </div>
                  <input 
                    type="range" min={-OFFSET_HARD_LIMIT} max={OFFSET_HARD_LIMIT} step="0.01" 
                    value={offset} 
                    onMouseDown={() => setIsAdjusting(true)}
                    onMouseUp={() => setIsAdjusting(false)}
                    onTouchStart={() => setIsAdjusting(true)}
                    onTouchEnd={() => setIsAdjusting(false)}
                    onChange={e => handleOffsetChange(parseFloat(e.target.value))}
                    className={`w-full h-1.5 bg-transparent appearance-none rounded-full cursor-pointer z-10 accent-current transition-all duration-300 ${offsetIntensity}`} 
                  />
                </div>
              </div>

              {validationError && (
                <div className={`p-3 rounded border animate-in slide-in-from-top-1 flex items-start space-x-3 glass-panel ${Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]'}`}>
                  <AlertOctagon size={16} className="flex-shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase leading-tight tracking-wider">{validationError}</span>
                    <span className="text-[7px] opacity-60 uppercase font-mono mt-1 tracking-widest">Manual Veto Active // Adjust Input</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-none glass-panel p-5 rounded-lg border border-[var(--emerald-primary)]/20 bg-slate-900/40 shadow-2xl cyber-border hover:bg-slate-900/60 transition-colors duration-300">
            <h3 className="text-[10px] font-black text-[var(--emerald-primary)] uppercase tracking-widest mb-4 flex items-center text-glow-emerald">
               <ScanLine size={12} className="mr-2 animate-pulse" /> Signal_Stack
            </h3>
            <div className="space-y-2">
              {filteredSignals.map(sig => (
                <div key={sig.id} className="relative group/sig">
                  <div 
                    onClick={() => handleToggleSignal(sig.id)}
                    role="button"
                    aria-pressed={sig.visible}
                    className={`flex items-center justify-between p-2.5 bg-slate-950/60 border rounded hover:border-[var(--emerald-primary)]/40 transition-all duration-300 cursor-pointer group glass-panel ${sig.visible ? 'border-[var(--emerald-primary)]/20 shadow-[0_0_10px_rgba(0,0,0,0.2)]' : 'border-red-950/20 opacity-30 grayscale'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] transition-all duration-300 group-hover:scale-125" style={{ backgroundColor: sig.color, color: sig.color }}></div>
                      <span className={`text-[9px] font-black uppercase truncate transition-colors duration-300 ${sig.visible ? 'text-emerald-100' : 'text-slate-600'}`}>{sig.id === 'SIG-002' ? ghostLabel : sig.name}</span>
                    </div>
                    {sig.visible ? <CheckCircle2 size={12} className="text-[var(--emerald-primary)] animate-in zoom-in duration-300" /> : <ShieldAlert size={12} className="text-red-900" />}
                  </div>

                  {/* Signal Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/sig:block z-50 p-2 bg-slate-900 border border-emerald-500/30 rounded shadow-2xl animate-in fade-in zoom-in-95 duration-200 pointer-events-none min-w-[120px]">
                    <div className="flex flex-col space-y-1 text-[8px] font-mono">
                      <div className="flex justify-between space-x-4">
                        <span className="text-slate-500 uppercase">Signal_ID:</span>
                        <span className="text-emerald-400 font-bold">{sig.id}</span>
                      </div>
                      <div className="flex justify-between space-x-4">
                        <span className="text-slate-500 uppercase">Hex_Code:</span>
                        <span className="font-bold" style={{ color: sig.color.startsWith('var') ? 'inherit' : sig.color }}>{sig.color}</span>
                      </div>
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-b border-r border-emerald-500/30 rotate-45"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 glass-panel p-5 rounded-lg border border-[var(--emerald-primary)]/20 bg-slate-900/40 flex flex-col overflow-hidden shadow-2xl cyber-border hover:bg-slate-900/60 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-[var(--emerald-primary)] uppercase tracking-widest flex items-center text-glow-emerald">
                 <AlertTriangle size={12} className="mr-2 animate-pulse" /> Detected_Anomalies
              </h3>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center text-[8px] font-black text-[var(--emerald-primary)]/50 uppercase tracking-widest">
                  <div className="flex items-center space-x-2">
                    <SlidersHorizontal size={10} className="text-[var(--emerald-primary)]/60" />
                    <span className="text-glow-emerald">Detection_Threshold</span>
                  </div>
                  <span className="text-[var(--emerald-primary)] text-glow-emerald">{anomalyThreshold} API</span>
                </div>
                <div className="relative h-4 flex items-center">
                  <div className="absolute inset-0 h-1 my-auto rounded-full bg-slate-800/50 pointer-events-none border border-slate-700/30"></div>
                  <input 
                    type="range" min="5" max="100" step="1" 
                    value={anomalyThreshold} 
                    onChange={e => setAnomalyThreshold(parseInt(e.target.value))}
                    className="w-full h-1 bg-transparent appearance-none rounded-full cursor-pointer z-10 accent-[var(--emerald-primary)] transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[8px] font-black text-[var(--emerald-primary)]/50 uppercase tracking-widest block text-glow-emerald">Severity_Filter</span>
                <div className="flex p-1 bg-slate-950/80 rounded border border-[var(--emerald-primary)]/20 glass-panel">
                  {(['ALL', 'CRITICAL', 'WARNING'] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`flex-1 py-1 text-[8px] font-black uppercase rounded transition-all duration-300 ${
                        severityFilter === sev 
                          ? 'bg-[var(--emerald-primary)] text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                          : 'text-[var(--emerald-primary)]/50 hover:text-[var(--emerald-primary)] hover:bg-[var(--emerald-primary)]/5'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[8px] font-black text-[var(--emerald-primary)]/50 uppercase tracking-widest block text-glow-emerald">Temporal_Filter</span>
                <div className="flex p-1 bg-slate-950/80 rounded border border-[var(--emerald-primary)]/20 glass-panel">
                  {(['ALL', 'LAST_7_DAYS', 'LAST_30_DAYS'] as const).map((date) => (
                    <button
                      key={date}
                      onClick={() => setDateFilter(date)}
                      className={`flex-1 py-1 text-[8px] font-black uppercase rounded transition-all duration-300 ${
                        dateFilter === date 
                          ? 'bg-[var(--emerald-primary)] text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                          : 'text-[var(--emerald-primary)]/50 hover:text-[var(--emerald-primary)] hover:bg-[var(--emerald-primary)]/5'
                      }`}
                    >
                      {date.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {filteredAnomalies.length === 0 ? (
                <div className="text-[10px] text-slate-600 font-terminal text-center py-8 uppercase tracking-widest italic opacity-50">NO ANOMALIES FOUND</div>
              ) : (
                filteredAnomalies.map(anomaly => (
                  <div 
                    key={anomaly.id}
                    onClick={() => setSelectedAnomaly(anomaly)}
                    className={`p-3 rounded border cursor-pointer transition-all duration-300 glass-panel hover:bg-slate-800/60 group ${selectedAnomaly?.id === anomaly.id ? 'border-[var(--emerald-primary)] bg-slate-800/90 shadow-[0_0_15px_rgba(34,197,94,0.25)] cyber-border' : 'border-[var(--emerald-primary)]/10 bg-slate-950/40 hover:border-[var(--emerald-primary)]/30'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-black transition-colors duration-300 ${selectedAnomaly?.id === anomaly.id ? 'text-white text-glow-emerald' : 'text-emerald-100/70 group-hover:text-emerald-100'}`}>{anomaly.id}</span>
                        {anomaly.status !== 'PENDING' && (
                          <span className={`text-[7px] font-black px-1 rounded ${anomaly.status === 'VALID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {anomaly.status}
                          </span>
                        )}
                      </div>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded transition-all duration-300 ${anomaly.severity === 'CRITICAL' ? 'bg-[var(--alert-red)]/20 text-[var(--alert-red)] shadow-[0_0_8px_rgba(239,68,68,0.2)]' : 'bg-orange-500/20 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.2)]'}`}>
                        {anomaly.severity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-terminal text-slate-400">
                      <span>{anomaly.startDepth.toFixed(1)}m - {anomaly.endDepth.toFixed(1)}m</span>
                      <span className="flex items-center"><Calendar size={8} className="mr-1"/> {anomaly.detectedAt}</span>
                    </div>

                    {selectedAnomaly?.id === anomaly.id && (
                      <div className="mt-3 pt-3 border-t border-slate-800/50 space-y-2 animate-in slide-in-from-top-1 duration-300">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black">Start_Depth</span>
                            <span className="text-[10px] text-slate-200 font-mono">{anomaly.startDepth.toFixed(1)}m</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black">End_Depth</span>
                            <span className="text-[10px] text-slate-200 font-mono">{anomaly.endDepth.toFixed(1)}m</span>
                          </div>
                          <div className="flex flex-col col-span-2">
                            <span className="text-[7px] text-slate-500 uppercase font-black">Avg_Deviation</span>
                            <span className="text-[10px] text-orange-400 font-mono">{anomaly.avgDiff.toFixed(2)} API</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-relaxed italic border-l-2 border-slate-800 pl-2">
                          {anomaly.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <button className="flex items-center justify-center space-x-3 w-full py-4 bg-slate-950/90 border border-emerald-500/20 rounded-lg text-emerald-500 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-400 transition-all group shadow-xl">
             <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Notarize_Sync_Truth</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
        .animate-shake {
          animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
          animation-iteration-count: 2;
        }
        .warning-glow {
          text-shadow: 0 0 15px rgba(249, 115, 22, 0.8), 0 0 30px rgba(249, 115, 22, 0.4);
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          box-shadow: 0 0 10px currentColor;
        }
        input[type=range]::-moz-range-thumb {
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          box-shadow: 0 0 10px currentColor;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default GhostSync;
