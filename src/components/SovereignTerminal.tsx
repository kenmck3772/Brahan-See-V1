import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { initialFilesystem, defaultBookmarks } from '../data';
import { Bookmark, DirectoryNode, ForensicLog, IngestedArtifact } from '../types';
import { BookmarkManager } from './BookmarkManager';
import { TraumaNodeVisualizer } from './TraumaNodeVisualizer';
import { ArtifactIngestion } from './ArtifactIngestion';
import { WellTegraLogo } from './WellTegraLogo';
import { 
  Folder, 
  FolderOpen,
  FileText, 
  Search, 
  Terminal, 
  Clock, 
  Activity, 
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
  Info,
  X,
  Trash2,
  Download,
  ShieldCheck,
  ShieldAlert,
  Maximize2,
  Minimize2,
  GitCompare,
  Shield,
  Lock,
  Unlock
} from 'lucide-react';

export const SovereignTerminal: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/');
  
  // Generate beautiful deterministic hexadecimal row streams with optional traumaRating degradation
  const generateHexDump = (targetName: string, traumaRating: number = 0) => {
    const hexRows = [];
    const chars = "ABCDEF0123456789";
    const nameLength = targetName.length || 1;
    for (let i = 0; i < 6; i++) {
      let hexBytes = "";
      let asciiVal = "";
      for (let b = 0; b < 12; b++) {
        const charCode = targetName.charCodeAt((i * 12 + b) % nameLength) || 97;
        const idx = (charCode + i + b) % chars.length;
        
        let b1 = chars[idx];
        let b2 = chars[(idx + 4) % chars.length];
        let asciiChar = b % 3 === 0 ? '.' : String.fromCharCode(33 + (idx * 5) % 90);

        // Apply a deterministic corruption filter if byte index satisfies trauma rating tension
        const byteOffset = i * 12 + b;
        const byteTension = (byteOffset * 13 + nameLength * 7) % 100;
        if (traumaRating > 0 && byteTension < traumaRating) {
          const mutatedIdx = (idx + Math.floor(traumaRating / 8)) % chars.length;
          b1 = chars[mutatedIdx];
          b2 = chars[(mutatedIdx + 3) % chars.length];
          // Use typical corrupted data characters or flags
          asciiChar = '!';
        }

        hexBytes += `${b1}${b2} `;
        asciiVal += asciiChar;
      }
      hexRows.push({
        offset: `0x00${(i * 16).toString(16).toUpperCase().padStart(2, '0')}`,
        bytes: hexBytes.trim(),
        ascii: asciiVal
      });
    }
    return hexRows;
  };
  const [hoveredByteIndex, setHoveredByteIndex] = useState<{ rowIdx: number; byteIdx: number } | null>(null);
  const [anomalySortOrder, setAnomalySortOrder] = useState<'none' | 'desc' | 'asc'>('none');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(defaultBookmarks);
  const [filesystemUpdateTrigger, setFilesystemUpdateTrigger] = useState(0);
  const [monitorEnabled, setMonitorEnabled] = useState(true);
  const [traumaHistory, setTraumaHistory] = useState<Record<string, Array<{ timestamp: number; rating: number }>>>({});
  const lastNotificationTimesRef = useRef<Record<string, number>>({});
  const bookmarksRef = useRef<Bookmark[]>(defaultBookmarks);

  useEffect(() => {
    bookmarksRef.current = bookmarks;
  }, [bookmarks]);

  // Helper to gather all files under a path recursively
  const getFilesUnderPath = (nodePath: string): DirectoryNode[] => {
    const files: DirectoryNode[] = [];
    const findInNode = (node: DirectoryNode) => {
      if (node.path === nodePath) {
        const gather = (n: DirectoryNode) => {
          if (n.type === 'file') {
            files.push(n);
          } else if (n.children) {
            n.children.forEach(gather);
          }
        };
        gather(node);
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (findInNode(child)) return true;
        }
      }
      return false;
    };
    findInNode(initialFilesystem);
    return files;
  };

  const updateNodeTraumaRating = (path: string, newRating: number) => {
    const findAndSet = (node: DirectoryNode): boolean => {
      if (node.path === path) {
        node.traumaRating = newRating;
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (findAndSet(child)) return true;
        }
      }
      return false;
    };
    findAndSet(initialFilesystem);
    setSelectedFile(prev => {
      if (prev && prev.path === path) {
        return { ...prev, traumaRating: newRating };
      }
      return prev;
    });
    setFilesystemUpdateTrigger(prev => prev + 1);
  };

  const [ingestedArtifacts, setIngestedArtifacts] = useState<IngestedArtifact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [forensicLogs, setForensicLogs] = useState<ForensicLog[]>([
    { id: 'l1', timestamp: '21:04:12 UTC', message: 'Brahan Sovereign Kernel booted successfully.', type: 'success' },
    { id: 'l2', timestamp: '21:04:20 UTC', message: 'Holographic TraumaNode Rig alignment active [Sector Alpha].', type: 'info' },
    { id: 'l3', timestamp: '21:05:01 UTC', message: 'Security scan complete: 0 unlogged bypass signatures.', type: 'success' }
  ]);
  const [selectedFile, setSelectedFile] = useState<DirectoryNode | null>(null);
  const [lockedFilePath, setLockedFilePath] = useState<string | null>(null);
  const [batchSelectedPaths, setBatchSelectedPaths] = useState<string[]>([]);
  const [batchRebuildingPaths, setBatchRebuildingPaths] = useState<string[]>([]);
  const [overlayTab, setOverlayTab] = useState<'specs' | 'diff'>('specs');
  const [fileSnapshots, setFileSnapshots] = useState<Record<string, {
    traumaRating: number;
    lastModified: string;
    anomalies: string[];
    timestamp: string;
    history: number[];
  }>>({});

  const getSnapshot = (file: DirectoryNode) => {
    const path = file.path;
    if (fileSnapshots[path]) {
      return fileSnapshots[path];
    }
    
    // Create custom deterministic baseline snapshot representing state 2 hours ago
    const baseStress = Math.max(0, (file.traumaRating || 0) > 0 ? (file.traumaRating || 0) - 20 : 10);
    const baseModified = file.lastModified ? `${file.lastModified} 02:00:00 UTC` : '2026-06-01 10:00:00 UTC';
    
    // Generate deterministic 12 readings leading to baseStress
    const nameLength = file.name.length || 5;
    const history = Array.from({ length: 12 }, (_, i) => {
      const wobble = (i * 7 + nameLength) % 5;
      return Math.max(0, Math.min(100, Math.round(baseStress + wobble - 2)));
    });
    
    // For anomalies, take only the first anomaly if any, simulating that others were introduced in active session
    const baseAnomalies = file.anomalies && file.anomalies.length > 0 ? [file.anomalies[0]] : [];
    
    return {
      traumaRating: baseStress,
      lastModified: baseModified,
      anomalies: baseAnomalies,
      timestamp: '2 hours ago (Automatic Baseline)',
      history
    };
  };

  const captureSnapshot = (file: DirectoryNode) => {
    const currentStress = file.traumaRating || 0;
    
    // Generate current history curve representing active session trend
    const nameLength = file.name.length || 5;
    const history = Array.from({ length: 12 }, (_, i) => {
      const wobble = (i * 3 + nameLength) % 4;
      return Math.max(0, Math.min(100, Math.round(currentStress + wobble - 2)));
    });

    setFileSnapshots(prev => ({
      ...prev,
      [file.path]: {
        traumaRating: currentStress,
        lastModified: file.lastModified,
        anomalies: file.anomalies || [],
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC (Captured Reference)',
        history
      }
    }));
    addLog(`Captured benchmark reference snapshot for [${file.name}] at current stress matrix: ${currentStress}%`, 'success');
  };

  const getPresentHistory = (file: DirectoryNode) => {
    const currentStress = file.traumaRating || 0;
    const nameLength = file.name.length || 5;
    return Array.from({ length: 12 }, (_, i) => {
      const wobble = (i * 4 + nameLength * 2) % 6;
      const progress = i / 11;
      const baseVal = Math.round(15 + progress * (currentStress - 15));
      return Math.max(0, Math.min(100, Math.round(baseVal + wobble - 3)));
    });
  };

  const [isFullScreenExplorer, setIsFullScreenExplorer] = useState(false);
  const [quarantinedFiles, setQuarantinedFiles] = useState<Record<string, boolean>>({});
  const [rebuildingFile, setRebuildingFile] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<DirectoryNode | null>(null);
  const [timeStr, setTimeStr] = useState('');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeAlert, setActiveAlert] = useState(false);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [hoveredArtifact, setHoveredArtifact] = useState<IngestedArtifact | null>(null);
  const [artifactTooltipCoords, setArtifactTooltipCoords] = useState<{ x: number; y: number } | null>(null);

  // Real-time sparkline telemetry rolling snapshot history, tracking log rate in 3-second intervals
  const [logVolumeHistory, setLogVolumeHistory] = useState<Array<{
    info: number;
    success: number;
    warning: number;
    error: number;
  }>>(() => [
    { info: 1, success: 1, warning: 1, error: 0 },
    { info: 0, success: 1, warning: 0, error: 0 },
    { info: 1, success: 0, warning: 1, error: 0 },
    { info: 0, success: 2, warning: 0, error: 0 },
    { info: 2, success: 1, warning: 0, error: 0 },
    { info: 1, success: 0, warning: 0, error: 1 },
    { info: 0, success: 1, warning: 1, error: 0 },
    { info: 1, success: 1, warning: 0, error: 0 },
    { info: 2, success: 0, warning: 1, error: 0 },
    { info: 0, success: 0, warning: 0, error: 0 },
    { info: 1, success: 1, warning: 0, error: 0 },
    { info: 0, success: 2, warning: 0, error: 0 },
    { info: 2, success: 0, warning: 1, error: 1 },
    { info: 1, success: 1, warning: 0, error: 0 },
    { info: 0, success: 1, warning: 1, error: 0 },
    { info: 1, success: 1, warning: 0, error: 0 },
  ]);

  const lastProcessedIndexRef = useRef(3); // Start tracking after initial 3 logs
  const forensicLogsRef = useRef(forensicLogs);

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const prevLogsLengthRef = useRef(3); // Start with initial 3 logs

  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return forensicLogs;
    return forensicLogs.filter(log => log.type === logFilter);
  }, [forensicLogs, logFilter]);

  // Max peak log volume within history for sparkline normalization mapping
  const maxVolume = useMemo(() => {
    return Math.max(...logVolumeHistory.map(h => h.info + h.success + h.warning + h.error), 1);
  }, [logVolumeHistory]);

  // Keep logs reference always current for interval closures
  useEffect(() => {
    forensicLogsRef.current = forensicLogs;
  }, [forensicLogs]);

  // Active volume accumulator recording ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLogs = forensicLogsRef.current;
      const lastIndex = lastProcessedIndexRef.current;
      const newLogs = currentLogs.slice(lastIndex);
      
      const counts = { info: 0, success: 0, warning: 0, error: 0 };
      newLogs.forEach(log => {
        if (log.type in counts) {
          counts[log.type]++;
        }
      });

      setLogVolumeHistory(prev => {
        const next = [...prev, counts];
        if (next.length > 20) {
          next.shift();
        }
        return next;
      });

      lastProcessedIndexRef.current = currentLogs.length;
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // --- Ingest Integrity Monitor Periodical Auditor and Simulator ---
  useEffect(() => {
    if (!monitorEnabled) return;

    // A timer that runs every 8 seconds to:
    // 1. Slightly wiggle random file trauma ratings for background dynamic realism
    // 2. Perform the sliding-window delta audit and trigger blue logs if >10% spike is met
    const interval = setInterval(() => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;

      // Part A: Subtle background simulation wiggling to make graphs and ratings lively
      if (Math.random() < 0.3) {
        // Collect all files in the initialFilesystem to mutate
        const allFiles: DirectoryNode[] = [];
        const gatherAll = (node: DirectoryNode) => {
          if (node.type === 'file') {
            allFiles.push(node);
          } else if (node.children) {
            node.children.forEach(gatherAll);
          }
        };
        gatherAll(initialFilesystem);

        if (allFiles.length > 0) {
          const target = allFiles[Math.floor(Math.random() * allFiles.length)];
          const currentTr = target.traumaRating ?? 0;
          let delta = Math.floor(Math.random() * 3) - 1; // -1 to +1 wiggles
          
          // Rare random spike
          if (Math.random() < 0.15) {
            delta = Math.floor(Math.random() * 6) + 2; // +2% to +7% upward shifts
          }
          
          const newTr = Math.max(0, Math.min(100, currentTr + delta));
          if (newTr !== currentTr) {
            updateNodeTraumaRating(target.path, newTr);
          }
        }
      }

      // Part B: Perform sliding window delta audit of bookmarked paths
      setTraumaHistory(prev => {
        const next = { ...prev };
        
        // Find all unique files under currently bookmarked directories or file bookmarks
        const bookmarkedFiles: DirectoryNode[] = [];
        bookmarksRef.current.forEach(b => {
          const files = getFilesUnderPath(b.path);
          files.forEach(f => {
            if (!bookmarkedFiles.some(bf => bf.path === f.path)) {
              bookmarkedFiles.push(f);
            }
          });
        });

        bookmarkedFiles.forEach(file => {
          const path = file.path;
          const currentRating = file.traumaRating ?? 0;
          const fileHistory = prev[path] ? [...prev[path]] : [];

          // Log current check point
          fileHistory.push({ timestamp: now, rating: currentRating });

          // Keep history capped to last 5 minutes
          const cleanHistory = fileHistory.filter(h => h.timestamp >= fiveMinutesAgo);
          next[path] = cleanHistory;

          // Perform delta check if there is historical data in the 5-minute sliding window
          if (cleanHistory.length > 1) {
            const oldestReading = cleanHistory[0];
            const changeRating = currentRating - oldestReading.rating;
            
            // True if the rating went up by 10 points/percent or more
            if (changeRating >= 10) {
              const lastNotified = lastNotificationTimesRef.current[path] || 0;
              const notificationThrottleMs = 25000; // Debounce alarm trigger per file path for 25s
              if (now - lastNotified > notificationThrottleMs) {
                lastNotificationTimesRef.current[path] = now;
                
                // Fire subtle blue warning notification at next tick
                setTimeout(() => {
                  const percentString = changeRating > 0 ? `+${changeRating}%` : `${changeRating}%`;
                  addLog(
                    `INTEGRITY CRITICAL SPIKE: Bookmarked node target [${file.path}] has deviated by ${percentString} within the 5-minute telemetry window (Was: ${oldestReading.rating}%, Now: ${currentRating}%).`,
                    'info'
                  );
                }, 0);
              }
            }
          }
        });

        return next;
      });

    }, 8000);

    return () => clearInterval(interval);
  }, [monitorEnabled]);

  // Auto-scrolling logic for new black box trace telemetry entries
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  // Track new log additions and trigger active alert for errors
  useEffect(() => {
    if (forensicLogs.length > prevLogsLengthRef.current) {
      // Find newly appended logs
      const newlyAddedLogs = forensicLogs.slice(prevLogsLengthRef.current);
      const hasNewError = newlyAddedLogs.some(log => log.type === 'error');
      if (hasNewError) {
        setActiveAlert(true);
      }
    }
    prevLogsLengthRef.current = forensicLogs.length;
  }, [forensicLogs]);

  const handleCopyLog = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLogId(id);
      setTimeout(() => {
        setCopiedLogId(prev => prev === id ? null : prev);
      }, 1500);
    }).catch((err) => {
      console.error('Failed to copy. Error: ', err);
    });
  };

  const clearSessionLogs = () => {
    setForensicLogs([]);
    setActiveAlert(false);
    lastProcessedIndexRef.current = 0;
    prevLogsLengthRef.current = 0;
    setShowClearConfirmation(false);
  };

  const downloadSessionLogs = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
      downloadAnchor.setAttribute("download", `sovereign_blackbox_${logFilter}_logs_${timestampStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.error('Failed to export black box telemetry:', error);
    }
  };

  const downloadSnapshotCSV = (file: DirectoryNode, snapshot: any, presentHist: number[]) => {
    try {
      const headers = ["Time Offset", "Offset Seconds", "Baseline Stress (%)", "Present Stress (%)"];
      const rows = snapshot.history.map((baseVal: number, idx: number) => {
        const offsetSec = -44 + idx * 4;
        const timeOffset = `T-${Math.abs(offsetSec)}s`;
        const presVal = presentHist[idx] !== undefined ? presentHist[idx] : 0;
        return [
          timeOffset,
          offsetSec.toString(),
          baseVal.toString(),
          presVal.toString()
        ];
      });

      let csvContent = "";
      csvContent += `# Sovereign Forensic Diff Snapshot Export\n`;
      csvContent += `# Inspected Asset: ${file.path || file.name}\n`;
      csvContent += `# Exported At: ${new Date().toISOString()}\n`;
      csvContent += `# Baseline Reference Timestamp: ${snapshot.timestamp}\n`;
      csvContent += `# Present Reference: Real-Time Stream\n\n`;
      
      csvContent += headers.join(",") + "\n";
      rows.forEach((row: string[]) => {
        csvContent += row.join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${file.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_integrity_diff_${timestampStr}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addLog(`Exported forensic integrity trend snapshot to CSV: ${filename}`, 'success');
    } catch (err) {
      console.error(err);
      addLog(`Failed to export forensic CSV snapshot.`, 'error');
    }
  };

  // 1. Programmatic scanline randomized delay & duration adjustments
  useEffect(() => {
    const crt = document.getElementById('crt-overlay');
    if (!crt) return;

    const adjustScenario = () => {
      const randomDuration = (Math.random() * 5 + 6).toFixed(2); // 6s - 11s duration
      const randomDelay = (Math.random() * 4).toFixed(2); // 0s - 4s delay
      crt.style.setProperty('--scan-duration', `${randomDuration}s`);
      crt.style.setProperty('--scan-delay', `${randomDelay}s`);
    };

    adjustScenario();
    const interval = setInterval(adjustScenario, 9500); // randomize periodically
    return () => clearInterval(interval);
  }, []);

  // 2. Real-time UTC digital clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const h = String(d.getUTCHours()).padStart(2, '0');
      const m = String(d.getUTCMinutes()).padStart(2, '0');
      const s = String(d.getUTCSeconds()).padStart(2, '0');
      setTimeStr(`${h}:${m}:${s} UTC`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Helper to append logs to Black Box forensic logger
  const addLog = (message: string, type: 'info' | 'warning' | 'error' | 'success') => {
    const d = new Date();
    const ts = d.toISOString().slice(11, 19) + ' UTC';
    setForensicLogs(prev => [
      ...prev,
      { id: 'log-' + Math.floor(Math.random() * 10000), timestamp: ts, message, type }
    ]);
  };

  // 4. Resolve the current directory from the virtual filesystem
  const currentDirectory = useMemo(() => {
    if (currentPath === '/') return initialFilesystem;

    const parts = currentPath.split('/').filter(Boolean);
    let tempNode: DirectoryNode = initialFilesystem;

    for (const part of parts) {
      const child = tempNode.children?.find(c => c.name === part);
      if (child && child.type === 'directory') {
        tempNode = child;
      } else {
        // Fallback safely if path broken
        return initialFilesystem;
      }
    }
    return tempNode;
  }, [currentPath, filesystemUpdateTrigger]);

  // 5. Bookmarks triggers
  const handleAddBookmark = (name: string, path: string) => {
    const newBookmark: Bookmark = {
      id: 'b-' + Math.floor(Math.random() * 100000),
      name,
      path,
      createdAt: new Date().toISOString()
    };
    setBookmarks(prev => [...prev, newBookmark]);
    addLog(`Operator indexing action complete. Added [${name}] to quick-jump register.`, 'success');
  };

  const handleRemoveBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    addLog(`Bookmark registry record decommissioned.`, 'warning');
  };

  // 6. Navigation handler
  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (!lockedFilePath) {
      setSelectedFile(null); // Reset file inspection on dir change only if not locked
    }
  };

  const handleGoUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parentPath = '/' + parts.join('/');
    handleNavigate(parentPath);
    addLog(`Directory navigation backward. Scope: [${parentPath}]`, 'info');
  };

  // 7. Dynamic Trauma details for the right visualizer panel
  const activeInspectionNodeName = useMemo(() => {
    if (selectedFile) return selectedFile.name;
    if (hoveredNode) return hoveredNode.name;
    return currentDirectory.name;
  }, [selectedFile, hoveredNode, currentDirectory]);

  const activeInspectionTraumaLevel = useMemo(() => {
    if (selectedFile?.traumaRating !== undefined) return selectedFile.traumaRating;
    if (hoveredNode?.traumaRating !== undefined) return hoveredNode.traumaRating;
    
    // Average directory trauma from children
    if (currentDirectory.children && currentDirectory.children.length > 0) {
      const rates = currentDirectory.children
        .map(c => c.traumaRating ?? (c.type === 'directory' ? 15 : 0))
        .filter(r => r !== undefined) as number[];
      if (rates.length > 0) {
        return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
      }
    }
    return 10;
  }, [selectedFile, hoveredNode, currentDirectory, filesystemUpdateTrigger]);

  const activeInspectionAnomalies = useMemo(() => {
    if (selectedFile?.anomalies) return selectedFile.anomalies;
    if (hoveredNode?.anomalies) return hoveredNode.anomalies;
    return [];
  }, [selectedFile, hoveredNode]);

  // 8. Custom search query mapping (Registry scan/Crawl database)
  const filteredNodes = useMemo(() => {
    let nodes = currentDirectory.children || [];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      addLog(`Crawl Registry scanner engaged: search query [${searchQuery}]`, 'info');
      nodes = nodes.filter(node => 
        node.name.toLowerCase().includes(query) || (node.path.toLowerCase().includes(query))
      );
    }

    if (anomalySortOrder !== 'none') {
      nodes = [...nodes].sort((a, b) => {
        const countA = a.anomalies?.length || 0;
        const countB = b.anomalies?.length || 0;
        
        if (anomalySortOrder === 'desc') {
          return countB - countA;
        } else {
          return countA - countB;
        }
      });
    }

    return nodes;
  }, [currentDirectory, searchQuery, anomalySortOrder, filesystemUpdateTrigger]);

  // Helper to render text with query search matches highlighted
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return <>{text}</>;
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, idx) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={idx} className="bg-emerald-400/35 text-white font-extrabold rounded px-0.5 border border-emerald-400/25 shadow-[0_0_8px_rgba(52,211,153,0.35)]">
              {part}
            </mark>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
      </>
    );
  };

  // Get all unique files belonging to bookmarked paths currently
  const bookmarkedFiles = useMemo(() => {
    const list: DirectoryNode[] = [];
    bookmarks.forEach(b => {
      const files = getFilesUnderPath(b.path);
      files.forEach(f => {
        if (!list.some(bf => bf.path === f.path)) {
          list.push(f);
        }
      });
    });
    return list;
  }, [bookmarks, filesystemUpdateTrigger]);

  // Helper to automatically style and color-highlight common cyber-forensic keywords in the log stream
  const highlightForensicKeywords = (message: string) => {
    const list = [
      'bypass', 'bypassed', 'bypass-override',
      'mismatch', 'mismatched', 'mismatches',
      'compromised', 'compromise', 'compromising',
      'integrity', 'integrity-breached'
    ];
    const regex = new RegExp(`\\b(${list.join('|')})\\b`, 'gi');
    const parts = message.split(regex);

    return (
      <>
        {parts.map((part, idx) => {
          const lower = part.toLowerCase();
          if (list.includes(lower)) {
            let badgeClass = 'font-semibold px-0.5 py-0.25 rounded border text-[10px] select-all ';
            if (lower.startsWith('compromise')) {
              badgeClass += 'bg-red-500/15 border-red-500/30 text-red-400';
            } else if (lower.startsWith('integrity')) {
              badgeClass += 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400';
            } else if (lower.startsWith('bypass')) {
              badgeClass += 'bg-amber-500/15 border-amber-500/30 text-amber-400';
            } else if (lower.startsWith('mismat')) {
              badgeClass += 'bg-orange-500/15 border-orange-500/30 text-orange-400';
            } else {
              badgeClass += 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
            }
            return (
              <span key={idx} className={badgeClass}>
                {part}
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </>
    );
  };

  const toggleFileLock = (node: DirectoryNode) => {
    if (lockedFilePath === node.path) {
      setLockedFilePath(null);
      addLog(`Security Lock disengaged: Forensic asset [${node.name}] unpinned.`, 'warning');
    } else {
      setSelectedFile(node);
      setLockedFilePath(node.path);
      addLog(`Security Lock engaged: Pinning forensic asset [${node.name}] for persistent telemetry.`, 'success');
    }
  };

  // Handle single clicking nodes
  const handleSelectNode = (node: DirectoryNode) => {
    if (node.type === 'directory') {
      handleNavigate(node.path);
      addLog(`Directory navigation forward. Entering sector: [${node.path}]`, 'info');
    } else {
      if (lockedFilePath && lockedFilePath !== node.path) {
        addLog(`System pipeline is LOCKED to [${selectedFile?.name}]. Unlock current asset first to switch.`, 'warning');
        return;
      }
      setSelectedFile(node);
      addLog(`Holographic link set: Inspecting forensic asset [${node.name}]`, 'info');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black text-white p-4 font-sans select-none overflow-hidden relative border border-emerald-500/10 rounded-lg shadow-2xl h-full m-1">
      {/* Decorative Diamond Group Grid Accents (Inspired by Well-Tegra Branding) */}
      <div className="absolute bottom-2 right-2 pointer-events-none opacity-10 select-none z-0">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <path d="M 60 12 L 72 30 L 60 48 L 48 30 Z" fill="#22d3ee" />
          <path d="M 96 48 L 108 66 L 96 84 L 84 66 Z" fill="#10b981" />
          <path d="M 78 30 L 86 42 L 78 54 L 70 42 Z" fill="#38bdf8" />
          <path d="M 108 24 L 115 34 L 108 44 L 101 34 Z" fill="#22d3ee" />
          <path d="M 96 84 L 108 102 L 96 120 L 84 102 Z" fill="#10b981" opacity="0.6" />
          <path d="M 78 72 L 86 84 L 78 96 L 70 84 Z" fill="#38bdf8" opacity="0.4" />
          <circle cx="60" cy="30" r="1" fill="#ffffff" />
          <circle cx="96" cy="66" r="1.5" fill="#ffffff" />
          <circle cx="78" cy="42" r="1.2" fill="#ffffff" />
        </svg>
      </div>

      {/* Subtle high-tech Well-Tegra background watermark */}
      <div className="absolute bottom-6 right-6 pointer-events-none opacity-[0.05] select-none z-0">
        <WellTegraLogo size={140} variant="default" showText={true} />
      </div>

      {/* 1. Header Banner */}
      <header className="flex flex-col md:flex-row items-center justify-between border border-emerald-500/25 bg-emerald-500/5 rounded p-3 select-text flex-shrink-0 mb-3 scanline-glow relative overflow-hidden">
        {/* Ambient Top Circuit Traces Background (Inspired by Well-Tegra Branding) */}
        <div className="absolute inset-x-0 top-0 h-full overflow-hidden pointer-events-none opacity-20 select-none">
          <svg className="w-full h-full" viewBox="0 0 1000 70" preserveAspectRatio="none">
            {/* Top circuit paths */}
            <path d="M 0 5 H 150 L 170 25 H 350 L 370 5 H 600 L 615 20 H 800 L 820 5 L 1000 5" fill="none" stroke="#10b981" strokeWidth="1.2" />
            <path d="M 120 5 L 135 20 H 260 L 275 5" fill="none" stroke="#22d3ee" strokeWidth="0.8" />
            <path d="M 450 5 L 460 15 H 520 L 530 5" fill="none" stroke="#10b981" strokeWidth="0.8" />
            <path d="M 700 5 L 710 15 L 730 15 L 740 5" fill="none" stroke="#22d3ee" strokeWidth="1" />
            
            {/* Round circuit node terminals */}
            <circle cx="150" cy="5" r="3.5" fill="none" stroke="#10b981" strokeWidth="1.2" />
            <circle cx="170" cy="25" r="2.5" fill="#10b981" />
            <circle cx="350" cy="25" r="2.5" fill="#22d3ee" />
            <circle cx="370" cy="5" r="3.5" fill="none" stroke="#22d3ee" strokeWidth="1.2" />
            <circle cx="615" cy="20" r="2.5" fill="#10b981" />
            <circle cx="800" cy="20" r="2.5" fill="#22d3ee" />
            <circle cx="820" cy="5" r="3.5" fill="none" stroke="#22d3ee" strokeWidth="1.2" />
          </svg>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex-shrink-0 bg-slate-950/40 p-1 rounded-md border border-emerald-500/10">
            <WellTegraLogo size={42} variant="default" showText={false} />
          </div>
          <div>
            <h1 className="font-mono text-emerald-400 font-bold text-base md:text-lg lg:text-xl tracking-wider glow-text-emerald flex items-center gap-2">
              WELL-TEGRA SOVEREIGN TERMINAL v4.2
            </h1>
            <p className="text-[10px] text-emerald-500/70 font-mono tracking-tight uppercase">
              COGNITIVE FORENSICS & TRAUMA METRIC REGISTRY • SECURE DIAL SECTOR
            </p>
          </div>
        </div>

        {/* Dynamic clocks & HUD alerts */}
        <div className="flex items-center gap-6 mt-3 md:mt-0 font-mono">
          <div className="flex items-center gap-1.5 border border-emerald-500/20 px-2.5 py-1 rounded bg-black/60">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-white text-xs font-bold glow-text-emerald tabular-nums">
              {timeStr || '00:00:00 UTC'}
            </span>
          </div>

          {activeAlert ? (
            <button
              type="button"
              onClick={() => {
                setActiveAlert(false);
                addLog('Operator manual override: active telemetry hazard alert silenced.', 'info');
              }}
              className="flex items-center gap-1.5 border border-red-500 bg-red-950/80 px-2.5 py-1 rounded text-[10px] font-bold text-red-400 animate-pulse cursor-pointer hover:bg-red-900/60 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              title="CRITICAL LOG_ERROR DETECTED. Click to acknowledge & silence strobe."
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-[bounce_1s_infinite]" />
              <span className="tracking-wider">ALERT: LOG_ERROR [CLICK ACK]</span>
            </button>
          ) : (
            <div className="hidden border border-emerald-500/20 px-2 py-1 rounded bg-black/60 sm:flex items-center gap-1 text-[10px] text-emerald-400">
              <Activity className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
              <span>K_NOMINAL_ON</span>
            </div>
          )}
        </div>
      </header>

      {/* 2. Primary Split Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden mb-3">
        {/* Left Side: System managers & Upload Ingestion (Col span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Quick bookmarks */}
          <BookmarkManager
            currentPath={currentPath}
            bookmarks={bookmarks}
            onAddBookmark={handleAddBookmark}
            onRemoveBookmark={handleRemoveBookmark}
            onNavigate={handleNavigate}
            addLog={addLog}
          />

          {/* Ingest Integrity Monitor */}
          <div className="bg-[#020617]/90 border border-cyan-500/20 rounded-md p-4 flex flex-col gap-3 scanline-glow relative select-text" id="node-integrity-monitor">
            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
              <h3 className="font-mono text-cyan-400 text-xs font-bold flex items-center gap-1.5 glow-text-cyan">
                <Shield className="w-4 h-4 text-cyan-400 animate-pulse" />
                INGEST INTEGRITY MONITOR
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = !monitorEnabled;
                    setMonitorEnabled(next);
                    addLog(`Ingest Integrity Monitor ${next ? 'ENGAGED' : 'STANDBY'}`, next ? 'success' : 'warning');
                  }}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold leading-none select-none transition-all cursor-pointer ${
                    monitorEnabled 
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                  }`}
                >
                  {monitorEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="font-mono text-[10px] leading-relaxed text-zinc-400 flex flex-col gap-2">
              <p className="text-zinc-500 text-[9.5px]">
                Auditing delta-deviations over a rolling 5-minute telemetry window. Anomalies trigger deep-blue log traces automatically.
              </p>
              
              <div className="bg-black/40 border border-cyan-500/10 rounded p-2 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[9px] text-cyan-400/80 border-b border-cyan-500/5 pb-1">
                  <span>INDEXED REGISTRIES:</span>
                  <span className="text-white font-bold">{bookmarks.length} MATCHES</span>
                </div>
                <div className="flex justify-between items-center text-[9px] text-cyan-400/80">
                  <span>TELEMETRY STATE:</span>
                  <span className={`${monitorEnabled ? 'text-cyan-400 animate-pulse font-bold' : 'text-zinc-500 font-semibold'}`}>
                    {monitorEnabled ? 'POLLING [8s]' : 'SUSPENDED'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 mt-1 border-t border-cyan-500/10 pt-2">
                  <span className="text-[8px] text-cyan-500/50 uppercase tracking-wider font-extrabold font-mono mb-1">MONITORED ASSETS DELTA:</span>
                  {bookmarkedFiles.length === 0 ? (
                    <span className="text-[8px] text-zinc-500 italic">[No indexed files under bookmarks]</span>
                  ) : (
                    bookmarkedFiles.slice(0, 3).map(file => {
                      const history = traumaHistory[file.path] || [];
                      const baseline = history.length > 0 ? history[0].rating : (file.traumaRating ?? 0);
                      const current = file.traumaRating ?? 0;
                      const delta = current - baseline;
                      const deltaStr = delta > 0 ? `+${delta}%` : `${delta}%`;
                      return (
                        <div key={file.path} className="flex justify-between items-center text-[8.5px] border-b border-zinc-950 pb-0.5 last:border-0">
                          <span className="truncate max-w-[110px] text-zinc-405" title={file.path}>{file.name}</span>
                          <span className={`font-mono font-bold ${delta >= 10 ? "text-cyan-400 glow-text-cyan text-[9px]" : "text-zinc-500"}`}>
                            {current}% <span className="text-[8px] font-normal text-zinc-600">({deltaStr})</span>
                          </span>
                        </div>
                      );
                    })
                  )}
                  {bookmarkedFiles.length > 3 && (
                    <span className="text-[7.5px] text-zinc-500/60 text-right mt-0.5">
                      + {bookmarkedFiles.length - 3} more assets polling
                    </span>
                  )}
                </div>
              </div>

              {/* Manual Stress Injector */}
              <button
                type="button"
                onClick={() => {
                  const bookmarkedFiles: DirectoryNode[] = [];
                  bookmarks.forEach(b => {
                    const files = getFilesUnderPath(b.path);
                    files.forEach(f => {
                      if (!bookmarkedFiles.some(bf => bf.path === f.path)) {
                        bookmarkedFiles.push(f);
                      }
                    });
                  });

                  if (bookmarkedFiles.length === 0) {
                    addLog(`Simulation failure: index any file/folder in Registry to run stress delta validations.`, 'warning');
                    return;
                  }

                  // Pick a random bookmarked file
                  const file = bookmarkedFiles[Math.floor(Math.random() * bookmarkedFiles.length)];
                  const oldTr = file.traumaRating ?? 0;
                  const delta = Math.floor(Math.random() * 6) + 12; // 12% to 17% increase
                  const newTr = Math.min(100, oldTr + delta);

                  addLog(`Command: exogenously spike trauma rating of [${file.path}] by +${delta}% (Was ${oldTr}%, Now ${newTr}%)`, 'warning');
                  updateNodeTraumaRating(file.path, newTr);
                }}
                disabled={!monitorEnabled}
                className="w-full bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/25 hover:border-cyan-400/50 disabled:opacity-40 text-cyan-400 hover:text-cyan-300 disabled:hover:text-cyan-400 transition-all font-mono text-[9px] tracking-wider py-1.5 rounded cursor-pointer font-black uppercase text-center mt-1"
              >
                💥 PUMP EXOGENOUS STRESS TRAUMA
              </button>
            </div>
          </div>

          {/* Ingestion artifact uploader */}
          <ArtifactIngestion
            onArtifactIngested={(art) => {
              setIngestedArtifacts(prev => [art, ...prev]);
            }}
            addLog={addLog}
          />

          {/* Ingested list panel */}
          <div className="bg-[#020617]/90 border border-emerald-500/20 rounded-md p-4 flex flex-col gap-2 flex-grow min-h-[160px] max-h-[220px] overflow-hidden">
            <span className="font-mono text-xs font-bold text-emerald-400 border-b border-emerald-500/10 pb-1 flex-shrink-0">
              AUDITED RECORDS ({ingestedArtifacts.length})
            </span>
            <div className="flex flex-col gap-1.5 overflow-y-auto flex-grow max-h-[160px] pr-1">
              {ingestedArtifacts.length === 0 ? (
                <div className="font-mono text-[10px] text-emerald-500/30 italic text-center py-6 select-all">
                  No forensic artifacts audited. Drop files to ingest details.
                </div>
              ) : (
                ingestedArtifacts.map((art) => (
                  <div 
                    key={art.id} 
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredArtifact(art);
                      setArtifactTooltipCoords({
                        x: rect.right,
                        y: rect.top
                      });
                    }}
                    onMouseLeave={() => {
                      setHoveredArtifact(null);
                      setArtifactTooltipCoords(null);
                    }}
                    className={`p-2 rounded border transition-all duration-200 bg-black/45 hover:bg-emerald-500/5 cursor-help flex items-center justify-between select-text gap-2 ${
                      art.status === 'corrupted' 
                        ? 'border-red-500/35 bg-red-950/15 hover:border-red-500/50 hover:bg-red-950/25 shadow-[inset_0_0_8px_rgba(239,68,68,0.05)]' 
                        : 'border-emerald-500/15 hover:border-emerald-500/35 shadow-[inset_0_0_8px_rgba(16,185,129,0.02)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Live flashing or solid status indicator */}
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 relative ${
                        art.status === 'corrupted' 
                          ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse' 
                          : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      }`}>
                        {art.status === 'corrupted' && (
                          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                        )}
                      </span>
                      <span className="font-mono text-[11px] text-white font-semibold truncate">
                        {art.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[9px] font-mono text-emerald-500/40">{art.size}</span>
                      {art.status === 'corrupted' ? (
                        <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 animate-bounce" />
                      ) : (
                        <Check className="w-3 h-3 text-emerald-500/60 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center Panel: Interactive Directory Hub (Col span 5) */}
        <div className="lg:col-span-5 bg-[#020617]/90 border border-emerald-500/20 rounded-md p-4 flex flex-col overflow-hidden justify-between scanline-glow" id="node-explorer">
          <div className="flex flex-col overflow-hidden flex-1">
            {/* Node Explorer Header and Sorting Controller */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-500/15 pb-2 mb-3 gap-2 flex-shrink-0 font-mono" id="node-explorer-header">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase text-white tracking-widest glow-text-emerald">
                  Node Explorer Register
                </span>
              </div>
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <span className="text-[9px] text-emerald-500/50 uppercase font-black select-none">Order:</span>
                <select
                  id="anomaly-sort-select"
                  value={anomalySortOrder}
                  onChange={(e) => {
                    const nextOrder = e.target.value as 'none' | 'desc' | 'asc';
                    setAnomalySortOrder(nextOrder);
                    addLog(`Node Explorer sort matrix modified: [AnomaliesCount: ${nextOrder.toUpperCase()}]`, 'info');
                  }}
                  className="bg-black/95 border border-emerald-500/25 hover:border-emerald-400/50 text-emerald-400 text-[10.5px] rounded px-1.5 py-0.5 outline-none font-mono cursor-pointer transition-all focus:border-emerald-400/60 font-bold"
                >
                  <option value="none">NATURAL INDEX</option>
                  <option value="desc">ANOMALIES (HIGH &rarr; LOW)</option>
                  <option value="asc">ANOMALIES (LOW &rarr; HIGH)</option>
                </select>
              </div>
            </div>

            {/* Batch Action Menu Component: Displays only when one or more items are selected */}
            <AnimatePresence initial={false}>
              {batchSelectedPaths.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: -20, marginBottom: 0 }}
                  animate={{ height: "auto", opacity: 1, y: 0, marginBottom: 12 }}
                  exit={{ height: 0, opacity: 0, y: -20, marginBottom: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 20 }}
                  className="bg-emerald-950/25 border border-emerald-500/40 rounded p-2.5 flex flex-col gap-2.5 font-mono text-[10px] shadow-[0_0_15px_rgba(16,185,129,0.18)] flex-shrink-0 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
                      <span className="text-cyan-400 font-extrabold uppercase tracking-wider">
                        BATCH OPERATION ACTIVE:
                      </span>
                      <div className="relative inline-flex items-center bg-cyan-950/60 border border-cyan-500/35 px-2 py-0.5 rounded overflow-hidden h-5 min-w-[72px] justify-center">
                        <AnimatePresence mode="popLayout">
                          <motion.span
                            key={batchSelectedPaths.length}
                            initial={{ y: 14, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -14, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 450, damping: 22 }}
                            className="text-white font-mono font-black text-[10px]"
                          >
                            {batchSelectedPaths.length}
                          </motion.span>
                        </AnimatePresence>
                        <span className="text-cyan-300 font-bold ml-1 text-[8.5px] uppercase tracking-wide">Selected</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setQuarantinedFiles(prev => {
                            const updated = { ...prev };
                            batchSelectedPaths.forEach(path => {
                              updated[path] = true;
                            });
                            return updated;
                          });
                          addLog(`Bulk quarantine ENGAGED for ${batchSelectedPaths.length} selected assets.`, 'warning');
                        }}
                        className="px-2 py-1 rounded border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 text-amber-400 hover:text-amber-300 transition-all cursor-pointer font-bold uppercase leading-none text-[9px]"
                        title="Quarantine all selected nodes"
                        id="batch-quarantine-btn"
                      >
                        🔒 Quarantine
                      </button>
  
                      <button
                        type="button"
                        onClick={() => {
                          setQuarantinedFiles(prev => {
                            const updated = { ...prev };
                            batchSelectedPaths.forEach(path => {
                              updated[path] = false;
                            });
                            return updated;
                          });
                          addLog(`Bulk quarantine STANDBY/DISENGAGED for ${batchSelectedPaths.length} selected assets.`, 'info');
                        }}
                        className="px-2 py-1 rounded border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer font-bold uppercase leading-none text-[9px]"
                        title="Remove selected nodes from quarantine"
                        id="batch-unquarantine-btn"
                      >
                        🔓 Unquarantine
                      </button>
  
                      <button
                        type="button"
                        disabled={batchRebuildingPaths.length > 0}
                        onClick={() => {
                          setBatchRebuildingPaths([...batchSelectedPaths]);
                          addLog(`Initiating bulk integrity sanitization for ${batchSelectedPaths.length} selected assets...`, 'info');
                          setTimeout(() => {
                            setBatchRebuildingPaths([]);
                            addLog(`Bulk integrity checksums successfully REBUILT for ${batchSelectedPaths.length} assets. Checksums verified.`, 'success');
                            setBatchSelectedPaths([]);
                          }, 2500);
                        }}
                        className={`px-2 py-1 rounded border font-bold uppercase leading-none text-[9px] transition-all cursor-pointer ${
                          batchRebuildingPaths.length > 0
                            ? 'bg-cyan-950/20 text-cyan-400 border-cyan-500/40 animate-pulse'
                            : 'border-cyan-500/35 bg-cyan-950/25 hover:bg-cyan-950/50 text-cyan-300 hover:text-white'
                        }`}
                        title="Rebuild integrity checksums for all selected nodes"
                        id="batch-rebuild-btn"
                      >
                        {batchRebuildingPaths.length > 0 ? "⚡ Rebuilding..." : "🛡️ Bulk Rebuild"}
                      </button>
  
                      <button
                        type="button"
                        onClick={() => {
                          setBatchSelectedPaths([]);
                          addLog(`Batch operations cancelled. Selections cleared.`, 'info');
                        }}
                        className="px-2 py-1 rounded border border-red-500/20 bg-transparent text-red-400/70 hover:text-red-450 hover:bg-red-950/20 transition-all cursor-pointer text-[9px]"
                        id="batch-cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Dynamic selection queue list visualization */}
                  <div className="border-t border-emerald-500/10 pt-2 flex flex-col gap-1.5">
                    <span className="text-[8px] uppercase tracking-widest text-emerald-500/50 font-bold">Selected Asset Tracking Registry Log:</span>
                    <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                      <AnimatePresence>
                        {batchSelectedPaths.map(path => {
                          const name = path.split('/').pop() || path;
                          return (
                            <motion.div
                              key={path}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center gap-1.5 bg-black/60 border border-emerald-500/20 rounded px-2 py-0.5 text-[8.5px] text-emerald-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]"
                              title={path}
                            >
                              <span className="truncate max-w-[130px] font-mono select-all font-semibold">{name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setBatchSelectedPaths(prev => prev.filter(p => p !== path));
                                  addLog(`Forensic record deselected from queue: [${name}]`, 'info');
                                }}
                                className="text-red-400/50 hover:text-red-400 ml-1 transition-colors cursor-pointer select-none font-sans font-bold text-[10px]"
                                title="Remove from select register"
                              >
                                &times;
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Folder breadcrumbs */}
            <div className="flex items-center gap-1 bg-black/60 border border-emerald-500/10 rounded px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider flex-shrink-0 mb-3 text-emerald-400 select-text">
              <Terminal className="w-3.5 h-3.5 text-emerald-500/70" />
              <span className="cursor-pointer hover:text-white" onClick={() => handleNavigate('/')}>ROOT</span>
              {currentPath !== '/' && currentPath.split('/').filter(Boolean).map((part, idx, arr) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="w-3 h-3 text-emerald-500/40" />
                  <span 
                    className="cursor-pointer hover:text-white"
                    onClick={() => {
                      const rebuildPath = '/' + arr.slice(0, idx + 1).join('/');
                      handleNavigate(rebuildPath);
                    }}
                  >
                    {part}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Folder controls & Registry filter input */}
            <div className="flex items-center gap-2 mb-3 flex-shrink-0 font-mono">
              {currentPath !== '/' && (
                <button
                  type="button"
                  onClick={handleGoUp}
                  className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 duration-200 px-3 py-1 rounded text-xs text-white"
                  title="Up to parent context"
                >
                  ../
                </button>
              )}
              {/* Crawl Registry input bar */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-emerald-500/50 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Scan registry indexes (Crawl Graph)..."
                  className="w-full bg-black/80 border border-emerald-500/20 rounded pl-8 pr-2.5 py-1 text-xs text-white placeholder-emerald-500/30 focus:outline-none focus:border-emerald-500/40 font-mono"
                />
              </div>
            </div>

            {/* File lists browser */}
            <div className="flex-grow overflow-y-auto border border-emerald-500/10 bg-black/50 rounded flex flex-col divide-y divide-emerald-500/10 max-h-[360px] lg:max-h-none">
              {filteredNodes.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border-b border-emerald-500/10 text-[9px] font-mono text-emerald-400/80 font-bold select-none uppercase tracking-wider flex-shrink-0">
                  <input 
                    type="checkbox"
                    id="master-select-nodes"
                    checked={filteredNodes.length > 0 && filteredNodes.every(node => batchSelectedPaths.includes(node.path))}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        const allVisiblePaths = filteredNodes.map(n => n.path);
                        setBatchSelectedPaths(prev => {
                          const next = [...prev];
                          allVisiblePaths.forEach(p => {
                            if (!next.includes(p)) next.push(p);
                          });
                          return next;
                        });
                        addLog(`Selected all ${allVisiblePaths.length} visible sector assets.`, 'info');
                      } else {
                        const allVisiblePaths = filteredNodes.map(n => n.path);
                        setBatchSelectedPaths(prev => prev.filter(p => !allVisiblePaths.includes(p)));
                        addLog(`Deselected all visible sector assets.`, 'info');
                      }
                    }}
                    className="w-3.5 h-3.5 border-emerald-500/30 text-emerald-500 bg-black/45 rounded focus:ring-emerald-500/40 transition-all cursor-pointer accent-emerald-500"
                  />
                  <label htmlFor="master-select-nodes" className="cursor-pointer hover:text-emerald-300 transition-colors flex items-center gap-1">
                    Select All Sector Nodes ({filteredNodes.length} visible)
                  </label>
                </div>
              )}
              {filteredNodes.length === 0 ? (
                <div className="font-mono text-[11px] text-emerald-500/40 py-12 text-center select-all leading-relaxed">
                  [Zero items indexed matching query]<br/>
                  Sector reference logically unaligned.
                </div>
              ) : (
                filteredNodes.map((node) => {
                  const isFile = node.type === 'file';
                  const isCompromised = node.traumaRating && node.traumaRating > 70;
                  const isCurrentSelected = selectedFile?.path === node.path;
                  const isSearchMatch = searchQuery.trim() !== '' && (
                    node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    node.path.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  
                  return (
                    <div
                      key={node.path}
                      onClick={() => handleSelectNode(node)}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className={`flex flex-col md:flex-row md:items-center justify-between p-2.5 cursor-pointer transition-all duration-200 hover:bg-emerald-500/5 select-text group ${
                        isCurrentSelected 
                          ? 'bg-emerald-500/10' 
                          : isSearchMatch 
                            ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500/80 shadow-[inset_4px_0_12px_rgba(16,185,129,0.06)]' 
                            : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input 
                          type="checkbox"
                          checked={batchSelectedPaths.includes(node.path)}
                          onChange={(e) => {
                            e.stopPropagation();
                            const isChecked = e.target.checked;
                            setBatchSelectedPaths(prev => 
                              isChecked 
                                ? [...prev, node.path]
                                : prev.filter(p => p !== node.path)
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-3.5 h-3.5 border-emerald-500/30 text-emerald-500 bg-black/45 rounded focus:ring-emerald-500/40 transition-all cursor-pointer accent-emerald-500 flex-shrink-0"
                          title="Select for batch operations"
                          id={`select-node-${node.name}`}
                        />
                        {isFile ? (
                          <FileText className={`w-4 h-4 flex-shrink-0 ${isCompromised ? 'text-red-400' : 'text-emerald-500/60 group-hover:text-emerald-400'}`} />
                        ) : (
                          <Folder className="w-4 h-4 flex-shrink-0 text-amber-500/70 group-hover:text-amber-400" />
                        )}
                        <div className="flex flex-col min-w-0 leading-tight">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-mono text-[12px] font-medium truncate glow-text-emerald ${
                              isCompromised ? 'text-red-400 font-bold' : 'text-white'
                            }`}>
                              {renderHighlightedText(node.name, searchQuery)}
                            </span>
                            {lockedFilePath === node.path && (
                              <span className="bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 px-1 py-0.5 rounded text-[7px] font-mono font-black uppercase tracking-widest animate-pulse flex items-center gap-0.5 select-none leading-none">
                                <Lock className="w-2 h-2 text-cyan-400" />
                                PINNED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-mono text-emerald-500/40">{node.lastModified}</span>
                            {isFile && node.anomalies && node.anomalies.length > 0 && (
                              <span className="bg-red-950/40 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider animate-pulse uppercase flex items-center gap-1 shadow-[0_0_8px_rgba(239,68,68,0.15)] select-none">
                                <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                                CRITICAL ({node.anomalies.length})
                              </span>
                            )}
                            {isSearchMatch && (
                              <span className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/25 px-1 rounded text-[8px] font-mono font-bold tracking-wider animate-pulse uppercase">
                                MATCH
                              </span>
                            )}
                            {quarantinedFiles[node.path] && (
                              <span className="bg-amber-950/60 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase flex items-center gap-0.5 select-none leading-none h-4">
                                🔒 QUARANTINED
                              </span>
                            )}
                            {(rebuildingFile === node.path || batchRebuildingPaths.includes(node.path)) && (
                              <span className="bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 px-1.5 py-0.5 rounded text-[8px] font-mono font-black tracking-widest animate-pulse uppercase flex items-center gap-0.5 select-none leading-none h-4">
                                ⚡ REBUILDING
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Display Stress indicator levels on files */}
                      {isFile ? (
                        <div className="flex items-center gap-3 mt-1.5 md:mt-0">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end whitespace-nowrap">
                              <span className="text-[9px] font-mono text-emerald-500/50 uppercase">distress index</span>
                              <span className={`font-mono text-[10px] font-semibold ${isCompromised ? 'text-red-400' : 'text-emerald-400'}`}>
                                {node.traumaRating}% STRESS
                              </span>
                            </div>
                            {/* Mini meter representation */}
                            <div className="w-12 h-1.5 bg-black/60 rounded border border-emerald-500/10 overflow-hidden flex-shrink-0">
                              <div 
                                className={`h-full ${isCompromised ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${node.traumaRating}%` }}
                              />
                            </div>
                          </div>

                          {/* Lock / Pin toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFileLock(node);
                            }}
                            className={`p-1.5 rounded border transition-all cursor-pointer flex items-center justify-center ${
                              lockedFilePath === node.path
                                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                                : 'bg-transparent text-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/20'
                            }`}
                            title={lockedFilePath === node.path ? "Unlock asset" : "Click to lock and pin active inspection"}
                            id={`lock-toggle-${node.name}`}
                          >
                            {lockedFilePath === node.path ? (
                              <Lock className="w-3.5 h-3.5 animate-pulse" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-500/30 uppercase mt-1.5 md:mt-0">
                          [DIRECTORY DIRECT]
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* File Info Panel */}
            <div className={`mt-3 border rounded p-3 font-mono text-[11px] relative flex shadow-lg flex-shrink-0 transition-all duration-300 ${
              selectedFile 
                ? selectedFile.traumaRating && selectedFile.traumaRating > 70
                  ? 'border-red-500/30 bg-red-950/10 shadow-red-950/10 animate-[pulse_3s_infinite]'
                  : 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-emerald-500/5 bg-transparent opacity-60'
            }`}>
              {selectedFile ? (
                <div className="w-full flex flex-col gap-1.5">
                  <div className="flex items-center justify-between border-b border-emerald-500/10 pb-1.5">
                    <span className={`font-bold flex items-center gap-1.5 uppercase ${
                      selectedFile.traumaRating && selectedFile.traumaRating > 70 ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      <Info className="w-3.5 h-3.5 animate-pulse" />
                      Sector Asset Specs: {selectedFile.name}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Active Panel Pin Lock Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleFileLock(selectedFile)}
                        className={`p-0.5 rounded transition-all cursor-pointer flex items-center justify-center ${
                          lockedFilePath === selectedFile.path
                            ? 'text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                            : 'text-emerald-500/50 hover:text-emerald-300'
                        }`}
                        title={lockedFilePath === selectedFile.path ? "Unlock current file" : "Pin/Lock current file for persistent inspection"}
                        id="active-inspect-lock"
                      >
                        {lockedFilePath === selectedFile.path ? (
                          <Lock className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsFullScreenExplorer(true);
                          addLog(`Expanding high-definition diagnostics stream for: ${selectedFile.name}`, 'info');
                        }}
                        className="text-emerald-500/50 hover:text-emerald-300 transition-colors p-0.5 cursor-pointer flex items-center justify-center"
                        title="Display full screen forensic metadata overview"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (lockedFilePath === selectedFile.path) {
                            setLockedFilePath(null);
                          }
                          setSelectedFile(null);
                          setIsFullScreenExplorer(false);
                          addLog('Inspecting forensic asset link disconnected.', 'warning');
                        }}
                        className="text-emerald-500/50 hover:text-red-400 transition-colors p-0.5 cursor-pointer flex items-center justify-center"
                        title="Decommission selection stream"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-emerald-500/80">
                    <div className="md:col-span-2 flex items-center justify-between gap-2 border-b border-emerald-500/5 pb-1 block">
                      <span className="text-emerald-500/40 text-[9px] uppercase tracking-wider font-semibold">Decrypted Path:</span>
                      <div className="flex items-center gap-1.5 min-w-0 max-w-[80%]">
                        <span className="text-white truncate select-all font-semibold font-mono text-[10px] tracking-tight">{selectedFile.path}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedFile.path);
                            addLog(`Forensic path registry cloned to clipboard: [${selectedFile.path}]`, 'success');
                          }}
                          className="text-emerald-500/60 hover:text-emerald-300 p-0.5 rounded hover:bg-emerald-500/10 transition-all flex-shrink-0 cursor-pointer"
                          title="Copy decrypted path"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-500/40 text-[9px] uppercase tracking-wider">Storage Scope:</span>
                      <span className="text-white font-medium">{selectedFile.size || 'DYN_ALLOCATED'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-500/40 text-[9px] uppercase tracking-wider">Chronos Stamp:</span>
                      <span className="text-white font-medium">{selectedFile.lastModified}</span>
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between mt-1 pt-1 border-t border-emerald-500/5">
                      <span className="text-emerald-500/40 text-[9px] uppercase tracking-wider">Distress Index:</span>
                      <span className={`font-semibold ${selectedFile.traumaRating && selectedFile.traumaRating > 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {selectedFile.traumaRating}% STRESS
                      </span>
                    </div>

                    {selectedFile.anomalies && selectedFile.anomalies.length > 0 && (
                      <div className="md:col-span-2 flex flex-col gap-1 mt-1 border-t border-emerald-500/5 pt-1.5">
                        <span className="text-red-400/80 text-[9px] uppercase tracking-wider font-semibold">Flagged Anomalies ({selectedFile.anomalies.length}):</span>
                        <div className="flex flex-wrap gap-1 max-h-[48px] overflow-y-auto">
                          {selectedFile.anomalies.map((anom, idx) => (
                            <span key={idx} className="bg-red-500/10 text-red-400 text-[8.5px] px-1.5 py-0.5 rounded border border-red-500/20 truncate max-w-full">
                              • {anom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center justify-center py-5 text-center text-emerald-500/20 select-none">
                  <Info className="w-5 h-5 mb-1.5 text-emerald-500/15" />
                  <span className="text-[10px] tracking-wider uppercase font-medium">Select an asset from the crawl registry to fetch metadata</span>
                </div>
              )}
            </div>
          </div>

          <div className="font-mono text-[10px] text-emerald-500/40 border-t border-emerald-500/10 pt-2.5 mt-2.5 flex items-center justify-between flex-shrink-0">
            <span>FILESYSTEM INTEGRITY STATUS</span>
            <span className="text-emerald-400 font-semibold">[NOMINALLY BALANCED]</span>
          </div>
        </div>

        {/* Right Panel: Holographic 3D visualization analyzer (Col span 4) */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
          <TraumaNodeVisualizer
            currentNodeName={activeInspectionNodeName}
            traumaLevel={activeInspectionTraumaLevel}
            anomalies={activeInspectionAnomalies}
          />
        </div>
      </div>

      {/* 3. Bottom Black Box Forensic Logger */}
      <footer className="h-44 border border-emerald-500/20 bg-[#020617]/95 rounded p-3 bg-black/80 flex flex-col overflow-hidden scanline-glow flex-shrink-0 select-text relative z-10">
        <div className="flex items-center justify-between border-b border-emerald-500/15 pb-1.5 flex-shrink-0 mb-1.5 gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-emerald-400 glow-text-emerald flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              BLACK BOX HISTORIC LOG ENGINE
            </span>
            
            {/* Real-time Stacked Bar Chart with exact severity breakdown */}
            <div className="hidden lg:flex items-center gap-2 px-2 py-0.5 border border-emerald-500/20 bg-[#020617]/70 rounded-md font-mono text-[9px] h-[32px] shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]">
              <div className="flex flex-col justify-between text-[7px] text-emerald-500/40 h-full font-bold leading-none select-none select-all-none">
                <span>{maxVolume}</span>
                <span>0</span>
              </div>
              
              <div className="flex items-end h-[24px] gap-[2px]">
                {logVolumeHistory.map((h, idx) => {
                  const total = h.info + h.success + h.warning + h.error;
                  // Normalise exact bar height based on peak history volume
                  const barHeight = total > 0 ? (total / maxVolume) * 24 : 0;
                  
                  // Proportional segment heights in pixels
                  const errorHeight = total > 0 ? (h.error / total) * barHeight : 0;
                  const warningHeight = total > 0 ? (h.warning / total) * barHeight : 0;
                  const successHeight = total > 0 ? (h.success / total) * barHeight : 0;
                  const infoHeight = total > 0 ? (h.info / total) * barHeight : 0;

                  return (
                    <div 
                      key={idx} 
                      className="w-[8px] h-[24px] bg-emerald-500/[0.01] flex flex-col justify-end gap-0 rounded-sm overflow-hidden relative group/sparkline cursor-crosshair hover:bg-emerald-500/5 transition-all border border-transparent hover:border-emerald-500/20"
                    >
                      {/* Interactive Hover Tooltip with exact counts */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/sparkline:block bg-[#020e24] border border-emerald-500/45 p-2 rounded text-[8.5px] leading-normal text-white z-50 whitespace-nowrap shadow-[0_0_15px_rgba(16,185,129,0.4)] select-none animate-[fadeIn_0.1s_ease-out]">
                        <div className="text-emerald-300 font-bold mb-1 border-b border-emerald-500/20 pb-0.5 text-[8.5px]">Interval T-{(logVolumeHistory.length - idx - 1) * 3}s</div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-left">
                          <span className="text-emerald-500/60 font-semibold">Total Logs:</span>
                          <span className="font-bold text-white text-right">{total}</span>
                          
                          <div className="col-span-2 h-[1px] bg-emerald-500/10 my-0.5" />

                          <span className="text-red-400 font-medium">Error:</span>
                          <span className={`${h.error > 0 ? 'text-red-400 font-bold' : 'text-white/45'}`}>{h.error}</span>

                          <span className="text-amber-400 font-medium">Warning:</span>
                          <span className={`${h.warning > 0 ? 'text-amber-400 font-bold' : 'text-white/45'}`}>{h.warning}</span>

                          <span className="text-emerald-400 font-medium">Success:</span>
                          <span className={`${h.success > 0 ? 'text-emerald-400 font-bold' : 'text-white/45'}`}>{h.success}</span>

                          <span className="text-cyan-400 font-medium font-mono">Info:</span>
                          <span className={`${h.info > 0 ? 'text-cyan-400 font-bold' : 'text-white/45'}`}>{h.info}</span>
                        </div>
                      </div>

                      {/* Bar segment stacks */}
                      {h.error > 0 && (
                        <div 
                          className="w-full bg-red-500/90 shadow-[0_0_2px_rgba(239,68,68,0.4)]" 
                          style={{ height: `${Math.max(1, errorHeight)}px` }} 
                        />
                      )}
                      {h.warning > 0 && (
                        <div 
                          className="w-full bg-amber-500/90 shadow-[0_0_2px_rgba(245,158,11,0.4)]" 
                          style={{ height: `${Math.max(1, warningHeight)}px` }} 
                        />
                      )}
                      {h.success > 0 && (
                        <div 
                          className="w-full bg-emerald-500/90 shadow-[0_0_2px_rgba(16,185,129,0.4)]" 
                          style={{ height: `${Math.max(1, successHeight)}px` }} 
                        />
                      )}
                      {h.info > 0 && (
                        <div 
                          className="w-full bg-cyan-400/90 shadow-[0_0_2px_rgba(34,211,238,0.4)]" 
                          style={{ height: `${Math.max(1, infoHeight)}px` }} 
                        />
                      )}
                      {total === 0 && (
                        <div className="w-full h-[1px] bg-emerald-500/20" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Severity Guide Legend */}
              <div className="flex flex-row lg:flex-col gap-x-2 gap-y-[1px] text-[7.5px] border-l border-emerald-500/15 pl-2 leading-none uppercase font-bold text-emerald-500/50 select-none">
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-sm bg-red-400 animate-pulse" />
                  <span className="text-red-400/80">ERR</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-sm bg-amber-400" />
                  <span className="text-amber-400/80">WRN</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-sm bg-emerald-400" />
                  <span className="text-emerald-400/80">OK</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-sm bg-cyan-400" />
                  <span className="text-cyan-400/80">INF</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTimestamps(!showTimestamps)}
              className="flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-[9px] font-mono text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
              title="Toggle logs timestamp visibility"
            >
              <span>TIMESTAMPS:</span>
              <span className={`font-bold ${showTimestamps ? 'text-emerald-300' : 'text-emerald-500/40'}`}>
                {showTimestamps ? 'ON' : 'OFF'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAutoScroll(!autoScroll)}
              className="flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-[9px] font-mono text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
              title="Toggle auto-scroll to bottom of log stream"
            >
              <span>AUTO-SCROLL:</span>
              <span className={`font-bold ${autoScroll ? 'text-emerald-300' : 'text-emerald-500/40'}`}>
                {autoScroll ? 'ON' : 'OFF'}
              </span>
            </button>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-[9px] font-mono text-emerald-400 select-none">
              <span className="text-emerald-500/50">FILTER:</span>
              <select
                value={logFilter}
                onChange={(e) => {
                  setLogFilter(e.target.value);
                }}
                className="bg-transparent text-emerald-300 font-bold outline-none cursor-pointer border-none p-0 focus:ring-0 text-[10px] uppercase font-mono"
              >
                <option value="all" className="bg-[#020617] text-emerald-400">ALL</option>
                <option value="info" className="bg-[#020617] text-cyan-400">INFO</option>
                <option value="success" className="bg-[#020617] text-emerald-400">SUCCESS</option>
                <option value="warning" className="bg-[#020617] text-amber-400">WARNING</option>
                <option value="error" className="bg-[#020617] text-red-400">ERROR</option>
              </select>
            </div>
            <button
              type="button"
              onClick={downloadSessionLogs}
              className="flex items-center gap-1 px-2 py-0.5 rounded border border-cyan-500/25 bg-cyan-950/20 hover:bg-cyan-950/40 text-[9px] font-mono text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer"
              title="Download currently filtered log stream as a JSON file"
            >
              <Download className="w-3 h-3 text-cyan-500/70" />
              <span>DOWNLOAD LOGS</span>
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirmation(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-[9px] font-mono text-red-450 hover:text-red-300 transition-all cursor-pointer"
              title="Wipe current session logs with confirmation protection"
            >
              <Trash2 className="w-3 h-3 text-red-500/70" />
              <span>CLEAR ALL</span>
            </button>
            <span className="hidden sm:inline font-mono text-[10px] text-emerald-500/30 uppercase">
              |
            </span>
            <span className="hidden sm:inline font-mono text-[10px] text-emerald-500/60 uppercase">
              Telemetry Recording Online
            </span>
          </div>
        </div>

        {/* Streaming Logs container */}
        <div ref={logsContainerRef} className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed flex flex-col gap-1 select-all hover:scale-[1.002] transition-transform">
          {filteredLogs.length === 0 ? (
            <div className="flex-grow flex items-center justify-center text-center text-emerald-500/35 uppercase text-[10px] py-6 animate-pulse font-mono tracking-wider">
              No isolated records match threat level: [{logFilter}]
            </div>
          ) : (
            filteredLogs.map((log) => {
              let textColor = 'text-white/80';
              let borderClass = 'border-l-2 border-emerald-500/10 pl-2 bg-emerald-500/[0.01]';

              if (log.type === 'success') {
                textColor = 'text-emerald-400 glow-text-emerald font-medium';
                borderClass = 'border-l-2 border-emerald-500 pl-2 bg-emerald-500/5';
              } else if (log.type === 'error') {
                textColor = 'text-red-400 font-bold';
                borderClass = 'border-l-2 border-red-500 pl-2 bg-red-500/10';
              } else if (log.type === 'warning') {
                textColor = 'text-amber-400';
                borderClass = 'border-l-2 border-amber-500 pl-2 bg-amber-500/10';
              } else if (log.type === 'info') {
                textColor = 'text-cyan-400 font-semibold';
                borderClass = 'border-l-2 border-cyan-500 pl-2 bg-cyan-950/20';
              }

              const logText = showTimestamps ? `[${log.timestamp}] ${log.message}` : log.message;
              const isCopied = copiedLogId === log.id;

              return (
                <div 
                  key={log.id} 
                  className={`group flex items-start justify-between gap-2 p-0.5 rounded hover:bg-emerald-500/10 transition-colors ${borderClass} ${textColor}`}
                >
                  <div className="flex items-start gap-1 min-w-0 flex-1">
                    {showTimestamps && (
                      <span className="text-emerald-500/50 flex-shrink-0">[{log.timestamp}]</span>
                    )}
                    <span className="leading-tight break-all md:break-normal select-text">
                      {highlightForensicKeywords(log.message)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLog(log.id, logText)}
                    title="Copy log line"
                    className={`flex-shrink-0 p-1 md:p-0.5 rounded border transition-all duration-150 mt-0.5 ${
                      isCopied 
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 opacity-100' 
                        : 'opacity-50 md:opacity-0 group-hover:opacity-100 bg-emerald-500/5 hover:bg-emerald-500/20 border-emerald-500/10 hover:border-emerald-500/30 text-emerald-500/70 hover:text-emerald-400'
                    }`}
                  >
                    {isCopied ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </footer>

      {/* Confirmation Modal for Clearing Black Box logs */}
      {showClearConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-[#020617] border border-red-500/40 rounded-lg p-5 max-w-sm w-full shadow-[0_0_30px_rgba(239,68,68,0.25)] font-mono text-xs text-white relative scanline-glow">
            <div className="flex items-center gap-2 text-red-400 border-b border-red-500/20 pb-2.5 mb-4 select-none">
              <AlertTriangle className="w-4 h-4 text-red-500 animate-[bounce_1s_infinite]" />
              <span className="font-bold uppercase tracking-wider text-[11px]">PURGE BLACK BOX Telemetry?</span>
            </div>
            
            <p className="text-white/80 leading-relaxed mb-5">
              Warning: clearing the telemetry logs is an <span className="text-red-400 font-bold">irreversible operator override</span>. All recorded active diagnostics will be permanently destroyed.
            </p>
            
            <div className="flex justify-end gap-3 font-semibold select-none pb-0.5">
              <button
                type="button"
                onClick={() => setShowClearConfirmation(false)}
                className="px-3 py-1.5 rounded border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-[10px] tracking-wider transition-all cursor-pointer uppercase font-mono"
              >
                Abort PURGE
              </button>
              <button
                type="button"
                onClick={clearSessionLogs}
                className="px-3 py-1.5 rounded border border-red-500 bg-red-950/70 hover:bg-red-900/80 text-red-400 hover:text-red-300 text-[10px] tracking-wider transition-all cursor-pointer uppercase font-mono shadow-[0_0_8px_rgba(239,68,68,0.15)] flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                EXEC OVERRIDE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Hover Tooltip for Ingested Artifacts */}
      {hoveredArtifact && artifactTooltipCoords && (
        <div 
          className="fixed z-[99999] pointer-events-none select-none"
          style={{
            left: `${Math.min(window.innerWidth - 320, artifactTooltipCoords.x + 12)}px`,
            top: `${Math.min(window.innerHeight - 260, Math.max(12, artifactTooltipCoords.y - 10))}px`,
          }}
        >
          <div className={`bg-[#020e24]/95 border rounded-lg p-3.5 max-w-[300px] w-[300px] shadow-[0_0_25px_rgba(16,185,129,0.35)] font-mono text-xs text-white relative flex flex-col gap-2.5 backdrop-blur-md scanline-glow border-l-4 transition-opacity duration-150 animate-[fadeIn_0.1s_ease-out] ${
            hoveredArtifact.status === 'corrupted' 
              ? 'border-red-500/40 border-l-red-500/70 shadow-[0_0_25px_rgba(239,68,68,0.35)]' 
              : 'border-emerald-500/40 border-l-emerald-500/70'
          }`}>
            {/* Header: Title Name and Type logo */}
            <div className="flex items-start justify-between gap-2 border-b border-emerald-500/15 pb-2">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-emerald-400/50 uppercase font-bold tracking-wider leading-none mb-1">AUDIT EVIDENCE REPORT</span>
                <span className="text-[11.5px] font-bold text-white truncate break-all block">{hoveredArtifact.name}</span>
              </div>
              <div className="flex-shrink-0 mt-0.5">
                {hoveredArtifact.status === 'corrupted' ? (
                  <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                )}
              </div>
            </div>

            {/* In-depth details grid */}
            <div className="grid grid-cols-12 gap-x-2 gap-y-1.5 text-[10px]">
              <span className="col-span-4 text-emerald-500/50 uppercase font-semibold">CONTENT TYPE:</span>
              <span className="col-span-8 font-medium text-white/90 truncate">{hoveredArtifact.type || 'application/octet-stream'}</span>

              <span className="col-span-4 text-emerald-500/50 uppercase font-semibold">SECURE HASH:</span>
              <span className="col-span-8 font-mono bg-black/40 px-1 py-0.5 rounded border border-emerald-500/15 text-[9px] text-cyan-300 break-all select-all">
                MD5: {hoveredArtifact.hash}
              </span>

              <span className="col-span-4 text-emerald-500/50 uppercase font-semibold">INGEST TIME:</span>
              <span className="col-span-8 font-medium text-white/95 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-500/70" />
                {hoveredArtifact.ingestTime}
              </span>

              <span className="col-span-4 text-emerald-500/50 uppercase font-semibold">FILE SIZE:</span>
              <span className="col-span-8 text-emerald-400 font-bold">{hoveredArtifact.size}</span>

              <span className="col-span-4 text-emerald-500/50 uppercase font-semibold">STATUS CODE:</span>
              <span className={`col-span-8 font-bold flex items-center gap-1.5 ${
                hoveredArtifact.status === 'corrupted' ? 'text-red-400' : 'text-emerald-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  hoveredArtifact.status === 'corrupted' ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                }`} />
                {hoveredArtifact.status === 'corrupted' ? 'INTEGRITY_BREACHED' : 'ALIGNMENT_NOMINAL'}
              </span>
            </div>

            {/* Threat intelligence diagnostic alerts */}
            {hoveredArtifact.status === 'corrupted' && (
              <div className="mt-1 border-t border-red-500/15 pt-2 flex flex-col gap-1 bg-red-950/25 p-1.5 rounded border border-red-500/20">
                <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1 leading-none">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  Anomaly Diagnostics ({hoveredArtifact.anomaliesCount})
                </span>
                <ul className="list-disc list-inside text-[8.5px] text-white/80 leading-normal flex flex-col gap-0.5 leading-relaxed pl-1">
                  {hoveredArtifact.detectedThreats.map((threat, tid) => (
                    <li key={tid} className="truncate select-none">{threat}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Hover guidance label */}
            <div className="text-[8px] text-center text-emerald-500/30 uppercase mt-1 border-t border-emerald-500/5 pt-1.5 font-sans tracking-wide">
              Hover to load signature diagnostics
            </div>
          </div>
        </div>
      )}

      {/* Full Screen High-Definition Forensic Asset Overlay */}
      {isFullScreenExplorer && selectedFile && (
        <div className="fixed inset-0 z-[8000] bg-slate-950/98 overflow-y-auto backdrop-blur-md p-6 font-mono text-xs text-emerald-400/90 flex flex-col gap-6 scanline-glow relative select-text selection:bg-emerald-500/30 selection:text-white">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(16,185,129,0.05)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-45" />

          {/* Top scanning header */}
          <header className="flex flex-col md:flex-row items-center justify-between border-b border-emerald-500/25 pb-4 gap-4 flex-shrink-0 animate-[fadeIn_0.2s_ease-out] relative z-10">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase animate-pulse">
                  SECURE DECRYPTION STREAM
                </span>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest select-none">
                  // DECODED FORENSICS CHANNEL ALPHA
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white leading-none tracking-tight flex items-center gap-2 select-text font-sans">
                <Terminal className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                ASSET REPORT: {selectedFile.name}
              </h1>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsFullScreenExplorer(false);
                  addLog(`De-escalated diagnostics stream to standard terminal window.`, 'info');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/55 text-emerald-400 hover:text-emerald-300 transition-all font-bold tracking-wider uppercase cursor-pointer"
                title="Collapse detailed view"
              >
                <Minimize2 className="w-4 h-4 text-emerald-500/80" />
                <span>Standard Terminal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (lockedFilePath === selectedFile.path) {
                    setLockedFilePath(null);
                  }
                  setSelectedFile(null);
                  setIsFullScreenExplorer(false);
                  addLog('Inspecting forensic asset link disconnected.', 'warning');
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-md border border-red-500/30 bg-red-950/20 hover:bg-red-950/45 text-red-400 hover:text-red-300 transition-all font-bold tracking-wider uppercase cursor-pointer"
                title="Close and disconnect stream"
              >
                <X className="w-4 h-4 text-red-500/85" />
                <span>Decommission URL</span>
              </button>
            </div>
          </header>

          {/* Diagnostic Mode Tab Selector */}
          <div className="flex border-b border-emerald-500/15 pb-1 gap-2 relative z-10 flex-shrink-0">
            <button
              type="button"
              onClick={() => setOverlayTab('specs')}
              className={`px-4 py-1.5 border-b-2 font-bold uppercase tracking-wider transition-all cursor-pointer text-[10px] ${
                overlayTab === 'specs'
                  ? 'border-emerald-400 text-white bg-emerald-500/5'
                  : 'border-transparent text-emerald-500/40 hover:text-emerald-500/80 hover:bg-white/5'
              }`}
            >
              [🔍 Forensic Specs & Actions]
            </button>
            <button
              type="button"
              onClick={() => setOverlayTab('diff')}
              className={`px-4 py-1.5 border-b-2 font-bold uppercase tracking-wider transition-all cursor-pointer text-[10px] flex items-center gap-1.5 ${
                overlayTab === 'diff'
                  ? 'border-cyan-400 text-white bg-cyan-500/5'
                  : 'border-transparent text-emerald-500/40 hover:text-cyan-400 hover:bg-white/5'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>[⚖️ Side-by-Side Integrity Diff]</span>
            </button>
          </div>

          {/* Main detailed content area */}
          {(() => {
            const snapshot = getSnapshot(selectedFile);
            const presentHist = getPresentHistory(selectedFile);
            const ratingDelta = (selectedFile.traumaRating || 0) - snapshot.traumaRating;
            const snapAnomalies = snapshot.anomalies;
            const presAnomalies = selectedFile.anomalies || [];
            const baselineRows = generateHexDump(selectedFile.name, snapshot.traumaRating);
            const presentRows = generateHexDump(selectedFile.name, selectedFile.traumaRating);

            if (overlayTab === 'specs') {
              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow overflow-auto animate-[fadeIn_0.3s_ease-out] relative z-10 pb-4">
                  
                  {/* COLUMN 1: METADATA & CRYPTOGRAPHIC STAMPS (COL-SPAN-4) */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    
                    {/* Well-Tegra Brand Integrity Emblem Card */}
                    <div className="border border-emerald-500/20 bg-emerald-950/10 p-4 rounded-lg flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden backdrop-blur-sm shadow-[0_0_12px_rgba(16,185,129,0.02)]">
                      <div className="absolute top-1 left-2 text-[7px] text-emerald-500/30 uppercase font-mono tracking-widest leading-none font-black select-none">
                        INTEGRITY UNIT SEAL
                      </div>
                      <WellTegraLogo size={105} variant="default" showText={false} />
                      <div className="flex flex-col gap-0.5 mt-1 select-none">
                        <h3 className="text-white text-sm font-black tracking-[0.2em] uppercase font-sans">
                          WELL-TEGRA
                        </h3>
                        <p className="text-[8px] text-cyan-400 font-bold tracking-widest uppercase">
                          DATA SOLUTIONS
                        </p>
                      </div>
                      <div className="text-[9px] text-emerald-500/40 select-all bg-black/40 px-2.5 py-1.5 border border-emerald-500/10 rounded w-full font-mono mt-1 relative">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse absolute -top-0.5 -right-0.5 border border-slate-950" />
                        FORENSIC VERIFICATION SECURED
                      </div>
                    </div>
                    
                    {/* Asset Specifications Spec sheet */}
                    <div className="border border-emerald-500/20 bg-emerald-950/5 p-4 rounded-lg flex flex-col gap-3 relative overflow-hidden shadow-inner">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rotate-45 translate-x-12 -translate-y-12 select-none pointer-events-none" />
                      <h2 className="text-white font-bold text-xs uppercase tracking-wider border-b border-emerald-500/10 pb-1.5 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-emerald-400" />
                        Forensic Specifications
                      </h2>

                      <div className="flex flex-col gap-2.5 text-[11px]">
                        <div className="flex flex-col gap-1">
                          <span className="text-emerald-500/40 uppercase text-[9px] font-semibold">Virtual Sector Name:</span>
                          <span className="text-white font-medium pl-1 bg-black/15 py-0.5 rounded">{selectedFile.name}</span>
                        </div>

                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-emerald-500/40 uppercase text-[9px] font-semibold">Relative Logical Path:</span>
                          <div className="flex items-center justify-between bg-black/30 p-1.5 rounded border border-emerald-500/10 gap-2">
                            <span className="text-cyan-300 select-all font-mono break-all leading-tight pr-1">{selectedFile.path}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedFile.path);
                                addLog(`Cloned path directly to registry clipboard.`, 'success');
                              }}
                              className="text-emerald-400 hover:text-white p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-all cursor-pointer flex-shrink-0"
                              title="Copy absolute path registry"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                          <div className="flex flex-col">
                            <span className="text-emerald-500/40 uppercase text-[8.5px] font-semibold">Asset Format:</span>
                            <span className="text-emerald-300 font-mono pl-1">{selectedFile.type === 'directory' ? 'SYSTEM_SECTOR' : selectedFile.name.split('.').pop()?.toUpperCase() + ' FILE'}</span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-emerald-500/40 uppercase text-[8.5px] font-semibold">Allocated Memory:</span>
                            <span className="text-emerald-300 font-mono pl-1">{selectedFile.size || 'DYN_ALLOCATED'}</span>
                          </div>
                        </div>

                        <div className="flex flex-col mt-1">
                          <span className="text-emerald-500/40 uppercase text-[9px] font-semibold">Chronos Registry Stamp:</span>
                          <span className="text-white pl-1 font-semibold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-500/50" />
                            {selectedFile.lastModified}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cryptographic Signatures Verification Card */}
                    <div className="border border-emerald-500/25 bg-[#010e20]/80 p-4 rounded-lg flex flex-col gap-3">
                      <h2 className="text-white font-bold text-xs uppercase tracking-wider border-b border-emerald-500/10 pb-1.5 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        Security Payload Integrity Signatures
                      </h2>

                      <div className="flex flex-col gap-2 text-[10.5px]">
                        <div className="flex flex-col">
                          <span className="text-emerald-500/40 uppercase text-[8.5px]">CHECKSUM COMPUTE STATUS</span>
                          <span className="text-emerald-300 font-bold bg-emerald-950/20 p-1 border border-emerald-500/15 rounded flex items-center gap-2 mt-0.5 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            INTEGRITY_INDEXING_STABLE
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-emerald-500/40 uppercase text-[8.5px] font-semibold">MD5 SUM:</span>
                          <span className="font-mono bg-black/40 px-2 py-1 rounded text-[9.5px] text-cyan-300 border border-emerald-500/10 select-all tracking-wider break-all">
                            F420FFDEE86B7DA70{Math.abs(selectedFile.name.charCodeAt(0) * 111).toString(16).slice(0, 3)}A69CBA3C51A1
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-emerald-500/40 uppercase text-[8.5px] font-semibold">SHA-256 CHECK:</span>
                          <span className="font-mono bg-black/40 px-2 py-1 rounded text-[9px] text-emerald-305 border border-emerald-500/10 select-all tracking-wide break-all leading-normal">
                            7F420E4A6DC{selectedFile.name.length}CE67420F00BA76EFFF9179A99CA810FD4296A1C3C6CCDAA881274F20
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 2: CYBER HEURISTICS, TRAUMA CIRCULAR GAUGE & COMPROMISE CONTROLS (COL-SPAN-4) */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    
                    {/* Dynamic Trauma & Stress index visualization circular ring gauge */}
                    <div className="border border-emerald-500/20 bg-emerald-950/5 p-4 rounded-lg flex flex-col items-center justify-between text-center gap-4 relative shadow-md">
                      <div className="absolute top-2 left-2 text-emerald-500/30 text-[8px] font-bold font-mono">GAUGE: TRAUMATIC_INDEX</div>
                      <h2 className="text-white font-bold text-xs uppercase tracking-wider border-b border-emerald-500/10 pb-1.5 w-full text-left">
                        Distress Stress Index
                      </h2>

                      <div className="relative w-36 h-36 flex items-center justify-center mt-2">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="72"
                            cy="72"
                            r="58"
                            className="stroke-emerald-950/40 fill-none"
                            strokeWidth="8"
                          />
                          <circle
                            cx="72"
                            cy="72"
                            r="58"
                            className={`fill-none transition-all duration-1000 ease-out ${
                              (selectedFile.traumaRating || 0) > 70 
                                ? 'stroke-red-500' 
                                : 'stroke-emerald-400'
                            }`}
                            strokeWidth="8"
                            strokeDasharray={`${2 * Math.PI * 58}`}
                            strokeDashoffset={`${2 * Math.PI * 58 * (1 - (selectedFile.traumaRating || 0) / 100)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className={`text-2xl font-black ${
                            (selectedFile.traumaRating || 0) > 70 ? 'text-red-400' : 'text-emerald-400'
                          }`}>
                            {selectedFile.traumaRating || 0}%
                          </span>
                          <span className="text-[7.5px] uppercase text-emerald-500/50 tracking-widest font-bold font-mono">STRESS RATE</span>
                        </div>
                      </div>

                      <div className="bg-black/25 px-3 py-1.5 border border-emerald-500/10 rounded text-[9.5px] w-full text-center">
                        <p className="leading-relaxed">
                          {(selectedFile.traumaRating || 0) > 70 ? (
                            <span className="text-red-400 font-bold tracking-wide uppercase">
                              ⚠️ ALERT: CRITICAL COMPROMISE. Substantial system distress identified. Isolated containment is suggested immediately.
                            </span>
                          ) : (
                            <span className="text-emerald-400/80 font-semibold tracking-wide uppercase">
                              ✅ NOMINAL: Safe telemetry baseline. No quarantine constraints active on current security alignment loop.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action sandbox/quarantine routines */}
                    <div className="border border-emerald-500/25 bg-[#010e20]/80 p-4 rounded-lg flex flex-col gap-3">
                      <h2 className="text-white font-bold text-xs uppercase tracking-wider border-b border-emerald-500/10 pb-1.5 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        Integrity Mitigation Protocols
                      </h2>

                      <div className="flex flex-col gap-2.5 text-[10px]">
                        {/* Quarantine Toggle */}
                        <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-emerald-500/5 hover:border-emerald-500/20 transition-all gap-3">
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-white uppercase text-[9.5px]">SANDBOX QUARANTINE</span>
                            <span className="text-[8px] text-zinc-400 truncate">Lock off file structure access permissions</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const next = !quarantinedFiles[selectedFile.path];
                              setQuarantinedFiles(prev => ({ ...prev, [selectedFile.path]: next }));
                              if (next) {
                                addLog(`Quarantine protocol ENGAGED for asset path: [${selectedFile.name}]`, 'warning');
                              } else {
                                addLog(`Quarantine protocol COMPLETED for asset path: [${selectedFile.name}]`, 'info');
                              }
                            }}
                            className={`px-3 py-1.5 rounded border-2 text-[9px] font-bold tracking-widest leading-none transition-all cursor-pointer uppercase flex-shrink-0 ${
                              quarantinedFiles[selectedFile.path]
                                ? 'border-red-500 bg-red-950/40 text-red-400 animate-pulse'
                                : 'border-emerald-500/30 bg-transparent text-emerald-500/70 hover:bg-emerald-500/10 hover:border-emerald-500/50'
                            }`}
                          >
                            {quarantinedFiles[selectedFile.path] ? 'ACTIVE' : 'STANDBY'}
                          </button>
                        </div>

                        {/* Secure Header Rebuild Simulation */}
                        <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-emerald-500/5 hover:border-emerald-500/20 transition-all gap-3">
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-white uppercase text-[9.5px]">REGEN INTEGRITY HEADER</span>
                            <span className="text-[8px] text-zinc-400 truncate">Surgical sanitization of index pointers</span>
                          </div>
                          <button
                            type="button"
                            disabled={rebuildingFile === selectedFile.path}
                            onClick={() => {
                              setRebuildingFile(selectedFile.path);
                              addLog(`Sanitizing index pointer segments for: [${selectedFile.name}]`, 'info');
                              
                              setTimeout(() => {
                                setRebuildingFile(null);
                                addLog(`Integrity checksums REBUILT and realigned for: ${selectedFile.name}`, 'success');
                              }, 2500);
                            }}
                            className={`px-3 py-1.5 rounded text-[9px] font-bold tracking-widest leading-none transition-all cursor-pointer uppercase flex-shrink-0 ${
                              rebuildingFile === selectedFile.path
                                ? 'bg-cyan-950/20 text-cyan-400 border border-cyan-500/40 animate-pulse'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50'
                            }`}
                          >
                            {rebuildingFile === selectedFile.path ? 'REBUILDING' : 'INITIATE'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 3: DECRYPTED LIVE DUMP & COMPREHENSIVE ANOMALY LOGS (COL-SPAN-4) */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    
                    {/* Detailed Anomaly Logs list reports */}
                    <div className="border border-emerald-500/20 bg-emerald-950/5 p-4 rounded-lg flex flex-col flex-grow gap-3 relative min-h-[160px]">
                      <h2 className="text-white font-bold text-xs uppercase tracking-wider border-b border-emerald-500/10 pb-1.5 flex items-center gap-1.5">
                        <AlertTriangle className={`w-4 h-4 ${
                          selectedFile.anomalies && selectedFile.anomalies.length > 0 ? 'text-red-400 animate-bounce' : 'text-emerald-400'
                        }`} />
                        Compromised Anomaly Inspection
                      </h2>

                      <div className="mt-1 flex flex-col gap-2 overflow-y-auto pr-1 flex-grow">
                        {selectedFile.anomalies && selectedFile.anomalies.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] text-red-400 font-bold tracking-wide flex items-center gap-1">
                              UNAUTHORIZED INTRUSIONS IDENTIFIED:
                            </span>
                            {selectedFile.anomalies.map((anom, idx) => (
                              <div key={idx} className="bg-red-950/25 border border-red-500/30 p-2 rounded flex flex-col gap-1 shadow-[0_0_8px_rgba(239,68,68,0.1)]">
                                <div className="flex items-center justify-between text-[8px] opacity-60 font-mono">
                                  <span>SECTOR MAP: CH-6421</span>
                                  <span>SIGNATURE CONFIDENTIAL</span>
                                </div>
                                <span className="text-red-300 font-mono text-[9.5px] leading-relaxed select-text font-bold">
                                  ⚠️ {anom}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="w-full flex-grow flex flex-col items-center justify-center text-center p-6 bg-emerald-950/10 border border-emerald-500/15 rounded select-none">
                            <ShieldCheck className="w-8 h-8 text-emerald-400/50 mb-2 animate-pulse" />
                            <span className="text-[10.5px] tracking-wider uppercase font-bold text-emerald-400">NOMINAL_STATE_SECURED</span>
                            <span className="text-[8.5px] text-emerald-400/60 mt-1 uppercase max-w-[200px] leading-normal font-sans">
                              No stress indicators or bypassed hashes flagged in audit tree registry.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* LIVE HEX STAMP MONITOR */}
                    <div className="border border-emerald-500/25 bg-[#010e20]/80 p-4 rounded-lg flex flex-col gap-3">
                      <h2 className="text-white font-bold text-xs uppercase tracking-wider border-b border-emerald-500/10 pb-1.5 flex items-center gap-1.5 leading-none">
                        <Folder className="w-4 h-4 text-cyan-400" />
                        Decrypted Index Hex Dump
                      </h2>

                      {/* Hex Row Output */}
                      <div className="bg-black/95 p-2.5 rounded-lg border border-emerald-500/15 flex flex-col font-mono text-[8.5px] text-emerald-400 leading-normal gap-1.5 select-all select-text overflow-x-auto shadow-inner">
                        {generateHexDump(selectedFile.name, selectedFile.traumaRating).map((row, idx) => (
                          <div key={idx} className="flex justify-between gap-3 truncate">
                            <span className="text-emerald-500/50 font-bold">{row.offset}</span>
                            <span className="text-cyan-300 tracking-wider font-semibold max-w-[155px] truncate">{row.bytes}</span>
                            <span className="text-white/65 border-l border-emerald-500/10 pl-2 max-w-[70px] truncate">{row.ascii}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="flex flex-col gap-6 flex-grow overflow-auto animate-[fadeIn_0.2s_ease-out] relative z-10 pb-4">
                  
                  {/* Benchmark Controller & Delta Summary Bar */}
                  <div className="border border-cyan-500/25 bg-cyan-950/5 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_0_15px_rgba(34,211,238,0.02)]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest">
                          CHRONOS REGISTRY BENCHMARK VERIFIED
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        Baseline Snapshot Reference: <strong className="text-white bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-500/10 font-mono text-[9px] ml-1">{snapshot.timestamp}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {ratingDelta !== 0 && (
                        <div className={`px-2.5 py-1.5 rounded border font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 ${
                          ratingDelta > 0 
                            ? 'border-red-500/40 bg-red-950/25 text-red-400 animate-pulse' 
                            : 'border-emerald-500/40 bg-emerald-950/25 text-emerald-400'
                        }`}>
                          {ratingDelta > 0 ? '⚠️ STRESS COMPROMISE ESCALATED:' : '✅ STRESS STATUS REMISSION:'}
                          <span className="text-white text-xs">{ratingDelta > 0 ? `+${ratingDelta}%` : `${ratingDelta}%`} deviation</span>
                        </div>
                      )}
                      {ratingDelta === 0 && (
                        <div className="px-2.5 py-1.5 rounded border border-cyan-500/30 bg-cyan-950/20 text-cyan-300 font-mono text-[10px] uppercase font-bold">
                          ⚖️ STABILIZED baselines matched
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => captureSnapshot(selectedFile)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyan-400 bg-cyan-950/30 hover:bg-cyan-950/60 text-cyan-300 hover:text-white transition-all font-bold tracking-wider uppercase cursor-pointer text-[10px]"
                        title="Capture live session parameters as benchmark"
                      >
                        <span>💾 Capture Benchmark</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadSnapshotCSV(selectedFile, snapshot, presentHist)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-emerald-500/40 bg-emerald-950/25 hover:bg-emerald-950/55 text-emerald-300 hover:text-white transition-all font-bold tracking-wider uppercase cursor-pointer text-[10px]"
                        title="Download compared trend snapshot as a CSV table"
                        id="download-snapshot-csv"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Download Snapshot CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Side-by-Side Dual Deck panels */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* LEFT SIDE: BENCHMARK REFERENCE SNAPSHOT */}
                    <div className="border border-cyan-500/20 bg-cyan-950/5 rounded-lg p-4 flex flex-col gap-4 relative">
                      <div className="absolute top-2 right-2 text-[7px] text-cyan-500/40 uppercase font-mono tracking-widest leading-none font-bold">
                        [ REFERENCE BASELINE STATE ]
                      </div>
                      <h2 className="text-cyan-300 font-bold text-xs uppercase tracking-wider border-b border-cyan-500/15 pb-2 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        🔒 STABILIZED BENCHMARK REFERENCE
                      </h2>

                      {/* Trauma details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-black/35 p-3 rounded border border-cyan-500/10 flex flex-col items-center justify-center text-center">
                          <span className="text-cyan-500/40 text-[8px] font-bold uppercase tracking-wider font-mono">HISTORIC STRESS RATE</span>
                          <span className="text-3xl font-black text-cyan-400 mt-1">{snapshot.traumaRating}%</span>
                          <span className="text-[7.5px] uppercase text-zinc-500 mt-1 font-mono">STABLE REFERENCE BASELINE</span>
                        </div>

                        <div className="flex flex-col justify-between text-[11px] gap-2 p-1">
                          <div className="flex flex-col">
                            <span className="text-cyan-500/40 text-[8.5px] uppercase font-bold font-mono">Registry Stamp:</span>
                            <span className="text-white/90 font-mono mt-0.5">{snapshot.lastModified}</span>
                          </div>
                          <div className="flex flex-col animate-[fadeIn_0.5s_ease-out]">
                            <span className="text-cyan-500/40 text-[8.5px] uppercase font-bold font-mono">SHA-256 Alignment Hash:</span>
                            <span className="text-cyan-400/70 font-mono text-[9px] break-all leading-normal select-all">
                              7F420E4A6DC{selectedFile.name.length}CE67420F00BA76EFFF9179A99CA810FD4296A1C3C6CCDAA881274F20
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Trend Sparkline History */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-cyan-500/40 text-[8.5px] uppercase font-bold font-mono">BENCHMARK HISTORICAL TREND</span>
                        <div className="h-16 bg-black/40 border border-cyan-500/10 rounded overflow-hidden flex items-end p-1 relative">
                          <div className="absolute top-1 left-2 text-[7px] text-cyan-500/30 font-mono">T-44s &rarr; T-0s (SNAPSHOT REFERENCE)</div>
                          <div className="w-full h-full flex items-end justify-between px-2 pt-4">
                            {snapshot.history.map((val, idx) => (
                              <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group relative px-0.5">
                                <div 
                                  className="w-full bg-cyan-400/20 hover:bg-cyan-400/40 rounded-t transition-all"
                                  style={{ height: `${Math.max(5, val)}%` }}
                                />
                                <span className="text-[6.5px] text-cyan-300 font-mono group-hover:block hidden absolute -top-3.5 bg-black/85 px-1 rounded border border-cyan-500/20">{val}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Anomaly list */}
                      <div className="flex flex-col gap-1.5 flex-grow">
                        <span className="text-cyan-500/40 text-[8.5px] uppercase font-bold font-mono">REFERENCE THREAT REGISTRY ({snapAnomalies.length})</span>
                        <div className="bg-black/30 border border-cyan-500/10 p-2.5 rounded text-[10.5px] flex-grow flex flex-col gap-1.5 min-h-[90px] overflow-y-auto">
                          {snapAnomalies.length > 0 ? (
                            snapAnomalies.map((anom, idx) => (
                              <div key={idx} className="font-mono text-cyan-300/80 leading-relaxed pl-2 border-l border-cyan-500/30">
                                🔹 {anom}
                              </div>
                            ))
                          ) : (
                            <div className="flex-grow flex items-center justify-center text-cyan-500/40 text-[9px] uppercase tracking-widest font-mono">
                              [ No baseline threats registered ]
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reference Hex Dump with character highlights */}
                      <div className="flex flex-col gap-1.5 font-mono">
                        <span className="text-cyan-500/40 text-[8.5px] uppercase font-bold">BASELINE MEMORY SNAPSHOT DUMP</span>
                        <div className="bg-black/95 px-2 py-2 rounded border border-cyan-500/15 flex flex-col leading-none gap-1 select-none relative overflow-x-auto">
                          <div className="flex items-center text-[7px] text-cyan-500/50 font-bold uppercase pb-1 border-b border-cyan-500/10 mb-1 px-1 justify-between select-none font-mono">
                            <span className="w-10">OFFSET</span>
                            <span className="flex-grow max-w-[200px]">HEXADECIMAL CONTENT</span>
                            <span className="w-20 text-right">ASCII MAP</span>
                          </div>

                          {baselineRows.map((row, rowIdx) => {
                            const pRow = presentRows[rowIdx];
                            const baseBytes = row.bytes.split(' ');
                            const presBytes = pRow ? pRow.bytes.split(' ') : baseBytes;
                            const baseAscii = row.ascii.split('');
                            const presAscii = pRow ? pRow.ascii.split('') : baseAscii;

                            return (
                              <div key={rowIdx} className="flex justify-between items-center gap-2 py-[2px] hover:bg-cyan-500/5 px-1 rounded transition-colors font-mono">
                                <span className="text-cyan-500/30 text-[7.5px] font-black w-10">{row.offset}</span>
                                
                                <div className="flex flex-wrap items-center gap-[3px] flex-grow max-w-[200px]">
                                  {baseBytes.map((byte, byteIdx) => {
                                    const otherByte = presBytes[byteIdx];
                                    const hasChanged = byte !== otherByte;
                                    const isHovered = hoveredByteIndex?.rowIdx === rowIdx && hoveredByteIndex?.byteIdx === byteIdx;
                                    return (
                                      <span
                                        key={byteIdx}
                                        onMouseEnter={() => setHoveredByteIndex({ rowIdx, byteIdx })}
                                        onMouseLeave={() => setHoveredByteIndex(null)}
                                        className={`transition-all duration-100 cursor-crosshair px-[2px] rounded text-[8px] font-mono font-bold leading-none ${
                                          isHovered 
                                            ? 'bg-cyan-400 text-slate-950 font-black scale-110 shadow-[0_0_6px_rgba(34,211,238,0.7)] z-10' 
                                            : hasChanged
                                              ? 'bg-red-500/20 text-red-400 border border-red-500/30 line-through decoration-slate-900/40 text-[7.5px]'
                                              : 'text-cyan-300'
                                        }`}
                                      >
                                        {byte}
                                      </span>
                                    );
                                  })}
                                </div>

                                <div className="flex items-center gap-[1px] border-l border-cyan-500/10 pl-3.5 w-20 justify-end">
                                  {baseAscii.map((char, charIdx) => {
                                    const otherChar = presAscii[charIdx];
                                    const hasChanged = char !== otherChar;
                                    const isHovered = hoveredByteIndex?.rowIdx === rowIdx && hoveredByteIndex?.byteIdx === charIdx;
                                    return (
                                      <span
                                        key={charIdx}
                                        onMouseEnter={() => setHoveredByteIndex({ rowIdx, byteIdx: charIdx })}
                                        onMouseLeave={() => setHoveredByteIndex(null)}
                                        className={`transition-all duration-100 cursor-crosshair text-[8px] font-mono px-[1px] rounded-[1px] leading-none ${
                                          isHovered
                                            ? 'bg-cyan-400 text-slate-950 font-black scale-125 z-10'
                                            : hasChanged
                                              ? 'text-red-400 font-bold line-through bg-red-950/30 border-b border-red-500'
                                              : 'text-white/40 font-medium'
                                        }`}
                                      >
                                        {char}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE: LIVE SESSION ACTIVE MATRIX */}
                    <div className={`border rounded-lg p-4 flex flex-col gap-4 relative ${
                      (selectedFile.traumaRating || 0) > 70 
                        ? 'border-red-500/25 bg-red-950/5' 
                        : 'border-emerald-500/20 bg-emerald-950/5'
                    }`}>
                      <div className="absolute top-2 right-2 text-[7px] text-emerald-500/40 uppercase font-mono tracking-widest leading-none font-bold">
                        [ LIVE SESSION RECORDING ]
                      </div>
                      <h2 className={`font-bold text-xs uppercase tracking-wider border-b pb-2 flex items-center gap-2 ${
                        (selectedFile.traumaRating || 0) > 70 ? 'text-red-400 border-red-500/15' : 'text-emerald-400 border-emerald-500/15'
                      }`}>
                        <Activity className={`w-4 h-4 ${(selectedFile.traumaRating || 0) > 70 ? 'text-red-400' : 'text-emerald-400'}`} />
                        📡 ACTIVE DECRYPTION RUNTIME STATE
                      </h2>

                      {/* Trauma details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`p-3 rounded border flex flex-col items-center justify-center text-center ${
                          (selectedFile.traumaRating || 0) > 70 
                            ? 'bg-red-950/20 border-red-500/20' 
                            : 'bg-black/35 border-emerald-500/10'
                        }`}>
                          <span className="text-emerald-500/40 text-[8px] font-bold uppercase tracking-wider font-mono">LIVE TRAUMA PRESSURE</span>
                          <span className={`text-3xl font-black mt-1 ${
                            (selectedFile.traumaRating || 0) > 70 ? 'text-red-400 glow-text-red' : 'text-emerald-400 glow-text-emerald'
                          }`}>
                            {selectedFile.traumaRating}%
                          </span>
                          <span className={`text-[7.5px] uppercase mt-1 font-mono ${
                            (selectedFile.traumaRating || 0) > 70 ? 'text-red-400/80 font-bold' : 'text-emerald-400/80'
                          }`}>
                            {(selectedFile.traumaRating || 0) > 70 ? '⚠️ OVERLOAD PRESSURE' : 'NOMINAL COUPLING'}
                          </span>
                        </div>

                        <div className="flex flex-col justify-between text-[11px] gap-2 p-1">
                          <div className="flex flex-col">
                            <span className="text-emerald-500/40 text-[8.5px] uppercase font-bold font-mono">Logical Path Registry:</span>
                            <span className="text-white/90 font-mono truncate mt-0.5" title={selectedFile.path}>{selectedFile.path}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-emerald-500/40 text-[8.5px] uppercase font-bold font-mono">SHA-256 Alignment Hash:</span>
                            <span className="text-yellow-400/70 font-mono text-[9px] break-all leading-normal select-all">
                              7F420E4A6DC{selectedFile.name.length}CE67420F00BA76EFFF9179A99CA810FD4296A1C3C6CCDAA88{ratingDelta !== 0 ? 'F42' : '127'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Trend Sparkline History */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-emerald-500/40 text-[8.5px] uppercase font-bold font-mono">PRESENT RUNTIME PROFILE</span>
                        <div className="h-16 bg-black/40 border border-emerald-500/10 rounded overflow-hidden flex items-end p-1 relative">
                          <div className="absolute top-1 left-2 text-[7px] text-emerald-500/30 font-mono">T-44s &rarr; T-0s (REALTIME STREAM)</div>
                          <div className="w-full h-full flex items-end justify-between px-2 pt-4">
                            {presentHist.map((val, idx) => (
                              <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group relative px-0.5 animate-[fadeIn_0.4s_ease-out]">
                                <div 
                                  className={`w-full rounded-t transition-all ${
                                    val > 70 ? 'bg-red-500/40 hover:bg-red-500' : 'bg-emerald-400/20 hover:bg-emerald-400/45'
                                  }`}
                                  style={{ height: `${Math.max(5, val)}%` }}
                                />
                                <span className="text-[6.5px] text-emerald-300 font-mono group-hover:block hidden absolute -top-3.5 bg-black/85 px-1 rounded border border-emerald-500/20">{val}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Anomaly list */}
                      <div className="flex flex-col gap-1.5 flex-grow">
                        <span className="text-emerald-500/40 text-[8.5px] uppercase font-bold font-mono">PRESENT INTUITION SIGNATURES ({presAnomalies.length})</span>
                        <div className="bg-black/30 border border-emerald-500/10 p-2.5 rounded text-[10.5px] flex-grow flex flex-col gap-1.5 min-h-[90px] overflow-y-auto">
                          {presAnomalies.length > 0 ? (
                            presAnomalies.map((anom, idx) => {
                              const isNew = !snapAnomalies.includes(anom);
                              return (
                                <div 
                                  key={idx} 
                                  className={`font-mono leading-relaxed pl-2 border-l flex items-start gap-1 justify-between ${
                                    isNew 
                                      ? 'border-red-500 text-red-300 bg-red-950/15 p-1 rounded' 
                                      : 'border-emerald-500/30 text-emerald-300/80'
                                  }`}
                                >
                                  <span>🔹 {anom}</span>
                                  {isNew && (
                                    <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-1 py-0.5 text-[6.5px] font-bold rounded uppercase tracking-wider animate-pulse font-sans">
                                      NEW THREAT
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex-grow flex items-center justify-center text-emerald-500/25 text-[9px] uppercase tracking-widest font-mono">
                              [ File aligned. Zero anomalies logged. ]
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Present Hex Dump with highlight overlay */}
                      <div className="flex flex-col gap-1.5 font-mono">
                        <span className="text-emerald-500/40 text-[8.5px] uppercase font-bold">PRESENT MEMORY RUNTIME DUMP</span>
                        <div className="bg-black/95 px-2 py-2 rounded border border-emerald-500/15 flex flex-col leading-none gap-1 overflow-x-auto">
                          <div className="flex items-center text-[7px] text-emerald-500/50 font-bold uppercase pb-1 border-b border-emerald-500/10 mb-1 px-1 justify-between select-none font-mono">
                            <span className="w-10">OFFSET</span>
                            <span className="flex-grow max-w-[200px]">HEXADECIMAL CONTENT</span>
                            <span className="w-20 text-right">ASCII MAP</span>
                          </div>

                          {presentRows.map((row, rowIdx) => {
                            const bRow = baselineRows[rowIdx];
                            const baseBytes = bRow ? bRow.bytes.split(' ') : row.bytes.split(' ');
                            const presBytes = row.bytes.split(' ');
                            const baseAscii = bRow ? bRow.ascii.split('') : row.ascii.split('');
                            const presAscii = row.ascii.split('');

                            return (
                              <div key={rowIdx} className="flex justify-between items-center gap-2 py-[2px] hover:bg-emerald-500/5 px-1 rounded transition-colors font-mono">
                                <span className="text-emerald-500/30 text-[7.5px] font-black w-10">{row.offset}</span>
                                
                                <div className="flex flex-wrap items-center gap-[3px] flex-grow max-w-[200px]">
                                  {presBytes.map((byte, byteIdx) => {
                                    const otherByte = baseBytes[byteIdx];
                                    const hasChanged = byte !== otherByte;
                                    const isHovered = hoveredByteIndex?.rowIdx === rowIdx && hoveredByteIndex?.byteIdx === byteIdx;
                                    return (
                                      <span
                                        key={byteIdx}
                                        onMouseEnter={() => setHoveredByteIndex({ rowIdx, byteIdx })}
                                        onMouseLeave={() => setHoveredByteIndex(null)}
                                        className={`transition-all duration-100 cursor-crosshair px-[2px] rounded text-[8px] font-mono leading-none ${
                                          isHovered 
                                            ? 'bg-emerald-400 text-slate-950 font-black scale-110 shadow-[0_0_6px_rgba(52,211,153,0.7)] z-10' 
                                            : hasChanged
                                              ? 'bg-red-500/25 text-yellow-300 font-bold border border-yellow-400/40 animate-pulse'
                                              : 'text-emerald-400'
                                        }`}
                                      >
                                        {byte}
                                      </span>
                                    );
                                  })}
                                </div>

                                <div className="flex items-center gap-[1px] border-l border-emerald-500/10 pl-3.5 w-20 justify-end">
                                  {presAscii.map((char, charIdx) => {
                                    const otherChar = baseAscii[charIdx];
                                    const hasChanged = char !== otherChar;
                                    const isHovered = hoveredByteIndex?.rowIdx === rowIdx && hoveredByteIndex?.byteIdx === charIdx;
                                    return (
                                      <span
                                        key={charIdx}
                                        onMouseEnter={() => setHoveredByteIndex({ rowIdx, byteIdx: charIdx })}
                                        onMouseLeave={() => setHoveredByteIndex(null)}
                                        className={`transition-all duration-100 cursor-crosshair text-[8px] font-mono px-[1px] rounded-[1px] leading-none ${
                                          isHovered
                                            ? 'bg-emerald-400 text-slate-950 font-black scale-125 z-10'
                                            : hasChanged
                                              ? 'text-yellow-300 font-black bg-red-950/25 border-b border-yellow-400'
                                              : 'text-white/65'
                                        }`}
                                      >
                                        {char}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HIGH-DEFINITION CROSSHAIR TELEMETRY TRACER & LEGEND BAR */}
                  <div className="bg-black/35 border border-cyan-500/15 rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-4 relative shadow-sm">
                    <div className="flex flex-wrap items-center gap-4 text-[8px] uppercase font-mono tracking-wider font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-cyan-400 rounded-sm" />
                        <span className="text-cyan-300">Baseline Cell</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-400 rounded-sm" />
                        <span className="text-emerald-400">Present Cell</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-red-500/35 border border-red-500/40 rounded-sm" />
                        <span className="text-red-400">Baseline Mutation (Overwritten)</span>
                      </div>
                      <div className="flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 bg-red-500/20 border border-yellow-400/45 rounded-sm" />
                        <span className="text-yellow-300">Stress Deviation Mutated Value</span>
                      </div>
                    </div>

                    <div className="text-[9px] font-mono text-cyan-300/90 bg-cyan-950/20 px-3 py-1 border border-cyan-500/10 rounded min-h-[16px] text-right font-bold w-full md:w-auto shadow-inner select-text">
                      {hoveredByteIndex ? (
                        <span>
                          [TRACING ADDR {baselineRows[hoveredByteIndex.rowIdx].offset} // COL {hoveredByteIndex.byteIdx}] &bull; Baseline: "{baselineRows[hoveredByteIndex.rowIdx].bytes.split(' ')[hoveredByteIndex.byteIdx]}" ({baselineRows[hoveredByteIndex.rowIdx].ascii[hoveredByteIndex.byteIdx]}) &rarr; Modern Present: "{presentRows[hoveredByteIndex.rowIdx].bytes.split(' ')[hoveredByteIndex.byteIdx]}" ({presentRows[hoveredByteIndex.rowIdx].ascii[hoveredByteIndex.byteIdx]})
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-semibold">[IDLE ADDRESS TRACER] Hover any hexadecimal memory block cell above for crosshair comparative debugging</span>
                      )}
                    </div>

                  </div>

                  {/* OVERLOAPPED DUAL GRAPH COMPARATIVE DATA VISUALIZER */}
                  <div className="border border-cyan-500/15 bg-cyan-950/5 rounded-lg p-4 flex flex-col gap-3 relative shadow-inner">
                    <div className="absolute top-2 right-2 text-[7px] text-cyan-500/35 font-mono uppercase tracking-widest">
                      [ DUAL TREND LINE OVERLAY MATRIX ]
                    </div>
                    <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-cyan-500/10 pb-1.5 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      Dual-Line Stress History Overlap Graph
                    </h3>

                    {/* Draw actual high-contrast SVG overlays comparing snapshots */}
                    <div className="relative bg-slate-900/40 border border-cyan-500/10 p-3 rounded h-32 flex flex-col justify-between">
                      <div className="absolute top-2 left-3 flex items-center gap-4 text-[7.5px] uppercase font-mono z-20 bg-black/60 px-2 py-1 rounded border border-cyan-500/5">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-0.5 bg-cyan-400 border-t border-dashed" />
                          <span className="text-cyan-400">Baseline History ({snapshot.traumaRating}%)</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-0.5 bg-emerald-400" />
                          <span className="text-emerald-400">Present History ({selectedFile.traumaRating}%)</span>
                        </span>
                      </div>

                      <div className="w-full h-full pt-6 relative px-8 flex-grow">
                        <svg className="w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
                          {/* Gridline bounds */}
                          <line x1="0" y1="0" x2="400" y2="0" stroke="rgba(16,185,129,0.06)" strokeDasharray="2" />
                          <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(16,185,129,0.06)" strokeDasharray="2" />
                          <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(16,185,129,0.08)" />

                          {/* Snap History path */}
                          {(() => {
                            const snapPoints = snapshot.history.map((val, i) => ({
                              x: (i / 11) * 400,
                              y: 60 - (val / 100) * 55
                            }));
                            const snapPathStr = snapPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                            return (
                              <path 
                                d={snapPathStr} 
                                fill="none" 
                                stroke="#22d3ee" 
                                strokeWidth="1.5" 
                                strokeDasharray="4 3" 
                                className="opacity-70"
                              />
                            );
                          })()}

                          {/* Present History path */}
                          {(() => {
                            const presPoints = presentHist.map((val, i) => ({
                              x: (i / 11) * 400,
                              y: 60 - (val / 100) * 55
                            }));
                            const presPathStr = presPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                            return (
                              <path 
                                d={presPathStr} 
                                fill="none" 
                                stroke={(selectedFile.traumaRating || 0) > 70 ? '#f87171' : '#34d399'} 
                                strokeWidth="2" 
                                className="drop-shadow-[0_0_4px_rgba(52,211,153,0.3)] animate-pulse"
                              />
                            );
                          })()}
                        </svg>

                        {/* X axis labels */}
                        <div className="absolute left-8 right-8 bottom-0 flex justify-between font-mono text-[6.5px] text-zinc-500 uppercase leading-none transform translate-y-1 select-none">
                          <span>T-44s</span>
                          <span>T-36s</span>
                          <span>T-28s</span>
                          <span>T-20s</span>
                          <span>T-12s</span>
                          <span>Active</span>
                        </div>

                        {/* Y axis labels */}
                        <div className="absolute -left-1 inset-y-0 pt-6 pb-2.5 flex flex-col justify-between font-mono text-[6.5px] text-zinc-500 select-none">
                          <span>100%</span>
                          <span>50%</span>
                          <span>0%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AUDIT SUMMARY & DELTA REPORT CARD */}
                  <div className="border border-cyan-500/20 bg-cyan-950/10 p-3 rounded-lg text-[10.5px]">
                    <div className="flex flex-col gap-2">
                      <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 leading-none">
                        <Info className="w-4 h-4 text-cyan-400" />
                        DEVIATION AUDIT INTEGRITY COMPARISON REPORT
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono mt-1 text-[10px]">
                        <div className="bg-black/20 p-2.5 border border-cyan-500/10 rounded">
                          <span className="text-zinc-400">BENCHMARK COMPUTE:</span>
                          <div className="text-white mt-1 uppercase font-bold text-[10px]">
                            {snapshot.anomalies.length} Flagged Threats
                          </div>
                        </div>
                        <div className="bg-black/20 p-2.5 border border-cyan-500/10 rounded">
                          <span className="text-zinc-400">PRESENT SESSION COUPLING:</span>
                          <div className={`mt-1 uppercase font-bold text-[10px] ${
                            presAnomalies.length > snapAnomalies.length ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                          }`}>
                            {presAnomalies.length} Active Threats
                          </div>
                        </div>
                        <div className="bg-black/20 p-2.5 border border-cyan-500/10 rounded">
                          <span className="text-zinc-400">INTEGRITY COMPARISON STATUS:</span>
                          <div className={`mt-1 uppercase font-bold text-[10px] ${
                            ratingDelta > 0 ? 'text-red-400 animate-pulse font-black' : 'text-cyan-400'
                          }`}>
                            {ratingDelta > 0 
                              ? `⚠️ INTEGRITY GAP ESCALATION (+${ratingDelta}%)`
                              : ratingDelta < 0
                                ? `✅ SUCCESSFUL REMISSION (${ratingDelta}%)`
                                : `⚖️ BASES ALIGNED (STABLE)`
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              );
            }
          })()}

          {/* Footer informational scanner text */}
          <footer className="border-t border-emerald-500/20 pt-3 flex flex-col md:flex-row items-center justify-between text-[9px] text-emerald-500/40 uppercase gap-2 flex-shrink-0 select-none font-bold">
            <span>Sovereign Security Platform // High Definition Audit Telemetry Terminal</span>
            <span>Index Status: REALTIME_CONNECTED // Decryption Key Strength: 4096-BIT CURVE</span>
          </footer>
        </div>
      )}
    </div>
  );
};
