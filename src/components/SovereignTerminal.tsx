import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { initialFilesystem, defaultBookmarks } from '../data';
import { Bookmark, DirectoryNode, ForensicLog, IngestedArtifact, WorkspaceSnapshot } from '../types';
import { BookmarkManager } from './BookmarkManager';
import { WorkspaceSnapshotManager } from './WorkspaceSnapshotManager';
import { DiagnosticSessionSidebar } from './DiagnosticSessionSidebar';
import { TraumaNodeVisualizer } from './TraumaNodeVisualizer';
import { ForensicHeatmap } from './ForensicHeatmap';
import { TelemetryPanel } from './TelemetryPanel';
import { CasingTraumaVisualizer } from './CasingTraumaVisualizer';
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
  RefreshCw,
  ChevronRight,
  ChevronDown,
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
   Unlock,
  Loader2,
  Edit3,
  MoreVertical,
  GripVertical,
  Flag,
  Tag,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { exportForensicPDFReport } from '../utils/pdfGenerator';

const getAnomalyThreatDetails = (anomaly: string) => {
  const text = anomaly.toUpperCase();
  if (
    text.includes('CRITICAL') || 
    text.includes('COLLAPSE') || 
    text.includes('BYPASS') || 
    text.includes('FAIL') || 
    text.includes('FAULT') || 
    text.includes('INTRUSION') || 
    text.includes('COMPROMISED') ||
    text.includes('IMMINENT')
  ) {
    return {
      severity: 'CRITICAL',
      colorClass: 'text-red-400',
      badgeClass: 'bg-red-500/15 border-red-500/35 text-red-400',
      glowShadow: 'shadow-[0_0_8px_rgba(239,68,68,0.25)]',
      borderClass: 'border-red-500/30 bg-red-950/20',
      dotColor: 'bg-red-500'
    };
  }
  if (
    text.includes('WARNING') || 
    text.includes('SHIFT') || 
    text.includes('MISMATCH') || 
    text.includes('UNSCHEDULED') || 
    text.includes('FRACTURE') || 
    text.includes('STRESS') || 
    text.includes('OVERFILL') || 
    text.includes('DEVIATION')
  ) {
    return {
      severity: 'WARNING',
      colorClass: 'text-amber-400',
      badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      glowShadow: 'shadow-[0_0_8px_rgba(245,158,11,0.2)]',
      borderClass: 'border-amber-500/25 bg-amber-950/15',
      dotColor: 'bg-amber-500'
    };
  }
  return {
    severity: 'INFO',
    colorClass: 'text-cyan-400',
    badgeClass: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
    glowShadow: 'shadow-[0_0_6px_rgba(6,182,212,0.15)]',
    borderClass: 'border-cyan-500/20 bg-cyan-950/10',
    dotColor: 'bg-cyan-500'
  };
};

const getScanAgeStatus = (lastScanned?: string) => {
  if (!lastScanned) {
    return { text: 'UNSCANNED', color: 'text-red-500/50 bg-red-950/20 border-red-500/20' };
  }
  
  try {
    const cleanScannedStr = lastScanned.replace(' UTC', '').trim();
    const scannedDate = new Date(cleanScannedStr);
    const referenceDate = new Date('2026-06-02T14:07:48Z');
    
    // Safe evaluation
    const activeCurrentDate = new Date().getTime() > referenceDate.getTime() ? new Date() : referenceDate;
    
    const diffMs = activeCurrentDate.getTime() - scannedDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 0) {
      return { text: 'FRESH', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
    }
    
    if (diffHours < 24) {
      return { text: 'FRESH', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
    } else if (diffHours < 72) {
      return { text: 'STALE', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' };
    } else {
      return { text: 'OUTDATED', color: 'text-red-400 bg-red-500/20 border-red-400/30' };
    }
  } catch (err) {
    return { text: 'AUDITED', color: 'text-emerald-500/60 bg-black/30 border-emerald-500/25' };
  }
};

export const SovereignTerminal: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/');

  const [rightPanelWeight, setRightPanelWeight] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('sovereign_terminal_right_panel_weight');
      return stored ? parseFloat(stored) : 4;
    } catch (e) {
      return 4;
    }
  });

  const [isLgScreen, setIsLgScreen] = useState(false);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsLgScreen(mq.matches);
    const listener = (e: MediaQueryListEvent) => {
      setIsLgScreen(e.matches);
    };
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const startResizing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.classList.add('cursor-col-resize', 'select-none');
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isResizingRef.current) return;
      
      let clientX = 0;
      if ('touches' in e) {
        if (e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
        } else {
          return;
        }
      } else {
        clientX = e.clientX;
      }

      const gridContainer = document.getElementById('node-explorer')?.parentElement;
      if (gridContainer) {
        const rect = gridContainer.getBoundingClientRect();
        const absoluteRight = rect.right;
        const totalWidth = rect.width;
        
        // Left side is approximately 25% of grid template columns (or 3/12 of total width).
        // Let's get the exact pixel width of the left side panel.
        const leftPanel = gridContainer.children[0];
        const leftWidth = leftPanel ? leftPanel.getBoundingClientRect().width : (totalWidth * 0.25);
        
        const remainingWidth = totalWidth - leftWidth - 16; // subtract small gap padding
        const rightWidthPixels = absoluteRight - clientX;
        
        const rightRatio = rightWidthPixels / remainingWidth;
        const newWeight = rightRatio * 9;
        
        // Constraints
        const constrainedWeight = Math.max(1.8, Math.min(6.2, newWeight));
        setRightPanelWeight(constrainedWeight);
        try {
          localStorage.setItem('sovereign_terminal_right_panel_weight', constrainedWeight.toString());
        } catch (err) {
          // ignore
        }
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.classList.remove('cursor-col-resize', 'select-none');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: true });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);
  
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
  
  // Right-click context menu states for explorer nodes
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
    node: DirectoryNode | null;
  }>({ x: 0, y: 0, visible: false, node: null });

  const [renameState, setRenameState] = useState<{
    visible: boolean;
    path: string;
    oldName: string;
    newName: string;
  }>({ visible: false, path: '', oldName: '', newName: '' });

  const [propertiesNode, setPropertiesNode] = useState<DirectoryNode | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('sovereign_terminal_expanded_paths');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sovereign_terminal_expanded_paths', JSON.stringify(expandedPaths));
    } catch (e) {
      console.error('Failed to save expanded paths to localStorage', e);
    }
  }, [expandedPaths]);
  const [nodeViewMode, setNodeViewMode] = useState<'tree' | 'trauma'>('tree');
  const [expandedTraumaGroups, setExpandedTraumaGroups] = useState({ critical: true, warning: true, stable: true });
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | 'inside' | null>(null);

  const lastNotificationTimesRef = useRef<Record<string, number>>({});
  const bookmarksRef = useRef<Bookmark[]>(defaultBookmarks);

  useEffect(() => {
    bookmarksRef.current = bookmarks;
  }, [bookmarks]);

  // Handle outside click to hide custom context menu
  useEffect(() => {
    const handleCloseMenu = () => {
      setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
    };
    window.addEventListener('click', handleCloseMenu);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
    };
  }, []);

  const deleteNodeFromFilesystem = (pathToDelete: string) => {
    if (pathToDelete === '/') return;

    const findAndRemove = (parent: DirectoryNode): boolean => {
      if (parent.children) {
        const idx = parent.children.findIndex(child => child.path === pathToDelete);
        if (idx !== -1) {
          parent.children.splice(idx, 1);
          return true;
        }
        for (const child of parent.children) {
          if (findAndRemove(child)) return true;
        }
      }
      return false;
    };

    findAndRemove(initialFilesystem);
    
    // Clear inspection if deleted
    if (selectedFile?.path === pathToDelete) {
      setSelectedFile(null);
    }
    setBatchSelectedPaths(prev => prev.filter(p => p !== pathToDelete));
    addLog(`Dismantled filesystem node from matrix registry: [${pathToDelete}]`, 'warning');
    setFilesystemUpdateTrigger(prev => prev + 1);
  };

  const updateDescendantPathsGlobal = (node: DirectoryNode, parentPath: string) => {
    const suffix = parentPath === '/' ? '' : parentPath;
    node.path = `${suffix}/${node.name}`;
    if (node.children) {
      node.children.forEach(child => updateDescendantPathsGlobal(child, node.path));
    }
  };

  const moveOrReorderNodeInFilesystem = (
    srcPath: string,
    targetPath: string,
    dropPosition: 'before' | 'after' | 'inside'
  ) => {
    if (srcPath === targetPath) return; // Cannot drop on itself
    
    // Prevent dragging a directory into its own sub-structure
    if (targetPath.startsWith(srcPath + '/')) {
      addLog(`Error: Cannot move a directory inside its own sub-directory hierarchy.`, 'error');
      return;
    }

    const findNodeAndParent = (
      root: DirectoryNode,
      tPath: string
    ): { node: DirectoryNode; parent: DirectoryNode | null; index: number } | null => {
      if (root.path === tPath) {
        return { node: root, parent: null, index: -1 };
      }
      if (root.children) {
        for (let i = 0; i < root.children.length; i++) {
          const child = root.children[i];
          if (child.path === tPath) {
            return { node: child, parent: root, index: i };
          }
          const found = findNodeAndParent(child, tPath);
          if (found) return found;
        }
      }
      return null;
    };

    const draggedInfo = findNodeAndParent(initialFilesystem, srcPath);
    const targetInfo = findNodeAndParent(initialFilesystem, targetPath);

    if (!draggedInfo || !draggedInfo.parent) {
      addLog(`Failed to locate source item metadata for path: [${srcPath}]`, 'error');
      return;
    }
    if (!targetInfo) {
      addLog(`Failed to locate target item metadata for path: [${targetPath}]`, 'error');
      return;
    }

    const { node: draggedNode, parent: draggedParent, index: draggedIndex } = draggedInfo;
    const { node: targetNode, parent: targetParent } = targetInfo;

    // Remove the dragged node from its current parent
    draggedParent.children?.splice(draggedIndex, 1);

    if (dropPosition === 'inside' && targetNode.type === 'directory') {
      // Move inside the target directory
      if (!targetNode.children) {
        targetNode.children = [];
      }
      targetNode.children.push(draggedNode);
      updateDescendantPathsGlobal(draggedNode, targetNode.path);
      
      addLog(`Moved sector [${draggedNode.name}] into folder: [${targetNode.path}]`, 'success');
    } else {
      // Sibling reorder or drop before/after
      if (!targetParent) {
        // Can't drop before/after root node
        return;
      }
      
      if (!targetParent.children) {
        targetParent.children = [];
      }

      // Re-find target index
      const actualTargetIndex = targetParent.children.findIndex(child => child.path === targetPath);
      if (actualTargetIndex === -1) {
        // Fallback: put back at original index
        draggedParent.children = draggedParent.children || [];
        draggedParent.children.splice(draggedIndex, 0, draggedNode);
        return;
      }

      let insertIndex = actualTargetIndex;
      if (dropPosition === 'after') {
        insertIndex = actualTargetIndex + 1;
      }

      targetParent.children.splice(insertIndex, 0, draggedNode);

      // If parent changed, update descendant paths
      if (draggedParent.path !== targetParent.path) {
        updateDescendantPathsGlobal(draggedNode, targetParent.path);
        addLog(`Relocated & Reordered [${draggedNode.name}] under parent: [${targetParent.name || 'ROOT'}]`, 'success');
      } else {
        addLog(`Reordered item [${draggedNode.name}] inside sector: [${draggedParent.name || 'ROOT'}]`, 'success');
      }
    }

    // Force re-render
    setFilesystemUpdateTrigger(prev => prev + 1);
  };

  const renameNodeInFilesystem = (pathToRename: string, newName: string) => {
    if (pathToRename === '/') return;
    if (!newName.trim()) return;

    const updateDescendantPaths = (node: DirectoryNode, parentPath: string) => {
      const suffix = parentPath === '/' ? '' : parentPath;
      node.path = `${suffix}/${node.name}`;
      if (node.children) {
        node.children.forEach(child => updateDescendantPaths(child, node.path));
      }
    };

    const findAndRename = (node: DirectoryNode): boolean => {
      if (node.path === pathToRename) {
        const oldName = node.name;
        node.name = newName;
        const parts = pathToRename.split('/');
        parts.pop();
        const parentPath = parts.join('/') || '/';
        
        updateDescendantPaths(node, parentPath);
        addLog(`System registry update: renamed [${oldName}] to [${newName}]`, 'success');
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (findAndRename(child)) return true;
        }
      }
      return false;
    };

    findAndRename(initialFilesystem);
    
    // Update inspection panel selection reference
    setSelectedFile(prev => {
      if (prev && prev.path === pathToRename) {
        const parts = pathToRename.split('/');
        parts.pop();
        const parentPath = parts.join('/') || '/';
        const nextPath = `${parentPath === '/' ? '' : parentPath}/${newName}`;
        return { ...prev, name: newName, path: nextPath };
      }
      return prev;
    });

    setBatchSelectedPaths(prev => prev.map(p => {
      if (p === pathToRename) {
        const parts = pathToRename.split('/');
        parts.pop();
        const parentPath = parts.join('/') || '/';
        return `${parentPath === '/' ? '' : parentPath}/${newName}`;
      }
      return p;
    }));

    setFilesystemUpdateTrigger(prev => prev + 1);
  };

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

  const addIngestedFileToFolder = (targetFolderPath: string, file: File) => {
    const hasAnomalies = Math.random() > 0.45;
    const traumaRating = hasAnomalies ? Math.floor(Math.random() * 41) + 60 : Math.floor(Math.random() * 30);
    const anomalies = hasAnomalies 
      ? ['Logic Fault / Integrity Compromised on drag bypass', 'MD5 signature mismatch on auth gate']
      : [];

    const newFileNode: DirectoryNode = {
      name: file.name,
      path: '',
      type: 'file',
      size: `${(file.size / 1024).toFixed(1)} KB`,
      traumaRating,
      anomalies,
      lastModified: new Date().toISOString().slice(0, 10),
      lastScanned: new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC'
    };

    const findFolderAndInsert = (node: DirectoryNode): boolean => {
      if (node.path === targetFolderPath && node.type === 'directory') {
        if (!node.children) {
          node.children = [];
        }
        
        let baseName = file.name;
        let suffix = 1;
        while (node.children.some(child => child.name === baseName)) {
          const extIdx = file.name.lastIndexOf('.');
          if (extIdx !== -1) {
            baseName = `${file.name.substring(0, extIdx)}_${suffix}${file.name.substring(extIdx)}`;
          } else {
            baseName = `${file.name}_${suffix}`;
          }
          suffix++;
        }
        newFileNode.name = baseName;
        const prefix = targetFolderPath === '/' ? '' : targetFolderPath;
        newFileNode.path = `${prefix}/${baseName}`;
        node.children.push(newFileNode);
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (findFolderAndInsert(child)) return true;
        }
      }
      return false;
    };

    const inserted = findFolderAndInsert(initialFilesystem);
    if (inserted) {
      const newArtifact: IngestedArtifact = {
        id: 'art-' + Math.floor(Math.random() * 10000),
        name: newFileNode.name,
        size: newFileNode.size || '0 KB',
        type: file.type || 'application/octet-stream',
        hash: Array.from({length: 32}, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
        status: hasAnomalies ? 'corrupted' : 'completed',
        anomaliesCount: anomalies.length,
        detectedThreats: anomalies,
        ingestTime: new Date().toISOString().slice(11, 19) + ' UTC'
      };
      setIngestedArtifacts(prev => [newArtifact, ...prev]);
      addLog(`Audited asset [${newFileNode.name}] ingested directly into folder sector: [${targetFolderPath}] with trauma rating ${traumaRating}%`, hasAnomalies ? 'warning' : 'success');
      setFilesystemUpdateTrigger(prev => prev + 1);
    } else {
      addLog(`Failed to ingest dropped file: targeted folder [${targetFolderPath}] is invalid.`, 'error');
    }
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

  const isRecentNode = (node: DirectoryNode): boolean => {
    if (node.type !== 'file') return false;

    const parseTimeToMs = (timeStr?: string): number | null => {
      if (!timeStr) return null;
      let normalized = timeStr.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        normalized = `${normalized}T00:00:00.000Z`;
      } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
        normalized = `${normalized.replace(' ', 'T')}Z`;
      } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC$/.test(normalized)) {
        normalized = `${normalized.replace(' UTC', '').replace(' ', 'T')}Z`;
      }
      const parsed = Date.parse(normalized);
      return isNaN(parsed) ? null : parsed;
    };

    const modifiedMs = parseTimeToMs(node.lastModified);
    const scannedMs = parseTimeToMs(node.lastScanned);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    const isModRecent = modifiedMs !== null && modifiedMs >= oneHourAgo;
    const isScanRecent = scannedMs !== null && scannedMs >= oneHourAgo;

    return isModRecent || isScanRecent;
  };

  const hasRecentDescendant = (n: DirectoryNode): boolean => {
    if (!n.children) return false;
    return n.children.some(child => {
      return isRecentNode(child) || hasRecentDescendant(child);
    });
  };

  const [ingestedArtifacts, setIngestedArtifacts] = useState<IngestedArtifact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentFilterActive, setRecentFilterActive] = useState(false);
  const [forensicLogs, setForensicLogs] = useState<ForensicLog[]>([
    { id: 'l1', timestamp: '21:04:12 UTC', message: 'Brahan Sovereign Kernel booted successfully.', type: 'success' },
    { id: 'l2', timestamp: '21:04:20 UTC', message: 'Holographic TraumaNode Rig alignment active [Sector Alpha].', type: 'info' },
    { id: 'l3', timestamp: '21:05:01 UTC', message: 'Security scan complete: 0 unlogged bypass signatures.', type: 'success' }
  ]);
  const [selectedFile, setSelectedFile] = useState<DirectoryNode | null>(null);
  const selectedFileRef = useRef<DirectoryNode | null>(null);
  useEffect(() => {
    selectedFileRef.current = selectedFile;
  }, [selectedFile]);

  const [lockedFilePath, setLockedFilePath] = useState<string | null>(null);
  const [batchSelectedPaths, setBatchSelectedPaths] = useState<string[]>([]);
  const [showCombinedAuditModal, setShowCombinedAuditModal] = useState(false);

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
  const [flaggedFiles, setFlaggedFiles] = useState<Record<string, boolean>>({});
  const [fileTags, setFileTags] = useState<Record<string, string[]>>({});

  const selectedFilesForReport = useMemo(() => {
    const list: DirectoryNode[] = [];
    const traverse = (node: DirectoryNode) => {
      if (batchSelectedPaths.includes(node.path)) {
        list.push(node);
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(initialFilesystem);
    return list;
  }, [batchSelectedPaths, initialFilesystem, filesystemUpdateTrigger]);

  const selectedFilesReportStats = useMemo(() => {
    const files = selectedFilesForReport;
    if (files.length === 0) {
      return {
        total: 0,
        fileCount: 0,
        meanStress: 0,
        quarantinedCount: 0,
        flaggedCount: 0,
        anomalyCount: 0,
        scannedCount: 0
      };
    }

    const fileOnlyList = files.filter(f => f.type === 'file');
    const count = fileOnlyList.length;
    if (count === 0) {
      return {
        total: files.length,
        fileCount: 0,
        meanStress: 0,
        quarantinedCount: 0,
        flaggedCount: 0,
        anomalyCount: 0,
        scannedCount: 0
      };
    }

    let totalStress = 0;
    let quarantinedCount = 0;
    let flaggedCount = 0;
    let anomalyCount = 0;
    let scannedCount = 0;

    fileOnlyList.forEach(f => {
      totalStress += f.traumaRating ?? 0;
      if (quarantinedFiles[f.path]) quarantinedCount++;
      if (flaggedFiles[f.path]) flaggedCount++;
      anomalyCount += f.anomalies?.length ?? 0;
      if (f.lastScanned) scannedCount++;
    });

    return {
      total: files.length,
      fileCount: count,
      meanStress: Math.round(totalStress / count),
      quarantinedCount,
      flaggedCount,
      anomalyCount,
      scannedCount
    };
  }, [selectedFilesForReport, quarantinedFiles, flaggedFiles, filesystemUpdateTrigger]);
  const [customTimelineEvents, setCustomTimelineEvents] = useState<Record<string, {
    id: string;
    timestamp: string;
    type: 'creation' | 'mutation' | 'anomaly' | 'quarantine' | 'sanitization' | 'audit' | 'tag' | 'simulation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    operator: string;
  }[]>>({});
  const [timelineSimulationIncident, setTimelineSimulationIncident] = useState('MALICIOUS_OVERFLOW');
  const [bulkTagInputValue, setBulkTagInputValue] = useState('');
  const [showTraumaChart, setShowTraumaChart] = useState(true);
  const [showPredictiveAnalysis, setShowPredictiveAnalysis] = useState(false);
  const [terminalTheme, setTerminalTheme] = useState<'emerald' | 'crimson'>(() => {
    try {
      const stored = localStorage.getItem('sovereign_terminal_theme');
      return (stored === 'emerald' || stored === 'crimson') ? stored : 'emerald';
    } catch (e) {
      return 'emerald';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sovereign_terminal_theme', terminalTheme);
    } catch (e) {
      console.error('Failed to save terminal theme to localStorage', e);
    }
  }, [terminalTheme]);

  // ===================================================================================
  // Unified Theme and Diagnostic Profile Synchronization Service
  // Dynamically updates telemetry line charts, grid intensity, and CSS variables across the terminal
  // ===================================================================================
  useEffect(() => {
    const root = document.documentElement;
    const severity = selectedFile 
      ? (selectedFile.traumaRating ?? 0) > 70 
        ? 'severe' 
        : (selectedFile.traumaRating ?? 0) > 30 
          ? 'warning' 
          : 'nominal'
      : 'nominal';

    let primaryColorRgb = '16, 185, 129'; // emerald rgb
    let primaryColorHex = '#10b981';
    let chartLineHex = '#34d399';
    let gridStrokeColor = 'rgba(16, 185, 129, 0.06)';
    let gridOpacity = '0.06';
    let crtColorRgb = '16, 185, 129';
    let glowColorStr = 'rgba(16, 185, 129, 0.15)';
    let gridIntensityMode = 'NOMINAL_GREEN_GRID';

    // 1. Base theme mapping (e.g., standard green vs. high-severity crimson)
    if (terminalTheme === 'crimson') {
      primaryColorRgb = '239, 68, 68'; // crimson rgb
      primaryColorHex = '#f43f5e';
      chartLineHex = '#f87171';
      gridStrokeColor = 'rgba(248, 113, 113, 0.08)';
      gridOpacity = '0.08';
      crtColorRgb = '239, 68, 68';
      glowColorStr = 'rgba(225, 29, 72, 0.18)';
      gridIntensityMode = 'NOMINAL_CRIMSON_GRID';
    }

    // 2. Override based on selected Diagnostic Anomaly Severity Profile
    if (severity === 'severe') {
      primaryColorRgb = '220, 38, 38'; // red-600
      primaryColorHex = '#dc2626';
      chartLineHex = '#dc2626';
      gridStrokeColor = 'rgba(239, 68, 68, 0.28)';
      gridOpacity = '0.28';
      crtColorRgb = '220, 38, 38';
      glowColorStr = 'rgba(239, 68, 68, 0.28)';
      gridIntensityMode = 'HIGH_ALERT_CRIMSON_CRITICAL';
    } else if (severity === 'warning') {
      primaryColorRgb = '245, 158, 11'; // amber-500
      primaryColorHex = '#f59e0b';
      chartLineHex = '#f59e0b';
      gridStrokeColor = 'rgba(245, 158, 11, 0.16)';
      gridOpacity = '0.16';
      crtColorRgb = '245, 158, 11';
      glowColorStr = 'rgba(245, 158, 11, 0.20)';
      gridIntensityMode = 'ALERT_AMBER_WARNING';
    }

    // 3. Set global CSS custom attributes directly to root style
    root.style.setProperty('--crt-color-rgb', crtColorRgb);
    root.style.setProperty('--glow-color', glowColorStr);
    root.style.setProperty('--theme-primary-rgb', primaryColorRgb);
    root.style.setProperty('--theme-primary-hex', primaryColorHex);
    root.style.setProperty('--theme-chart-line-hex', chartLineHex);
    root.style.setProperty('--theme-grid-stroke', gridStrokeColor);
    root.style.setProperty('--theme-grid-opacity', gridOpacity);
    root.style.setProperty('--theme-grid-intensity-mode', gridIntensityMode);

    // Toggle global CSS theme-crimson class on html element for unified tailwind color override propagation
    root.classList.toggle('theme-crimson', terminalTheme === 'crimson');

    addLog(`[THEME SYNCHRONIZER] Alignment complete: Grid density Mode="${gridIntensityMode}" (Alpha=${gridOpacity}), Waveform Color: [${chartLineHex}]. CSS custom variables updated.`, severity === 'severe' ? 'error' : severity === 'warning' ? 'warning' : 'success');
  }, [terminalTheme, selectedFile?.path, selectedFile?.traumaRating]);

  // Workspace Snapshots Persistence and State Provider
  const [snapshots, setSnapshots] = useState<WorkspaceSnapshot[]>(() => {
    try {
      const stored = localStorage.getItem('sovereign_terminal_workspace_snapshots');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sovereign_terminal_workspace_snapshots', JSON.stringify(snapshots));
    } catch (e) {
      console.error('Failed to save snapshots to localStorage', e);
    }
  }, [snapshots]);

  const [isSessionSidebarOpen, setIsSessionSidebarOpen] = useState(false);

  const handleLoadFileByPath = (pathStr: string) => {
    const findNodeByPath = (node: DirectoryNode, targetPath: string): DirectoryNode | null => {
      if (node.path === targetPath) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNodeByPath(child, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    const targetNode = findNodeByPath(initialFilesystem, pathStr);
    if (targetNode) {
      setSelectedFile(targetNode);
      const parentParts = pathStr.split('/');
      parentParts.pop();
      const parentPath = parentParts.join('/') || '/';
      setCurrentPath(parentPath);
    } else {
      setSelectedFile({
        name: pathStr.split('/').pop() || 'Untitled File',
        path: pathStr,
        type: 'file',
        lastModified: new Date().toISOString().replace('T', ' ').slice(0, 10),
        traumaRating: 0
      });
    }
  };

  const handleSaveSnapshot = (name: string) => {
    const formattedToday = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const activeTelemetry = (window as any).wellTegraTelemetryReportData;

    const newSnap: WorkspaceSnapshot = {
      id: `snap-${Date.now()}`,
      name,
      timestamp: formattedToday,
      selectedFilePath: selectedFile ? selectedFile.path : null,
      nodeViewMode,
      terminalTheme,
      rightPanelWeight,
      expandedPaths,
      isLeakScannerEnabled: activeTelemetry?.isLeakScannerEnabled,
      leakPressureThreshold: activeTelemetry?.leakPressureThreshold,
      leakTempDropThreshold: activeTelemetry?.leakTempDropThreshold
    };

    setSnapshots(prev => [...prev, newSnap]);
    addLog(`Captured workspace snapshot record: [${name}]`, 'success');
  };

  const handleLoadSnapshot = (snap: WorkspaceSnapshot) => {
    // 1. Theme Configuration
    setTerminalTheme(snap.terminalTheme);

    // 2. Main View Mode (Tree/Trauma)
    setNodeViewMode(snap.nodeViewMode);

    // 3. Folder Expansion Structure
    setExpandedPaths(snap.expandedPaths);

    // 4. Panel Layout Weights
    setRightPanelWeight(snap.rightPanelWeight);

    // 5. Restore Currently Selected File reference
    if (snap.selectedFilePath) {
      const findNodeByPath = (node: DirectoryNode, pathStr: string): DirectoryNode | null => {
        if (node.path === pathStr) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = findNodeByPath(child, pathStr);
            if (found) return found;
          }
        }
        return null;
      };

      const targetNode = findNodeByPath(initialFilesystem, snap.selectedFilePath);
      if (targetNode) {
        setSelectedFile(targetNode);
      } else {
        setSelectedFile({
          name: snap.selectedFilePath.split('/').pop() || 'Untitled File',
          path: snap.selectedFilePath,
          type: 'file',
          lastModified: new Date().toISOString().replace('T', ' ').slice(0, 10),
          traumaRating: 0
        });
      }
    } else {
      setSelectedFile(null);
    }

    // 6. Support for restoring background leak configurations if exists
    if (snap.isLeakScannerEnabled !== undefined && (window as any).wellTegraTelemetryReportData) {
      (window as any).wellTegraTelemetryReportData.isLeakScannerEnabled = snap.isLeakScannerEnabled;
      if (snap.leakPressureThreshold !== undefined) {
        (window as any).wellTegraTelemetryReportData.leakPressureThreshold = snap.leakPressureThreshold;
      }
      if (snap.leakTempDropThreshold !== undefined) {
        (window as any).wellTegraTelemetryReportData.leakTempDropThreshold = snap.leakTempDropThreshold;
      }
    }

    addLog(`Operator command: restored saved workspace state [${snap.name}]`, 'success');
  };

  const handleRemoveSnapshot = (id: string) => {
    setSnapshots(prev => {
      const target = prev.find(s => s.id === id);
      if (target) {
        addLog(`Purged workspace snapshot: [${target.name}]`, 'warning');
      }
      return prev.filter(s => s.id !== id);
    });
  };

  const maxTraumaRating = useMemo(() => {
    let max = 0;
    const traverse = (node: DirectoryNode) => {
      if (node.type === 'file' && node.traumaRating !== undefined) {
        if (node.traumaRating > max) {
          max = node.traumaRating;
        }
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(initialFilesystem);
    return max;
  }, [initialFilesystem, filesystemUpdateTrigger]);

  const getPredictiveRiskScore = (node: DirectoryNode): number => {
    let score = 15; // base probability percentage
    
    if (node.type === 'directory') {
      if (node.path.includes('/sys') || node.path.includes('/kernel')) score += 20;
      if (node.path.includes('/var/log')) score += 25;
      return Math.min(95, score);
    }

    // Heuristics based on file name or type
    const extension = node.name.split('.').pop() || '';
    if (['conf', 'sys', 'bin', 'err'].includes(extension)) {
      score += 25; // system configuration/binary/errors are riskier
    } else if (['log'].includes(extension)) {
      score += 15;
    }

    if (node.traumaRating && node.traumaRating > 0) {
      score += node.traumaRating * 0.45; // higher current trauma -> higher future risk
    }

    if (node.anomalies && node.anomalies.length > 0) {
      score += node.anomalies.length * 15;
    }

    if (quarantinedFiles[node.path]) {
      score += 20; // isolation indicates strong active risk context
    }

    if (flaggedFiles[node.path]) {
      score += 15; // flagged files have high priority security interest
    }

    const tags = fileTags[node.path] || [];
    if (tags.length > 0) {
      tags.forEach(t => {
        const lower = t.toLowerCase();
        if (lower.includes('threat') || lower.includes('malicious') || lower.includes('overflow') || lower.includes('corruption') || lower.includes('critical')) {
          score += 25;
        } else {
          score += 5;
        }
      });
    }

    // Time-based risk factors: never audited means high uncertainty probability
    if (!node.lastScanned) {
      score += 20;
    }

    // Path indicators
    if (node.path.includes('/sys') || node.path.includes('/kernel')) {
      score += 15;
    }

    // Deterministic variability based on name length to ensure it looks dynamic and realistic
    score += (node.name.length % 5) * 3;

    return Math.min(100, Math.max(5, Math.round(score)));
  };

  const getTraumaHistory = (path: string, currentRating: number) => {
    const recorded = traumaHistory[path] || [];
    if (recorded.length >= 5) {
      return recorded.slice(-5);
    }
    const completedHistory = [];
    let hash = 0;
    for (let i = 0; i < path.length; i++) {
      hash = (hash << 5) - hash + path.charCodeAt(i);
      hash |= 0;
    }
    for (let i = 0; i < 5; i++) {
      const timeOffset = (5 - i) * 8000;
      const timestampVal = Date.now() - timeOffset;
      const wiggle = Math.sin(hash + i) * 6;
      let histRating = Math.max(0, Math.min(100, Math.round(currentRating + wiggle)));
      if (i === 4) {
        histRating = currentRating;
      }
      completedHistory.push({
        timestamp: timestampVal,
        rating: histRating
      });
    }
    const result = [...completedHistory];
    const recordedCount = recorded.length;
    for (let idx = 0; idx < recordedCount; idx++) {
      const targetIdx = 4 - (recordedCount - 1 - idx);
      if (targetIdx >= 0 && targetIdx < 5) {
        result[targetIdx] = {
          timestamp: recorded[idx].timestamp,
          rating: recorded[idx].rating
        };
      }
    }
    return result;
  };

  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [isScanningDirect, setIsScanningDirect] = useState(false);
  const pristineBackupRef = useRef<DirectoryNode | null>(null);

  const getForensicTimelineEvents = (file: DirectoryNode) => {
    const path = file.path;
    const customList = customTimelineEvents[path] || [];
    
    // Generate deterministic baseline events matching the file name & initial parameters
    const threatRating = file.traumaRating ?? 0;
    
    type ForensicTimelineItem = {
      id: string;
      timestamp: string;
      type: 'creation' | 'mutation' | 'anomaly' | 'quarantine' | 'sanitization' | 'audit' | 'tag' | 'simulation';
      severity: 'low' | 'medium' | 'high' | 'critical';
      title: string;
      description: string;
      operator: string;
    };

    const baselineEvents: ForensicTimelineItem[] = [
      {
        id: 'base-ingest',
        timestamp: '2026-06-01 09:12:45 UTC',
        type: 'creation',
        severity: 'low',
        title: 'INITIAL SECTOR INGESTION',
        description: `Source sector aligned. File structural allocation allocated under metadata block. Size: ${file.size || 'DYN_ALLOCATED'}.`,
        operator: 'SYSTEM_DAEMON'
      },
      {
        id: 'base-sign',
        timestamp: '2026-06-01 14:32:10 UTC',
        type: 'audit',
        severity: (threatRating > 30 ? 'medium' : 'low') as 'medium' | 'low',
        title: 'BENCHMARK SIGNATURE AUDIT',
        description: `Initial filesystem handshake. Present distortion factor listed at ${Math.max(5, Math.ceil(threatRating * 0.4))}% resonance coupling.`,
        operator: 'SYS_AUDITOR_B'
      }
    ];

    // If there is stress/trauma rating, add a stress event
    if (threatRating > 20) {
      const isCritical = threatRating > 70;
      baselineEvents.unshift({
        id: 'base-trauma-spike',
        timestamp: '2026-06-02 01:20:44 UTC',
        type: 'mutation',
        severity: isCritical ? 'critical' : 'medium',
        title: 'DISTRESS DEVIATION ENCOUNTERED',
        description: `Thermal pressure stress anomaly registered in active cluster. Structural stress level increased to ${threatRating}%.`,
        operator: 'SECTOR_CRITICAL_MONITOR'
      });
    }

    // Add events for current anomalies
    if (file.anomalies && file.anomalies.length > 0) {
      file.anomalies.forEach((anom, idx) => {
        const isCritical = anom.toUpperCase().includes('CRITICAL') || anom.toUpperCase().includes('COLLAPSE') || anom.toUpperCase().includes('BYPASS');
        baselineEvents.unshift({
          id: `base-anomaly-${idx}-${anom}`,
          timestamp: `2026-06-02 08:44:1${idx} UTC`,
          type: 'anomaly',
          severity: isCritical ? 'critical' : 'high',
          title: 'ANOMALOUS ACTIVITY REGISTERED',
          description: `Telemetry scanner warning flag raised: [${anom}]. Integrity unit quarantined path access until resolution.`,
          operator: 'INTEGRITY_DAEMON'
        });
      });
    }

    // If currently flagged
    if (flaggedFiles[path]) {
      baselineEvents.unshift({
        id: 'user-flag-active',
        timestamp: 'Active Session Log',
        type: 'anomaly',
        severity: 'high',
        title: '🚩 MANUAL HIGH-RISK FLAG SET',
        description: 'Operator tagged file as priority threat target. Enhanced monitoring probe attached.',
        operator: 'SECURE_OPERATOR'
      });
    }

    // If currently quarantined
    if (quarantinedFiles[path]) {
      baselineEvents.unshift({
        id: 'user-quarantine-active',
        timestamp: 'Active Session Log',
        type: 'quarantine',
        severity: 'critical',
        title: '🔒 ISOLATION QUARANTINE PROTOCOL',
        description: 'Sector relocated to read-only sandboxed lockbox. External interface pipelines shut down.',
        operator: 'SYS_ADMIN'
      });
    }

    // If file tags are present
    const tags = fileTags[path] || [];
    if (tags.length > 0) {
      baselineEvents.unshift({
        id: 'tags-applied-active',
        timestamp: 'Active Session Log',
        type: 'tag',
        severity: 'low',
        title: '🏷️ METADATA IDENTIFICATION TAGGED',
        description: `Metadata descriptors updated: "${tags.join(', ')}". Tags cataloged inside crawled registry.`,
        operator: 'CRAWL_SCANNER'
      });
    }

    return [...customList, ...baselineEvents];
  };

  const injectTraumaIncident = (type: string) => {
    if (!selectedFile) return;
    const path = selectedFile.path;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    
    let traumaDelta = 0;
    let eventTitle = '';
    let eventDesc = '';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let newAnomaly: string | null = null;

    switch (type) {
      case 'MALICIOUS_OVERFLOW':
        traumaDelta = 25;
        eventTitle = 'HEAP OVERFLOW CORRUPTION';
        eventDesc = 'A remote telemetry payload exceeded buffer thresholds. Injected memory pointers triggered stress destabilization.';
        severity = 'critical';
        newAnomaly = 'Corrupt Memory Pointer Injection';
        break;
      case 'AUDIT_RESET':
        traumaDelta = -20;
        eventTitle = 'THERMAL PURGE & REBUILDS';
        eventDesc = 'System core sanitized. Restored baseline clock cycles and aligned sector entropy.';
        severity = 'low';
        break;
      case 'INTEGRITY_COMPROMISE':
        traumaDelta = 15;
        eventTitle = 'PARITY VERIFICATION FAILURE';
        eventDesc = 'Sector checksum signature did not match baseline key. Metadata block misaligned.';
        severity = 'high';
        newAnomaly = 'Hash Parity Integrity Alert';
        break;
      case 'SECURITY_INTRUSION':
        traumaDelta = 35;
        eventTitle = 'INTRUSION BYPASS HANDSHAKE';
        eventDesc = 'Foreign execution credential attempted illegal read pipeline mapping without authorization.';
        severity = 'critical';
        newAnomaly = 'Illegal Sector Cipher Access Attempt';
        break;
      default:
        traumaDelta = 10;
        eventTitle = 'TELEMETRY STRESS CONGESTION';
        eventDesc = 'Simulated distress index increase caused by dynamic sector workload.';
        severity = 'low';
    }

    // Traverse and update tree
    const updateNode = (node: DirectoryNode): boolean => {
      if (node.path === path) {
        const rating = node.traumaRating ?? 0;
        node.traumaRating = Math.max(0, Math.min(100, rating + traumaDelta));
        if (newAnomaly) {
          if (!node.anomalies) node.anomalies = [];
          if (!node.anomalies.includes(newAnomaly)) {
            node.anomalies.push(newAnomaly);
          }
        } else if (type === 'AUDIT_RESET') {
          node.anomalies = [];
        }
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (updateNode(child)) return true;
        }
      }
      return false;
    };

    updateNode(initialFilesystem);

    // Update selectedFile state
    setSelectedFile(prev => {
      if (prev && prev.path === path) {
        const currentRating = prev.traumaRating ?? 0;
        const nextRating = Math.max(0, Math.min(100, currentRating + traumaDelta));
        let nextAnomalies = prev.anomalies ? [...prev.anomalies] : [];
        if (newAnomaly && !nextAnomalies.includes(newAnomaly)) {
          nextAnomalies.push(newAnomaly);
        } else if (type === 'AUDIT_RESET') {
          nextAnomalies = [];
        }
        return {
          ...prev,
          traumaRating: nextRating,
          anomalies: nextAnomalies
        };
      }
      return prev;
    });

    const newEvent = {
      id: `sim-event-${Date.now()}`,
      timestamp: nowStr,
      type: 'simulation' as const,
      severity,
      title: eventTitle,
      description: eventDesc,
      operator: 'FORENSIC_AGENT_SIMULATOR'
    };

    setCustomTimelineEvents(prev => {
      const existing = prev[path] || [];
      return {
        ...prev,
        [path]: [newEvent, ...existing]
      };
    });

    setFilesystemUpdateTrigger(prev => prev + 1);

    addLog(`Forensic event registered for [${selectedFile.name}]: ${eventTitle}`, severity === 'critical' ? 'error' : severity === 'high' ? 'warning' : 'success');
  };

  useEffect(() => {
    if (!pristineBackupRef.current) {
      const deepClone = (node: DirectoryNode): DirectoryNode => {
        const copy: DirectoryNode = { ...node };
        if (node.children) {
          copy.children = node.children.map(deepClone);
        }
        if (node.anomalies) {
          copy.anomalies = [...node.anomalies];
        }
        return copy;
      };
      pristineBackupRef.current = deepClone(initialFilesystem);
    }
  }, []);
  const [rebuildingFile, setRebuildingFile] = useState<string | null>(null);
  const isScanningActive = isScanningDirect || rebuildingFile !== null || batchRebuildingPaths.length > 0;
  const [hoveredNode, setHoveredNode] = useState<DirectoryNode | null>(null);
  const [timeStr, setTimeStr] = useState('');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeAlert, setActiveAlert] = useState(false);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
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
    let logs = forensicLogs;
    if (logFilter !== 'all') {
      logs = logs.filter(log => log.type === logFilter);
    }
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase().trim();
      logs = logs.filter(log => {
        const msgMatch = log.message.toLowerCase().includes(q);
        const timeMatch = log.timestamp.toLowerCase().includes(q);
        const typeMatch = log.type.toLowerCase().includes(q);
        
        // Check for bracket-enclosed categorical tags (e.g. "[FOCUS SYSTEM]", "[TELEMETRY]")
        const bracketTags: string[] = [];
        const bracketRegex = /\[([^\]]+)\]/g;
        let match;
        while ((match = bracketRegex.exec(log.message)) !== null) {
          bracketTags.push(match[1].toLowerCase());
        }
        const tagMatch = bracketTags.some(tag => tag.includes(q));

        return msgMatch || timeMatch || typeMatch || tagMatch;
      });
    }
    return logs;
  }, [forensicLogs, logFilter, logSearchQuery]);

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

        const filesToProcess = [...bookmarkedFiles];
        if (selectedFileRef.current && selectedFileRef.current.type === 'file') {
          if (!filesToProcess.some(bf => bf.path === selectedFileRef.current!.path)) {
            filesToProcess.push(selectedFileRef.current);
          }
        }

        filesToProcess.forEach(file => {
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
    const uniqueId = `log-${Date.now()}-${Math.floor(Math.random() * 10000000)}`;
    setForensicLogs(prev => [
      ...prev,
      { id: uniqueId, timestamp: ts, message, type }
    ]);
  };

  // 3.5 Global Keyboard Shortcut Controls Listener for Navigation Efficiency
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape -> Clear Active Selections and blurs active inputs
      if (e.key === 'Escape' || e.key === 'Esc') {
        setSelectedFile(null);
        setShowCombinedAuditModal(false);
        setShowClearConfirmation(false);
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        addLog("[NAVIGATION] Keyboard directive 'ESC' registered. Resetting active element focus & active inspection panels.", 'info');
      }

      // Ctrl + T (or Cmd + T on macOS) -> Telemetry Panel auto-focus / smooth scroll
      if ((e.ctrlKey || e.metaKey) && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        const telemetryEl = document.getElementById('telemetry-panel');
        if (telemetryEl) {
          telemetryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          telemetryEl.classList.add('ring-2', 'ring-cyan-400', 'shadow-[0_0_25px_rgba(6,182,212,0.45)]');
          addLog("[NAVIGATION] Keyboard hotkey 'Ctrl+T' registered. Rolling viewport refocus to Telemetry Monitoring Panel.", 'success');
          setTimeout(() => {
            telemetryEl.classList.remove('ring-2', 'ring-cyan-400', 'shadow-[0_0_25px_rgba(6,182,212,0.45)]');
          }, 1500);
        }
      }

      // Ctrl + F (or Cmd + F on macOS) -> Forensic Log Terminal auto-focus / search activation
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        const loggerEl = document.getElementById('black-box-forensic-logger');
        if (loggerEl) {
          loggerEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
          loggerEl.classList.add('ring-2', 'ring-emerald-400', 'shadow-[0_0_25px_rgba(16,185,129,0.45)]');
          addLog("[NAVIGATION] Keyboard hotkey 'Ctrl+F' registered. Anchored viewport focus to Black Box Forensic Log stream.", 'success');
          
          const searchInput = document.getElementById('forensic-log-search');
          if (searchInput) {
            searchInput.focus();
            if (searchInput instanceof HTMLInputElement) {
              searchInput.select();
            }
          }
          
          setTimeout(() => {
            loggerEl.classList.remove('ring-2', 'ring-emerald-400', 'shadow-[0_0_25px_rgba(16,185,129,0.45)]');
          }, 1500);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setSelectedFile, setShowCombinedAuditModal, setShowClearConfirmation]);

  // Auto-Scan interval simulation
  useEffect(() => {
    if (!autoScanEnabled) return;

    // Run a scan immediately and then every 4.5 seconds
    const runScan = () => {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      const allFiles: DirectoryNode[] = [];
      const collectFiles = (node: DirectoryNode) => {
        if (node.type === 'file') {
          allFiles.push(node);
        } else if (node.children) {
          node.children.forEach(collectFiles);
        }
      };
      collectFiles(initialFilesystem);

      if (allFiles.length > 0) {
        // Pick 2 random files to update
        const numToScan = Math.min(2, allFiles.length);
        const shuffled = [...allFiles].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, numToScan);
        
        selected.forEach(file => {
          file.lastScanned = nowStr;
        });

        // Also trigger an update for the UI and any dependent states/useMemos
        setFilesystemUpdateTrigger(prev => prev + 1);
        
        addLog(`[AUTO-SCAN] Deep scan audited: ${selected.map(f => f.name).join(', ')} - Integrity status FRESH.`, 'info');
      }
    };

    runScan();
    const interval = setInterval(runScan, 4500);

    return () => clearInterval(interval);
  }, [autoScanEnabled]);

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
    const query = searchQuery.trim().toLowerCase();
    
    const matchesFilters = (n: DirectoryNode): boolean => {
      if (n.type === 'file') {
        const matchesQuery = !query || n.name.toLowerCase().includes(query) || n.path.toLowerCase().includes(query) || (fileTags[n.path] || []).some(tag => tag.toLowerCase().includes(query));
        const matchesRecent = !recentFilterActive || isRecentNode(n);
        return matchesQuery && matchesRecent;
      } else {
        return n.children?.some(child => matchesFilters(child)) ?? false;
      }
    };

    const getVisibleNodes = (
      parent: DirectoryNode,
      expanded: string[],
      depth: number = 0
    ): Array<DirectoryNode & { depth: number }> => {
      if (!parent.children) return [];
      
      let result: Array<DirectoryNode & { depth: number }> = [];
      let nodes = [...parent.children];
      
      // Sort
      if (anomalySortOrder !== 'none') {
        nodes.sort((a, b) => {
          const countA = a.anomalies?.length || 0;
          const countB = b.anomalies?.length || 0;
          return anomalySortOrder === 'desc' ? countB - countA : countA - countB;
        });
      }

      for (const node of nodes) {
        const isFiltering = !!query || recentFilterActive;
        const showNode = !isFiltering || matchesFilters(node);

        if (showNode) {
          result.push({ ...node, depth });
          
          const isDir = node.type === 'directory';
          const isExpanded = expanded.includes(node.path) || (isFiltering && (node.children?.some(child => matchesFilters(child)) ?? false));
          
          if (isDir && isExpanded && node.children) {
            result = result.concat(getVisibleNodes(node, expanded, depth + 1));
          }
        }
      }
      return result;
    };

    if (query) {
      addLog(`Crawl Registry scanner engaged: search query [${searchQuery}] with tree hierarchies`, 'info');
    }
    if (recentFilterActive) {
      addLog(`Recent filter engaged: showing repository assets modified or scanned within the last hour`, 'info');
    }

    return getVisibleNodes(currentDirectory, expandedPaths, 0);
  }, [currentDirectory, searchQuery, recentFilterActive, anomalySortOrder, expandedPaths, filesystemUpdateTrigger, fileTags]);

  const traumaDistributionData = useMemo(() => {
    const allFiles: DirectoryNode[] = [];
    const gatherFiles = (node: DirectoryNode) => {
      if (node.type === 'file') {
        allFiles.push(node);
      } else if (node.children) {
        node.children.forEach(gatherFiles);
      }
    };
    gatherFiles(currentDirectory);

    const query = searchQuery.trim().toLowerCase();
    const filtered = allFiles.filter(node => {
      if (!query) return true;
      const tags = fileTags[node.path] || [];
      const matchesTag = tags.some(tag => tag.toLowerCase().includes(query));
      return node.name.toLowerCase().includes(query) || node.path.toLowerCase().includes(query) || matchesTag;
    });

    const bins = [
      { name: 'STABLE', range: '0-20%', count: 0, fill: 'url(#emeraldGrad)' },
      { name: 'NOMINAL', range: '21-40%', count: 0, fill: 'url(#mintGrad)' },
      { name: 'WARN', range: '41-60%', count: 0, fill: 'url(#amberGrad)' },
      { name: 'SEVERE', range: '61-80%', count: 0, fill: 'url(#orangeGrad)' },
      { name: 'CRITICAL', range: '81-100%', count: 0, fill: 'url(#redGrad)' },
    ];

    filtered.forEach(node => {
      const rating = node.traumaRating ?? 0;
      if (rating <= 20) {
        bins[0].count++;
      } else if (rating <= 40) {
        bins[1].count++;
      } else if (rating <= 60) {
        bins[2].count++;
      } else if (rating <= 80) {
        bins[3].count++;
      } else {
        bins[4].count++;
      }
    });

    return bins;
  }, [currentDirectory, searchQuery, fileTags, filesystemUpdateTrigger]);

  const groupedTraumaFiles = useMemo(() => {
    const allFiles: DirectoryNode[] = [];
    const gatherFiles = (node: DirectoryNode) => {
      if (node.type === 'file') {
        allFiles.push(node);
      } else if (node.children) {
        node.children.forEach(gatherFiles);
      }
    };
    gatherFiles(currentDirectory);

    const query = searchQuery.trim().toLowerCase();
    const filtered = allFiles.filter(node => {
      const matchesQuery = !query || node.name.toLowerCase().includes(query) || node.path.toLowerCase().includes(query);
      const matchesRecent = !recentFilterActive || isRecentNode(node);
      return matchesQuery && matchesRecent;
    });

    const criticalItems: DirectoryNode[] = [];
    const warningItems: DirectoryNode[] = [];
    const stableItems: DirectoryNode[] = [];

    filtered.forEach(node => {
      const rating = node.traumaRating ?? 0;
      if (rating > 70) {
        criticalItems.push(node);
      } else if (rating > 30) {
        warningItems.push(node);
      } else {
        stableItems.push(node);
      }
    });

    const sortFn = (a: DirectoryNode, b: DirectoryNode) => {
      if (anomalySortOrder === 'desc') {
        return (b.anomalies?.length || 0) - (a.anomalies?.length || 0);
      } else if (anomalySortOrder === 'asc') {
        return (a.anomalies?.length || 0) - (b.anomalies?.length || 0);
      }
      return 0;
    };

    criticalItems.sort(sortFn);
    warningItems.sort(sortFn);
    stableItems.sort(sortFn);

    return { critical: criticalItems, warning: warningItems, stable: stableItems };
  }, [currentDirectory, searchQuery, recentFilterActive, anomalySortOrder, filesystemUpdateTrigger]);

  // Scroll selected node into view & auto-expand ancestors
  useEffect(() => {
    if (selectedFile) {
      // Find ancestors to expand
      const parts = selectedFile.path.split('/').filter(Boolean);
      const ancestors: string[] = [];
      let current = '';
      for (let i = 0; i < parts.length - 1; i++) {
        current += '/' + parts[i];
        ancestors.push(current);
      }

      if (ancestors.length > 0) {
        setExpandedPaths(prev => {
          const needed = ancestors.filter(p => !prev.includes(p));
          if (needed.length > 0) {
            return [...prev, ...needed];
          }
          return prev;
        });
      }
    }
  }, [selectedFile]);

  // Handle actual scrolling when selected file or the rendered node list changes
  useEffect(() => {
    if (selectedFile) {
      const timer = setTimeout(() => {
        const elementId = `node-row-${selectedFile.path.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const container = document.getElementById('node-explorer-list');
        const item = document.getElementById(elementId);
        
        if (container && item) {
          const containerRect = container.getBoundingClientRect();
          const itemRect = item.getBoundingClientRect();
          
          const relativeTop = itemRect.top - containerRect.top + container.scrollTop;
          const relativeBottom = relativeTop + itemRect.height;
          
          if (relativeTop < container.scrollTop) {
            container.scrollTo({
              top: relativeTop,
              behavior: 'smooth'
            });
          } else if (relativeBottom > container.scrollTop + container.clientHeight) {
            container.scrollTo({
              top: relativeBottom - container.clientHeight,
              behavior: 'smooth'
            });
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedFile, filteredNodes, expandedPaths]);

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
      const isExpanded = expandedPaths.includes(node.path);
      if (isExpanded) {
        setExpandedPaths(prev => prev.filter(p => p !== node.path));
        addLog(`Collapsed folder workspace: [${node.name}]`, 'info');
      } else {
        setExpandedPaths(prev => [...prev, node.path]);
        addLog(`Expanded folder workspace: [${node.name}]`, 'info');
      }
    } else {
      if (lockedFilePath && lockedFilePath !== node.path) {
        addLog(`System pipeline is LOCKED to [${selectedFile?.name}]. Unlock current asset first to switch.`, 'warning');
        return;
      }
      setSelectedFile(node);
      addLog(`Holographic link set: Inspecting forensic asset [${node.name}]`, 'info');
    }
  };

  // Helper function to render a node row uniformly across different view modes
  const renderNodeRow = (node: DirectoryNode & { depth?: number }, forceDepthZero = false) => {
    const isFile = node.type === 'file';
    const isCompromised = node.traumaRating && node.traumaRating > 70;
    const isCurrentSelected = selectedFile?.path === node.path;
    const isSearchMatch = searchQuery.trim() !== '' && (
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      node.path.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Compute dynamic green-to-red heatmap gradient based on traumaRating intensity
    const rating = node.traumaRating ?? 0;
    const percent = rating / 100;
    // Interpolate from Emerald Green (16, 185, 129) to Warning Crimson (239, 68, 68)
    const rColor = Math.round(16 + (239 - 16) * percent);
    const gColor = Math.round(185 + (68 - 185) * percent);
    const bColor = Math.round(129 + (68 - 129) * percent);
    
    const startOpacity = 0.06 + percent * 0.16; // ranges from 6% to 22%
    const endOpacity = 0.005 + percent * 0.03; // ranges from 0.5% to 3.5%
    const heatmapBackground = isFile
      ? `linear-gradient(90deg, rgba(${rColor}, ${gColor}, ${bColor}, ${startOpacity}) 0%, rgba(${rColor}, ${gColor}, ${bColor}, ${endOpacity}) 100%)`
      : undefined;
    
    const predictiveRisk = getPredictiveRiskScore(node);
    const isHighPredictiveRisk = showPredictiveAnalysis && isFile && predictiveRisk >= 50;

    let rowBackground = isFile && !isCurrentSelected && !batchSelectedPaths.includes(node.path) ? heatmapBackground : undefined;
    let rowBorderColor = isFile && !isCurrentSelected && !batchSelectedPaths.includes(node.path) ? `rgba(${rColor}, ${gColor}, ${bColor}, ${0.12 + percent * 0.28})` : undefined;

    if (showPredictiveAnalysis && isFile && !isCurrentSelected && !batchSelectedPaths.includes(node.path)) {
      const riskPercent = predictiveRisk / 100;
      const prStartOpacity = 0.08 + riskPercent * 0.26;
      const prEndOpacity = 0.005 + riskPercent * 0.04;
      rowBackground = `linear-gradient(90deg, rgba(147, 51, 234, ${prStartOpacity}) 0%, rgba(236, 72, 153, ${prEndOpacity}) 100%)`;
      rowBorderColor = `rgba(147, 51, 234, ${0.12 + riskPercent * 0.38})`;
    }

    const isDragTarget = dragOverPath === node.path;
    const depthPadding = forceDepthZero ? 10 : ((node.depth ?? 0) * 16 + 10);

    return (
      <motion.div
        key={node.path}
        id={`node-row-${node.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
        draggable={true}
        onDragStartCapture={(e: React.DragEvent<HTMLDivElement>) => {
          setDraggedPath(node.path);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', node.path);
          addLog(`Initiating drag transplant operation for node: [${node.name}]`, 'info');
        }}
        onDragEndCapture={() => {
          setDraggedPath(null);
          setDragOverPath(null);
          setDragOverPosition(null);
        }}
        onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          const isExternalFileDrag = e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files');
          
          if (!isExternalFileDrag && (!draggedPath || draggedPath === node.path)) return;

          const rect = e.currentTarget.getBoundingClientRect();
          const relativeY = e.clientY - rect.top;
          const height = rect.height;

          let position: 'before' | 'after' | 'inside' = 'inside';

          if (isExternalFileDrag) {
            if (node.type === 'directory') {
              position = 'inside';
            } else {
              position = relativeY < height * 0.5 ? 'before' : 'after';
            }
          } else {
            if (node.type === 'directory') {
              if (relativeY < height * 0.25) {
                position = 'before';
              } else if (relativeY > height * 0.75) {
                position = 'after';
              } else {
                position = 'inside';
              }
            } else {
              if (relativeY < height * 0.5) {
                position = 'before';
              } else {
                position = 'after';
              }
            }
          }

          if (dragOverPath !== node.path || dragOverPosition !== position) {
            setDragOverPath(node.path);
            setDragOverPosition(position);
          }
        }}
        onDragLeave={() => {
          if (dragOverPath === node.path) {
            setDragOverPath(null);
            setDragOverPosition(null);
          }
        }}
        onDrop={(e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          const isExternalFileDrag = e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files');

          if (isExternalFileDrag) {
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
              let targetFolderPath = node.path;
              if (node.type === 'file') {
                const parts = node.path.split('/');
                parts.pop();
                targetFolderPath = parts.join('/') || '/';
              }

              addLog(`Processing drop event for ${files.length} external forensic assets onto folder sector [${targetFolderPath}]`, 'info');
              for (let i = 0; i < files.length; i++) {
                addIngestedFileToFolder(targetFolderPath, files[i]);
              }
            }
          } else {
            if (!draggedPath || draggedPath === node.path) return;
            const finalPosition = dragOverPosition || 'inside';
            moveOrReorderNodeInFilesystem(draggedPath, node.path, finalPosition);
          }

          setDraggedPath(null);
          setDragOverPath(null);
          setDragOverPosition(null);
        }}
        onClick={() => handleSelectNode(node)}
        onDoubleClick={() => {
          if (node.type === 'directory') {
            handleNavigate(node.path);
            addLog(`Deep navigated into sector: [${node.path}]`, 'info');
          }
        }}
        onMouseEnter={() => setHoveredNode(node)}
        onMouseLeave={() => setHoveredNode(null)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({
            x: e.clientX,
            y: e.clientY,
            visible: true,
            node
          });
        }}
        animate={isCurrentSelected ? {
          backgroundColor: ["rgba(16, 185, 129, 0.08)", "rgba(16, 185, 129, 0.25)", "rgba(16, 185, 129, 0.08)"],
          boxShadow: [
            "inset 0 0 4px rgba(16, 185, 129, 0.1), 0 0 2px rgba(16, 185, 129, 0.1)",
            "inset 0 0 16px rgba(16, 185, 129, 0.45), 0 0 10px rgba(16, 185, 129, 0.3)",
            "inset 0 0 4px rgba(16, 185, 129, 0.1), 0 0 2px rgba(16, 185, 129, 0.1)"
          ],
          borderColor: ["rgba(16, 185, 129, 0.25)", "rgba(16, 185, 129, 0.65)", "rgba(16, 185, 129, 0.25)"],
        } : isHighPredictiveRisk ? {
          backgroundColor: ["rgba(168, 85, 247, 0.03)", "rgba(168, 85, 247, 0.18)", "rgba(168, 85, 247, 0.03)"],
          boxShadow: [
            "inset 0 0 2px rgba(168, 85, 247, 0.05), 0 0 1px rgba(168, 85, 247, 0.05)",
            "inset 0 0 12px rgba(168, 85, 247, 0.25), 0 0 6px rgba(168, 85, 247, 0.15)",
            "inset 0 0 2px rgba(168, 85, 247, 0.05), 0 0 1px rgba(168, 85, 247, 0.05)"
          ],
          borderColor: ["rgba(168, 85, 247, 0.15)", "rgba(168, 85, 247, 0.55)", "rgba(168, 85, 247, 0.15)"],
        } : batchSelectedPaths.includes(node.path) ? {
          backgroundColor: ["rgba(6, 182, 212, 0.03)", "rgba(6, 182, 212, 0.16)", "rgba(6, 182, 212, 0.03)"],
          boxShadow: [
            "inset 0 0 2px rgba(6, 182, 212, 0.05), 0 0 1px rgba(6, 182, 212, 0.05)",
            "inset 0 0 10px rgba(6, 182, 212, 0.25), 0 0 6px rgba(6, 182, 212, 0.15)",
            "inset 0 0 2px rgba(6, 182, 212, 0.05), 0 0 1px rgba(6, 182, 212, 0.05)"
          ],
          borderColor: ["rgba(6, 182, 212, 0.15)", "rgba(6, 182, 212, 0.5)", "rgba(6, 182, 212, 0.15)"],
        } : {}}
        style={{ 
          paddingLeft: `${depthPadding}px`,
          background: rowBackground,
          borderColor: rowBorderColor,
          opacity: draggedPath === node.path ? 0.35 : 1
        }}
        transition={isCurrentSelected ? {
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut"
        } : isHighPredictiveRisk ? {
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut"
        } : batchSelectedPaths.includes(node.path) ? {
          duration: 1.4,
          repeat: 2, // Soft pulsed flash twice to show selection
          ease: "easeInOut"
        } : {}}
        className={`flex flex-col md:flex-row md:items-center justify-between p-2.5 cursor-pointer transition-all duration-200 hover:bg-emerald-500/5 select-none group border ${
          isDragTarget
            ? dragOverPosition === 'inside'
              ? 'border-cyan-400 border-2 bg-cyan-950/40 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
              : dragOverPosition === 'before'
                ? 'border-t-cyan-400 border-t-2 border-b-transparent border-l-transparent border-r-transparent bg-cyan-950/10'
                : 'border-b-cyan-400 border-b-2 border-t-transparent border-l-transparent border-r-transparent bg-cyan-950/10'
            : isCurrentSelected 
              ? 'border-emerald-500/35 rounded shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
              : isHighPredictiveRisk
                ? 'border-purple-500/40 rounded shadow-[0_0_10px_rgba(168,85,247,0.2)] animate-pulse'
                : batchSelectedPaths.includes(node.path)
                  ? 'border-cyan-500/35 bg-cyan-950/10 rounded shadow-[0_0_6px_rgba(6,182,212,0.1)]'
                  : isSearchMatch 
                    ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500/80 border-t-transparent border-r-transparent border-b-transparent shadow-[inset_4px_0_12px_rgba(16,185,129,0.06)]' 
                    : 'border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Drag Handle Icon with tooltips */}
          <div 
            className="text-emerald-500/35 hover:text-cyan-400 cursor-grab active:cursor-grabbing p-1 flex-shrink-0 flex items-center justify-center transition-all duration-150 rounded hover:bg-emerald-500/10"
            title="Drag descriptor to reorder or transplant into directory"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

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
          
          {/* Expand/Collapse Chevron for directories */}
          {!isFile ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const isExpanded = expandedPaths.includes(node.path);
                if (isExpanded) {
                  setExpandedPaths(prev => prev.filter(p => p !== node.path));
                  addLog(`Collapsed folder workspace: [${node.name}]`, 'info');
                } else {
                  setExpandedPaths(prev => [...prev, node.path]);
                  addLog(`Expanded folder workspace: [${node.name}]`, 'info');
                }
              }}
              className="p-1 rounded hover:bg-emerald-500/15 text-emerald-500/50 hover:text-emerald-400 transition-colors mr-0.5 flex-shrink-0 cursor-pointer flex items-center justify-center border border-transparent hover:border-emerald-500/10"
              title={expandedPaths.includes(node.path) ? "Collapse group" : "Expand group"}
              id={`expand-toggle-${node.name}`}
            >
              {expandedPaths.includes(node.path) ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <div className="w-5.5 h-5.5 flex-shrink-0" />
          )}

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

              {/* Micro Status Icons next to Name */}
              <div className="flex items-center gap-1 select-none" id={`system-status-icons-${node.name}`}>
                {(rebuildingFile === node.path || batchRebuildingPaths.includes(node.path)) && (
                  <span 
                    className="w-4.5 h-4.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center animate-pulse" 
                    title="Indexing alignment active"
                    id={`status-icon-indexing-${node.name}`}
                  >
                    <Loader2 className="w-2.5 h-2.5 text-cyan-400 animate-spin" />
                  </span>
                )}
                {lockedFilePath === node.path && (
                  <span 
                    className="w-4.5 h-4.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center" 
                    title="Sovereign lock active"
                    id={`status-icon-locked-${node.name}`}
                  >
                    <Lock className="w-2.5 h-2.5 text-cyan-400" />
                  </span>
                )}
                {isCompromised && (
                  <span 
                    className="w-4.5 h-4.5 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center shadow-[0_0_4px_rgba(239,68,68,0.4)]" 
                    title="Trauma critical state"
                    id={`status-icon-trauma-${node.name}`}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                  </span>
                )}
              </div>
              
              {/* System Status Indicators */}
              {(rebuildingFile === node.path || batchRebuildingPaths.includes(node.path)) && (
                <span className="bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 px-1.5 py-0.5 rounded text-[7px] font-mono font-black uppercase tracking-widest animate-pulse flex items-center gap-1 select-none leading-none h-4">
                  <Loader2 className="w-2 h-2 text-cyan-400 animate-spin" />
                  INDEXING
                </span>
              )}
              
              {lockedFilePath === node.path && (
                <span className="bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded text-[7px] font-mono font-black uppercase tracking-widest animate-pulse flex items-center gap-1 select-none leading-none h-4">
                  <Lock className="w-2 h-2 text-cyan-400" />
                  LOCKED
                </span>
              )}

              {isCompromised && (
                <span className="bg-red-950/60 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded text-[7px] font-mono font-black uppercase tracking-widest animate-pulse flex items-center gap-1 select-none leading-none h-4 shadow-[0_0_6px_rgba(239,68,68,0.2)]">
                  <AlertTriangle className="w-2 h-2 text-red-400" />
                  TRAUMA-CRITICAL
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[10px] font-mono text-emerald-500/40">{node.lastModified}</span>
              {isFile && (
                (() => {
                  const auditStatus = getScanAgeStatus(node.lastScanned);
                  return (
                    <span 
                      className={`text-[9px] font-mono border rounded px-1.5 py-0.5 leading-none flex items-center gap-1 cursor-help transition-all duration-150 select-none h-4 ${auditStatus.color}`}
                      title={node.lastScanned ? `Last Audit Security Scan: ${node.lastScanned}` : "File has never been scanned by the system."}
                    >
                      <span className={`w-1 h-1 rounded-full ${
                        auditStatus.text === 'FRESH' ? 'bg-emerald-400 animate-pulse' :
                        auditStatus.text === 'STALE' ? 'bg-amber-400 animate-pulse' : 'bg-red-400 animate-pulse'
                      }`} />
                      AUDIT: {node.lastScanned ? node.lastScanned : 'NONE'} ({auditStatus.text})
                    </span>
                  );
                })()
              )}
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
              {flaggedFiles[node.path] && (
                <span className="bg-red-950/65 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase flex items-center gap-0.5 select-none leading-none h-4" id={`flagged-badge-${node.name}`}>
                  🚩 FLAGGED
                </span>
              )}
              {(rebuildingFile === node.path || batchRebuildingPaths.includes(node.path)) && (
                <span className="bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 px-1.5 py-0.5 rounded text-[8px] font-mono font-black tracking-widest animate-pulse uppercase flex items-center gap-0.5 select-none leading-none h-4">
                  ⚡ REBUILDING
                </span>
              )}
              {showPredictiveAnalysis && isFile && (
                <span 
                  className={`border px-1.5 py-0.5 rounded text-[8px] font-mono font-black tracking-wider uppercase flex items-center gap-0.5 select-none leading-none h-4 transition-all duration-300 ${
                    predictiveRisk >= 70
                      ? 'bg-fuchsia-950/65 text-fuchsia-400 border-fuchsia-500/35 animate-pulse shadow-[0_0_6px_rgba(217,70,239,0.25)]'
                      : predictiveRisk >= 40
                        ? 'bg-purple-950/60 text-purple-400 border-purple-500/25'
                        : 'bg-indigo-950/45 text-indigo-400 border-indigo-500/20'
                  }`}
                  id={`predictive-badge-${node.name}`}
                  title={`Statistical Trauma Probability Forecast: ${predictiveRisk}% based on system metadata characteristics.`}
                >
                  🔮 RISK: {predictiveRisk}%
                </span>
              )}
              {(fileTags[node.path] || []).map(tag => (
                <span key={tag} className="bg-indigo-950/60 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase flex items-center gap-0.5 select-none leading-none h-4" id={`tag-badge-${node.name}-${tag}`}>
                  🏷️ {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Display Stress indicator levels on files */}
        {isFile ? (
          <div className="flex items-center gap-3 mt-1.5 md:mt-0">
            {/* Default Indicators (hidden on hover) */}
            <div className="flex group-hover:hidden items-center gap-2">
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

            {/* Quick Actions (shown on hover instead of distress, or visible on hover) */}
            <div className="hidden group-hover:flex items-center gap-1.5" id={`quick-actions-${node.name}`}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectNode(node);
                }}
                className="px-2 py-1 rounded border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all text-[8.5px] font-bold uppercase cursor-pointer"
                title="Inspect forensic telemetry"
                id={`quick-action-inspect-${node.name}`}
              >
                Inspect
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = !quarantinedFiles[node.path];
                  setQuarantinedFiles(prev => ({ ...prev, [node.path]: next }));
                  if (next) {
                    addLog(`Quarantine protocol ENGAGED for asset path: [${node.name}]`, 'warning');
                  } else {
                    addLog(`Quarantine protocol COMPLETED for asset path: [${node.name}]`, 'info');
                  }
                }}
                className={`px-2 py-1 rounded border transition-all text-[8.5px] font-bold uppercase cursor-pointer ${
                  quarantinedFiles[node.path]
                    ? 'border-red-500 bg-red-950/45 text-red-100 animate-pulse'
                    : 'border-amber-500/30 bg-amber-950/30 text-amber-400 hover:bg-amber-500 hover:text-white'
                }`}
                title={quarantinedFiles[node.path] ? "Release asset from quarantine" : "Quarantine file"}
                id={`quick-action-quarantine-${node.name}`}
              >
                {quarantinedFiles[node.path] ? 'Release' : 'Quarantine'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = !flaggedFiles[node.path];
                  setFlaggedFiles(prev => ({ ...prev, [node.path]: next }));
                  if (next) {
                    addLog(`Security FLAG assigned to asset segment: [${node.name}]`, 'warning');
                  } else {
                    addLog(`Security FLAG cleared for asset segment: [${node.name}]`, 'info');
                  }
                }}
                className={`px-2 py-1 rounded border transition-all text-[8.5px] font-bold uppercase cursor-pointer ${
                  flaggedFiles[node.path]
                    ? 'border-red-500 bg-red-950/45 text-red-100 animate-pulse'
                    : 'border-red-500/30 bg-red-950/30 text-rose-400 hover:bg-red-500 hover:text-white'
                }`}
                title={flaggedFiles[node.path] ? "Clear flag from asset" : "Flag asset as suspicious"}
                id={`quick-action-flag-${node.name}`}
              >
                {flaggedFiles[node.path] ? 'Unflag' : 'Flag'}
              </button>
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

            {/* Sector Action Indicator Three-Dots menu */}
            <button
              type="button"
              id={`context-menu-trigger-${node.name}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  visible: true,
                  node
                });
              }}
              className="p-1.5 rounded transition-all text-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer flex items-center justify-center border border-transparent hover:border-emerald-500/20 context-menu-indicator"
              title="Right-click context menu available"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 mt-1.5 md:mt-0">
            {/* Default label (hidden on hover) */}
            <span className="text-[10px] font-mono text-emerald-500/30 uppercase group-hover:hidden">
              [DIRECTORY DIRECT]
            </span>

            {/* Quick Actions for Directory (shown on hover) */}
            <div className="hidden group-hover:flex items-center gap-1.5" id={`quick-actions-${node.name}`}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectNode(node);
                }}
                className="px-2 py-1 rounded border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all text-[8.5px] font-bold uppercase cursor-pointer"
                title="Toggle expansion directory"
                id={`quick-action-inspect-dir-${node.name}`}
              >
                Inspect
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = !quarantinedFiles[node.path];
                  setQuarantinedFiles(prev => ({ ...prev, [node.path]: next }));
                  if (next) {
                    addLog(`Quarantine protocol ENGAGED for asset path: [${node.name}]`, 'warning');
                  } else {
                    addLog(`Quarantine protocol COMPLETED for asset path: [${node.name}]`, 'info');
                  }
                }}
                className={`px-2 py-1 rounded border transition-all text-[8.5px] font-bold uppercase cursor-pointer ${
                  quarantinedFiles[node.path]
                    ? 'border-red-500 bg-red-950/45 text-red-100 animate-pulse'
                    : 'border-amber-500/30 bg-amber-950/30 text-amber-400 hover:bg-amber-500 hover:text-white'
                }`}
                title={quarantinedFiles[node.path] ? "Release directory from quarantine" : "Quarantine directory"}
                id={`quick-action-quarantine-dir-${node.name}`}
              >
                {quarantinedFiles[node.path] ? 'Release' : 'Quarantine'}
              </button>
            </div>
            
            {/* Sector Action Indicator Three-Dots menu */}
            <button
              type="button"
              id={`context-menu-trigger-dir-${node.name}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  visible: true,
                  node
                });
              }}
              className="p-1.5 rounded transition-all text-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer flex items-center justify-center border border-transparent hover:border-emerald-500/20 context-menu-indicator"
              title="Right-click context menu available"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`flex-1 flex flex-col bg-black text-white p-4 font-sans select-none overflow-hidden relative border border-emerald-500/10 rounded-lg shadow-2xl h-full m-1 ${terminalTheme === 'crimson' ? 'theme-crimson' : ''}`}>
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
        <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-3 md:mt-0 font-mono">
          {/* Theme selection toggle */}
          <div className="flex items-center gap-2 border border-emerald-500/20 px-2.5 py-1 rounded bg-black/60 select-none" id="theme-toggle-container">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <Shield className={`w-3 h-3 ${terminalTheme === 'crimson' ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
              THEME
            </span>
            <button
              type="button"
              id="header-theme-toggle-btn"
              onClick={() => {
                const nextTheme = terminalTheme === 'emerald' ? 'crimson' : 'emerald';
                setTerminalTheme(nextTheme);
                addLog(`Terminal intelligence layout re-hosed to: ${nextTheme === 'crimson' ? '[CRIMSON HIGH-ALERT METRIC REGISTRY]' : '[EMERALD CYBER-FORENSIC REGISTER]'}`, nextTheme === 'crimson' ? 'warning' : 'success');
              }}
              className={`relative inline-flex h-4 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                terminalTheme === 'crimson' ? 'bg-red-500' : 'bg-emerald-950/40 border border-emerald-500/30'
              }`}
              title="Toggle system theme between standard Emerald or Crimson High-Alert Mode"
            >
              <span
                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-black transition-transform ${
                  terminalTheme === 'crimson' ? 'translate-x-[22px]' : 'translate-x-[4px]'
                }`}
              />
            </button>
            <span className={`text-[8.5px] font-black uppercase tracking-widest min-w-[44px] ${terminalTheme === 'crimson' ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              {terminalTheme === 'crimson' ? 'CRIMSON' : 'EMERALD'}
            </span>
          </div>

          {/* Auto-Scan Toggle Switch */}
          <div className="flex items-center gap-2 border border-emerald-500/20 px-2.5 py-1 rounded bg-black/60 select-none" id="auto-scan-toggle-container">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5 line-clamp-1">
              <RefreshCw className={`w-3 h-3 ${autoScanEnabled ? 'animate-spin' : ''} text-emerald-400`} />
              AUTO-SCAN
            </span>
            <button
              type="button"
              id="header-autoscan-toggle-btn"
              onClick={() => {
                const nextState = !autoScanEnabled;
                setAutoScanEnabled(nextState);
                addLog(`Auto-Scan telemetry system ${nextState ? 'ENGAGED. Initiating dynamic background node auditing.' : 'STANDBY.'}`, nextState ? 'success' : 'warning');
              }}
              className={`relative inline-flex h-4 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                autoScanEnabled ? 'bg-emerald-500' : 'bg-emerald-950/40 border border-emerald-500/30'
              }`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-black transition-transform ${
                  autoScanEnabled ? 'translate-x-[22px]' : 'translate-x-[4px]'
                }`}
              />
            </button>
            <span className={`text-[8.5px] font-black uppercase tracking-widest min-w-[28px] ${autoScanEnabled ? 'text-emerald-400 animate-pulse' : 'text-zinc-600'}`}>
              {autoScanEnabled ? 'ACTIVE' : 'STBY'}
            </span>
          </div>

          {/* Trauma Monitoring Indicator with 'Critical Alert' pulse effect */}
          <div 
            id="header-trauma-monitor"
            className={`flex items-center gap-2 border px-2.5 py-1 rounded bg-black/60 select-none transition-all duration-300 ${
              maxTraumaRating > 70
                ? 'border-red-500/50 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse'
                : maxTraumaRating > 30
                  ? 'border-amber-500/30 bg-amber-950/10 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                  : 'border-emerald-500/20'
            }`}
            title={`System Trauma Monitoring: Max rating at ${maxTraumaRating}%. Status: ${maxTraumaRating > 70 ? 'CRITICAL DISTRESS ALERT' : maxTraumaRating > 30 ? 'WARNING STATE' : 'SECURE/NOMINAL'}`}
          >
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <Activity className={`w-3.5 h-3.5 ${
                maxTraumaRating > 70 
                  ? 'text-red-500 animate-[pulse_0.8s_infinite] scale-110' 
                  : maxTraumaRating > 30 
                    ? 'text-amber-500 animate-[pulse_1.5s_infinite]'
                    : 'text-emerald-400'
              }`} />
              TRAUMA:
            </span>
            <span className={`text-xs font-black tracking-widest tabular-nums ${
              maxTraumaRating > 70 
                ? 'text-red-400 animate-pulse scale-105' 
                : maxTraumaRating > 30 
                  ? 'text-amber-400 font-bold' 
                  : 'text-emerald-400 font-medium'
            }`}>
              {maxTraumaRating}%
            </span>
            {maxTraumaRating > 70 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>

          {/* Generate PDF Forensic Report Button */}
          <button
            type="button"
            onClick={() => {
              try {
                exportForensicPDFReport({
                  terminalTheme,
                  maxTraumaRating,
                  forensicLogs,
                  operatorEmail: 'kmck3772@gmail.com'
                });
                addLog('Sovereign Terminal compiling assets... PDF Forensic Report downloaded successfully.', 'success');
              } catch (err: any) {
                console.error(err);
                addLog(`Failed to compile forensic report PDF: ${err.message || err}`, 'error');
              }
            }}
            className={`flex items-center gap-1.5 border px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              terminalTheme === 'crimson'
                ? 'border-red-500/30 hover:border-red-500/60 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                : 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
            }`}
            title="Compile all active telemetry datasets, anomaly maps, and 3D heatmaps into a PDF forensic audit document."
          >
            <Download className={`w-3.5 h-3.5 ${terminalTheme === 'crimson' ? 'text-red-400' : 'text-emerald-400'}`} />
            <span className="tracking-wide uppercase text-[10px]">Generate PDF Report</span>
          </button>

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

      {/* Dynamic Hotkey / Shortcuts Quick-Access Command Bar indicator */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 mb-3 border border-emerald-500/10 rounded-md bg-[#020617]/50 text-[9.5px] font-mono select-none text-zinc-500 animate-fade-in shadow-[inset_0_0_10px_rgba(16,185,129,0.02)]">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-emerald-500/60 animate-pulse" />
          <span className="text-emerald-500/60 font-bold uppercase tracking-wider text-[8.5px]">COMMAND HUD KEYBOARD SHORTCUTS:</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap text-zinc-400">
          <span className="flex items-center gap-1.5 h-full">
            <kbd className="bg-zinc-950 text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_5px_rgba(16,185,129,0.05)] font-bold">Esc</kbd>
            <span className="text-zinc-500 font-bold hover:text-zinc-400 transition-colors uppercase tracking-[0.02em] text-[8px]">Clear Inspections & Focus</span>
          </span>
          <span className="text-zinc-800 font-black">/</span>
          <span className="flex items-center gap-1.5">
            <kbd className="bg-zinc-950 text-cyan-400 px-1 py-0.5 rounded border border-cyan-500/20 shadow-[0_0_5px_rgba(6,182,212,0.05)] font-bold">Ctrl + T</kbd>
            <span className="text-zinc-500 font-bold hover:text-zinc-400 transition-colors uppercase tracking-[0.02em] text-[8px]">Telemetry Panel</span>
          </span>
          <span className="text-zinc-800 font-black">/</span>
          <span className="flex items-center gap-1.5">
            <kbd className="bg-zinc-950 text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_5px_rgba(16,185,129,0.05)] font-bold">Ctrl + F</kbd>
            <span className="text-zinc-500 font-bold hover:text-zinc-400 transition-colors uppercase tracking-[0.02em] text-[8px]">Forensic Log (Search)</span>
          </span>
        </div>
      </div>

      {/* Container wrapping DiagnosticSessionSidebar and main split grid side-by-side */}
      <div className="flex-1 flex overflow-hidden gap-3 w-full pr-1">
        {/* Diagnostic Session Sidebar */}
        <DiagnosticSessionSidebar
          terminalTheme={terminalTheme}
          isOpen={isSessionSidebarOpen}
          onToggle={() => setIsSessionSidebarOpen(prev => !prev)}
          selectedFile={selectedFile}
          onLoadFileByPath={handleLoadFileByPath}
          onSetTheme={setTerminalTheme}
          onSetViewMode={setNodeViewMode}
          addLog={addLog}
        />

        {/* 2. Primary Split Grid Layout */}
        <div 
          className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden mb-3"
          style={isLgScreen ? { gridTemplateColumns: `3fr ${9 - rightPanelWeight}fr ${rightPanelWeight}fr` } : undefined}
        >
        {/* Left Side: System managers & Upload Ingestion (Col span 1) */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Quick bookmarks */}
          <BookmarkManager
            currentPath={currentPath}
            bookmarks={bookmarks}
            onAddBookmark={handleAddBookmark}
            onRemoveBookmark={handleRemoveBookmark}
            onNavigate={handleNavigate}
            addLog={addLog}
          />

          {/* Workspace Snapshots Recovery */}
          <WorkspaceSnapshotManager
            terminalTheme={terminalTheme}
            snapshots={snapshots}
            onSaveSnapshot={handleSaveSnapshot}
            onLoadSnapshot={handleLoadSnapshot}
            onRemoveSnapshot={handleRemoveSnapshot}
            addLog={addLog}
            currentSelectedFilePath={selectedFile ? selectedFile.path : null}
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

        {/* Center Panel: Interactive Directory Hub (Col span 1) */}
        <div className="lg:col-span-1 bg-[#020617]/90 border border-emerald-500/20 rounded-md p-4 flex flex-col overflow-hidden justify-between scanline-glow relative" id="node-explorer">
          {/* Subtle Scanning Progress Bar Overlay */}
          <AnimatePresence>
            {isScanningActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 3 }}
                exit={{ opacity: 0, height: 0 }}
                className="absolute top-0 left-0 right-0 z-40 bg-emerald-950/40 overflow-hidden"
                id="node-explorer-scanning-progress"
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear"
                  }}
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex flex-col overflow-hidden flex-1">
            {/* Node Explorer Header and Sorting Controller */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-500/15 pb-2 mb-3 gap-2 flex-shrink-0 font-mono" id="node-explorer-header">
              <div className="flex flex-col gap-1.5 matches-compact-layout">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase text-white tracking-widest glow-text-emerald">
                    Node Explorer Register
                  </span>
                </div>
                {/* Trauma Rating Heatmap Legend */}
                <div className="flex flex-wrap items-center gap-2 text-[8px] tracking-wider font-bold select-none" id="trauma-rating-legend">
                  <span className="uppercase font-semibold text-[7.5px] text-emerald-500/35">TRAUMA KEY:</span>
                  <div className="flex flex-wrap items-center gap-2.5 bg-black/45 border border-emerald-500/10 rounded px-1.5 py-0.5">
                    <div className="flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>STABLE (0-30%)</span>
                    </div>
                    <div className="w-10 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 border border-black/20" />
                    <div className="flex items-center gap-1 text-amber-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>WARN (31-70%)</span>
                    </div>
                    <div className="w-10 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 border border-black/20" />
                    <div className="flex items-center gap-1 text-red-400 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span>CRIT (&gt;70%)</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                {/* View Toggles */}
                <div className="flex border border-emerald-500/20 bg-black/40 rounded p-0.5 mr-1" id="view-mode-toggle-group">
                  <button
                    type="button"
                    onClick={() => {
                      setNodeViewMode('tree');
                      addLog("Switched Node Explorer layout to folder system tree.", "info");
                    }}
                    className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                      nodeViewMode === 'tree'
                        ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 font-black'
                        : 'text-emerald-500/40 hover:text-emerald-400 border border-transparent'
                    }`}
                    title="Render standard file system structure"
                    id="toggle-layout-tree"
                  >
                    Tree Layout
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNodeViewMode('trauma');
                      addLog("Switched Node Explorer layout to trauma rating classifications.", "info");
                    }}
                    className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                      nodeViewMode === 'trauma'
                        ? 'bg-red-500/20 text-red-500/80 font-bold border border-red-500/30 font-black'
                        : 'text-emerald-500/40 hover:text-emerald-400 border border-transparent'
                    }`}
                    title="Group files by trauma rating severity (Critical / Warning / Stable)"
                    id="toggle-layout-trauma"
                  >
                    Trauma Sectors
                  </button>
                </div>

                <button
                  type="button"
                  id="toggle-recent-filter-btn"
                  onClick={() => {
                    const nextVal = !recentFilterActive;
                    setRecentFilterActive(nextVal);
                    if (nextVal) {
                      addLog("RECENT filter ENGAGED. Restricting view to assets modified or scanned within the last hour.", "warning");
                    } else {
                      addLog("RECENT filter DISENGAGED. Standard workspace file view restored.", "info");
                    }
                  }}
                  className={`px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-wide transition-all h-6 flex items-center justify-center gap-1 cursor-pointer ${
                    recentFilterActive
                      ? 'bg-amber-950/40 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.35)] font-black animate-pulse'
                      : 'border-emerald-500/20 bg-black/40 text-emerald-500/60 hover:text-emerald-400 hover:bg-emerald-500/5'
                  }`}
                  title="Show only repository assets scanned or modified within the last hour"
                >
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Recent: {recentFilterActive ? 'ACTIVE' : 'STANDBY'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextValue = !showPredictiveAnalysis;
                    setShowPredictiveAnalysis(nextValue);
                    if (nextValue) {
                      addLog("Predictive intelligence scanner ENGAGED. Projecting sector vulnerability matrices and future trauma indicators...", "info");
                    } else {
                      addLog("Predictive intelligence scanner OFFLINE. Restoring standard telemetry heatmap.", "info");
                    }
                  }}
                  id="predictive-analysis-toggle"
                  className={`px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-wide transition-all h-6 flex items-center justify-center gap-1 cursor-pointer ${
                    showPredictiveAnalysis
                      ? 'bg-purple-950/40 border-purple-500 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.35)] font-black'
                      : 'border-emerald-500/20 bg-black/40 text-emerald-500/60 hover:text-emerald-400 hover:bg-emerald-500/5'
                  }`}
                  title="Toggle Predictive Intelligence Mode. Highlight files with high statistical probability of developing future trauma or corruption."
                >
                  <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                  <span>PREDICTION: {showPredictiveAnalysis ? 'ACTIVE' : 'STANDBY'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (nodeViewMode === 'tree') {
                      setExpandedPaths([]);
                      addLog("Collapsed all directories in node workspace.", "info");
                    } else {
                      setExpandedTraumaGroups({ critical: false, warning: false, stable: false });
                      addLog("Collapsed all trauma classification groups.", "info");
                    }
                  }}
                  disabled={
                    nodeViewMode === 'tree'
                      ? expandedPaths.length === 0
                      : !expandedTraumaGroups.critical && !expandedTraumaGroups.warning && !expandedTraumaGroups.stable
                  }
                  id="collapse-all-btn"
                  className={`px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-wide transition-all select-none leading-none h-6 flex items-center justify-center gap-1 ${
                    nodeViewMode === 'tree'
                      ? expandedPaths.length === 0
                        ? 'border-emerald-500/10 text-emerald-500/25 bg-transparent cursor-not-allowed'
                        : 'border-emerald-500/35 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 hover:text-white hover:border-emerald-500/50 cursor-pointer'
                      : !expandedTraumaGroups.critical && !expandedTraumaGroups.warning && !expandedTraumaGroups.stable
                        ? 'border-emerald-500/10 text-emerald-500/25 bg-transparent cursor-not-allowed'
                        : 'border-emerald-500/35 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 hover:text-white hover:border-emerald-500/50 cursor-pointer'
                  }`}
                  title={nodeViewMode === 'tree' ? "Collapse all directory groups" : "Collapse all trauma lists"}
                >
                  Collapse All
                </button>

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

                      <button
                        type="button"
                        onClick={() => {
                          setBatchSelectedPaths([]);
                          addLog("Batch selection registry cleared.", "info");
                        }}
                        id="clear-batch-selection-btn"
                        className="ml-1 px-2 py-1 rounded border border-red-500/35 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-white hover:border-red-500/50 cursor-pointer text-[8.5px] font-black uppercase tracking-wide transition-all select-none leading-none h-5 flex items-center justify-center"
                        title="Clear batch selection"
                      >
                        Clear Selection
                      </button>
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
                          const targets = [...batchSelectedPaths];
                          setBatchRebuildingPaths(targets);
                          addLog(`Initiating bulk integrity sanitization for ${targets.length} selected assets...`, 'info');
                          setTimeout(() => {
                            setBatchRebuildingPaths([]);
                            
                            const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
                            
                            const updateBatchScan = (node: DirectoryNode) => {
                              if (targets.includes(node.path)) {
                                node.lastScanned = nowStr;
                              }
                              if (node.children) {
                                node.children.forEach(updateBatchScan);
                              }
                            };
                            updateBatchScan(initialFilesystem);
                            
                            setSelectedFile(prev => {
                              if (prev && targets.includes(prev.path)) {
                                return { ...prev, lastScanned: nowStr };
                              }
                              return prev;
                            });
                            setFilesystemUpdateTrigger(prev => prev + 1);

                            addLog(`Bulk integrity checksums successfully REBUILT for ${targets.length} assets. Checksums verified.`, 'success');
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
            <div 
              id="node-explorer-breadcrumbs" 
              className="flex items-center flex-wrap gap-1 bg-[#091222]/80 border border-emerald-500/15 rounded px-3 py-2 font-mono text-[10.5px] uppercase tracking-wider flex-shrink-0 mb-3 text-emerald-400 select-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-1.5 mr-1 text-emerald-500/60 font-bold border-r border-emerald-500/20 pr-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Sector:</span>
              </div>
              
              <button
                type="button"
                id="breadcrumb-root"
                onClick={() => {
                  handleNavigate('/');
                  addLog("Returned to [ROOT] navigation sector", "info");
                }}
                className={`cursor-pointer px-1.5 py-0.5 rounded text-[10px] font-bold transition-all duration-150 ${
                  currentPath === '/' 
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]' 
                    : 'hover:bg-emerald-500/10 text-emerald-500/80 hover:text-emerald-300'
                }`}
              >
                ROOT
              </button>
              
              {currentPath !== '/' && currentPath.split('/').filter(Boolean).map((part, idx, arr) => {
                const rebuildPath = '/' + arr.slice(0, idx + 1).join('/');
                const isLast = idx === arr.length - 1;
                return (
                  <div key={idx} className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-emerald-500/40" />
                    <button
                      type="button"
                      id={`breadcrumb-part-${idx}`}
                      onClick={() => {
                        handleNavigate(rebuildPath);
                        addLog(`Segment-navigated to directory sector: [${rebuildPath}]`, 'info');
                      }}
                      className={`cursor-pointer px-1.5 py-0.5 rounded text-[10px] font-bold transition-all duration-150 ${
                        isLast 
                          ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)]' 
                          : 'hover:bg-emerald-500/10 text-emerald-500/80 hover:text-emerald-300'
                      }`}
                      title={`Navigate back to ${part}`}
                    >
                      {part}
                    </button>
                  </div>
                );
              })}

              {/* Manual directory sector refresh button */}
              <button
                type="button"
                id="manual-directory-refresh-btn"
                onClick={() => {
                  if (isScanningDirect) return;
                  setIsScanningDirect(true);
                  addLog(`Initiating directory telemetry refresh for sector: [${currentPath}]`, 'info');
                  
                  setTimeout(() => {
                    setIsScanningDirect(false);
                    setFilesystemUpdateTrigger(prev => prev + 1);
                    addLog(`Telemetry refresh complete. Checked sector [${currentPath}] integrity.`, 'success');
                  }, 1200);
                }}
                disabled={isScanningActive}
                className={`ml-auto flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] font-extrabold uppercase tracking-widest transition-all duration-150 h-6 cursor-pointer select-none ${
                  isScanningDirect
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                    : 'border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300'
                }`}
                title="Refresh current directory sector"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isScanningDirect ? 'animate-spin text-cyan-300' : 'text-emerald-400'}`} />
                <span>Refresh Sector</span>
              </button>
            </div>

            {/* Folder controls & Registry filter input */}
            <div className="flex items-center gap-2 mb-3 flex-shrink-0 font-mono">
              {currentPath !== '/' && (
                <button
                  type="button"
                  onClick={handleGoUp}
                  className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 duration-200 px-3 py-1 rounded text-xs text-white cursor-pointer"
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
              <button
                type="button"
                id="toggle-trauma-chart-btn"
                onClick={() => setShowTraumaChart(!showTraumaChart)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  showTraumaChart
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/45 glow-text-emerald'
                    : 'bg-black/50 hover:bg-emerald-500/10 text-emerald-500/70 border-emerald-500/15'
                }`}
                title="Toggle trauma distribution visualization"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Stress Profile</span>
              </button>
            </div>

            {/* Trauma Distribution chart */}
            {showTraumaChart && (
              <div className="mb-3 bg-black/60 border border-emerald-500/15 rounded p-3 font-mono flex-shrink-0 select-none shadow-[inside_0_0_8px_rgba(16,185,129,0.02)]" id="trauma-distribution-widget">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-emerald-500/10">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-300 uppercase tracking-wider">
                      Trauma Intensity Histogram
                    </span>
                  </div>
                  <span className="text-[8px] text-emerald-500/50 font-bold">
                    {filteredNodes.filter(n => n.type === 'file').length} ACTIVE SECTOR FILES
                  </span>
                </div>

                <div className="h-28 w-full relative" id="trauma-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={traumaDistributionData}
                      margin={{ top: 5, right: 5, left: -32, bottom: 0 }}
                      barSize={20}
                    >
                      <defs>
                        <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.15}/>
                        </linearGradient>
                        <linearGradient id="mintGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0.15}/>
                        </linearGradient>
                        <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.15}/>
                        </linearGradient>
                        <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.15}/>
                        </linearGradient>
                        <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.15}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="name" 
                        stroke="#059669" 
                        fontSize={8}
                        tickLine={false}
                        axisLine={{ stroke: '#059669', strokeOpacity: 0.2 }}
                      />
                      <YAxis 
                        stroke="#059669" 
                        fontSize={8}
                        tickLine={false}
                        allowDecimals={false}
                        axisLine={{ stroke: '#059669', strokeOpacity: 0.2 }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(16, 185, 129, 0.04)' }}
                        contentStyle={{
                          backgroundColor: '#020617',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          fontSize: '9px',
                          color: '#34d399',
                          fontFamily: 'monospace',
                          padding: '4px 6px'
                        }}
                        itemStyle={{ padding: 0 }}
                        labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      />
                      <Bar 
                        dataKey="count" 
                        radius={[2, 2, 0, 0]}
                        animationDuration={400}
                      >
                        {traumaDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* File lists browser */}
            <div id="node-explorer-list" className="flex-grow overflow-y-auto border border-emerald-500/10 bg-black/50 rounded flex flex-col divide-y divide-emerald-500/10 max-h-[360px] lg:max-h-none min-h-[160px]">
              {isScanningDirect ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center font-mono text-xs text-emerald-400/80 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  <div className="animate-pulse flex flex-col gap-1">
                    <span className="font-bold uppercase tracking-wider">INITIATING MATRIX SCAN...</span>
                    <span className="text-[10px] text-emerald-500/50">CRAWLING SECTOR: {currentPath}</span>
                  </div>
                </div>
              ) : filteredNodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-6 text-center font-mono gap-4" id="no-artifacts-empty-state">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/5 rounded-full blur-xl animate-pulse" />
                    <FolderOpen className="w-10 h-10 text-emerald-500/25 relative z-10" />
                  </div>
                  <div className="flex flex-col gap-1 max-w-sm">
                    <span className="text-emerald-400 font-bold uppercase text-[11px] tracking-wider">No Artifacts Detected</span>
                    <span className="text-[10px] text-emerald-500/50 leading-relaxed">
                      Sector registry is currently vacant. No active files, anomalies, or system stress patterns were detected under this navigation matrix index.
                    </span>
                  </div>
                  <button
                    type="button"
                    id="rescan-empty-state-btn"
                    onClick={() => {
                      setIsScanningDirect(true);
                      addLog(`Scanning system registry sector: [${currentPath}]`, 'info');
                      
                      setTimeout(() => {
                        const restoreNode = (target: DirectoryNode, source: DirectoryNode) => {
                          target.children = source.children ? source.children.map(c => {
                            const deepClone = (node: DirectoryNode): DirectoryNode => {
                              const copy: DirectoryNode = { ...node };
                              if (node.children) {
                                copy.children = node.children.map(deepClone);
                              }
                              if (node.anomalies) {
                                copy.anomalies = [...node.anomalies];
                              }
                              return copy;
                            };
                            return deepClone(c);
                          }) : undefined;
                        };

                        if (pristineBackupRef.current) {
                          restoreNode(initialFilesystem, pristineBackupRef.current);
                        }

                        setIsScanningDirect(false);
                        addLog(`Scan complete. Matrix integrity state recalibrated. Recovered default system sectors.`, 'success');
                        setFilesystemUpdateTrigger(prev => prev + 1);
                      }, 1200);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 transition-all font-black uppercase text-[10px] tracking-wider cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.05)] active:scale-95 select-none"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Rescan Matrix</span>
                  </button>
                </div>
              ) : (
                <>
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
                  {nodeViewMode === 'tree' ? (
                    filteredNodes.map((node) => renderNodeRow(node))
                  ) : (
                    // Grouped by Trauma severity rating
                    <div className="flex flex-col flex-grow divide-y divide-emerald-500/10">
                  {/* CRITICAL SECTOR GROUP */}
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => setExpandedTraumaGroups(prev => ({ ...prev, critical: !prev.critical }))}
                      className="flex items-center justify-between px-3 py-2.5 bg-red-950/20 hover:bg-red-950/30 border-b border-red-500/15 text-[10.5px] font-mono text-red-400 font-black select-none uppercase tracking-wider cursor-pointer transition-all duration-150 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)] animate-pulse" />
                        <span>Critical Trauma sector ({groupedTraumaFiles.critical.length})</span>
                      </div>
                      {expandedTraumaGroups.critical ? <ChevronDown className="w-3.5 h-3.5 text-red-400/50" /> : <ChevronRight className="w-3.5 h-3.5 text-red-400/50" />}
                    </button>
                    {expandedTraumaGroups.critical && (
                      <div className="flex flex-col divide-y divide-emerald-500/5 bg-red-950/5">
                        {groupedTraumaFiles.critical.length === 0 ? (
                          <div className="font-mono text-[9px] text-red-500/30 py-3.5 text-center italic select-none">
                            No critical trauma assets registered matching scanner query.
                          </div>
                        ) : (
                          groupedTraumaFiles.critical.map(node => renderNodeRow(node, true))
                        )}
                      </div>
                    )}
                  </div>

                  {/* WARNING SECTOR GROUP */}
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => setExpandedTraumaGroups(prev => ({ ...prev, warning: !prev.warning }))}
                      className="flex items-center justify-between px-3 py-2.5 bg-amber-950/15 hover:bg-amber-950/25 border-b border-amber-500/15 text-[10.5px] font-mono text-amber-400 font-black select-none uppercase tracking-wider cursor-pointer transition-all duration-150 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)] animate-pulse" />
                        <span>Warning Trauma sector ({groupedTraumaFiles.warning.length})</span>
                      </div>
                      {expandedTraumaGroups.warning ? <ChevronDown className="w-3.5 h-3.5 text-amber-400/50" /> : <ChevronRight className="w-3.5 h-3.5 text-amber-400/50" />}
                    </button>
                    {expandedTraumaGroups.warning && (
                      <div className="flex flex-col divide-y divide-emerald-500/5 bg-amber-950/5">
                        {groupedTraumaFiles.warning.length === 0 ? (
                          <div className="font-mono text-[9px] text-amber-500/35 py-3.5 text-center italic select-none">
                            No warning trauma assets registered matching scanner query.
                          </div>
                        ) : (
                          groupedTraumaFiles.warning.map(node => renderNodeRow(node, true))
                        )}
                      </div>
                    )}
                  </div>

                  {/* STABLE SECTOR GROUP */}
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => setExpandedTraumaGroups(prev => ({ ...prev, stable: !prev.stable }))}
                      className="flex items-center justify-between px-3 py-2.5 bg-emerald-950/10 hover:bg-emerald-950/20 border-b border-emerald-500/15 text-[10.5px] font-mono text-emerald-400 font-black select-none uppercase tracking-wider cursor-pointer transition-all duration-150 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-455 shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
                        <span>Stable Trauma sector ({groupedTraumaFiles.stable.length})</span>
                      </div>
                      {expandedTraumaGroups.stable ? <ChevronDown className="w-3.5 h-3.5 text-emerald-400/50" /> : <ChevronRight className="w-3.5 h-3.5 text-emerald-400/50" />}
                    </button>
                    {expandedTraumaGroups.stable && (
                      <div className="flex flex-col divide-y divide-emerald-500/5 bg-emerald-950/5">
                        {groupedTraumaFiles.stable.length === 0 ? (
                          <div className="font-mono text-[10px] text-emerald-500/30 py-3.5 text-center italic select-none">
                            No stable trauma assets registered matching scanner query.
                          </div>
                        ) : (
                          groupedTraumaFiles.stable.map(node => renderNodeRow(node, true))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>)}
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
                <div className="w-full flex flex-col xl:flex-row gap-4" id="dual-forensic-split-view">
                  
                  {/* Left Column: Specifications sheet */}
                  <div className="flex-1 flex flex-col gap-1.5 min-w-0">
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

                       <div className="md:col-span-2 flex flex-col gap-1 border-t border-emerald-500/5 pt-1.5" id="sparkline-container">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-500/40 text-[9px] uppercase tracking-wider">Distress Index:</span>
                          <span className={`font-semibold ${selectedFile.traumaRating && selectedFile.traumaRating > 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {selectedFile.traumaRating}% STRESS
                          </span>
                        </div>
                        {(() => {
                          const historyPoints = getTraumaHistory(selectedFile.path, selectedFile.traumaRating ?? 0);
                          const sparkWidth = 240;
                          const sparkHeight = 28;
                          const maxRating = Math.max(...historyPoints.map(p => p.rating), 30);
                          const minRating = Math.min(...historyPoints.map(p => p.rating), 0);
                          const ratingRange = maxRating - minRating === 0 ? 1 : maxRating - minRating;

                          const ptsCoords = historyPoints.map((p, idx) => {
                            const x = (idx / 4) * (sparkWidth - 8) + 4;
                            const y = sparkHeight - ((p.rating - minRating) / ratingRange) * (sparkHeight - 8) - 4;
                            return { x, y, rating: p.rating };
                          });

                          const pathD = ptsCoords.reduce((acc, pt, idx) => {
                            return acc + `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
                          }, '');

                          const isHighStress = (selectedFile.traumaRating ?? 0) > 70;
                          const strokeColor = isHighStress ? 'stroke-red-500/90' : 'stroke-emerald-500/90';
                          const fillColor = isHighStress ? 'fill-red-500/10' : 'fill-emerald-500/10';
                          const dotColor = isHighStress ? 'fill-red-400 stroke-red-650' : 'fill-emerald-400 stroke-emerald-650';

                          const fillD = `${pathD} L ${ptsCoords[4].x.toFixed(1)} ${sparkHeight} L ${ptsCoords[0].x.toFixed(1)} ${sparkHeight} Z`;

                          return (
                            <div className="bg-black/45 border border-emerald-500/10 rounded px-1.5 py-1 flex flex-col gap-1 mt-0.5 font-mono">
                              <div className="flex items-center justify-between text-[7px] text-zinc-500 uppercase tracking-widest leading-none select-none">
                                <span>5-Scan Telemetry Trend</span>
                                <span className={isHighStress ? 'text-red-400/80 font-bold' : 'text-emerald-400/80 font-bold'}>
                                  Peak: {maxRating}%
                                </span>
                              </div>
                              <div className="relative h-6 w-full flex items-center bg-[#01040f]/60 rounded border border-emerald-500/5 overflow-hidden">
                                <svg className="w-full h-full" viewBox={`0 0 ${sparkWidth} ${sparkHeight}`} preserveAspectRatio="none">
                                  <line x1="0" y1={sparkHeight / 2} x2={sparkWidth} y2={sparkHeight / 2} className="stroke-emerald-500/5" strokeDasharray="2 2" />
                                  <path d={fillD} className={`${fillColor}`} />
                                  <path d={pathD} fill="none" className={`${strokeColor}`} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                  {ptsCoords.map((pt, idx) => (
                                    <circle
                                      key={idx}
                                      cx={pt.x}
                                      cy={pt.y}
                                      r="1.8"
                                      className={`${dotColor}`}
                                      strokeWidth="0.8"
                                    >
                                      <title>{`Scan ${idx + 1}: ${pt.rating}%`}</title>
                                    </circle>
                                  ))}
                                </svg>
                              </div>
                            </div>
                          );
                        })()}
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

                  {/* Right Column: Detailed Forensic Trauma Timeline */}
                  <div className="w-full xl:w-72 xl:border-l xl:border-emerald-500/10 xl:pl-4 flex flex-col gap-2 min-w-0" id="forensic-timeline-subpanel">
                    <div className="flex items-center justify-between border-b border-emerald-500/10 pb-1.5">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase text-[10px]">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        Forensic Trauma Pathway
                      </span>
                      <span className="text-[8px] text-emerald-500/40 uppercase tracking-widest leading-none font-bold">
                        HISTORIC LOG ARCHIVE
                      </span>
                    </div>

                    {/* Timeline Log body */}
                    <div className="max-h-[140px] xl:max-h-[160px] overflow-y-auto relative pr-1.5 flex flex-col gap-2.5 py-1 text-[10px] scrollbar-thin scrollbar-thumb-emerald-500/10" id="timeline-scroll-area">
                      {/* Vertical connector line */}
                      <div className="absolute left-[5px] top-1.5 bottom-1.5 w-[1px] bg-emerald-500/10" />

                      {getForensicTimelineEvents(selectedFile).map((evt) => {
                        // determine color class of dot
                        const dotColor = 
                          evt.severity === 'critical' ? 'bg-red-500 border-red-500/40 ring-red-500/20' : 
                          evt.severity === 'high' ? 'bg-orange-500 border-orange-500/40 ring-orange-500/20' : 
                          evt.severity === 'medium' ? 'bg-amber-500 border-amber-500/35 ring-amber-500/15' : 
                          'bg-emerald-500 border-emerald-500/30 ring-emerald-500/10';

                        return (
                          <div key={evt.id} className="relative pl-4 flex flex-col gap-0.5">
                            {/* Dot node */}
                            <span className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full border ring-2 ${dotColor}`} />
                            
                            <div className="flex items-center justify-between gap-1 text-[8px] text-emerald-500/50 uppercase select-none leading-none">
                              <span>{evt.timestamp}</span>
                              <span className="font-mono">@{evt.operator}</span>
                            </div>

                            <div className={`text-[9.5px] font-black uppercase tracking-wider leading-tight ${
                              evt.severity === 'critical' ? 'text-red-400' :
                              evt.severity === 'high' ? 'text-orange-400' :
                              evt.severity === 'medium' ? 'text-amber-400' :
                              'text-emerald-300'
                            }`}>
                              {evt.title}
                            </div>

                            <p className="text-[8.5px] text-zinc-400 leading-normal font-mono select-all select-text font-normal">
                              {evt.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Simulation Injector Controller */}
                    <div className="mt-1 bg-black/40 border border-emerald-500/10 hover:border-emerald-500/25 transition-all p-2 rounded flex flex-col gap-1 text-[9px]" id="trauma-simulator-control">
                      <div className="text-[8px] font-black uppercase tracking-wider text-emerald-500/60 leading-none">
                        ⚙️ SIMULATE INCIDENT VECTOR
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <select
                          value={timelineSimulationIncident}
                          onChange={(e) => setTimelineSimulationIncident(e.target.value)}
                          className="flex-1 bg-[#020617] border border-emerald-500/25 hover:border-emerald-500/40 text-[9px] text-emerald-300 font-mono focus:outline-none focus:ring-0 uppercase h-6 px-1 cursor-pointer rounded"
                        >
                          <option value="MALICIOUS_OVERFLOW">HEAP OVERFLOW (+25%)</option>
                          <option value="INTEGRITY_COMPROMISE">PARITY FAULT (+15%)</option>
                          <option value="SECURITY_INTRUSION">ILLEGAL BYPASS (+35%)</option>
                          <option value="AUDIT_RESET">CORE RE-ALIGN (-20%)</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => injectTraumaIncident(timelineSimulationIncident)}
                          className="h-6 bg-emerald-500/15 hover:bg-emerald-500/30 active:bg-emerald-500/45 border border-emerald-500/35 hover:border-emerald-500/65 text-emerald-300 px-2 py-0.5 rounded transition-all cursor-pointer font-black uppercase text-[8.5px] tracking-wider"
                          title="Inject trauma signature at this asset's active interface state"
                        >
                          INJECT
                        </button>
                      </div>
                    </div>
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

          <div className="border-t border-emerald-500/10 pt-2.5 mt-2.5 flex-shrink-0 min-h-[32px] flex items-center justify-between font-mono text-[10px]" id="node-explorer-footer">
            <AnimatePresence mode="wait">
              {batchSelectedPaths.length > 1 ? (
                <motion.div
                  key="bulk-overlay"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="w-full flex flex-wrap items-center justify-between gap-1.5 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/25 rounded px-2.5 py-1.5 shadow-[inset_0_1px_3px_rgba(245,158,11,0.05),0_0_12px_rgba(245,158,11,0.05)] transition-all"
                  id="bulk-action-footer-overlay"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-amber-400 font-black tracking-wider uppercase">
                      BULK DETECTOR OPERATIONAL:
                    </span>
                    <span className="text-white font-extrabold px-1.5 py-0.5 bg-amber-950/50 border border-amber-500/30 rounded text-[9.5px]">
                      {batchSelectedPaths.length} Nodes Queue
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Tag entry control */}
                    <div className="flex items-center gap-1 bg-black/60 border border-emerald-500/20 rounded px-1.5 py-0.5" id="bulk-tag-form-wrapper">
                      <Tag className="w-2.5 h-2.5 text-emerald-400" />
                      <input
                        type="text"
                        placeholder="ADD TAG..."
                        value={bulkTagInputValue}
                        onChange={(e) => setBulkTagInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = bulkTagInputValue.trim();
                            if (val) {
                              setFileTags(prev => {
                                const updated = { ...prev };
                                batchSelectedPaths.forEach(path => {
                                  const currentTags = updated[path] ? [...updated[path]] : [];
                                  if (!currentTags.includes(val)) {
                                    currentTags.push(val);
                                  }
                                  updated[path] = currentTags;
                                });
                                return updated;
                              });
                              addLog(`Assigned metadata tag [${val}] to ${batchSelectedPaths.length} selected assets.`, 'success');
                              setBulkTagInputValue('');
                            }
                          }
                        }}
                        className="bg-transparent border-none text-[8.5px] font-mono text-emerald-300 placeholder-emerald-500/30 focus:outline-none focus:ring-0 w-24 uppercase p-0"
                        id="bulk-tag-input-field"
                      />
                      <button
                        type="button"
                        id="bulk-tag-overlay-btn"
                        onClick={() => {
                          const val = bulkTagInputValue.trim();
                          if (val) {
                            setFileTags(prev => {
                              const updated = { ...prev };
                              batchSelectedPaths.forEach(path => {
                                const currentTags = updated[path] ? [...updated[path]] : [];
                                if (!currentTags.includes(val)) {
                                  currentTags.push(val);
                                }
                                updated[path] = currentTags;
                              });
                              return updated;
                            });
                            addLog(`Assigned metadata tag [${val}] to ${batchSelectedPaths.length} selected assets.`, 'success');
                            setBulkTagInputValue('');
                          }
                        }}
                        className="text-[8px] bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-white px-1 py-0.5 rounded transition-colors font-bold uppercase cursor-pointer"
                      >
                        + Tag
                      </button>
                    </div>

                    <button
                      type="button"
                      id="bulk-quarantine-overlay-btn"
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
                      className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 hover:text-white transition-all cursor-pointer font-black uppercase text-[8.5px] leading-none"
                    >
                      🔒 Quarantine
                    </button>

                    <button
                      type="button"
                      id="bulk-flag-overlay-btn"
                      onClick={() => {
                        setFlaggedFiles(prev => {
                          const updated = { ...prev };
                          batchSelectedPaths.forEach(path => {
                            updated[path] = true;
                          });
                          return updated;
                        });
                        addLog(`Security flags assigned to ${batchSelectedPaths.length} selected assets.`, 'warning');
                      }}
                      className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 hover:text-white transition-all cursor-pointer font-black uppercase text-[8.5px] leading-none"
                    >
                      🚩 Flag
                    </button>

                    <button
                      type="button"
                      id="bulk-release-all-btn"
                      onClick={() => {
                        setQuarantinedFiles(prev => {
                          const updated = { ...prev };
                          batchSelectedPaths.forEach(path => {
                            updated[path] = false;
                          });
                          return updated;
                        });
                        setFlaggedFiles(prev => {
                          const updated = { ...prev };
                          batchSelectedPaths.forEach(path => {
                            updated[path] = false;
                          });
                          return updated;
                        });
                        setFileTags(prev => {
                          const updated = { ...prev };
                          batchSelectedPaths.forEach(path => {
                            updated[path] = [];
                          });
                          return updated;
                        });
                        addLog(`Sanitization/Release engaged for ${batchSelectedPaths.length} selected assets. Tags and status markers purged.`, 'info');
                      }}
                      className="px-1.5 py-1 rounded bg-black/40 hover:bg-black/80 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer font-bold uppercase text-[8px] leading-none"
                    >
                      🛡️ Clean
                    </button>

                    <button
                      type="button"
                      id="bulk-audit-report-btn"
                      onClick={() => {
                        setShowCombinedAuditModal(true);
                        addLog(`Compiling detailed security forensic statement for ${batchSelectedPaths.length} sectors. Loading dynamic metrics...`, 'info');
                      }}
                      className="px-2 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all cursor-pointer font-black uppercase text-[8.5px] leading-none flex items-center gap-1 shadow-[0_0_8px_rgba(6,182,212,0.15)]"
                      title="Compile and view a comprehensive forensic audit statement of all selected assets"
                    >
                      <FileText className="w-3 h-3 text-cyan-400" />
                      <span>Audit Statement</span>
                    </button>

                    <button
                      type="button"
                      id="bulk-clear-selection-overlay-btn"
                      onClick={() => {
                        setBatchSelectedPaths([]);
                        addLog("Deselected all bulk queue reference systems.", "info");
                      }}
                      className="px-1.5 py-1 rounded bg-transparent hover:bg-red-950/20 border border-red-500/10 text-red-400 hover:text-red-300 transition-all cursor-pointer font-bold uppercase text-[8px] leading-none"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="standard-footer"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="w-full flex items-center justify-between text-emerald-500/40 pt-0.5"
                >
                  <span>FILESYSTEM INTEGRITY STATUS</span>
                  <span className="text-emerald-400 font-semibold">[NOMINALLY BALANCED]</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel: Holographic 3D visualization analyzer (Col span 1) */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-full overflow-y-auto pr-1 relative">
          {/* Resizable handle between center node explorer & right details panel */}
          <div
            onMouseDown={startResizing}
            onTouchStart={startResizing}
            className="hidden lg:flex absolute left-[-11px] top-0 bottom-0 w-[14px] cursor-col-resize items-center justify-center select-none z-30 group"
            title="Drag to resize workspace layout"
            id="workspace-layout-resize-handle"
          >
            <div className="h-24 w-[1.5px] bg-emerald-500/15 group-hover:bg-emerald-500/45 group-active:bg-emerald-400 transition-colors rounded" />
            <div className="absolute top-[48%] flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
            </div>
          </div>

          <TraumaNodeVisualizer
            currentNodeName={activeInspectionNodeName}
            traumaLevel={activeInspectionTraumaLevel}
            anomalies={activeInspectionAnomalies}
          />
          <ForensicHeatmap
            terminalTheme={terminalTheme}
            maxTraumaRating={maxTraumaRating}
            addLog={addLog}
          />
          <TelemetryPanel
            terminalTheme={terminalTheme}
            addLog={addLog}
            selectedFile={selectedFile}
          />
          <CasingTraumaVisualizer
            terminalTheme={terminalTheme}
            initialFilesystem={initialFilesystem}
            filesystemUpdateTrigger={filesystemUpdateTrigger}
            addLog={addLog}
            forensicLogs={forensicLogs}
          />
        </div>
      </div>

      {/* 3. Bottom Black Box Forensic Logger */}
      <footer id="black-box-forensic-logger" className="h-44 border border-emerald-500/20 bg-[#020617]/95 rounded p-3 bg-black/80 flex flex-col overflow-hidden scanline-glow flex-shrink-0 select-text relative z-10 transition-all duration-300">
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
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Real-time Query Filter Engine */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-950/20 text-[9px] font-mono text-emerald-400 w-28 sm:w-36 md:w-48 overflow-hidden transition-all duration-150">
              <Search className="w-3 h-3 text-emerald-500/50 flex-shrink-0" />
              <input
                id="forensic-log-search"
                type="text"
                placeholder="SEARCH ENGINE..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="bg-transparent text-emerald-300 font-bold outline-none border-none p-0 focus:ring-0 text-[9px] h-3.5 w-full placeholder:text-emerald-500/20 uppercase"
              />
              {logSearchQuery && (
                <button
                  id="reset-forensic-search"
                  type="button"
                  onClick={() => setLogSearchQuery('')}
                  className="text-emerald-500/70 hover:text-emerald-300 cursor-pointer flex-shrink-0 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              id="toggle-timestamps-btn"
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
      </div>

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
                                
                                const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
                                
                                const findAndUpdateScan = (node: DirectoryNode): boolean => {
                                  if (node.path === selectedFile.path) {
                                    node.lastScanned = nowStr;
                                    return true;
                                  }
                                  if (node.children) {
                                    for (const child of node.children) {
                                      if (findAndUpdateScan(child)) return true;
                                    }
                                  }
                                  return false;
                                };
                                findAndUpdateScan(initialFilesystem);
                                
                                setSelectedFile(prev => {
                                  if (prev && prev.path === selectedFile.path) {
                                    return { ...prev, lastScanned: nowStr };
                                  }
                                  return prev;
                                });
                                setFilesystemUpdateTrigger(prev => prev + 1);

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
                            {selectedFile.anomalies.map((anom, idx) => {
                              const details = getAnomalyThreatDetails(anom);
                              return (
                                <div 
                                  key={idx} 
                                  className={`border p-2.5 rounded flex flex-col gap-1.5 transition-all duration-300 ${details.borderClass} ${details.glowShadow}`}
                                >
                                  <div className="flex items-center justify-between text-[8px] font-mono">
                                    <span className="opacity-60 text-emerald-500/50">SECTOR MAP: CH-6421</span>
                                    <span className={`px-1.5 py-0.5 rounded border text-[7px] font-black tracking-widest uppercase flex items-center gap-1 ${details.badgeClass}`}>
                                      <span className={`w-1 h-1 rounded-full ${details.dotColor} animate-pulse`} />
                                      {details.severity}
                                    </span>
                                  </div>
                                  <span className={`font-mono text-[9.5px] leading-relaxed select-text font-bold ${details.colorClass}`}>
                                    {anom}
                                  </span>
                                </div>
                              );
                            })}
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
                          <span className="w-2.5 h-0.5" style={{ backgroundColor: 'var(--theme-chart-line-hex, #34d399)' }} />
                          <span className="font-semibold" style={{ color: 'var(--theme-chart-line-hex, #34d399)' }}>Present History ({selectedFile.traumaRating}%)</span>
                        </span>
                      </div>

                      <div className="w-full h-full pt-6 relative px-8 flex-grow">
                        <svg className="w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
                          {/* Gridline bounds */}
                          <line x1="0" y1="0" x2="400" y2="0" stroke="var(--theme-grid-stroke, rgba(16,185,129,0.06))" strokeDasharray="1 2" />
                          <line x1="0" y1="30" x2="400" y2="30" stroke="var(--theme-grid-stroke, rgba(16,185,129,0.06))" strokeDasharray="1 2" />
                          <line x1="0" y1="60" x2="400" y2="60" stroke="var(--theme-grid-stroke, rgba(16,185,129,0.08))" />

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
                                stroke="var(--theme-chart-line-hex, #34d399)" 
                                strokeWidth="2.2" 
                                className="animate-pulse"
                                style={{ filter: 'drop-shadow(0 0 4px var(--theme-chart-line-hex, rgba(52,211,153,0.3)))' }}
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

          {/* Node Context Menu */}
          <AnimatePresence>
            {contextMenu.visible && contextMenu.node && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="fixed z-50 bg-[#020617] border border-emerald-500/45 rounded p-1 shadow-[0_4px_24px_rgba(16,185,129,0.35)] font-mono text-[10px] min-w-[155px]"
                style={{
                  left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 170 : 1000),
                  top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 150 : 800)
                }}
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.preventDefault()}
              >
                <div className="px-2 py-1 text-[8px] text-emerald-500/50 uppercase tracking-widest border-b border-emerald-500/15 font-black mb-1.5 select-none text-center">
                  Sector Operations
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    const node = contextMenu.node!;
                    setRenameState({ visible: true, path: node.path, oldName: node.name, newName: node.name });
                    setContextMenu(prev => ({ ...prev, visible: false }));
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-emerald-300 hover:text-white hover:bg-emerald-500/10 rounded transition-all duration-150 text-left cursor-pointer font-bold uppercase"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rename</span>
                </button>

                <button
                  type="button"
                  id="context-menu-quarantine-btn"
                  onClick={() => {
                    const node = contextMenu.node!;
                    const next = !quarantinedFiles[node.path];
                    setQuarantinedFiles(prev => ({ ...prev, [node.path]: next }));
                    if (next) {
                      addLog(`Quarantine protocol ENGAGED for asset path: [${node.name}]`, 'warning');
                    } else {
                      addLog(`Quarantine protocol COMPLETED for asset path: [${node.name}]`, 'info');
                    }
                    setContextMenu(prev => ({ ...prev, visible: false }));
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-955/20 rounded transition-all duration-150 text-left cursor-pointer font-bold uppercase mt-0.5"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{quarantinedFiles[contextMenu.node?.path || ''] ? 'Release' : 'Quarantine'}</span>
                </button>

                <button
                  type="button"
                  id="context-menu-flag-btn"
                  onClick={() => {
                    const node = contextMenu.node!;
                    const next = !flaggedFiles[node.path];
                    setFlaggedFiles(prev => ({ ...prev, [node.path]: next }));
                    if (next) {
                      addLog(`Security FLAG assigned to asset segment: [${node.name}]`, 'warning');
                    } else {
                      addLog(`Security FLAG cleared for asset segment: [${node.name}]`, 'info');
                    }
                    setContextMenu(prev => ({ ...prev, visible: false }));
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-955/20 rounded transition-all duration-150 text-left cursor-pointer font-bold uppercase mt-0.5"
                >
                  <Flag className="w-3.5 h-3.5 text-red-500" />
                  <span>{flaggedFiles[contextMenu.node?.path || ''] ? 'Unflag' : 'Flag'}</span>
                </button>

                <button
                  type="button"
                  id="context-menu-copy-path-btn"
                  onClick={() => {
                    const node = contextMenu.node!;
                    navigator.clipboard.writeText(node.path).then(() => {
                      addLog(`Path copied to clipboard: ${node.path}`, 'info');
                      setCopiedPath(node.path);
                      setTimeout(() => {
                        setCopiedPath(null);
                      }, 2500);
                    }).catch(err => {
                      console.error('Clipboard copy failed:', err);
                      addLog(`Failed to copy pathway to clipboard`, 'error');
                    });
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-emerald-300 hover:text-white hover:bg-emerald-500/10 rounded transition-all duration-150 text-left cursor-pointer font-bold uppercase mt-0.5"
                >
                  {copiedPath === contextMenu.node!.path ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{copiedPath === contextMenu.node!.path ? 'Copied!' : 'Copy Path'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const node = contextMenu.node!;
                    deleteNodeFromFilesystem(node.path);
                    setContextMenu(prev => ({ ...prev, visible: false }));
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all duration-150 text-left cursor-pointer font-bold uppercase mt-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPropertiesNode(contextMenu.node);
                    setContextMenu(prev => ({ ...prev, visible: false }));
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-cyan-300 hover:text-white hover:bg-cyan-500/10 rounded transition-all duration-150 text-left cursor-pointer font-bold uppercase mt-0.5"
                >
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Properties</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Registry Rename dialog modal overlay */}
          <AnimatePresence>
            {renameState.visible && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-[#020617] border-2 border-emerald-500/40 rounded-lg max-w-sm w-full p-4 font-mono shadow-[0_0_35px_rgba(16,185,129,0.28)] scanline-glow flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <span className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 leading-none">
                      <Edit3 className="w-4 h-4 text-emerald-400 animate-pulse" />
                      REGISTRY RENAME UTILITY
                    </span>
                    <button 
                      type="button"
                      onClick={() => setRenameState({ visible: false, path: '', oldName: '', newName: '' })}
                      className="text-emerald-500/60 hover:text-red-450 cursor-pointer text-sm font-black transition-colors"
                    >
                      &times;
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div>
                      <div className="text-[8px] text-emerald-500/50 uppercase font-black leading-none mb-1">TARGET PATHWAY:</div>
                      <div className="bg-black/60 border border-emerald-500/10 p-2 rounded text-[9.5px] text-emerald-300 truncate select-all">{renameState.path}</div>
                    </div>
                    
                    <div>
                      <div className="text-[8px] text-emerald-500/50 uppercase font-black leading-none mb-1">ENTER NEW REGISTRY DESIGNATION:</div>
                      <input
                        type="text"
                        value={renameState.newName}
                        onChange={(e) => setRenameState(prev => ({ ...prev, newName: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            renameNodeInFilesystem(renameState.path, renameState.newName);
                            setRenameState({ visible: false, path: '', oldName: '', newName: '' });
                          }
                        }}
                        autoFocus
                        placeholder="New designation name..."
                        className="w-full bg-black border border-emerald-500/40 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-emerald-500/10 pt-3">
                    <button
                      type="button"
                      onClick={() => setRenameState({ visible: false, path: '', oldName: '', newName: '' })}
                      className="px-3 py-1.5 rounded border border-emerald-500/25 bg-transparent text-emerald-500/80 hover:text-white hover:bg-emerald-900/10 transition-all text-xs cursor-pointer font-bold uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        renameNodeInFilesystem(renameState.path, renameState.newName);
                        setRenameState({ visible: false, path: '', oldName: '', newName: '' });
                      }}
                      className="px-3 py-1.5 rounded bg-emerald-500 text-black border border-emerald-400 font-black hover:bg-emerald-400 transition-all text-xs cursor-pointer uppercase shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    >
                      Commit Change
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Registry Properties dialog modal overlay */}
          <AnimatePresence>
            {propertiesNode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-[#020617] border-2 border-cyan-500/40 rounded-lg max-w-sm w-full p-4 font-mono shadow-[0_0_35px_rgba(6,182,212,0.28)] scanline-glow flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                    <span className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 leading-none">
                      <Info className="w-4 h-4 text-cyan-400 animate-pulse" />
                      REGISTRY PROP MATRIX
                    </span>
                    <button 
                      type="button"
                      onClick={() => setPropertiesNode(null)}
                      className="text-cyan-500/60 hover:text-red-450 cursor-pointer text-sm font-black transition-colors"
                    >
                      &times;
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 text-[10px]">
                    <div className="grid grid-cols-3 border-b border-cyan-500/10 pb-1.5">
                      <span className="text-cyan-500/50 uppercase font-bold text-[8.5px]">IDENTIFIER:</span>
                      <span className="col-span-2 text-white font-black truncate">{propertiesNode.name}</span>
                    </div>

                    <div className="grid grid-cols-3 border-b border-cyan-500/10 pb-1.5">
                      <span className="text-cyan-500/50 uppercase font-bold text-[8.5px]">SYSTEM PATH:</span>
                      <span className="col-span-2 text-cyan-300 font-bold truncate select-all">{propertiesNode.path}</span>
                    </div>

                    <div className="grid grid-cols-3 border-b border-cyan-500/10 pb-1.5">
                      <span className="text-cyan-500/50 uppercase font-bold text-[8.5px]">ALLOCATED TYPE:</span>
                      <span className="col-span-2 text-zinc-300 font-bold uppercase tracking-wide">
                        {propertiesNode.type === 'directory' ? '📁 Directory Registry' : '📄 File Object'}
                      </span>
                    </div>

                    {propertiesNode.size && (
                      <div className="grid grid-cols-3 border-b border-cyan-500/10 pb-1.5">
                        <span className="text-cyan-500/50 uppercase font-bold text-[8.5px]">QUANTUM SIZE:</span>
                        <span className="col-span-2 text-emerald-400 font-black">{propertiesNode.size}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 border-b border-cyan-500/10 pb-1.5">
                      <span className="text-cyan-500/50 uppercase font-bold text-[8.5px]">LAST ALIGNMENT:</span>
                      <span className="col-span-2 text-zinc-300 truncate">{propertiesNode.lastModified}</span>
                    </div>

                    {propertiesNode.type === 'file' && (
                      <div className="grid grid-cols-3 border-b border-cyan-500/10 pb-1.5">
                        <span className="text-cyan-500/50 uppercase font-bold text-[8.5px]">LAST AUDITED:</span>
                        <span className="col-span-2 flex items-center gap-1.5 flex-wrap">
                          <span className="text-zinc-300 font-bold font-mono">
                            {propertiesNode.lastScanned ?? 'NEVER SCAN REGISTERED'}
                          </span>
                          {(() => {
                            const status = getScanAgeStatus(propertiesNode.lastScanned);
                            return (
                              <span className={`px-1.5 py-0.5 rounded border text-[7px] font-black uppercase tracking-wider leading-none select-none ${
                                status.text === 'FRESH'
                                  ? 'bg-emerald-950/45 border-emerald-500/40 text-emerald-400 animate-pulse'
                                  : status.text === 'STALE'
                                    ? 'bg-amber-950/45 border-amber-500/40 text-amber-400'
                                    : 'bg-red-950/45 border-red-500/40 text-red-400'
                              }`}>
                                {status.text}
                              </span>
                            );
                          })()}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 border-b border-cyan-500/10 pb-1.5">
                      <span className="text-cyan-500/50 uppercase font-bold text-[8.5px]">TRAUMA INDEX:</span>
                      <span className="col-span-2 flex items-center">
                        <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase ${
                          (propertiesNode.traumaRating ?? 0) > 70 
                            ? 'bg-red-950/45 border-red-500/40 text-red-400 animate-pulse' 
                            : 'bg-emerald-950/45 border-emerald-500/40 text-emerald-400'
                        }`}>
                          {propertiesNode.traumaRating ?? (propertiesNode.type === 'directory' ? 15 : 0)}% STRESS
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 pb-1">
                      <span className="text-cyan-500/50 uppercase font-bold text-[8.5px]">THREAT LOGS:</span>
                      <span className="col-span-2 font-bold">
                        {propertiesNode.anomalies && propertiesNode.anomalies.length > 0 ? (
                          <span className="text-red-400 uppercase text-[9px] font-bold">
                            ⚠️ {propertiesNode.anomalies.length} anomal{propertiesNode.anomalies.length === 1 ? 'y' : 'ies'} detected
                          </span>
                        ) : (
                          <span className="text-emerald-400 uppercase text-[9px] font-bold">
                            🛡️ Alignments Nominally Stable
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                   <div className="flex items-center justify-end border-t border-cyan-500/10 pt-3">
                    <button
                      type="button"
                      onClick={() => setPropertiesNode(null)}
                      className="px-4 py-1.5 rounded bg-cyan-500 text-black border border-cyan-400 font-black hover:bg-cyan-400 transition-all text-xs cursor-pointer uppercase shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                    >
                      Acknowledge
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Combined Forensic Audit Report modal overlay */}
          <AnimatePresence>
            {showCombinedAuditModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-[#020617] border-2 border-cyan-500/40 rounded-lg max-w-2xl w-full p-4 font-mono shadow-[0_0_35px_rgba(6,182,212,0.35)] scanline-glow flex flex-col gap-4 max-h-[90vh] overflow-hidden"
                  id="combined-audit-modal"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                    <span className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 leading-none">
                      <FileText className="w-4 h-4 text-cyan-400 animate-pulse" />
                      SYSTEM INTEGRITY AUDIT STATEMENT
                    </span>
                    <button 
                      type="button"
                      onClick={() => setShowCombinedAuditModal(false)}
                      className="text-cyan-500/60 hover:text-red-400 cursor-pointer text-sm font-black transition-colors"
                      title="Close Audit Report Dialogue"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Modal Body (Scrollable) */}
                  <div className="flex-grow overflow-y-auto flex flex-col gap-4 pr-1 text-[10px] scrollbar-thin scrollbar-thumb-cyan-500/20" id="audit-modal-scrollable-body">
                    
                    {/* Bento Metrics Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-black/60 border border-cyan-500/10 p-2 rounded flex flex-col gap-0.5">
                        <span className="text-cyan-500/40 text-[7.5px] uppercase tracking-wider font-extrabold">Audited Sectors</span>
                        <div className="text-white text-sm font-black flex items-baseline gap-1">
                          {selectedFilesReportStats.total} <span className="text-[8px] text-cyan-500/50">NODES</span>
                        </div>
                      </div>
                      
                      <div className="bg-black/60 border border-cyan-500/10 p-2 rounded flex flex-col gap-0.5">
                        <span className="text-cyan-500/40 text-[7.5px] uppercase tracking-wider font-extrabold">Mean Stress Quotient</span>
                        <div className="text-white text-sm font-black flex items-baseline gap-1">
                          <span className={
                            selectedFilesReportStats.meanStress > 70 ? 'text-red-400 font-extrabold' :
                            selectedFilesReportStats.meanStress > 30 ? 'text-amber-400 font-bold' :
                            'text-emerald-400'
                          }>
                            {selectedFilesReportStats.meanStress}%
                          </span>
                          <span className="text-[7px] text-cyan-500/50 uppercase">AVERAGE</span>
                        </div>
                      </div>

                      <div className="bg-black/60 border border-cyan-500/10 p-2 rounded flex flex-col gap-0.5">
                        <span className="text-cyan-500/40 text-[7.5px] uppercase tracking-wider font-extrabold">Isolation Status</span>
                        <div className="text-white text-sm font-black flex items-baseline gap-1">
                          <span className={selectedFilesReportStats.quarantinedCount > 0 ? 'text-amber-300' : 'text-zinc-500'}>
                            {selectedFilesReportStats.quarantinedCount}
                          </span>
                          <span className="text-[8px] text-zinc-500">/ {selectedFilesReportStats.fileCount} IN CONFINEMENT</span>
                        </div>
                      </div>

                      <div className="bg-black/60 border border-cyan-500/10 p-2 rounded flex flex-col gap-0.5">
                        <span className="text-cyan-500/40 text-[7.5px] uppercase tracking-wider font-bold">Combined Anomaly Load</span>
                        <div className="text-white text-sm font-black flex items-baseline gap-1">
                          <span className={selectedFilesReportStats.anomalyCount > 0 ? 'text-red-400' : 'text-emerald-400'}>
                            {selectedFilesReportStats.anomalyCount}
                          </span>
                          <span className="text-[8px] text-cyan-500/50 uppercase">THREAT INDEX</span>
                        </div>
                      </div>
                    </div>

                    {/* Sector Listing Breakdown */}
                    <div className="flex flex-col gap-1.5" id="audit-sector-grids">
                      <div className="text-[8px] text-cyan-500/60 uppercase font-black tracking-wider mb-1 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-cyan-400" />
                        INDIVIDUAL SECTOR DISPOSITION MATRIX
                      </div>
                      <div className="border border-cyan-500/15 rounded overflow-hidden">
                        <div className="grid grid-cols-12 bg-cyan-950/30 border-b border-cyan-500/15 p-1.5 font-bold text-cyan-400 text-[8px] select-none tracking-widest uppercase">
                          <div className="col-span-5">SECTOR PATHWAY</div>
                          <div className="col-span-2 text-right">SIZE</div>
                          <div className="col-span-2 text-right">STRESS</div>
                          <div className="col-span-3 text-right">STATUS FLAGGING</div>
                        </div>
                        <div className="max-h-[140px] overflow-y-auto divide-y divide-cyan-500/10 bg-black/45" id="sector-matrix-body">
                          {selectedFilesForReport.map((file) => {
                            const isQuarantined = quarantinedFiles[file.path];
                            const isFlagged = flaggedFiles[file.path];
                            const hasAnomalies = file.anomalies && file.anomalies.length > 0;
                            const isSevere = file.traumaRating && file.traumaRating > 70;
                            
                            return (
                              <div key={file.path} className="grid grid-cols-12 p-1.5 hover:bg-cyan-500/5 items-center select-text">
                                <div className="col-span-5 truncate text-white font-semibold pr-1.5 flex flex-col" title={file.path}>
                                  <span className="truncate">{file.name}</span>
                                  <span className="text-[7.5px] text-zinc-500 truncate leading-none">{file.path}</span>
                                </div>
                                <div className="col-span-2 text-right text-zinc-400 text-[8.5px] font-mono leading-none">
                                  {file.size || 'DYN_ALLOC'}
                                </div>
                                <div className="col-span-2 text-right text-[8.5px] font-mono leading-none">
                                  <span className={`font-bold ${isSevere ? 'text-red-400' : file.traumaRating && file.traumaRating > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {file.traumaRating ?? 0}%
                                  </span>
                                </div>
                                <div className="col-span-3 text-right flex items-center justify-end gap-1 flex-wrap">
                                  {isQuarantined && (
                                    <span className="bg-amber-950/40 border border-amber-500/35 text-amber-300 text-[7px] font-black px-1.5 py-0.5 rounded leading-none select-none">
                                      QUARANTINE
                                    </span>
                                  )}
                                  {isFlagged && (
                                    <span className="bg-rose-950/40 border border-rose-500/35 text-rose-300 text-[7px] font-black px-1.5 py-0.5 rounded leading-none select-none">
                                      FLAGGED
                                    </span>
                                  )}
                                  {!isQuarantined && !isFlagged && !hasAnomalies && (
                                    <span className="bg-emerald-950/40 border border-emerald-500/35 text-emerald-400 text-[7px] font-black px-1.5 py-0.5 rounded leading-none select-none">
                                      NOMINAL
                                    </span>
                                  )}
                                  {hasAnomalies && !isQuarantined && !isFlagged && (
                                    <span className="bg-red-950/40 border border-red-500/35 text-red-300 text-[7px] font-black px-1.5 py-0.5 rounded leading-none select-none">
                                      THREATWARN
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Chronos Chronology Forensic Transcript */}
                    <div className="flex flex-col gap-1" id="forensic-chronicle-wrap">
                      <div className="text-[8px] text-cyan-500/60 uppercase font-black tracking-wider mb-1 flex items-center gap-1 select-none">
                        <Terminal className="w-3 h-3 text-cyan-400" />
                        AUDIT CHRONOLOGY TELEMETRY TRANSCRIPT
                      </div>
                      <div className="bg-black/80 border border-cyan-500/15 p-2 rounded max-h-[120px] overflow-y-auto font-mono text-[8px] leading-relaxed text-cyan-300/80 pr-1.5 flex flex-col gap-1">
                        <div className="text-zinc-500">// handshaked audit pipeline compile start</div>
                        {selectedFilesForReport.map((file, index) => {
                          const statusText = 
                            quarantinedFiles[file.path] ? 'SECURE_CONFINEMENT' :
                            flaggedFiles[file.path] ? 'PRIORITY_ALERT_PROBELOCKED' :
                            (file.traumaRating || 0) > 70 ? 'VULNERABILITY_HIGH_OVERFLOW' :
                            'NOMINAL_REALIGNED';

                          return (
                            <div key={`log-${index}`} className="flex flex-col">
                              <div>{`> [SECURE_SCAN_DAEMON @ 2026-06-02T15:10:10Z] INSPECTING: ${file.path}`}</div>
                              <div className="pl-3.5 text-zinc-400">{`- Structural Distortion Factor: ${file.traumaRating ?? 0}%`}</div>
                              <div className="pl-3.5 text-zinc-400">{`- Integrity Status Allocation Code: ${statusText}`}</div>
                              {file.anomalies && file.anomalies.length > 0 && (
                                <div className="pl-3.5 text-red-400">{`- WARNING: ${file.anomalies.length} anomaly signpost flagged!`}</div>
                              )}
                            </div>
                          );
                        })}
                        <div className="text-zinc-500">// system integrity evaluation successfully sealed</div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer Controls */}
                  <div className="flex items-center justify-between border-t border-cyan-500/20 pt-3">
                    <span className="text-[7.5px] text-cyan-500/50 uppercase tracking-widest select-none">
                      CIPHER KEY: SVRGN-{selectedFilesReportStats.meanStress}-{selectedFilesReportStats.total}BC
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
                          let reportText = `========================================================================\n`;
                          reportText += `       SOVEREIGN TERMINAL FORENSIC AUDIT INTEGRITY STATEMENT\n`;
                          reportText += `========================================================================\n`;
                          reportText += `Audit compiled on: ${timestampStr}\n`;
                          reportText += `Total Queued Sectors: ${selectedFilesReportStats.total} assets\n`;
                          reportText += `Mean Vulnerability Indicator: ${selectedFilesReportStats.meanStress}% STRESS\n`;
                          reportText += `Current Isolation Protocols: ${selectedFilesReportStats.quarantinedCount} quarantined\n`;
                          reportText += `Target Flags Prioritized: ${selectedFilesReportStats.flaggedCount} targets\n`;
                          reportText += `Total Anomalous Threats Registered: ${selectedFilesReportStats.anomalyCount}\n\n`;
                          reportText += `--- DETAILED INDIVIDUAL SECTOR LOGS ---\n`;
                          
                          selectedFilesForReport.forEach(file => {
                            reportText += `\n[PATH]: ${file.path}\n`;
                            reportText += ` - Type: ${file.type === 'directory' ? 'SYSTEM_SECTOR_DIR' : 'FILE_DATA'}\n`;
                            reportText += ` - Size Alloc: ${file.size || 'DYN_ALLOCATED'}\n`;
                            reportText += ` - Distress Level: ${file.traumaRating ?? 0}%\n`;
                            reportText += ` - Scan Fingerprint: ${file.lastScanned ? file.lastScanned : 'UNAUDITED/NONE'}\n`;
                            reportText += ` - Isolation Status: ${quarantinedFiles[file.path] ? 'ACTIVE QUARANTINE' : 'NOMINAL'}\n`;
                            reportText += ` - Priority Alert: ${flaggedFiles[file.path] ? 'ACTIVE FLAG' : 'CLEAR'}\n`;
                            if (file.anomalies && file.anomalies.length > 0) {
                              reportText += ` - Registered Anomalies:\n`;
                              file.anomalies.forEach(anom => {
                                reportText += `   * [ALERT] ${anom}\n`;
                              });
                            }
                          });
                          
                          reportText += `\n========================================================================\n`;
                          reportText += `STATEMENT ENDS // VERIFICATION KEY: SVRGN-SEC-${Math.random().toString(36).substring(2, 8).toUpperCase()}\n`;
                          reportText += `========================================================================\n`;

                          navigator.clipboard.writeText(reportText);
                          addLog(`Combined forensic audit copy compiled successfully. Integrity statement saved to clipboard.`, 'success');
                        }}
                        className="px-3 py-1.5 rounded border border-cyan-500/25 bg-transparent font-black hover:bg-cyan-500/10 text-cyan-300 hover:text-white flex items-center gap-1.5 text-xs transition-all cursor-pointer uppercase"
                      >
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Copy Statement</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setShowCombinedAuditModal(false)}
                        className="px-4 py-1.5 rounded bg-cyan-500 text-black border border-cyan-400 font-black hover:bg-cyan-400 transition-all text-xs cursor-pointer uppercase shadow-[0_0_10px_rgba(6,182,212,0.35)]"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>

                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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
