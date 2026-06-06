import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Compass, 
  RotateCw, 
  Settings2, 
  Layers, 
  ShieldAlert, 
  Info, 
  Orbit, 
  Search,
  Focus,
  Link2,
  Flame,
  Disc
} from 'lucide-react';
import { DirectoryNode, ForensicLog } from '../types';

interface CasingTraumaVisualizerProps {
  terminalTheme?: 'emerald' | 'crimson';
  initialFilesystem: DirectoryNode;
  filesystemUpdateTrigger: number;
  addLog: (message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  forensicLogs?: ForensicLog[];
}

interface CasingArtifact {
  id: string;
  name: string;
  type: 'file_node' | 'casing_defect';
  depthM: number;      // Depth in meters (0 to 1000m)
  angleDeg: number;    // Radial angle (0 to 360 degrees)
  traumaLevel: number; // Anomaly rating (0 to 100)
  nominalTraumaLevel?: number; // Keep memory of nominal rating
  radialLossMm: number; // Spatial deformation (radial loss, e.g., 0 to 15mm)
  description: string;
  remediation: string;
  associatedPath?: string;
}

export const CasingTraumaVisualizer: React.FC<CasingTraumaVisualizerProps> = ({
  terminalTheme = 'emerald',
  initialFilesystem,
  filesystemUpdateTrigger,
  addLog,
  forensicLogs = []
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Core interactive projection settings
  const [spinAngle, setSpinAngle] = useState(45); // horizontal rotation (degrees)
  const [tiltAngle, setTiltAngle] = useState(15); // pitch/tilt (degrees)
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(12); // seconds per rotation
  const [casingRadius, setCasingRadius] = useState(55); // cylinder base radius
  const [minTraumaFilter, setMinTraumaFilter] = useState(0);
  const [depthRange, setDepthRange] = useState<[number, number]>([0, 1000]);
  const [isSynchronizedView, setIsSynchronizedView] = useState(false);
  const [showCasingSchema, setShowCasingSchema] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showCrossSection, setShowCrossSection] = useState(false);
  const [crossSectionDepth, setCrossSectionDepth] = useState(500);

  // Casing known material properties module state
  const [steelGrade, setSteelGrade] = useState<'J55' | 'N80' | 'P110' | 'Q125'>('N80');
  const [nominalThickness, setNominalThickness] = useState<number>(10.0);
  const [calibrationFactor, setCalibrationFactor] = useState<number>(1.0);
  
  // Selected anomaly details panel state
  const [selectedArtifact, setSelectedArtifact] = useState<CasingArtifact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Hovered coordinates from Telemetry Panel Chart
  const [hoveredDepth, setHoveredDepth] = useState<number | null>(null);
  const [hoveredTimeSnapshot, setHoveredTimeSnapshot] = useState<string | null>(null);

  // Navigational wellbore mini-map interactive state
  const [isScrubbingMap, setIsScrubbingMap] = useState(false);
  const [mapHoverDepth, setMapHoverDepth] = useState<number | null>(null);

  const handleMiniMapCommit = (clientY: number, containerRect: DOMRect, isInitialClick = false) => {
    const relativeY = clientY - containerRect.top;
    const percentage = Math.max(0, Math.min(1, relativeY / containerRect.height));
    const targetDepth = Math.round(percentage * 1000);
    
    setHoveredDepth(targetDepth);
    setHoveredTimeSnapshot("LIVE_SCRUB");
    setCrossSectionDepth(targetDepth);
    
    if (isInitialClick) {
      addLog(`[NAVIGATOR] Vertical viewport auto-aligned downhole target coordinates: DEPTH=${targetDepth}m.`, 'success');
    }
    
    // Dispatch synchronization custom event
    const customEvent = new CustomEvent('telemetry-hover-timestamp', {
      detail: {
        timeSnapshot: "LIVE_SCRUB",
        depthM: targetDepth
      }
    });
    window.dispatchEvent(customEvent);
  };

  // Hover states for interactive tooltips on specific casing trauma markers
  const [hoveredTooltipArtifact, setHoveredTooltipArtifact] = useState<CasingArtifact | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number, y: number } | null>(null);

  // Synchronize cross section depth scanner with system hover and selection
  useEffect(() => {
    if (hoveredDepth !== null) {
      setCrossSectionDepth(Math.round(hoveredDepth));
    } else if (selectedArtifact !== null) {
      setCrossSectionDepth(Math.round(selectedArtifact.depthM));
    }
  }, [hoveredDepth, selectedArtifact]);

  // Static physical casing defects to enrich dataset
  const staticDefects: CasingArtifact[] = useMemo(() => [
    {
      id: "def-01",
      name: "Mild Wall Thinning Zone #4",
      type: "casing_defect",
      depthM: 140,
      angleDeg: 160,
      traumaLevel: 32,
      radialLossMm: 2.4,
      description: "Pneumatic scour from injection fluids causing localized steel thinning.",
      remediation: "Continuous telemetry profiling. Keep well check frequencies nominal."
    },
    {
      id: "def-02",
      name: "Stress Fatigue Fracture Seam #1",
      type: "casing_defect",
      depthM: 380,
      angleDeg: 290,
      traumaLevel: 75,
      radialLossMm: 8.9,
      description: "Tectonic shifting strain loading near shale bedding transition boundary.",
      remediation: "Weld layer verification. Deploy hydraulic compression packer segment."
    },
    {
      id: "def-03",
      name: "Out-of-Roundness Ovality Clog",
      type: "casing_defect",
      depthM: 650,
      angleDeg: 80,
      traumaLevel: 55,
      radialLossMm: 5.1,
      description: "Overburden borehole compression forcing cylinder cross-section pinch.",
      remediation: "Run sizing mandrel audit sweep. Calibrate casing thickness indexes."
    },
    {
      id: "def-04",
      name: "Casing Internal Joint Pit Spot",
      type: "casing_defect",
      depthM: 910,
      angleDeg: 215,
      traumaLevel: 41,
      radialLossMm: 3.2,
      description: "Microbiological sulfate reduction corroding collar connection seals.",
      remediation: "Inject bio-inhibitor chemicals into downhole mud flow."
    }
  ], []);

  // Dynamically map active file trauma nodes onto the physical 3D casing space!
  const rawArtifacts = useMemo(() => {
    const list: CasingArtifact[] = [...staticDefects];

    // Recursive directory traversal to extract active telemetry trauma nodes
    const traverse = (node: DirectoryNode) => {
      if (node.type === 'file' && node.traumaRating && node.traumaRating > 0) {
        // Deterministically map file parameters to 3D coordinates using hash mapping
        let hash = 0;
        for (let i = 0; i < node.name.length; i++) {
          hash = (hash << 5) - hash + node.name.charCodeAt(i);
          hash |= 0;
        }
        const depthHash = Math.abs(hash % 900) + 50; // Map depth from 50m to 950m
        const angleHash = Math.abs((hash >> 3) % 360); // Circumferential angle 0 to 359°
        const radialLoss = Number((2.0 + (node.traumaRating / 100) * 12.0).toFixed(1)); // 2mm to 14mm

        let remediationGuide = "Initiate sector rebuild protocol to realign digital/physical integrity headers.";
        if (node.traumaRating > 80) {
          remediationGuide = "CRITICAL METRIC: Quarantine immediate node sector indexes. Engage full system bypass validation.";
        } else if (node.traumaRating > 50) {
          remediationGuide = "WARNING SECTOR: Trigger manual rescan. Audit index integrity vectors for parity checking.";
        }

        const anomalyStrings = node.anomalies?.join('; ') || 'Deformity indicators flagged during scanline sweeping';

        list.push({
          id: `file-${node.path}`,
          name: `${node.name} (File Core)`,
          type: "file_node",
          depthM: depthHash,
          angleDeg: angleHash,
          traumaLevel: node.traumaRating,
          radialLossMm: radialLoss,
          description: `Active directory asset containing ${node.anomalies?.length || 0} index anomalies. Diagnostic reports: [${anomalyStrings}].`,
          remediation: remediationGuide,
          associatedPath: node.path
        });
      }

      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    traverse(initialFilesystem);
    return list;
  }, [initialFilesystem, filesystemUpdateTrigger, staticDefects]);

  // Dynamic material stress multiplier calculated based on user input
  const materialStressMultiplier = useMemo(() => {
    let gradeFact = 1.0;
    if (steelGrade === 'J55') gradeFact = 1.30;
    else if (steelGrade === 'N80') gradeFact = 1.0;
    else if (steelGrade === 'P110') gradeFact = 0.78;
    else if (steelGrade === 'Q125') gradeFact = 0.65;

    // Relative to standard nominal base of 10.0mm thickness
    const thicknessFact = 10.0 / nominalThickness;

    return Number((gradeFact * thicknessFact * calibrationFactor).toFixed(3));
  }, [steelGrade, nominalThickness, calibrationFactor]);

  // Adjust casing artifacts database according to material properties
  const allArtifacts = useMemo(() => {
    return rawArtifacts.map(art => {
      // Scale trauma level based on material stress multiplier, bounded between 1 and 100
      const adjustedTrauma = Math.min(100, Math.max(1, Math.round(art.traumaLevel * materialStressMultiplier)));
      return {
        ...art,
        nominalTraumaLevel: art.traumaLevel, // Keep memory of nominal rating
        traumaLevel: adjustedTrauma // Override traumaLevel with adjusted value for simulations
      };
    });
  }, [rawArtifacts, materialStressMultiplier]);

  // Filtered dataset active for visual display
  const filteredArtifacts = useMemo(() => {
    return allArtifacts.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.description.toLowerCase().includes(searchQuery.toLowerCase());
      const levelMatch = a.traumaLevel >= minTraumaFilter;
      const depthMatch = a.depthM >= depthRange[0] && a.depthM <= depthRange[1];
      return matchSearch && levelMatch && depthMatch;
    });
  }, [allArtifacts, searchQuery, minTraumaFilter, depthRange]);

  // Publish casing data to the window object for forensic analytics and PDF reporting
  useEffect(() => {
    (window as any).wellTegraCasingData = {
      allArtifacts,
      filteredArtifacts,
      selectedArtifact,
      crossSectionDepth
    };
  }, [allArtifacts, filteredArtifacts, selectedArtifact, crossSectionDepth]);

  // Rotational simulation interval driver
  useEffect(() => {
    if (!isAutoRotating) return;

    // Tick every 50ms for buttery rotation animation
    const interval = setInterval(() => {
      setSpinAngle(prev => (prev + (360 / (rotationSpeed * 20))) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [isAutoRotating, rotationSpeed]);

  // Synchronize dynamic hover positions from chart interaction
  const isSyncedRef = useRef(isSynchronizedView);
  useEffect(() => {
    isSyncedRef.current = isSynchronizedView;
  }, [isSynchronizedView]);

  useEffect(() => {
    const handleHoverEvent = (event: any) => {
      const { timeSnapshot, depthM } = event.detail || {};
      if (timeSnapshot) {
        setHoveredDepth(depthM);
        setHoveredTimeSnapshot(timeSnapshot);
      } else {
        if (isSyncedRef.current) {
          // Keep the coordinates locked for synced camera focus even when cursor departs chart
          setHoveredDepth(prev => prev);
          setHoveredTimeSnapshot(prev => prev);
        } else {
          setHoveredDepth(null);
          setHoveredTimeSnapshot(null);
        }
      }
    };

    window.addEventListener('telemetry-hover-timestamp', handleHoverEvent);
    return () => {
      window.removeEventListener('telemetry-hover-timestamp', handleHoverEvent);
    };
  }, []);

  // D3-powered rendering pipeline
  useEffect(() => {
    if (!svgRef.current) return;

    // 1. Core Dimensions and Viewport configuration
    const width = 340;
    const height = 400;
    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Reset previous groupings
    svg.selectAll('*').remove();

    // SVG Layout Constants
    const centerX = width / 2;
    const centerY = height / 2;
    const cylinderHeight = 240;

    // Convert Degrees down to pitch/roll angles
    const pitchRad = (tiltAngle * Math.PI) / 180;
    const spinRad = (spinAngle * Math.PI) / 180;

    // 2. 3D Projector Transformation mathematical mapping
    // Converts cylindrical coordinates (Depth 0m-1000m, Angle 0-360) down to Screen 2D Coordinates (X, Y)
    const projectCylinder = (dM: number, angleDeg: number, customRadius = casingRadius) => {
      let normZ;
      let effectiveRadius = customRadius;

      if (isSynchronizedView && hoveredDepth !== null) {
        // Shift depth relative to hoveredDepth and apply high fidelity vertical zoom focus
        const relativeDepth = (dM - hoveredDepth) / 1000;
        normZ = relativeDepth * cylinderHeight * 2.2;
        // Keep central cylinder axis at coordinate 0 so shift doesn't widen it
        if (customRadius > 0) {
          effectiveRadius = customRadius * 1.8;
        }
      } else {
        // Standard full wellbore mapping
        normZ = ((dM / 1000) * cylinderHeight) - (cylinderHeight / 2);
      }
      
      // Compute coordinates around vertical tube cylinder axis
      const theta = (angleDeg * Math.PI) / 180;
      
      // Cylinder local coordinates where tube axis is vertically along Z axis (which we map to Screen-Y)
      // and circumferences spin horizontally on X and depth-depth queue on Y
      const lx = effectiveRadius * Math.cos(theta);
      const ly = effectiveRadius * Math.sin(theta);
      const lz = normZ;

      // Rotate coordinates around Y-axis (spin angle)
      const xRotated = lx * Math.cos(spinRad) - ly * Math.sin(spinRad);
      const yRotated = lx * Math.sin(spinRad) + ly * Math.cos(spinRad);
      const zRotated = lz; // unchanged vertical alignment during horizontal spin

      // Apply pitch tilting (rotation around X-axis) to create visual 3D tilt perspective
      const finalX = xRotated;
      const finalY = yRotated * Math.sin(pitchRad) + zRotated * Math.cos(pitchRad);
      
      // Depth queue distance value (larger is further inside screen, smaller is closer to viewer)
      const finalDepthQueue = yRotated * Math.cos(pitchRad) - zRotated * Math.sin(pitchRad);

      return {
        x: centerX + finalX,
        y: centerY + finalY,
        depthQueue: finalDepthQueue, // Front vs Back side validation
        isFrontFace: yRotated < 0 // Front face elements (facing the viewport)
      };
    };

    if (showCrossSection) {
      const R_cement = 115;
      const R_OD = 80;
      const R_ID = R_OD - 15; // 15px nominal wall thickness

      const mainGroup = svg.append('g').attr('class', 'cross-section-main');

      // Cement boundary background representing raw rock formation surrounding well block
      mainGroup.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', R_cement)
        .attr('fill', 'rgba(168, 85, 247, 0.015)')
        .attr('stroke', 'rgba(168, 85, 247, 0.12)')
        .attr('stroke-width', 1.0)
        .attr('stroke-dasharray', '3 3');

      // Polar axes / spoke lines
      const spokes = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
      spokes.forEach(deg => {
        const rad = (deg * Math.PI) / 180;
        const x1 = centerX + R_ID * 0.4 * Math.cos(rad);
        const y1 = centerY + R_ID * 0.4 * Math.sin(rad);
        const x2 = centerX + R_cement * Math.cos(rad);
        const y2 = centerY + R_cement * Math.sin(rad);

        mainGroup.append('line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2)
          .attr('stroke', 'rgba(168, 85, 247, 0.08)')
          .attr('stroke-width', 0.6)
          .attr('stroke-dasharray', '1 4');

        // Angle texts around the margin
        const lx = centerX + (R_cement + 12) * Math.cos(rad);
        const ly = centerY + (R_cement + 12) * Math.sin(rad);
        mainGroup.append('text')
          .attr('x', lx)
          .attr('y', ly + 2.5)
          .attr('fill', 'rgba(168, 85, 247, 0.45)')
          .attr('font-size', '6px')
          .attr('font-family', 'monospace')
          .attr('text-anchor', 'middle')
          .text(`${deg}°`);
      });

      // Reference concentric circular guidelines
      mainGroup.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', R_OD)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(168, 85, 247, 0.15)')
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '2 2');

      mainGroup.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', R_ID)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(168, 85, 247, 0.10)')
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '2 2');

      // Sample points to compute casing wear circumferentially
      const samples = 72;
      const angleLossMap = new Array(samples).fill(0).map((_, i) => {
        const deg = (i * 360) / samples;
        const rad = (deg * Math.PI) / 180;
        
        // Sum up radial deformation influence from all active anomalies at the selected depth
        let loss = 0;
        allArtifacts.forEach(art => {
          const dDepth = Math.abs(art.depthM - crossSectionDepth);
          const depthW = Math.exp(-((dDepth / 85) ** 2));

          const dAngle = Math.abs(art.angleDeg - deg) % 360;
          const shortAng = dAngle > 180 ? 360 - dAngle : dAngle;
          const angleW = Math.exp(-((shortAng / 28) ** 2));

          const totalWeight = depthW * angleW;
          const contribution = (art.radialLossMm / 15) * 14;
          loss += contribution * totalWeight;
        });

        const finalLoss = Math.min(13.8, Math.max(0, loss));
        return { deg, rad, loss: finalLoss };
      });

      // Bottom backing nominal wall representation
      const outerArc = d3.arc()
        .innerRadius(R_ID)
        .outerRadius(R_OD)
        .startAngle(0)
        .endAngle(2 * Math.PI);

      mainGroup.append('path')
        .attr('d', outerArc as any)
        .attr('transform', `translate(${centerX}, ${centerY})`)
        .attr('fill', '#110c24')
        .attr('stroke', '#2e1b4e')
        .attr('stroke-width', 0.6)
        .attr('opacity', 0.7);

      // Remaining Steel Wall (Dynamic composite path, outer-diameter to thinned inner-diameter)
      let survivingWallPath = '';
      for (let i = 0; i <= samples; i++) {
        const item = angleLossMap[i % samples];
        const x = centerX + R_OD * Math.cos(item.rad);
        const y = centerY + R_OD * Math.sin(item.rad);
        if (i === 0) survivingWallPath += `M ${x},${y}`;
        else survivingWallPath += ` L ${x},${y}`;
      }
      for (let i = samples; i >= 0; i--) {
        const item = angleLossMap[i % samples];
        const currentR = R_ID + item.loss;
        const x = centerX + currentR * Math.cos(item.rad);
        const y = centerY + currentR * Math.sin(item.rad);
        survivingWallPath += ` L ${x},${y}`;
      }
      survivingWallPath += ' Z';

      const steelFillColor = terminalTheme === 'emerald' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.22)';
      const steelStrokeColor = terminalTheme === 'emerald' ? '#10b981' : '#f87171';

      mainGroup.append('path')
        .attr('d', survivingWallPath)
        .attr('fill', steelFillColor)
        .attr('stroke', steelStrokeColor)
        .attr('stroke-width', 0.8)
        .attr('filter', `drop-shadow(0 0 3px ${steelStrokeColor}44)`);

      // Shaded Wear Zone (Showing exact thickness metal loss visually in amber/red)
      let wearZonePath = '';
      for (let i = 0; i <= samples; i++) {
        const item = angleLossMap[i % samples];
        const currentR = R_ID + item.loss;
        const x = centerX + currentR * Math.cos(item.rad);
        const y = centerY + currentR * Math.sin(item.rad);
        if (i === 0) wearZonePath += `M ${x},${y}`;
        else wearZonePath += ` L ${x},${y}`;
      }
      for (let i = samples; i >= 0; i--) {
        const item = angleLossMap[i % samples];
        const x = centerX + R_ID * Math.cos(item.rad);
        const y = centerY + R_ID * Math.sin(item.rad);
        wearZonePath += ` L ${x},${y}`;
      }
      wearZonePath += ' Z';

      mainGroup.append('path')
        .attr('d', wearZonePath)
        .attr('fill', 'rgba(245, 158, 11, 0.25)')
        .attr('stroke', 'rgba(245, 158, 11, 0.6)')
        .attr('stroke-width', 0.6)
        .attr('stroke-dasharray', '1.5 2');

      // Thermal Heatmap overlay if toggled
      if (showHeatmap) {
        const heatSlices = 36;
        for (let i = 0; i < heatSlices; i++) {
          const sDeg = (i * 360) / heatSlices;
          const eDeg = ((i + 1) * 360) / heatSlices;
          const mDeg = (sDeg + eDeg) / 2;

          let intensity = 10;
          allArtifacts.forEach(art => {
            const dDepth = Math.abs(art.depthM - crossSectionDepth);
            const depthWeight = Math.exp(-((dDepth / 90) ** 2));
            const dAngle = Math.abs(art.angleDeg - mDeg) % 360;
            const shortAng = dAngle > 180 ? 360 - dAngle : dAngle;
            const angleWeight = Math.exp(-((shortAng / 35) ** 2));
            
            intensity += art.traumaLevel * depthWeight * angleWeight;
          });

          const heatVal = Math.min(100, Math.max(0, intensity));
          const arcGen = d3.arc()
            .innerRadius(R_OD + 3)
            .outerRadius(R_OD + 14)
            .startAngle((sDeg * Math.PI) / 180 - Math.PI / 2)
            .endAngle((eDeg * Math.PI) / 180 - Math.PI / 2);

          const heatColor = heatVal > 70 ? 'rgba(239, 68, 68, 0.5)' : 
                            heatVal > 45 ? 'rgba(249, 115, 22, 0.38)' :
                            heatVal > 20 ? 'rgba(234, 179, 8, 0.24)' : 'rgba(6, 182, 212, 0.08)';

          mainGroup.append('path')
            .attr('d', arcGen as any)
            .attr('transform', `translate(${centerX}, ${centerY})`)
            .attr('fill', heatColor)
            .attr('stroke', 'none');
        }
      }

      // Radial Leak vectors and indicators
      allArtifacts.forEach(art => {
        const dDepth = Math.abs(art.depthM - crossSectionDepth);
        if (dDepth < 80) {
          const rad = (art.angleDeg * Math.PI) / 180;
          
          const diffs = angleLossMap.map((d, i) => ({ idx: i, diff: Math.abs(d.deg - art.angleDeg) }));
          diffs.sort((a, b) => a.diff - b.diff);
          const closestItem = angleLossMap[diffs[0].idx];
          const innerBoundaryCur = R_ID + closestItem.loss;

          const xStart = centerX + innerBoundaryCur * Math.cos(rad);
          const yStart = centerY + innerBoundaryCur * Math.sin(rad);
          const xEnd = centerX + (R_cement + 20) * Math.cos(rad);
          const yEnd = centerY + (R_cement + 20) * Math.sin(rad);

          const colorCode = art.traumaLevel > 70 ? '#f43f5e' : '#fbbf24';
          const thicknessCode = art.traumaLevel > 70 ? 2.5 : 1.5;

          const leakLine = mainGroup.append('line')
            .attr('x1', xStart)
            .attr('y1', yStart)
            .attr('x2', xEnd)
            .attr('y2', yEnd)
            .attr('stroke', colorCode)
            .attr('stroke-width', thicknessCode)
            .attr('stroke-dasharray', '5 4');

          leakLine.append('animate')
            .attr('attributeName', 'stroke-dashoffset')
            .attr('values', '9;0')
            .attr('dur', art.traumaLevel > 70 ? '0.5s' : '0.9s')
            .attr('repeatCount', 'indefinite');

          mainGroup.append('line')
            .attr('x1', xStart)
            .attr('y1', yStart)
            .attr('x2', xEnd)
            .attr('y2', yEnd)
            .attr('stroke', colorCode)
            .attr('stroke-width', thicknessCode * 3)
            .attr('opacity', 0.15)
            .attr('stroke-linecap', 'round');

          mainGroup.append('circle')
            .attr('cx', xStart)
            .attr('cy', yStart)
            .attr('r', 3)
            .attr('fill', colorCode)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 0.8)
            .attr('filter', `drop-shadow(0 0 2px ${colorCode})`);

          const xText = centerX + (R_cement + 35) * Math.cos(rad);
          const yText = centerY + (R_cement + 35) * Math.sin(rad);

          let textAnchor = 'middle';
          const cosVal = Math.cos(rad);
          if (cosVal > 0.3) textAnchor = 'start';
          else if (cosVal < -0.3) textAnchor = 'end';

          mainGroup.append('text')
            .attr('x', xText)
            .attr('y', yText + 2)
            .attr('fill', colorCode)
            .attr('font-size', '6.5px')
            .attr('font-face', 'monospace')
            .attr('font-weight', 'bold')
            .attr('text-anchor', textAnchor)
            .text(`[LEAK • θ=${art.angleDeg}° | ${art.traumaLevel}%]`);
        }
      });

      // Scanning angle line linked to drag interaction
      const currentScanRad = (spinAngle * Math.PI) / 180;
      const scanX = centerX + R_cement * Math.cos(currentScanRad);
      const scanY = centerY + R_cement * Math.sin(currentScanRad);

      mainGroup.append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', scanX)
        .attr('y2', scanY)
        .attr('stroke', '#a855f7')
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '1.5 2.5')
        .attr('opacity', 0.85);

      mainGroup.append('circle')
        .attr('cx', scanX)
        .attr('cy', scanY)
        .attr('r', 2)
        .attr('fill', '#a855f7')
        .attr('opacity', 0.9);

      // HUD overlay text Labels
      const crossHud = svg.append('g').attr('class', 'cross-section-hud');
      
      crossHud.append('text')
        .attr('x', 14)
        .attr('y', 24)
        .attr('fill', '#c084fc')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'black')
        .text(`TOP-DOWN CROSS-SECTION SCAN @ ${crossSectionDepth}m`);

      crossHud.append('text')
        .attr('x', 14)
        .attr('y', 33)
        .attr('fill', 'rgba(168, 85, 247, 0.75)')
        .attr('font-size', '6.5px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(`SCAN AZIMUTH: ${Math.round(spinAngle)}° θ`);

      crossHud.append('text')
        .attr('x', width - 14)
        .attr('y', 24)
        .attr('fill', 'rgba(110, 231, 183, 0.45)')
        .attr('font-size', '6.5px')
        .attr('font-family', 'monospace')
        .attr('text-anchor', 'end')
        .text(`BORE DIAMETER: 220mm (8.6")`);

      const dragHandler = d3.drag<SVGSVGElement, unknown>()
         .on('drag', (event) => {
           setIsAutoRotating(false);
           setSpinAngle(prev => (prev + event.dx + 360) % 360);
         });

      svg.call(dragHandler as any);

      return;
    }

    // 3. Draw Cyber Background Grids & Annotations
    const bgGridGroup = svg.append('g').attr('class', 'background-telemetry-grid');
    
    // Draw horizontal dashed lines across background showing depth boundaries
    const gridDepths = [100, 300, 500, 700, 900];
    gridDepths.forEach(d => {
      // Left and right visual borders
      const leftGrid = projectCylinder(d, 180, casingRadius + 30);
      const rightGrid = projectCylinder(d, 0, casingRadius + 30);

      // Main line marker
      bgGridGroup.append('line')
        .attr('x1', leftGrid.x - 20)
        .attr('y1', leftGrid.y)
        .attr('x2', rightGrid.x + 20)
        .attr('y2', rightGrid.y)
        .attr('stroke', 'rgba(16, 185, 129, 0.08)')
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '2 4');

      // Numeric depth indicators
      bgGridGroup.append('text')
        .attr('x', leftGrid.x - 30)
        .attr('y', leftGrid.y + 3)
        .attr('fill', 'rgba(16, 185, 129, 0.35)')
        .attr('font-size', '6.5px')
        .attr('font-family', 'monospace')
        .attr('text-anchor', 'end')
        .text(`${d}m`);
    });

    // Wellbore Casing Schema Reference Overlay Background Rendering
    if (showCasingSchema) {
      const schemaSegments = [
        { name: 'Surface Segment', start: 0, end: 250, color: '#312e81', borderCol: '#38bdf8', short: 'SURF' },
        { name: 'Intermediate Segment', start: 250, end: 600, color: '#1e1b4b', borderCol: '#fbbf24', short: 'INTM' },
        { name: 'Production Segment', start: 600, end: 850, color: '#311010', borderCol: '#f87171', short: 'PROD' },
        { name: 'Liner Segment', start: 850, end: 1000, color: '#2e1065', borderCol: '#c084fc', short: 'LINER' }
      ];

      schemaSegments.forEach(seg => {
        // Project start, end, and middle coordinates on the outer left grid zone (180 degrees)
        const pStartLeft = projectCylinder(seg.start, 180, casingRadius + 18);
        const pEndLeft = projectCylinder(seg.end, 180, casingRadius + 18);
        const pMidLeft = projectCylinder((seg.start + seg.end) / 2, 180, casingRadius + 18);

        // Solid structural segment bracket
        bgGridGroup.append('line')
          .attr('x1', pStartLeft.x)
          .attr('y1', pStartLeft.y)
          .attr('x2', pEndLeft.x)
          .attr('y2', pEndLeft.y)
          .attr('stroke', seg.borderCol)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.6);

        // Bracket top tick marker (pointing slightly inward)
        const tickStart = projectCylinder(seg.start, 180, casingRadius + 14);
        bgGridGroup.append('line')
          .attr('x1', pStartLeft.x)
          .attr('y1', pStartLeft.y)
          .attr('x2', tickStart.x)
          .attr('y2', tickStart.y)
          .attr('stroke', seg.borderCol)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.6);

        // Bracket bottom tick marker (pointing slightly inward)
        const tickEnd = projectCylinder(seg.end, 180, casingRadius + 14);
        bgGridGroup.append('line')
          .attr('x1', pEndLeft.x)
          .attr('y1', pEndLeft.y)
          .attr('x2', tickEnd.x)
          .attr('y2', tickEnd.y)
          .attr('stroke', seg.borderCol)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.6);

        // Segment Code Short Label Text
        bgGridGroup.append('text')
          .attr('x', pMidLeft.x - 7)
          .attr('y', pMidLeft.y + 2.5)
          .attr('fill', seg.borderCol)
          .attr('font-size', '6px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('text-anchor', 'end')
          .text(seg.short);

        // Horizontal division guidelines matching safety segments
        const pLeftDivide = projectCylinder(seg.start, 180, casingRadius + 8);
        const pRightDivide = projectCylinder(seg.start, 0, casingRadius + 8);
        bgGridGroup.append('line')
          .attr('x1', pLeftDivide.x)
          .attr('y1', pLeftDivide.y)
          .attr('x2', pRightDivide.x)
          .attr('y2', pRightDivide.y)
          .attr('stroke', seg.borderCol)
          .attr('stroke-dasharray', '1 3')
          .attr('stroke-width', 0.8)
          .attr('opacity', 0.35);
      });
    }

    // 4. Generate mesh slices to form wireframe tube
    const ribbonContainer = svg.append('g').attr('class', 'cylinder-mesh-wireframe');
    
    // Horizontal collar rings of casing at intervals of 100 meters
    const ringDepths = d3.range(0, 1001, 100);
    
    // Back-face rings (dashed grid layer rendering first, to exist under front-face points)
    ringDepths.forEach(depth => {
      // Generate circular coordinate path split by front vs back
      const samples = 48;
      const backPoints: [number, number][] = [];
      const frontPoints: [number, number][] = [];

      for (let i = 0; i <= samples; i++) {
        const ang = (i * 360) / samples;
        const pt = projectCylinder(depth, ang);
        
        if (pt.isFrontFace) {
          frontPoints.push([pt.x, pt.y]);
        } else {
          backPoints.push([pt.x, pt.y]);
        }
      }

      // Draw back-ring dashed path
      if (backPoints.length > 0) {
        const lineGen = d3.line();
        // Since points might be disjointed, sort back points by horizontal coordinate x to draw smooth ellipse Arc
        backPoints.sort((a, b) => a[0] - b[0]);
        ribbonContainer.append('path')
          .attr('d', lineGen(backPoints))
          .attr('fill', 'none')
          .attr('stroke', 'rgba(16, 185, 129, 0.08)')
          .attr('stroke-width', 0.8)
          .attr('stroke-dasharray', '2 3');
      }
    });

    // Vertical structural struts (Ribs) around the casing tube (every 45 degrees)
    const ribAngles = d3.range(0, 360, 45);
    ribAngles.forEach(angle => {
      const steps = 15;
      const verticalBackSegments: [number, number][] = [];
      const verticalFrontSegments: [number, number][] = [];

      for (let s = 0; s <= steps; s++) {
        const d = (s * 1000) / steps;
        const pt = projectCylinder(d, angle);
        if (pt.isFrontFace) {
          verticalFrontSegments.push([pt.x, pt.y]);
        } else {
          verticalBackSegments.push([pt.x, pt.y]);
        }
      }

      const lineGen = d3.line();
      if (verticalBackSegments.length > 0) {
        ribbonContainer.append('path')
          .attr('d', lineGen(verticalBackSegments))
          .attr('fill', 'none')
          .attr('stroke', 'rgba(16, 185, 129, 0.06)')
          .attr('stroke-width', 0.6)
          .attr('stroke-dasharray', '1 3');
      }
    });

    // 4.5. DRAW HEATMAP OVERLAY ELEMENTS IF ENABLED
    if (showHeatmap) {
      const heatmapGroup = svg.append('g').attr('class', 'casing-heatmap-overlay');
      
      // Define grid dimensions: 20 vertical slices, 12 circumferential slices (240 volumetric grid cells)
      const dSlices = 20;
      const aSlices = 12;
      const dStep = 1000 / dSlices;
      const aStep = 360 / aSlices;

      const cells: any[] = [];

      for (let di = 0; di < dSlices; di++) {
        const dStart = di * dStep;
        const dEnd = (di + 1) * dStep;
        const dMid = (dStart + dEnd) / 2;

        for (let ai = 0; ai < aSlices; ai++) {
          const aStart = ai * aStep;
          const aEnd = (ai + 1) * aStep;
          const aMid = (aStart + aEnd) / 2;

          // Baseline ambient stress value
          let cellTrauma = 10;

          // 1. Stress contributor from physical 3D artifacts (static & file and dynamic)
          allArtifacts.forEach(art => {
            const deltaD = (art.depthM - dMid) / 75;
            
            // Shortest angular difference that wraps correctly at 360° boundary
            const diffA = Math.abs(art.angleDeg - aMid) % 360;
            const deltaA = (diffA > 180 ? 360 - diffA : diffA) / 45;

            const distSq = (deltaD * deltaD) + (deltaA * deltaA);
            const weight = Math.exp(-distSq / 1.5); // thermal diffusion radius

            cellTrauma += art.traumaLevel * weight;
          });

          // 2. Stress contributor parsed dynamically from the Forensic Event Log messages
          if (forensicLogs && forensicLogs.length > 0) {
            forensicLogs.forEach(log => {
              const msg = log.message.toLowerCase();
              let weight = 0;
              if (log.type === 'error') weight = 12;
              else if (log.type === 'warning') weight = 7;
              else if (log.type === 'success') weight = -4; // success acts as a cooling field

              // Check for localized logs specifying depth boundaries or sectors
              const depthMatch = msg.match(/depth[=\s:]*(\d+)/i);
              const sectorMatch = msg.match(/(?:sector|θ)[=\s:]*[\[]?(\d+)/i);
              const traumaMatch = msg.match(/trauma[=\s:]*(\d+)/i);

              if (depthMatch) {
                const logDepth = parseInt(depthMatch[1], 10);
                const logAngle = sectorMatch ? parseInt(sectorMatch[1], 10) : 180;
                const logTrauma = traumaMatch ? parseInt(traumaMatch[1], 10) : (log.type === 'error' ? 50 : 25);

                const diffLA = Math.abs(logAngle - aMid) % 360;
                const deltaLA = (diffLA > 180 ? 360 - diffLA : diffLA);
                const cellDistSq = ((logDepth - dMid) / 100) ** 2 + (deltaLA / 60) ** 2;
                const logWeight = Math.exp(-cellDistSq / 1.5);
                cellTrauma += logTrauma * logWeight * (log.type === 'error' ? 1.5 : 1.0) * 0.4;
              } else {
                // Global/regional stresses matching casing segments from log metadata
                if (msg.includes('overpressure') || msg.includes('pressure warning') || msg.includes('injection')) {
                  if (dMid >= 500) cellTrauma += weight * 1.5;
                  else cellTrauma += weight * 0.4;
                } else if (msg.includes('temperature') || msg.includes('thermal') || msg.includes('geothermal')) {
                  if (dMid >= 750) cellTrauma += weight * 2.0;
                  else cellTrauma += weight * 0.3;
                } else if (msg.includes('clog') || msg.includes('compression') || msg.includes('shale')) {
                  if (dMid >= 250 && dMid <= 700) cellTrauma += weight * 1.6;
                } else if (msg.includes('quarantine') || msg.includes('corrupted') || msg.includes('bypass')) {
                  cellTrauma += weight * 0.8;
                } else {
                  cellTrauma += weight * 0.2;
                }
              }
            });
          }

          // Bound score between 0 and 100
          const finalScore = Math.min(100, Math.max(0, cellTrauma));

          // Project the 4 corner coordinates in 3D outer radius space
          const c1 = projectCylinder(dStart, aStart);
          const c2 = projectCylinder(dStart, aEnd);
          const c3 = projectCylinder(dEnd, aEnd);
          const c4 = projectCylinder(dEnd, aStart);

          // Mean Depth Queue of the cell for occlusion ordering
          const avgDepthQueue = (c1.depthQueue + c2.depthQueue + c3.depthQueue + c4.depthQueue) / 4;
          const isFront = (c1.isFrontFace && c2.isFrontFace && c3.isFrontFace && c4.isFrontFace) ||
                          (c1.isFrontFace || c3.isFrontFace);

          cells.push({
            polygonPoints: `${c1.x},${c1.y} ${c2.x},${c2.y} ${c3.x},${c3.y} ${c4.x},${c4.y}`,
            score: finalScore,
            avgDepthQueue,
            isFront
          });
        }
      }

      // Sort cell polygons back-to-front (Depth Queue Sorting)
      cells.sort((a, b) => b.avgDepthQueue - a.avgDepthQueue);

      // Continuous linear scale color-coding for elegant smooth thermal glow
      const colorScale = d3.scaleLinear<string>()
        .domain([0, 15, 45, 75, 100])
        .range([
          'rgba(6, 182, 212, 0.03)',  // nominal transparent cyan
          'rgba(16, 185, 129, 0.22)', // stable emerald
          'rgba(234, 179, 8, 0.45)',  // yellow warning
          'rgba(249, 115, 22, 0.60)',  // serious orange
          'rgba(239, 68, 68, 0.75)'   // critical red alert
        ])
        .clamp(true);

      // Render cells to SVG
      cells.forEach(cell => {
        const opacityMultiplier = cell.isFront ? 1.0 : 0.15;

        heatmapGroup.append('polygon')
          .attr('points', cell.polygonPoints)
          .attr('fill', colorScale(cell.score))
          .attr('stroke', 'rgba(16, 185, 129, 0.04)')
          .attr('stroke-width', 0.2)
          .attr('opacity', opacityMultiplier)
          .attr('class', 'heatmap-cell-segment')
          .append('animate')
            .attr('attributeName', 'opacity')
            .attr('values', cell.score > 70 
              ? `${opacityMultiplier * 0.85};${opacityMultiplier * 1.15};${opacityMultiplier * 0.85}` 
              : `${opacityMultiplier};${opacityMultiplier};${opacityMultiplier}`)
            .attr('dur', '3.5s')
            .attr('repeatCount', 'indefinite');
      });
    }

    // 5. PLOT DISPLACED TRAUMA POINTS AND DEPTH SORT THEM
    // We transform all points into 3D projected list to perform clean back-to-front rendering sorting
    const renderPoints = filteredArtifacts.map(art => {
      const proj = projectCylinder(art.depthM, art.angleDeg);
      return {
        artifact: art,
        proj
      };
    });

    // Sort to render back points first and front points last (Occulsion Depth Cue!)
    renderPoints.sort((a, b) => b.proj.depthQueue - a.proj.depthQueue);

    // 6. DRAW DEFECT ITEMS (HOVER ELEMENTS, EMBLEMS)
    const pointsGroup = svg.append('g').attr('class', 'anomaly-node-points');

    renderPoints.forEach(({ artifact, proj }) => {
      const color = artifact.traumaLevel > 75 
        ? '#ef4444' // Red critical
        : artifact.traumaLevel > 40 
          ? '#f59e0b' // Amber warning
          : '#10b981'; // Emerald stable

      const particleRadius = proj.isFrontFace 
        ? Math.max(3.5, 3 + (artifact.traumaLevel / 22)) 
        : Math.max(2, 1.5 + (artifact.traumaLevel / 35));

      const pointContainer = pointsGroup.append('g')
        .attr('class', `anomaly-point-item-${artifact.id}`)
        .attr('cursor', 'pointer')
        .on('click', () => {
          setSelectedArtifact(artifact);
          addLog(`[CASING ANALYSIS] Laser locked downhole coordinates: DEPTH=${artifact.depthM}m, SECTOR=θ[${artifact.angleDeg}°], TRAUMA=${artifact.traumaLevel}%, MAGNITUDE=${artifact.radialLossMm}mm.`, 'info');
        })
        .on('mouseover', (event: any) => {
          const viewportEl = document.getElementById('casing-3d-viewport');
          if (viewportEl) {
            const rect = viewportEl.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            setTooltipPosition({ x, y });
          } else {
            setTooltipPosition({ x: proj.x, y: proj.y });
          }
          setHoveredTooltipArtifact(artifact);
        })
        .on('mousemove', (event: any) => {
          const viewportEl = document.getElementById('casing-3d-viewport');
          if (viewportEl) {
            const rect = viewportEl.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            setTooltipPosition({ x, y });
          }
        })
        .on('mouseout', () => {
          setHoveredTooltipArtifact(null);
          setTooltipPosition(null);
        });

      // BACK SIDE: Dimmed & dashed rendering style
      if (!proj.isFrontFace) {
        pointContainer.append('circle')
          .attr('cx', proj.x)
          .attr('cy', proj.y)
          .attr('r', particleRadius)
          .attr('fill', color)
          .attr('opacity', 0.2)
          .attr('stroke', 'rgba(0,0,0,0.6)')
          .attr('stroke-width', 0.5);

        // Simple cross connector lines pointing to container cylinder axis (visual 3D wire anchor)
        const axisPt = projectCylinder(artifact.depthM, 0, 0); // coordinate on central axis
        pointContainer.append('line')
          .attr('x1', proj.x)
          .attr('y1', proj.y)
          .attr('x2', axisPt.x)
          .attr('y2', axisPt.y)
          .attr('stroke', color)
          .attr('stroke-opacity', 0.1)
          .attr('stroke-width', 0.5)
          .attr('stroke-dasharray', '1 2');

        return;
      }

      // FRONT SIDE: Rich cyber glowing circles, crosshairs, pulse ring animations
      const isSelected = selectedArtifact?.id === artifact.id;

      // Central node axis projected indicator wireframe anchor
      const axisPt = projectCylinder(artifact.depthM, 0, 0);
      pointContainer.append('line')
        .attr('x1', proj.x)
        .attr('y1', proj.y)
        .attr('x2', axisPt.x)
        .attr('y2', axisPt.y)
        .attr('stroke', color)
        .attr('stroke-opacity', isSelected ? 0.45 : 0.2)
        .attr('stroke-width', isSelected ? 1.0 : 0.6)
        .attr('stroke-dasharray', isSelected ? 'none' : '2 2');

      // Glowing outer dynamic pulsing circle (animated)
      if (artifact.traumaLevel > 40) {
        pointContainer.append('circle')
          .attr('cx', proj.x)
          .attr('cy', proj.y)
          .attr('r', particleRadius * (isSelected ? 2.8 : 2.2))
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 0.6)
          .attr('stroke-opacity', 0.5)
          .append('animate')
            .attr('attributeName', 'r')
            .attr('values', `${particleRadius * 1};${particleRadius * (isSelected ? 3.5 : 2.5)};${particleRadius * 1}`)
            .attr('dur', artifact.traumaLevel > 75 ? '1.0s' : '2.0s')
            .attr('repeatCount', 'indefinite');
      }

      // High visibility lock target marker for selected anomaly
      if (isSelected) {
        pointContainer.append('rect')
          .attr('x', proj.x - particleRadius * 2)
          .attr('y', proj.y - particleRadius * 2)
          .attr('width', particleRadius * 4)
          .attr('height', particleRadius * 4)
          .attr('fill', 'none')
          .attr('stroke', '#06b6d4')
          .attr('stroke-width', 0.8)
          .attr('stroke-dasharray', '1.5 1.5');
          
        pointContainer.append('circle')
          .attr('cx', proj.x)
          .attr('cy', proj.y)
          .attr('r', particleRadius * 1.5)
          .attr('fill', 'none')
          .attr('stroke', '#06b6d4')
          .attr('stroke-width', 0.5);
      }

      // Main core node dot
      pointContainer.append('circle')
        .attr('cx', proj.x)
        .attr('cy', proj.y)
        .attr('r', particleRadius)
        .attr('fill', color)
        .attr('stroke', '#020617')
        .attr('stroke-width', 1.0)
        .attr('filter', 'drop-shadow(0 0 4px ' + color + ')');

      // Value label floating directly on node when highly critical
      if (artifact.traumaLevel > 80 || isSelected) {
        pointContainer.append('text')
          .attr('x', proj.x + particleRadius + 4)
          .attr('y', proj.y + 2.5)
          .attr('fill', isSelected ? '#ffffff' : color)
          .attr('font-size', '6.5px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .text(`${artifact.traumaLevel}%`);
      }

      // Contextual schema depth markers pointing out to outer calibration lines
      if (showCasingSchema) {
        const schemaSegments = [
          { name: 'Surface Segment', start: 0, end: 250, borderCol: '#38bdf8', short: 'SURF' },
          { name: 'Intermediate Segment', start: 250, end: 600, borderCol: '#fbbf24', short: 'INTM' },
          { name: 'Production Segment', start: 600, end: 850, borderCol: '#f87171', short: 'PROD' },
          { name: 'Liner Segment', start: 850, end: 1000, borderCol: '#c084fc', short: 'LINER' }
        ];
        const matchedSeg = schemaSegments.find(s => artifact.depthM >= s.start && artifact.depthM <= s.end) || schemaSegments[3];
        const pCalloutRight = projectCylinder(artifact.depthM, 0, casingRadius + 14);

        // Guideline matching the segment code color linking 3D point to outer schematic label
        pointContainer.append('line')
          .attr('x1', proj.x)
          .attr('y1', proj.y)
          .attr('x2', pCalloutRight.x)
          .attr('y2', pCalloutRight.y)
          .attr('stroke', matchedSeg.borderCol)
          .attr('stroke-width', isSelected ? 1.0 : 0.6)
          .attr('stroke-opacity', isSelected ? 0.8 : 0.35)
          .attr('stroke-dasharray', isSelected ? '1 1' : '1 3');

        // Target dot
        pointContainer.append('circle')
          .attr('cx', pCalloutRight.x)
          .attr('cy', pCalloutRight.y)
          .attr('r', isSelected ? 2.5 : 1.2)
          .attr('fill', matchedSeg.borderCol)
          .attr('opacity', isSelected ? 1.0 : 0.65);

        // Depth & segment label callout string
        pointContainer.append('text')
          .attr('x', pCalloutRight.x + 4)
          .attr('y', pCalloutRight.y + 1.8)
          .attr('fill', isSelected ? '#ffffff' : matchedSeg.borderCol)
          .attr('font-size', isSelected ? '6px' : '4.8px')
          .attr('font-family', 'monospace')
          .attr('font-weight', isSelected ? 'extrabold' : 'normal')
          .text(`[${matchedSeg.short} • ${artifact.depthM}m]`);
      }
    });

    // 7. FRONT MESH TUBE COLLAR RINGS (Drawn on top of points to block/enclose them seamlessly in 3D Space!)
    // Back-face rings (dashed grid layer rendering first, to exist under front-face points)
    ringDepths.forEach(depth => {
      // Generate circular coordinate path split by front vs back
      const samples = 48;
      const frontPoints: [number, number][] = [];

      for (let i = 0; i <= samples; i++) {
        const ang = (i * 360) / samples;
        const pt = projectCylinder(depth, ang);
        
        if (pt.isFrontFace) {
          // Add width expansion on depth bounds for casing collars!
          frontPoints.push([pt.x, pt.y]);
        }
      }

      // Draw front-ring solid path
      if (frontPoints.length > 0) {
        const lineGen = d3.line();
        // Sort front points by horizontal coordinates to construct beautiful ellipse arch
        frontPoints.sort((a, b) => a[0] - b[0]);
        ribbonContainer.append('path')
          .attr('d', lineGen(frontPoints))
          .attr('fill', 'none')
          .attr('stroke', 'rgba(16, 185, 129, 0.28)')
          .attr('stroke-width', depth % 200 === 0 ? 1.4 : 0.85); // Collar thickness increases every 200m
      }
    });

    // Vertical structural struts (Ribs) (Front Face)
    ribAngles.forEach(angle => {
      const steps = 15;
      const verticalFrontSegments: [number, number][] = [];

      for (let s = 0; s <= steps; s++) {
        const d = (s * 1000) / steps;
        const pt = projectCylinder(d, angle);
        if (pt.isFrontFace) {
          verticalFrontSegments.push([pt.x, pt.y]);
        }
      }

      const lineGen = d3.line();
      if (verticalFrontSegments.length > 0) {
        ribbonContainer.append('path')
          .attr('d', lineGen(verticalFrontSegments))
          .attr('fill', 'none')
          .attr('stroke', 'rgba(16, 185, 129, 0.18)')
          .attr('stroke-width', 0.8);
      }
    });

    // 7.5 Dynamic Hover Coordinates scanning laser overlay
    if (hoveredDepth !== null) {
      const hoverGroup = svg.append('g').attr('class', 'telemetry-hover-scanning-disk');
      
      const samples = 60;
      const ptsFront: [number, number][] = [];
      const ptsBack: [number, number][] = [];
      
      for (let i = 0; i <= samples; i++) {
        const ang = (i * 360) / samples;
        const pt = projectCylinder(hoveredDepth, ang, casingRadius + 12);
        if (pt.isFrontFace) {
          ptsFront.push([pt.x, pt.y]);
        } else {
          ptsBack.push([pt.x, pt.y]);
        }
      }

      const lineHover = d3.line();

      // Back half of scanning ring
      if (ptsBack.length > 0) {
        ptsBack.sort((a, b) => a[0] - b[0]);
        hoverGroup.append('path')
          .attr('d', lineHover(ptsBack))
          .attr('fill', 'none')
          .attr('stroke', 'rgba(6, 182, 212, 0.4)')
          .attr('stroke-width', 1.0)
          .attr('stroke-dasharray', '2 2');
      }

      // Ring inside disc area fill
      const ptsAll = [...ptsFront, ...ptsBack.reverse()];
      if (ptsAll.length > 0) {
        hoverGroup.append('polygon')
          .attr('points', ptsAll.map(p => p.join(',')).join(' '))
          .attr('fill', 'rgba(6, 182, 212, 0.12)')
          .attr('stroke', 'none');
      }

      // Front half of scanning ring (solid glowing indicator)
      if (ptsFront.length > 0) {
        ptsFront.sort((a, b) => a[0] - b[0]);
        hoverGroup.append('path')
          .attr('d', lineHover(ptsFront))
          .attr('fill', 'none')
          .attr('stroke', '#06b6d4')
          .attr('stroke-width', 2.0)
          .attr('filter', 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.85))');
      }

      // Drawing a horizontal coordinate indicator crosshair center on cylinder axis
      const axPt = projectCylinder(hoveredDepth, 0, 0);
      hoverGroup.append('line')
        .attr('x1', axPt.x - 45)
        .attr('y1', axPt.y)
        .attr('x2', axPt.x + 45)
        .attr('y2', axPt.y)
        .attr('stroke', 'rgba(6, 182, 212, 0.35)')
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '1 2');

      // Scan locator arrow label text pointing directly to depth location!
      hoverGroup.append('text')
        .attr('x', axPt.x + (isSynchronizedView ? casingRadius * 1.8 : casingRadius) + 18)
        .attr('y', axPt.y + 2.5)
        .attr('fill', '#06b6d4')
        .attr('font-size', '6.8px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'extrabold')
        .text(`◄ [PROBE @ ${hoveredTimeSnapshot} | ${hoveredDepth}m]`);

      // Draw a line pointing towards closest actual casing defect or file trauma spot
      const nearestArt = allArtifacts.reduce((prev, curr) => {
        return Math.abs(curr.depthM - hoveredDepth) < Math.abs(prev.depthM - hoveredDepth) ? curr : prev;
      });

      if (nearestArt && Math.abs(nearestArt.depthM - hoveredDepth) < 180) {
        const nrPt = projectCylinder(nearestArt.depthM, nearestArt.angleDeg);
        // Connect scanning plane to nearest physical point with vector tracker!
        hoverGroup.append('line')
          .attr('x1', axPt.x)
          .attr('y1', axPt.y)
          .attr('x2', nrPt.x)
          .attr('y2', nrPt.y)
          .attr('stroke', '#06b6d4')
          .attr('stroke-opacity', 0.5)
          .attr('stroke-width', 0.8)
          .attr('stroke-dasharray', '1.5 2');

        hoverGroup.append('text')
          .attr('x', axPt.x)
          .attr('y', axPt.y - 4)
          .attr('fill', 'rgba(6, 182, 212, 0.75)')
          .attr('font-size', '5.5px')
          .attr('font-family', 'monospace')
          .attr('text-anchor', 'middle')
          .text(`ALIGN: ${Math.round(Math.abs(nearestArt.depthM - hoveredDepth))}m TO ${nearestArt.name.substring(0, 15)}...`);
      }
    }

    // 8. Dynamic Overlay Title & Calibration Markings inside SVG canvas
    const hudGroup = svg.append('g').attr('class', 'hud-overlay-telemetry');
    
    // Circumferential Orientation HUD (Spin calibration compass scale)
    hudGroup.append('text')
      .attr('x', 14)
      .attr('y', 24)
      .attr('fill', 'rgba(6, 182, 212, 0.65)')
      .attr('font-size', '6.5px')
      .attr('font-family', 'monospace')
      .text(`ROTATION: ${Math.round(spinAngle)}° θ`);

    hudGroup.append('text')
      .attr('x', 14)
      .attr('y', 33)
      .attr('fill', 'rgba(6, 182, 212, 0.65)')
      .attr('font-size', '6.5px')
      .attr('font-family', 'monospace')
      .text(`TILT PITCH: ${Math.round(tiltAngle)}° α`);

    hudGroup.append('text')
      .attr('x', width - 14)
      .attr('y', 24)
      .attr('fill', 'rgba(16, 185, 129, 0.45)')
      .attr('font-size', '6.5px')
      .attr('font-family', 'monospace')
      .attr('text-anchor', 'end')
      .text(`ASSETS: ${filteredArtifacts.length}/${allArtifacts.length}`);

    // Standard D3 canvas drag handler installation supporting dynamic manual spinning!
    const dragHandler = d3.drag<SVGSVGElement, unknown>()
      .on('drag', (event) => {
        // Stop auto rotation when user grabs and manually calibrates orientation!
        setIsAutoRotating(false);
        setSpinAngle(prev => (prev + event.dx * 0.9 + 360) % 360);
        // Tilt bounds between -10 and 60 degrees to avoid inverted viewport errors
        setTiltAngle(prev => Math.min(65, Math.max(-10, prev - event.dy * 0.8)));
      });

    // Mount touch/mouse track drag directly on SVG element
    svg.call(dragHandler as any);

  }, [spinAngle, tiltAngle, casingRadius, filteredArtifacts, allArtifacts, selectedArtifact, terminalTheme, hoveredDepth, hoveredTimeSnapshot, isSynchronizedView, showCasingSchema, showHeatmap, forensicLogs, showCrossSection, crossSectionDepth]);

  // Rotational focal auto-centering logic
  // Automatically rotates the 3D wellbore directly to align θ to point the defect right at the center of the viewport
  const handleFocusArtifact = (art: CasingArtifact) => {
    setIsAutoRotating(false);
    setSelectedArtifact(art);
    
    // Front face alignment means θ is centered horizontally at 270 degrees in our projection coordinates
    const targetSpin = (270 - art.angleDeg + 360) % 360;
    
    // Animate transition using simple JS interpolation steps to avoid crude jumps
    const steps = 12;
    let stepCount = 0;
    const startAngle = spinAngle;
    const angleDiff = ((targetSpin - startAngle + 540) % 360) - 180; // Shortest rotation path math

    const interpolationInterval = setInterval(() => {
      stepCount++;
      const progression = d3.easeCubicOut(stepCount / steps);
      setSpinAngle((startAngle + angleDiff * progression + 360) % 360);
      
      if (stepCount >= steps) {
        clearInterval(interpolationInterval);
        addLog(`[CASING ORIENTATION] Telemetry alignment locked: Casing rotated to θ=[${art.angleDeg}°] focal index. Sensor coverage MAXIMIZED.`, 'success');
      }
    }, 30);
  };

  // Helper method to dynamically resolve casing artifact timestamps from forensic logs or file nodes
  const getArtifactTimestamp = (art: CasingArtifact) => {
    // 1. Scan active forensic logs database for associated matches (by name or depth keywords)
    if (forensicLogs && forensicLogs.length > 0) {
      const match = forensicLogs.find(log => 
        log.message.toLowerCase().includes(art.name.toLowerCase()) ||
        log.message.toLowerCase().includes(`depth=${art.depthM}`) ||
        log.message.toLowerCase().includes(`depth = ${art.depthM}`)
      );
      if (match) return match.timestamp;
    }

    // 2. If mapping directly into active folder system structures, seek filesystem lastModified timestamp
    if (art.associatedPath) {
      const seekTime = (node: DirectoryNode): string | null => {
        if (node.path === art.associatedPath) {
          return node.lastModified || node.lastScanned || null;
        }
        if (node.children) {
          for (const child of node.children) {
            const out = seekTime(child);
            if (out) return out;
          }
        }
        return null;
      };
      const foundTime = seekTime(initialFilesystem);
      if (foundTime) return foundTime;
    }

    // 3. Structured fallback stamps mapping to default calibration/seeding logs
    const mockDate = "2026-06-06";
    if (art.id === "def-01") return `${mockDate} 15:44:12 UTC`;
    if (art.id === "def-02") return `${mockDate} 16:11:05 UTC`;
    if (art.id === "def-03") return `${mockDate} 16:32:48 UTC`;
    if (art.id === "def-04") return `${mockDate} 17:01:30 UTC`;

    return `${mockDate} 18:00:00 UTC (CALIBRATED)`;
  };

  // Listen for custom trigger events from other components (like our Forensic Event Log)
  useEffect(() => {
    const handleJumpEvent = (event: any) => {
      const { artifactId } = event.detail || {};
      if (!artifactId) return;
      const targetArt = allArtifacts.find(a => a.id === artifactId);
      if (targetArt) {
        handleFocusArtifact(targetArt);
        // Scroll to the casing-trauma-panel so user sees the 3D projection rotate!
        const el = document.getElementById('casing-trauma-panel');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    window.addEventListener('jump-to-casing-defect', handleJumpEvent);
    return () => {
      window.removeEventListener('jump-to-casing-defect', handleJumpEvent);
    };
  }, [allArtifacts, spinAngle]);

  return (
    <div className="bg-[#020617]/90 border border-emerald-500/20 rounded-md p-4 flex flex-col gap-3.5 scanline-glow relative select-text" id="casing-trauma-panel">
      {/* Dynamic header */}
      <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
        <h3 className="font-mono text-emerald-400 text-xs font-bold flex items-center gap-2 glow-text-emerald uppercase tracking-wider">
          <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
          Spatial Wellbore Casing Scanner
        </h3>
        <div className="flex items-center gap-1.5 font-mono text-[9px]">
          {/* Synchronized View Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextSync = !isSynchronizedView;
              setIsSynchronizedView(nextSync);
              if (nextSync) {
                setIsAutoRotating(false); // Let the user control rotation manually during sync scrub
                addLog(`[FOCUS SYSTEM] Synchronized View ENGAGED: Camera pan/zoom locked to live time-scrubber focus (Depth = ${hoveredDepth !== null ? hoveredDepth : 500}m).`, 'success');
              } else {
                addLog(`[FOCUS SYSTEM] Synchronized View DEACTIVATED: Camera returned to global casing overview.`, 'info');
              }
            }}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 font-extrabold tracking-widest uppercase ${
              isSynchronizedView 
                ? 'bg-cyan-500/15 border-cyan-500/45 text-cyan-400 font-bold shadow-[0_0_8px_rgba(6,182,212,0.15)]' 
                : 'bg-black/50 border-emerald-500/10 text-emerald-500/40 hover:border-emerald-500/20'
            }`}
            title="Link camera pan/zoom structure to active time-scrubber location"
          >
            <Link2 className="w-2.5 h-2.5" />
            <span>SYNC VIEW</span>
          </button>

          {/* Top-Down Cross-Section View Toggle */}
          <button
            type="button"
            id="casing-cross-section-toggle"
            onClick={() => {
              const nextVal = !showCrossSection;
              setShowCrossSection(nextVal);
              if (nextVal) {
                addLog(`[CROSS-SECTION ENGINE] Top-down polar radial cross-section engaged at depth scanline ${crossSectionDepth}m. Visualizing eccentric casing wear & fluid leak vectors.`, 'success');
              } else {
                addLog(`[CROSS-SECTION ENGINE] Returned to 3D vertical casing perspective scanning.`, 'info');
              }
            }}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 font-extrabold tracking-widest uppercase ${
              showCrossSection 
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-400 font-bold shadow-[0_0_8px_rgba(168,85,247,0.15)]' 
                : 'bg-black/50 border-emerald-500/10 text-emerald-500/40 hover:border-emerald-500/20'
            }`}
            title="Toggle top-down polar radial cross-section modeling for eccentric wear and leaks"
          >
            <Disc className="w-2.5 h-2.5" />
            <span>CROSS SECTION</span>
          </button>

          {/* Wellbore Casing Schema Overlay Toggle */}
          <button
            type="button"
            id="casing-schema-toggle"
            onClick={() => {
              const nextVal = !showCasingSchema;
              setShowCasingSchema(nextVal);
              if (nextVal) {
                addLog(`[CASING SCHEMA] Reference Wellbore Casing Schema OVERLAY activated. Segment definitions and contextual trauma depth markers mapped.`, 'success');
              } else {
                addLog(`[CASING SCHEMA] Reference overlay disabled. Returning to clean telemetry scanning mode.`, 'info');
              }
            }}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 font-extrabold tracking-widest uppercase ${
              showCasingSchema 
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold shadow-[0_0_8px_rgba(245,158,11,0.15)] shadow' 
                : 'bg-black/50 border-emerald-500/10 text-emerald-500/40 hover:border-emerald-500/20'
            }`}
            title="Toggle reference wellbore casing schema overlay and depth markers"
          >
            <Layers className="w-2.5 h-2.5" />
            <span>SCHEMA OVERLAY</span>
          </button>

          {/* Cumulative Heatmap Overlay Toggle */}
          <button
            type="button"
            id="casing-heatmap-toggle"
            onClick={() => {
              const nextVal = !showHeatmap;
              setShowHeatmap(nextVal);
              if (nextVal) {
                addLog(`[HEATMAP ENGINE] Dynamic 3D casing trauma/thermal heatmap overlay activated. Parsing Forensic Event Log to map cumulative stress distribution.`, 'success');
              } else {
                addLog(`[HEATMAP ENGINE] 3D trauma heatmap deactivated. Returning to clean wireframe diagnostic perspective.`, 'info');
              }
            }}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 font-extrabold tracking-widest uppercase ${
              showHeatmap 
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 font-bold shadow-[0_0_8px_rgba(239,68,68,0.15)] shadow' 
                : 'bg-black/50 border-emerald-500/10 text-emerald-500/40 hover:border-emerald-500/20'
            }`}
            title="Toggle volumetric D3 overlay cumulative thermal trauma heatmap"
          >
            <Flame className="w-2.5 h-2.5" />
            <span>HEATMAP OVERLAY</span>
          </button>

          {/* Autorotate HUD switcher */}
          <button
            type="button"
            onClick={() => {
              setIsAutoRotating(!isAutoRotating);
              addLog(`Casing spatial visualization auto-rotation ${!isAutoRotating ? 'ENGAGED. Standard orbit scan tracking.' : 'STANDBY.'}`, 'info');
            }}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 font-extrabold tracking-widest uppercase ${
              isAutoRotating 
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                : 'bg-black/50 border-emerald-500/10 text-emerald-500/40 hover:border-emerald-500/20'
            }`}
            title="Toggle autonomous wellbore orbit rotation modeling"
          >
            <RotateCw className={`w-2.5 h-2.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
            <span>{isAutoRotating ? 'ORBIT' : 'STATIC'}</span>
          </button>
        </div>
      </div>

      <p className="font-mono text-[9px] text-zinc-400 leading-relaxed -mt-1">
        Cylindrical coordinate projection mapping physical micro-cracks, ovality deformations, and metal thinning zones derived from core digital anomaly files.
      </p>

      {/* Main split grid: Top is 3D visualization canvas, side is controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Left Column: Virtual SVG Canvas (col-span-7) */}
        <div className="md:col-span-7 bg-black/85 rounded border border-emerald-500/15 relative h-80 overflow-hidden flex items-center justify-center cursor-move" id="casing-3d-viewport">
          <div className="absolute top-2 right-2 text-[7px] font-mono text-zinc-500 bg-black/75 px-1 rounded pointer-events-none select-none uppercase">
            ◄ DRAG SVG TO ROTATE wellbore ►
          </div>

          <svg ref={svgRef} className="w-full h-full text-emerald-400" id="casing-projection-svg" />

          {/* Navigational 2D Mini-Map Corner HUD Overlay */}
          <div 
            className="absolute left-2.5 top-8 bottom-8 w-16 bg-zinc-950/90 backdrop-blur-md border border-emerald-500/25 rounded p-1.5 flex flex-col items-center select-none z-30 font-mono text-[6.5px] text-zinc-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
            id="wellbore-navigational-minimap"
          >
            <div className="flex items-center gap-1 mb-1 font-extrabold text-emerald-400 uppercase tracking-widest text-[6px] border-b border-emerald-500/25 pb-1 w-full justify-center">
              <Compass className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              <span>WELL NAV</span>
            </div>

            {/* Content pane containing both vertical ticks & interactive track */}
            <div className="relative flex-grow w-full flex flex-row items-stretch justify-end pl-5 pr-0.5 py-0.5">
              {/* Vertical depth tick markers on the left */}
              <div className="absolute left-0.5 top-0.5 bottom-0.5 flex flex-col justify-between text-[6px] scale-90 text-zinc-500 font-bold pointer-events-none">
                <span>0m</span>
                <span>200</span>
                <span>400</span>
                <span>600</span>
                <span>800</span>
                <span>1k</span>
              </div>

              {/* Interactive Scroll/Scrub Track */}
              <div 
                className="relative w-3.5 h-full bg-zinc-900 border border-zinc-700/65 rounded-lg cursor-ns-resize overflow-hidden"
                onMouseDown={(e) => {
                  setIsScrubbingMap(true);
                  handleMiniMapCommit(e.clientY, e.currentTarget.getBoundingClientRect(), true);
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relativeY = e.clientY - rect.top;
                  const pct = Math.max(0, Math.min(1, relativeY / rect.height));
                  setMapHoverDepth(Math.round(pct * 1000));

                  if (isScrubbingMap || e.buttons === 1) {
                    handleMiniMapCommit(e.clientY, rect, false);
                  }
                }}
                onMouseUp={() => setIsScrubbingMap(false)}
                onMouseLeave={() => {
                  setIsScrubbingMap(false);
                  setMapHoverDepth(null);
                }}
                onTouchStart={(e) => {
                  setIsScrubbingMap(true);
                  handleMiniMapCommit(e.touches[0].clientY, e.currentTarget.getBoundingClientRect(), true);
                }}
                onTouchMove={(e) => {
                  handleMiniMapCommit(e.touches[0].clientY, e.currentTarget.getBoundingClientRect(), false);
                }}
                onTouchEnd={() => setIsScrubbingMap(false)}
              >
                {/* 1. Spatial filter active depth coverage window */}
                <div 
                  className="absolute left-0 right-0 bg-emerald-400/10 border-y border-emerald-500/30"
                  style={{
                    top: `${(depthRange[0] / 1000) * 100}%`,
                    height: `${((depthRange[1] - depthRange[0]) / 1000) * 100}%`
                  }}
                />

                {/* 2. Shaded Viewport focal lens box when synchronized zoom-in view is active */}
                {isSynchronizedView && hoveredDepth !== null && (
                  <div 
                    className="absolute left-0 right-0 bg-cyan-500/15 border-t border-b border-cyan-400/50 pointer-events-none z-10 animate-pulse"
                    style={{ 
                      top: `${Math.max(0, (hoveredDepth - 100) / 1000) * 100}%`,
                      height: `${(200 / 1000) * 100}%`
                    }}
                  />
                )}

                {/* 3. Physical defects/trauma locations mapping */}
                {filteredArtifacts.map((art) => {
                  const topPct = (art.depthM / 1000) * 100;
                  const isSelected = selectedArtifact?.id === art.id;
                  const severityColor = art.traumaLevel > 70 
                    ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.7)]' 
                    : art.traumaLevel > 30 
                      ? 'bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.6)]' 
                      : 'bg-emerald-400 shadow-[0_0_3px_rgba(52,211,153,0.5)]';
                  return (
                    <div 
                      key={`minimap-art-${art.id}`}
                      className={`absolute left-0 w-full h-0.5 pointer-events-none transition-all ${severityColor} ${isSelected ? 'scale-y-150 h-1 border-y border-white/50 z-20' : 'opacity-85'}`}
                      style={{ top: `${topPct}%`, transform: 'translateY(-50%)' }}
                    />
                  );
                })}

                {/* 4. Cross section depth scanning laser line */}
                {showCrossSection && (
                  <div 
                    className="absolute left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_6px_#c084fc] pointer-events-none z-20 animate-pulse border-y border-purple-400/40"
                    style={{ top: `${(crossSectionDepth / 1000) * 100}%`, transform: 'translateY(-50%)' }}
                  />
                )}

                {/* 5. active hovered/probed depth pointer line */}
                {hoveredDepth !== null && (
                  <div 
                    className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_6px_#22d3ee] pointer-events-none z-20 border-y border-cyan-300/40"
                    style={{ top: `${(hoveredDepth / 1000) * 100}%`, transform: 'translateY(-50%)' }}
                  />
                )}
              </div>
            </div>

            {/* Hover floating coordinate bubble */}
            {mapHoverDepth !== null && (
              <div 
                className="absolute left-16 bg-black/95 text-white border border-emerald-400/80 px-1 py-0.5 rounded text-[6.5px] pointer-events-none z-30 shadow-[0_0_6px_rgba(52,211,153,0.4)] font-bold whitespace-nowrap"
                style={{
                  top: `${Math.max(10, Math.min(90, (mapHoverDepth / 1000) * 100))}%`,
                  transform: 'translateY(-50%)'
                }}
              >
                GOTO: {mapHoverDepth}m
              </div>
            )}

            {/* Bottom active status bar */}
            <div className="flex flex-col items-center text-[5.8px] scale-95 border-t border-emerald-500/10 pt-1.5 w-full mt-1 uppercase text-zinc-500 font-extrabold text-center leading-none">
              <span className="text-emerald-400/80 mb-0.5 text-[5.5px]">TRACKER</span>
              <span className="text-zinc-400 max-w-full font-mono tabular-nums leading-none">
                {hoveredDepth !== null ? `${Math.round(hoveredDepth)}m` : '0m'}
              </span>
            </div>
          </div>

          {/* Interactive Tooltips Panel on Casing Trauma Marker Hover */}
          {hoveredTooltipArtifact && tooltipPosition && (
            <div 
              className="absolute p-2.5 rounded border border-cyan-500/40 bg-black/95 text-cyan-400 font-mono text-[9px] pointer-events-none z-50 shadow-[0_0_15px_rgba(6,182,212,0.3)] min-w-[190px] max-w-[240px] flex flex-col gap-1.5 select-none transition-all duration-75 pointer-events-none"
              style={{ 
                left: `${tooltipPosition.x}px`, 
                top: `${tooltipPosition.y}px`,
                transform: 'translate(-50%, -112%)'
              }}
            >
              <div className="flex items-center justify-between border-b border-cyan-500/15 pb-0.5 gap-2">
                <span className="font-extrabold text-[9.5px] text-white truncate max-w-[105px]">
                  {hoveredTooltipArtifact.name}
                </span>
                <span className={`px-1 py-0.2 rounded border text-[7.5px] font-black uppercase tracking-widest flex-shrink-0 ${
                  hoveredTooltipArtifact.traumaLevel > 75 
                    ? 'border-red-500 bg-red-950/40 text-red-400 font-bold' 
                    : hoveredTooltipArtifact.traumaLevel > 40 
                      ? 'border-amber-500 bg-amber-950/40 text-amber-400' 
                      : 'border-emerald-500 bg-emerald-950/40 text-emerald-400'
                }`}>
                  {hoveredTooltipArtifact.traumaLevel}% STRESS
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5 text-zinc-400 text-[8px] leading-tight">
                <div>
                  <span>DEPTH: </span>
                  <strong className="text-white font-sans">{hoveredTooltipArtifact.depthM}m</strong>
                </div>
                <div>
                  <span>SECTOR: </span>
                  <strong className="text-white font-sans">θ:{hoveredTooltipArtifact.angleDeg}°</strong>
                </div>
                <div>
                  <span>WALL LOSS: </span>
                  <strong className="text-rose-400 font-sans">{hoveredTooltipArtifact.radialLossMm}mm</strong>
                </div>
                <div>
                  <span>TIMESTAMP: </span>
                  <strong className="text-cyan-300 text-[7.5px] font-mono leading-none truncate">{getArtifactTimestamp(hoveredTooltipArtifact).replace(' (CALIBRATED)', '')}</strong>
                </div>
              </div>

              <div className="text-zinc-300 leading-normal border-t border-cyan-500/10 pt-1 text-[8px]">
                <span className="text-zinc-500 font-bold uppercase text-[7px] block tracking-wide mb-0.5">Forensic Summary:</span>
                <span className="text-zinc-400 block break-words">
                  {hoveredTooltipArtifact.description.length > 70 
                    ? `${hoveredTooltipArtifact.description.substring(0, 70)}...` 
                    : hoveredTooltipArtifact.description}
                </span>
              </div>
            </div>
          )}

          {/* Dynamic calibration depth bounding indicators on Right boundary */}
          <div className="absolute right-2 top-10 bottom-10 flex flex-col justify-between pointer-events-none text-[6.5px] font-mono text-zinc-500 select-none bg-black/25 pr-1.5 py-2.5 border-r border-emerald-500/10">
            {isSynchronizedView && hoveredDepth !== null ? (
              <>
                <span className="text-cyan-400 font-extrabold">FOCUS</span>
                <span>{Math.max(0, Math.round(hoveredDepth - 100))}m</span>
                <span className="text-cyan-300 font-extrabold bg-cyan-950/40 border border-cyan-500/35 px-1 rounded">{Math.round(hoveredDepth)}m</span>
                <span>{Math.min(1000, Math.round(hoveredDepth + 100))}m</span>
                <span className="text-cyan-400/70 font-extrabold">ZOOMED</span>
              </>
            ) : (
              <>
                <span className="text-emerald-400">0m</span>
                <span>200m</span>
                <span>400m</span>
                <span>600m</span>
                <span>800m</span>
                <span className="text-red-400">1000m</span>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Visual Controls and Filters (col-span-12 md:col-span-5) */}
        <div className="md:col-span-5 flex flex-col gap-2.5 font-mono text-[9px]" id="casing-interactive-filters">
          {showCrossSection && (
            <div className="bg-[#1e1b4b]/20 p-2 rounded border border-purple-500/25 flex flex-col gap-2 relative animate-fadeIn" id="cross-section-depth-scanner">
              <span className="font-extrabold text-purple-400 flex items-center gap-1.5 uppercase leading-none">
                <Disc className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
                2D RADIAL DEPTH SCANNER
              </span>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-zinc-400 text-[8px] font-bold">
                  <span>ACTIVE STRATA ELEVATION:</span>
                  <span className="text-purple-300 font-black">{crossSectionDepth}m</span>
                </div>
                <input 
                  type="range"
                  min={0}
                  max={1000}
                  step={5}
                  value={crossSectionDepth}
                  onChange={(e) => {
                    const depth = parseInt(e.target.value);
                    setCrossSectionDepth(depth);
                    addLog(`[CROSS-SECTION SCAN] Adjusting strata slice to: ${depth}m elevation. Recomputing radial stress vectors.`, 'info');
                  }}
                  className="w-full h-1 bg-zinc-950 rounded appearance-none cursor-pointer accent-purple-400"
                />
                <div className="flex justify-between text-[7px] text-zinc-500 font-mono">
                  <span>0m (CONDUCTOR Barrier)</span>
                  <span>1000m (RESERVOIR Segment)</span>
                </div>
              </div>
            </div>
          )}
          <div className="bg-black/55 p-2 rounded border border-emerald-500/10 flex flex-col gap-2 relative">
            <span className="font-bold text-zinc-400 flex items-center gap-1.5 uppercase leading-none">
              <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
              CAMERA CALIBRATION
            </span>

            {/* Radius Tuning Slider */}
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between text-zinc-500">
                <span>Cylinder Radius:</span>
                <span className="text-emerald-400 font-bold">{casingRadius}px</span>
              </div>
              <input 
                type="range"
                min={35}
                max={85}
                value={casingRadius}
                onChange={(e) => setCasingRadius(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-950 rounded appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* Rotation orbit Speed Slider */}
            {isAutoRotating && (
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-zinc-500">
                  <span>Orbit Sweep Rate:</span>
                  <span className="text-emerald-400 font-bold">{rotationSpeed}s</span>
                </div>
                <input 
                  type="range"
                  min={4}
                  max={30}
                  value={rotationSpeed}
                  onChange={(e) => setRotationSpeed(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-950 rounded appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            )}

            {/* Sync View Status */}
            <div className="flex items-center justify-between border-t border-white/5 pt-1.5 mt-0.5 text-[8px]">
              <span className="text-zinc-500 uppercase font-bold">SCRUB LOCK:</span>
              {isSynchronizedView && hoveredDepth !== null ? (
                <span className="text-cyan-400 font-mono font-black flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full inline-block" />
                  SYNCED @ {Math.round(hoveredDepth)}m
                </span>
              ) : (
                <span className="text-emerald-500/20 font-bold uppercase">
                  OFF (OVERVIEW)
                </span>
              )}
            </div>
          </div>

          <div className="bg-black/55 p-2 rounded border border-emerald-500/10 flex flex-col gap-2 relative">
            <span className="font-bold text-zinc-400 flex items-center gap-1.5 uppercase leading-none text-[8.5px]">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              SECTOR SPATIAL FILTERS
            </span>

            {/* Depth Slice Window range */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-zinc-500 text-[8px]">
                <span>DEPTH COVERAGE:</span>
                <span className="text-emerald-400 font-black">{depthRange[0]}m - {depthRange[1]}m</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[7.5px] text-zinc-600">MIN STRATA (m):</span>
                  <input
                    type="number"
                    min="0"
                    max="900"
                    value={depthRange[0]}
                    onChange={(e) => setDepthRange([Math.max(0, parseInt(e.target.value) || 0), depthRange[1]])}
                    className="bg-black/90 border border-emerald-500/15 p-1 text-[8.5px] text-emerald-400 font-bold rounded focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[7.5px] text-zinc-600">MAX STRATA (m):</span>
                  <input
                    type="number"
                    min="100"
                    max="1000"
                    value={depthRange[1]}
                    onChange={(e) => setDepthRange([depthRange[0], Math.min(1000, parseInt(e.target.value) || 1000)])}
                    className="bg-black/90 border border-emerald-500/15 p-1 text-[8.5px] text-emerald-400 font-bold rounded focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Severity Threshold filter slider */}
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between text-zinc-500">
                <span>MIN TRAUMA FILTER:</span>
                <span className="text-emerald-400 font-black">{minTraumaFilter}%</span>
              </div>
              <input 
                type="range"
                min={0}
                max={90}
                value={minTraumaFilter}
                onChange={(e) => setMinTraumaFilter(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-950 rounded appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          </div>

          {/* Casing Material Properties Module */}
          <div className="bg-black/55 p-2 px-2.5 rounded border border-emerald-500/10 flex flex-col gap-2 relative">
            <span className="font-bold text-zinc-400 flex items-center justify-between uppercase leading-none text-[8.5px]">
              <span className="flex items-center gap-1.5 font-bold">
                <Settings2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse animate-duration-1000" />
                CASING MATERIAL CALIBRATION
              </span>
              <span className="text-cyan-500/60 text-[7px] font-mono select-none">ACTIVE</span>
            </span>

            <p className="text-zinc-500 text-[8px] leading-normal -mt-1 font-mono">
              Configure known steel properties to dynamically recalibrate failure limits and adjust the 3D trauma heatmap.
            </p>

            {/* Steel Grade Selector */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-zinc-500 font-bold text-[7.5px]">
                <span>KNOWN STEEL GRADE:</span>
                <span className="text-yellow-400 font-mono font-bold">
                  {steelGrade} ({steelGrade === 'J55' ? '55' : steelGrade === 'N80' ? '80' : steelGrade === 'P110' ? '110' : '125'} KSI Yield)
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(['J55', 'N80', 'P110', 'Q125'] as const).map(grade => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => {
                      setSteelGrade(grade);
                      addLog(`[MATERIAL CONTROL] Set Casing Steel Grade: ${grade}. Recalibrating failure limits and modifying volumetric stress heatmap coefficient.`, 'info');
                    }}
                    className={`py-1 rounded border text-[8px] font-black cursor-pointer transition-all ${
                      steelGrade === grade
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.1)]'
                        : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            {/* Nominal Wall Thickness slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-zinc-500 text-[7.5px]">
                <span>NOMINAL WALL THICKNESS:</span>
                <span className="text-cyan-400 font-mono font-bold">{nominalThickness.toFixed(1)} mm</span>
              </div>
              <input 
                type="range"
                min={4.0}
                max={20.0}
                step={0.5}
                value={nominalThickness}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setNominalThickness(val);
                }}
                onMouseUp={() => {
                  addLog(`[MATERIAL CONTROL] Recalibration completed: Nominal wall thickness = ${nominalThickness.toFixed(1)}mm. Volumetric grid stress concentration adjusted.`, 'info');
                }}
                onTouchEnd={() => {
                  addLog(`[MATERIAL CONTROL] Recalibration completed: Nominal wall thickness = ${nominalThickness.toFixed(1)}mm. Volumetric grid stress concentration adjusted.`, 'info');
                }}
                className="w-full h-1 bg-zinc-950 rounded appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[6.5px] text-zinc-600">
                <span>4.0 mm (Thin / High Stress)</span>
                <span>20.0 mm (Thick / Secure Buffer)</span>
              </div>
            </div>

            {/* Calibration Slider / Sensitivity Adjust */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-zinc-500 text-[7.5px]">
                <span>BIAS CORRECTION SCALAR:</span>
                <span className="text-emerald-400 font-mono font-bold">×{calibrationFactor.toFixed(2)}</span>
              </div>
              <input 
                type="range"
                min={0.50}
                max={1.50}
                step={0.05}
                value={calibrationFactor}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCalibrationFactor(val);
                }}
                onMouseUp={() => {
                  addLog(`[MATERIAL CONTROL] Recalibration bias configured to ×${calibrationFactor.toFixed(2)}. Accuracy mapping adjusted.`, 'info');
                }}
                onTouchEnd={() => {
                  addLog(`[MATERIAL CONTROL] Recalibration bias configured to ×${calibrationFactor.toFixed(2)}. Accuracy mapping adjusted.`, 'info');
                }}
                className="w-full h-1 bg-zinc-950 rounded appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* Diagnostic readout summary badge */}
            <div className="flex items-center justify-between border-t border-white/5 pt-1.5 mt-0.5 text-[8px]">
              <span className="text-zinc-500 font-extrabold uppercase">STRESS MATRIX COEFFICIENT:</span>
              <span className={`px-1.5 py-0.5 rounded border text-[8px] font-mono font-black ${
                materialStressMultiplier > 1.2 
                  ? 'border-red-500/30 bg-red-950/20 text-red-400' 
                  : materialStressMultiplier > 0.85
                    ? 'border-amber-500/30 bg-amber-950/20 text-amber-400' 
                    : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400'
              }`}>
                ×{materialStressMultiplier.toFixed(3)}
              </span>
            </div>
          </div>

          {/* Wellbore Casing Schema Reference Legend */}
          {showCasingSchema && (
            <div className="bg-[#1e1b4b]/40 p-2 rounded border border-cyan-500/20 flex flex-col gap-1.5 animate-fadeIn" id="wellbore-schema-legend">
              <span className="font-bold text-cyan-400 flex items-center gap-1 uppercase leading-none text-[8.5px] tracking-wider">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Wellbore Casing Schema Legend
              </span>
              <div className="flex flex-col gap-1 text-[8px] font-mono leading-normal text-zinc-400">
                <div className="flex items-center justify-between border-b border-white/5 pb-0.5">
                  <span className="text-sky-400 font-extrabold">■ SURF [0m - 250m]:</span>
                  <span className="text-zinc-500 text-right">Surface Conductor Shield</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-0.5">
                  <span className="text-amber-400 font-extrabold font-bold">■ INTM [250m - 600m]:</span>
                  <span className="text-zinc-500 text-right">Intermediate Collapse Stop</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-0.5">
                  <span className="text-rose-400 font-extrabold">■ PROD [600m - 850m]:</span>
                  <span className="text-zinc-500 text-right">Production Transport Seal</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-400 font-extrabold">■ LINER [850m - 1000m]:</span>
                  <span className="text-zinc-500 text-right">Downhole Reservoir Screen</span>
                </div>
              </div>
              <div className="text-[7.5px] text-cyan-300/60 leading-normal border-t border-cyan-500/10 pt-1 font-mono">
                Real-time contextual guidelines map active trauma nodes on the 3D visualizer to the physical well casing structure.
              </div>
            </div>
          )}

          {/* Wellbore Casing Heatmap Reference Legend */}
          {showHeatmap && (
            <div className="bg-[#311010]/30 p-2 rounded border border-red-500/20 flex flex-col gap-1.5 animate-fadeIn" id="wellbore-heatmap-legend">
              <span className="font-bold text-red-400 flex items-center gap-1 uppercase leading-none text-[8.5px] tracking-wider">
                <Flame className="w-3.5 h-3.5 text-red-500" />
                Cumulative Trauma Heatmap Scale
              </span>
              <div className="flex flex-col gap-1 text-[8px] font-mono leading-normal text-zinc-400">
                <div className="flex items-center justify-between border-b border-white/5 pb-0.5">
                  <span className="text-red-400 font-extrabold font-bold">■ CRITICAL SECTOR [75% - 100%]:</span>
                  <span className="text-zinc-500 text-right">Severe Wear / Fracture Seam</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-0.5">
                  <span className="text-amber-400 font-extrabold font-bold">■ HIGH WARNING [45% - 75%]:</span>
                  <span className="text-zinc-500 text-right">Advanced Deformation / Ovality</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-0.5">
                  <span className="text-emerald-400 font-bold">■ STABLE ADVISORY [15% - 45%]:</span>
                  <span className="text-zinc-500 text-right">Nominal Squeeze / Scouring</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold">■ SECURE BUFFER [0% - 15%]:</span>
                  <span className="text-zinc-500 text-right">Nominal Integrative Structure</span>
                </div>
              </div>
              <div className="text-[7.5px] text-red-300/60 leading-normal border-t border-red-500/10 pt-1 font-mono">
                Volumetric heat density continuously maps cumulative wellbore trauma stress, dynamically parsed and aggregated from the live Forensic Event Log.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Anomaly Diagnosticians Board */}
      <div className="bg-[#01040f]/75 p-3 rounded border border-emerald-500/10 min-h-[70px] flex flex-col justify-between font-mono text-[8.5px] select-text relative">
        {selectedArtifact ? (
          <div className="flex flex-col gap-2" id="selected-anomaly-diagnostics">
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="font-extrabold text-[10px] text-white flex items-center gap-1.5">
                <ShieldAlert className={`w-3.5 h-3.5 ${selectedArtifact.traumaLevel > 75 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`} />
                DIAGNOSTICS: {selectedArtifact.name}
              </span>
              <span className={`px-1.5 py-0.2 rounded border text-[8px] font-black uppercase tracking-widest ${
                selectedArtifact.traumaLevel > 75 
                  ? 'border-red-500 bg-red-950/20 text-red-400' 
                  : selectedArtifact.traumaLevel > 40 
                    ? 'border-amber-500 bg-amber-950/20 text-amber-400' 
                    : 'border-emerald-500 bg-emerald-950/20 text-emerald-400'
              }`}>
                {selectedArtifact.traumaLevel > 75 ? 'CRITICAL TRAUMA' : selectedArtifact.traumaLevel > 40 ? 'WARNING DEFORMITY' : 'STABLE SECTOR'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-zinc-400 text-[8.5px]">
              <div>
                <span className="text-zinc-650 block text-[7.5px] uppercase">DEPTH LEVEL:</span>
                <strong className="text-white font-sans text-[9px]">{selectedArtifact.depthM} m</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[7.5px] uppercase">ADJUSTED STRESS (BASE):</span>
                <strong className="text-cyan-400 font-sans text-[9px]">
                  {selectedArtifact.traumaLevel}% 
                  {selectedArtifact.nominalTraumaLevel !== undefined && (
                    <span className="text-zinc-500 font-normal text-[8px] ml-1">
                      ({selectedArtifact.nominalTraumaLevel}%)
                    </span>
                  )}
                </strong>
              </div>
              <div>
                <span className="text-zinc-650 block text-[7.5px] uppercase">ORIENTATION:</span>
                <strong className="text-white font-sans text-[9px]">θ = {selectedArtifact.angleDeg}°</strong>
              </div>
              <div>
                <span className="text-zinc-650 block text-[7.5px] uppercase">WALL METALLIC LOSS:</span>
                <strong className="text-rose-400 font-sans text-[9px]">{selectedArtifact.radialLossMm} mm</strong>
              </div>
              {selectedArtifact.associatedPath ? (
                <div className="truncate">
                  <span className="text-zinc-650 block text-[7.5px] uppercase">SYSTEM SOURCE:</span>
                  <strong className="text-cyan-400 font-mono text-[8px] truncate block" title={selectedArtifact.associatedPath}>{selectedArtifact.associatedPath}</strong>
                </div>
              ) : (
                <div>
                  <span className="text-zinc-650 block text-[7.5px] uppercase">MATERIAL GRADE:</span>
                  <strong className="text-yellow-400 font-mono text-[8.5px] block">{steelGrade} STEEL</strong>
                </div>
              )}
            </div>

            <div className="text-zinc-300 leading-normal border-t border-white/5 pt-1.5 text-[8.5px]">
              <span className="text-zinc-600 font-bold block uppercase text-[7.5px] tracking-wide mb-0.5">Anomaly Forensic Description:</span>
              {selectedArtifact.description}
            </div>

            <div className="bg-emerald-950/5 border border-emerald-500/10 p-1.5 rounded text-[8.5px] text-emerald-400 leading-normal">
              <span className="text-emerald-500 font-extrabold uppercase text-[7.5px] block mb-0.5 tracking-wider leading-none">FORENSIC REMEDIATION GUIDE:</span>
              {selectedArtifact.remediation}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-zinc-500 gap-1 select-none">
            <Info className="w-5 h-5 text-zinc-600" />
            <span className="font-extrabold uppercase tracking-wide">Spatial diagnostics vacant</span>
            <span>Tap an active trauma crosshair node in the 3D projection cylinder to inject diagnostic diagnostics.</span>
          </div>
        )}
      </div>

      {/* Index of All Seams / Seam quick selector directory mapping list */}
      <div className="flex flex-col gap-1.5 border border-emerald-500/10 p-2.5 rounded bg-black/45">
        <div className="flex items-center justify-between border-b border-emerald-500/10 pb-1.5">
          <span className="font-bold text-zinc-400 uppercase text-[8.5px] flex items-center gap-1">
            <Orbit className="w-3.5 h-3.5 text-cyan-400" />
            Downhole Casing Seams Database index
          </span>
          {/* Quick Search bar filter */}
          <div className="flex items-center gap-1.5 border border-emerald-500/15 px-1.5 py-0.5 rounded bg-black/80 w-[140px] h-5">
            <Search className="w-2.5 h-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search index..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-[8px] h-full w-full text-emerald-400 font-mono placeholder-zinc-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="max-h-[120px] overflow-y-auto flex flex-col gap-1 pr-1" id="casing-artifacts-grid">
          {filteredArtifacts.length > 0 ? (
            filteredArtifacts.map(art => {
              const color = art.traumaLevel > 75 ? 'text-red-400' : art.traumaLevel > 40 ? 'text-amber-400' : 'text-emerald-400';
              const isSelected = selectedArtifact?.id === art.id;

              return (
                <div 
                  key={art.id}
                  onClick={() => handleFocusArtifact(art)}
                  className={`flex items-center justify-between text-[8px] px-2 py-1 rounded transition-all cursor-pointer h-7 border select-none ${
                    isSelected 
                      ? 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.15)]' 
                      : 'bg-black/60 border-white/5 hover:border-emerald-500/20 hover:bg-emerald-950/10'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 pr-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-current ${color}`} />
                    <span className="text-zinc-300 font-bold truncate">{art.name}</span>
                    <span className="text-zinc-600 font-sans">[{art.depthM}m, θ:{art.angleDeg}°]</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[8.5px] font-extrabold ${color}`}>{art.traumaLevel}%</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFocusArtifact(art);
                      }}
                      className="text-cyan-500 hover:text-cyan-300 opacity-60 hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                      title="Rotate wellbore model to center this defect"
                    >
                      <Focus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-zinc-600 uppercase text-[8px]">
              No casing anomalies indexed matching search queries or thresholds.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
