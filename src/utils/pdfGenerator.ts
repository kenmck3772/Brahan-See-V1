import { jsPDF } from 'jspdf';
import { ForensicLog } from '../types';

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

export interface CasingArtifact {
  id: string;
  name: string;
  type: 'file_node' | 'casing_defect';
  depthM: number;
  angleDeg: number;
  traumaLevel: number;
  radialLossMm: number;
  description: string;
  remediation: string;
  associatedPath?: string;
}

export interface TelemetryDataPoint {
  timeSnapshot: string;
  pressure: number;
  temperature: number;
  flowRate: number;
  stressIndex: number;
  timestampMs?: number;
}

interface PDFGeneratorInput {
  terminalTheme: 'emerald' | 'crimson';
  maxTraumaRating: number;
  forensicLogs: ForensicLog[];
  operatorEmail: string;
}

export function exportForensicPDFReport({
  terminalTheme,
  maxTraumaRating,
  forensicLogs,
  operatorEmail
}: PDFGeneratorInput) {
  // Retrieve shared live variables from the global window scope
  const telemetryShared = (window as any).wellTegraTelemetryReportData;
  const casingShared = (window as any).wellTegraCasingData;

  const dataPoints: TelemetryDataPoint[] = telemetryShared?.dataPoints || [];
  const forensicEvents: ForensicEvent[] = telemetryShared?.forensicEvents || [];
  const allArtifacts: CasingArtifact[] = casingShared?.allArtifacts || [];
  const currentCrossSectionDepth = casingShared?.crossSectionDepth || 500;

  // Initialize jsPDF (A4 Portrait, dimensions in mm: 210 x 297)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = terminalTheme === 'crimson' ? [185, 28, 28] : [16, 185, 129]; // Red-700 or Emerald-500
  const secondaryColor = [59, 7, 100]; // Deep Tech Purple (Well-Tegra Brand Accent)
  const charcoal = [30, 41, 59]; // Text color
  const lightGrey = [241, 245, 249]; // Background highlight
  const gridColor = [226, 232, 240];

  const totalPages = 3;

  // Header banner on every page helper
  const drawPageShell = (pageNumber: number) => {
    // Elegant border frame (2.5mm margin)
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.4);
    doc.rect(4, 4, 202, 289);

    // Subtle corner high-tech crosshairs
    const drawCrosshair = (cx: number, cy: number) => {
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.15);
      doc.line(cx - 3, cy, cx + 3, cy);
      doc.line(cx, cy - 3, cx, cy + 3);
    };
    drawCrosshair(10, 10);
    drawCrosshair(200, 10);
    drawCrosshair(10, 287);
    drawCrosshair(200, 287);

    // Running footer
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('CONFIDENTIAL // WELL-TEGRA WELLBORE FORENSIC AUDIT MATRIX', 12, 284);
    doc.text(`PAGE ${pageNumber} OF ${totalPages}`, 198, 284, { align: 'right' });
    
    // Tiny system watermarks
    doc.setFontSize(5);
    doc.text(`OPERATOR: ${operatorEmail.toUpperCase() || 'OPERATOR_1'}`, 12, 288);
    doc.text(`SECTOR RECONSTRUCTION ENGINE [WELL-INTEGRITY_v4.2]`, 198, 288, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: COVER BOARD & TELEMETRY STATISTICS
  // ==========================================
  drawPageShell(1);

  // Top Title Card Banner Block
  doc.setFillColor(15, 23, 42); // Solid Slate-900 background for a clean premium header block
  doc.rect(5, 5, 200, 32, 'F');

  // Circuit trace decoration style in the header banner
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.7);
  doc.line(10, 32, 120, 32);
  doc.line(120, 32, 125, 28);
  doc.line(125, 28, 200, 28);

  // Well-Tegra Logo Drawing
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFillColor(20, 80, 50, 0.2);
  doc.setLineWidth(0.4);
  doc.rect(12, 10, 10, 10);
  doc.line(12, 10, 22, 20);
  doc.line(12, 20, 22, 10);

  // Title branding text
  doc.setFont('courier', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('WELL-TEGRA SOVEREIGN DIAGNOSTIC REGISTRY', 26, 17);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('DOWNHOLE SEGMENT INTEGRITY & COGNITIVE TRACE REPORT', 26, 23);
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('SYSTEM KERNEL: BRAHAN_SOVEREIGN_v4.2 // SECURITY COMPLIANCE LEVEL: ALPHA_DIAL_SECTOR_5', 26, 28);

  // Metadata block coordinates
  let yPos = 46;

  // Primary Metadata Block
  doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
  doc.rect(10, yPos, 190, 24, 'F');
  doc.setDrawColor(gridColor[0], gridColor[1], gridColor[2]);
  doc.setLineWidth(0.3);
  doc.rect(10, yPos, 190, 24, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  
  const formattedToday = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  doc.text('REPORT METADATA:', 13, yPos + 5);
  doc.setFont('courier', 'normal');
  doc.text(`GENERATED TIMESTAMP  : ${formattedToday}`, 13, yPos + 10);
  doc.text(`OPERATOR EMAIL       : ${operatorEmail.toLowerCase()}`, 13, yPos + 14);
  doc.text(`TARGET SECTOR ZONE   : Sector Alpha Deepwell Casing (0 - 1000m)`, 13, yPos + 18);

  const activeThreatStatus = maxTraumaRating > 70 ? 'CRITICAL WELLBORE HAZARD' : maxTraumaRating > 30 ? 'ELEVATED SEISMIC DISTRESS' : 'NOMINAL/SECURE STATE';
  doc.setFont('courier', 'bold');
  doc.text(`MAX DISTRESS RATING  : `, 115, yPos + 10);
  doc.setTextColor(maxTraumaRating > 70 ? 239 : 16, maxTraumaRating > 70 ? 68 : 185, maxTraumaRating > 70 ? 68 : 129);
  doc.text(`${maxTraumaRating}%`, 166, yPos + 10);

  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text(`WELL INTEGRITY STATUS: `, 115, yPos + 14);
  doc.setTextColor(maxTraumaRating > 70 ? 239 : 16, maxTraumaRating > 70 ? 68 : 185, maxTraumaRating > 70 ? 68 : 129);
  doc.text(activeThreatStatus, 115, yPos + 18);

  yPos += 30;

  // Statistical calculations from simulated points
  let avgPressure = 6240, maxPressure = 6580, minPressure = 5900;
  let avgTemp = 196.2, maxTemp = 205.4, minTemp = 188.0;
  let avgFlow = 38.6, maxFlow = 42.1, minFlow = 35.2;
  let avgStress = 34.5, maxStress = 54.0;

  if (dataPoints.length > 0) {
    const pressures = dataPoints.map(p => p.pressure);
    const temps = dataPoints.map(p => p.temperature);
    const flows = dataPoints.map(p => p.flowRate);
    const stresses = dataPoints.map(p => p.stressIndex);

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    avgPressure = Math.round(sum(pressures) / pressures.length);
    maxPressure = Math.max(...pressures);
    minPressure = Math.min(...pressures);

    avgTemp = parseFloat((sum(temps) / temps.length).toFixed(1));
    maxTemp = Math.max(...temps);
    minTemp = Math.min(...temps);

    avgFlow = parseFloat((sum(flows) / flows.length).toFixed(1));
    maxFlow = Math.max(...flows);
    minFlow = Math.min(...flows);

    avgStress = parseFloat((sum(stresses) / stresses.length).toFixed(1));
    maxStress = Math.max(...stresses);
  }

  // Segment Title: Telemetry Statistics Engine
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(10, yPos, 3, 5, 'F');
  
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SECTION 1: BOREHOLE TELEMETRY STATISTICAL AUDIT', 15, yPos + 4);
  
  yPos += 8;

  // Summary Text
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text('Downhole telemetry parameters compiled over the rolling 10-minute automated sliding logging window.', 10, yPos);
  
  yPos += 4;

  // Draw table for telemetry variables
  const tableHeaders = ['TELEMETRY SENSOR MATRIX', 'AVERAGE VALUE', 'PEAK REGISTERED', 'MIN OBSERVED', 'CRITICAL LIMIT'];
  const tableData = [
    ['HYDROSTATIC BARRIER PRESSURE', `${avgPressure} PSI`, `${maxPressure} PSI`, `${minPressure} PSI`, '7,800 PSI'],
    ['DOWNHOLE CASING TEMPERATURE', `${avgTemp} °F`, `${maxTemp} °F`, `${minTemp} °F`, '230.0 °F'],
    ['VOLUMETRIC MUD FLOW RATE', `${avgFlow} gpm`, `${maxFlow} gpm`, `${minFlow} gpm`, '52.0 gpm'],
    ['STRUCTURAL WALL STRESS INDEX', `${avgStress}%`, `${maxStress}%`, '12.0%', '75.0%']
  ];

  // Draw telemetry header
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(10, yPos, 190, 6, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  
  const colWidths = [65, 33, 33, 33, 26];
  let curX = 10;
  tableHeaders.forEach((h, i) => {
    doc.text(h, curX + 2, yPos + 4.5);
    curX += colWidths[i];
  });

  yPos += 6;

  // Draw telemetry body
  tableData.forEach((row, rIdx) => {
    doc.setFillColor(rIdx % 2 === 0 ? 255 : 248, rIdx % 2 === 0 ? 255 : 250, rIdx % 2 === 0 ? 255 : 252);
    doc.rect(10, yPos, 190, 6, 'F');

    doc.setDrawColor(gridColor[0], gridColor[1], gridColor[2]);
    doc.setLineWidth(0.25);
    doc.line(10, yPos + 6, 200, yPos + 6);

    doc.setFont('courier', 'normal');
    if (rIdx === 3 && avgStress > 50) doc.setFont('courier', 'bold');

    doc.setFontSize(7.5);
    doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);

    curX = 10;
    row.forEach((cell, cIdx) => {
      // Highlight limit violations
      if (cIdx === 2 && rIdx === 0 && maxPressure > 7200) doc.setTextColor(185, 28, 28);
      else if (cIdx === 2 && rIdx === 1 && maxTemp > 220) doc.setTextColor(185, 28, 28);
      else if (cIdx === 2 && rIdx === 3 && maxStress > 70) doc.setTextColor(185, 28, 28);
      else doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);

      doc.text(cell, curX + 2, yPos + 4.2);
      curX += colWidths[cIdx];
    });
    yPos += 6;
  });

  yPos += 10;

  // Section 2: Active Background Safety Scanner Configurations
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(10, yPos, 3, 5, 'F');
  
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SECTION 2: AUTOMATIC REAL-TIME LEAK DETECTION SCANNERS', 15, yPos + 4);

  yPos += 8;

  const isScannerOn = telemetryShared?.isLeakScannerEnabled !== false;
  const pThreshold = telemetryShared?.leakPressureThreshold || 250;
  const tThreshold = telemetryShared?.leakTempDropThreshold || 2.0;
  const lastDetectedAt = telemetryShared?.lastLeakDetectedTime || 'NONE';

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text(`Background telemetry probes actively audit gradient rises. Configuration attributes below:`, 10, yPos);

  yPos += 5;

  // Background scanner configuration boxes side by side
  doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
  doc.rect(10, yPos, 92, 28, 'F');
  doc.rect(108, yPos, 92, 28, 'F');
  
  doc.setDrawColor(gridColor[0], gridColor[1], gridColor[2]);
  doc.setLineWidth(0.3);
  doc.rect(10, yPos, 92, 28, 'S');
  doc.rect(108, yPos, 92, 28, 'S');

  // Scanner Box 1
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('LEAK PROCESSOR CONTROL', 13, yPos + 5);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text(`Probes Status      : `, 13, yPos + 10);
  doc.setFont('courier', 'bold');
  doc.setTextColor(isScannerOn ? primaryColor[0] : 185, isScannerOn ? primaryColor[1] : 28, isScannerOn ? primaryColor[2] : 28);
  doc.text(isScannerOn ? 'ACTIVE_ON' : 'DEACTIVATED_OFF', 62, yPos + 10);
  
  doc.setFont('courier', 'normal');
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text(`Sensor Ingester    : Memory Buffer Stream v4`, 13, yPos + 15);
  doc.text(`Trigger Interlocking: Auto-Flag Event Log`, 13, yPos + 20);
  doc.text(`Last Logged Threat : `, 13, yPos + 25);
  doc.setFont('courier', 'bold');
  doc.setTextColor(lastDetectedAt !== 'NONE' ? 185 : charcoal[0], lastDetectedAt !== 'NONE' ? 28 : charcoal[1], lastDetectedAt !== 'NONE' ? 28 : charcoal[2]);
  doc.text(lastDetectedAt, 62, yPos + 25);

  // Scanner Box 2
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('STEP-ALARM THRESHOLDS', 111, yPos + 5);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text(`Pressure Spike Step : => +${pThreshold} PSI`, 111, yPos + 10);
  doc.text(`Cryo Temperature Drop: => -${tThreshold.toFixed(1)} °F`, 111, yPos + 15);
  doc.text(`Calculated Fluid Kick: Hydrodynamic Shear Override`, 111, yPos + 20);
  doc.text(`Response Interlocking: Force Orange Dial Strobe Alert`, 111, yPos + 25);

  yPos += 36;

  // Section 3: Casing Asset Summary Overview
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(10, yPos, 3, 5, 'F');
  
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SECTION 3: CASING DEFECT ANATOMY INVENTORY REPORT', 15, yPos + 4);

  yPos += 8;

  const casingScannedCount = allArtifacts.length;
  const highRiskCount = allArtifacts.filter(a => a.traumaLevel > 65).length;
  const mediumRiskCount = allArtifacts.filter(a => a.traumaLevel > 30 && a.traumaLevel <= 65).length;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text(`Acoustic scanning probes have mapped downhole physical casing segments. Summary of anomalies found:`, 10, yPos);

  yPos += 5;

  doc.setFillColor(248, 250, 252);
  doc.rect(10, yPos, 190, 16, 'F');
  doc.setDrawColor(gridColor[0], gridColor[1], gridColor[2]);
  doc.rect(10, yPos, 190, 16, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text(`TOTAL CASING ANOMALIES MAPPED : ${casingScannedCount} SEGMENTS`, 14, yPos + 6);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(`CRITICAL DEFECTS (>65% Trauma) : ${highRiskCount}`, 14, yPos + 11);
  doc.text(`ELEVATED WEAR (30 - 65% Trauma): ${mediumRiskCount}`, 105, yPos + 11);

  // ==========================================
  // PAGE 2: TOP-DOWN CROSS-SECTION SCHEMATICS
  // ==========================================
  doc.addPage();
  drawPageShell(2);

  let p2Y = 15;

  // Page 2 Header Title
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SECTION 4: TOP-DOWN VECTOR INTEGRITY SCHEMATIC (CROSS-SECTION)', 10, p2Y);
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.4);
  doc.line(10, p2Y + 2, 200, p2Y + 2);

  p2Y += 7;

  // Short description of the slice
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text(`Top-down polar coordinates cross-sectional schematic computed at the active scanline elevation: ${currentCrossSectionDepth}m.`, 10, p2Y);
  doc.text(`Radial lines denote azimuth angles (0-360° θ) and distances represent millimeter wear profiles.`, 10, p2Y + 4);

  p2Y += 10;

  // Let's draw the visual schematic diagram!
  // Diagram center coordinates
  const cx = 105;
  const cy = 90;
  const R_cement = 45;
  const R_OD = 32;
  const R_ID = 26; // Nominal wall thickness of 6mm in our PDF scale

  // 1. Draw raw cement / borehole background circle in dotted style
  doc.setDrawColor(168, 85, 247); // Purple accent for cement
  doc.setFillColor(250, 245, 255);
  doc.setLineWidth(0.2);
  doc.circle(cx, cy, R_cement, 'FD');

  // Let's shade a nice grid center lines
  doc.setDrawColor(220, 210, 245);
  doc.setLineWidth(0.15);
  doc.line(cx - R_cement - 5, cy, cx + R_cement + 5, cy);
  doc.line(cx, cy - R_cement - 5, cx, cy + R_cement + 5);

  // Spokes
  const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  angles.forEach(deg => {
    const rad = (deg * Math.PI) / 180;
    const x1 = cx + R_ID * 0.4 * Math.cos(rad);
    const y1 = cy + R_ID * 0.4 * Math.sin(rad);
    const x2 = cx + R_cement * Math.cos(rad);
    const y2 = cy + R_cement * Math.sin(rad);
    doc.line(x1, y1, x2, y2);

    // Label coordinates
    const lx = cx + (R_cement + 5) * Math.cos(rad);
    const ly = cy + (R_cement + 5) * Math.sin(rad);
    doc.setFont('courier', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(147, 51, 234);
    doc.text(`${deg}°`, lx, ly + 1.2, { align: 'center' });
  });

  // Guidelines concentric circles
  doc.setDrawColor(200, 180, 240);
  doc.setLineWidth(0.12);
  doc.circle(cx, cy, R_OD, 'S');
  doc.circle(cx, cy, R_ID, 'S');

  // 2. Draw surviving steel wall and thinned/deformed wear profile
  // Sample 48 points around the circle. Each point has radialLossMm.
  // We sum contributions from casing artifacts near the cross-section depth.
  const stepCount = 48;
  const wallPoints: {xOut: number, yOut: number, xIn: number, yIn: number, loss: number, angle: number}[] = [];

  for (let i = 0; i < stepCount; i++) {
    const deg = (i * 360) / stepCount;
    const rad = (deg * Math.PI) / 180;

    let loss = 0;
    allArtifacts.forEach(art => {
      const dDepth = Math.abs(art.depthM - currentCrossSectionDepth);
      const dDepthWeight = Math.exp(-((dDepth / 85) ** 2));

      const dAngle = Math.abs(art.angleDeg - deg) % 360;
      const shortAng = dAngle > 180 ? 360 - dAngle : dAngle;
      const dAngleWeight = Math.exp(-((shortAng / 28) ** 2));

      const weight = dDepthWeight * dAngleWeight;
      const contribution = (art.radialLossMm / 15) * 5.8; // Map nominal max loss
      loss += contribution * weight;
    });

    const finalLoss = Math.min(5.7, Math.max(0, loss));
    const currentR_ID = R_ID + finalLoss; // thinned inward

    // Polar to Cartesian
    const xOut = cx + R_OD * Math.cos(rad);
    const yOut = cy + R_OD * Math.sin(rad);
    const xIn = cx + currentR_ID * Math.cos(rad);
    const yIn = cy + currentR_ID * Math.sin(rad);

    wallPoints.push({ xOut, yOut, xIn, yIn, loss: finalLoss, angle: deg });
  }

  // Draw nominal steel background (un-eroded) to show what's lost in lighter yellow/amber
  doc.setDrawColor(245, 158, 11);
  doc.setFillColor(254, 243, 199);
  doc.setLineWidth(0.4);
  
  // Custom draw wear zone by drawing nominal wall then putting surviving wall on top
  doc.circle(cx, cy, R_OD, 'F');
  doc.setFillColor(250, 245, 255); // hole fill
  doc.circle(cx, cy, R_ID, 'F');

  // Draw surviving steel wall in solid primary color shade
  // We write an outline of surviving steel wall using polygons or multiple lines (since jsPDF custom polygons can be verbose)
  doc.setFillColor(primaryColor[0] + 50, primaryColor[1] + 50, primaryColor[2] + 50);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.4);

  // We draw the segments of surviving wall
  for (let i = 0; i < stepCount; i++) {
    const pt1 = wallPoints[i];
    const pt2 = wallPoints[(i + 1) % stepCount];

    // Create quadrilateral of the surviving segment
    doc.setFillColor(primaryColor[0] + 160, primaryColor[1] + 40, primaryColor[2] + 40);
    doc.triangle(pt1.xOut, pt1.yOut, pt2.xOut, pt2.yOut, pt1.xIn, pt1.yIn, 'FD');
    doc.triangle(pt1.xIn, pt1.yIn, pt2.xIn, pt2.yIn, pt2.xOut, pt2.yOut, 'FD');
  }

  // Center core fluid volume (hole inside ID)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.2);
  
  // Plot inner boundary line sequence
  for (let i = 0; i < stepCount; i++) {
    const pt1 = wallPoints[i];
    const pt2 = wallPoints[(i + 1) % stepCount];
    doc.line(pt1.xIn, pt1.yIn, pt2.xIn, pt2.yIn);
  }

  // Label Central Borehole
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text('CENTRAL FLUID CHANNEL', cx, cy - 2, { align: 'center' });
  doc.setFont('courier', 'normal');
  doc.setFontSize(5);
  doc.text('BOREHOLE DIAMETER: 220.0mm', cx, cy + 2, { align: 'center' });

  // 3. Draw active leak arrays and labels pointing to defects
  allArtifacts.forEach((art) => {
    const dDepth = Math.abs(art.depthM - currentCrossSectionDepth);
    if (dDepth < 80) {
      const rad = (art.angleDeg * Math.PI) / 180;
      
      const px = cx + (R_ID + 2) * Math.cos(rad);
      const py = cy + (R_ID + 2) * Math.sin(rad);
      const ex = cx + (R_cement + 18) * Math.cos(rad);
      const ey = cy + (R_cement + 18) * Math.sin(rad);

      // Draw red warning leak ray vector line
      doc.setDrawColor(244, 63, 94); // Roses/red leak lines
      doc.setLineWidth(0.5);
      doc.line(px, py, ex, ey);
      doc.circle(px, py, 0.8, 'F');

      // Add a cool warning target box at the outer end of ray
      doc.setFont('courier', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(225, 29, 72);
      
      let alignSide: 'left' | 'right' | 'center' = 'center';
      const cosVal = Math.cos(rad);
      if (cosVal > 0.3) alignSide = 'left';
      else if (cosVal < -0.3) alignSide = 'right';

      const labelText = `[LEAK THREAT θ=${art.angleDeg}° | ${art.traumaLevel}%] (${art.radialLossMm}mm loss)`;
      doc.text(labelText, ex + (cosVal > 0 ? 2 : -2), ey + 1, { align: alignSide });
    }
  });

  // Legend Box on the diagram margin
  const ly = 50;
  doc.setFillColor(255, 255, 255, 0.85);
  doc.setDrawColor(gridColor[0], gridColor[1], gridColor[2]);
  doc.rect(10, ly, 45, 22, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text('VECTOR SCHEMATIC KEY:', 12, ly + 4);

  doc.setFont('courier', 'normal');
  // Nominal Wall Block
  doc.setFillColor(254, 243, 199);
  doc.rect(12, ly + 6, 6, 2, 'F');
  doc.text('Metal Wear Zone', 20, ly + 8);

  // Surviving Wall Block
  doc.setFillColor(primaryColor[0] + 160, primaryColor[1] + 40, primaryColor[2] + 40);
  doc.rect(12, ly + 10, 6, 2, 'F');
  doc.text('Surviving Casing Wall', 20, ly + 12);

  // Cement Boundary
  doc.setFillColor(250, 245, 255);
  doc.setDrawColor(168, 85, 247);
  doc.rect(12, ly + 14, 6, 2, 'FD');
  doc.text('Annular Cement Seal', 20, ly + 16);

  // Active Leak Line
  doc.setDrawColor(244, 63, 94);
  doc.setLineWidth(0.4);
  doc.line(12, ly + 19, 18, ly + 19);
  doc.text('Active Fluid Flow Leak', 20, ly + 20.2);

  p2Y = 145;

  // Casing Defect Registry Table Header
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(10, p2Y, 3, 5, 'F');
  
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SECTION 5: GEOMETRIC CASING WEAR INVENTORY', 15, p2Y + 4);

  p2Y += 9;

  // Draw anomalies registry table
  const artifactCols = [25, 24, 26, 25, 20, 70];
  const artifactHeaders = ['DEFECT ID', 'DEPTH (m)', 'AZIMUTH θ', 'WEAR LOSS', 'RATING', 'FORENSIC INVESTIGATION SUMMARY'];

  // Table header background
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(10, p2Y, 190, 6, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  let tempX = 10;
  artifactHeaders.forEach((h, idx) => {
    doc.text(h, tempX + 2, p2Y + 4.5);
    tempX += artifactCols[idx];
  });

  p2Y += 6;

  // Ensure we sort defects by severity/trauma first to list critical ones at top
  const sortedArtifacts = [...allArtifacts].sort((a, b) => b.traumaLevel - a.traumaLevel);
  // Take only top 12 to fit on this page comfortably
  const listToDraw = sortedArtifacts.slice(0, 15);

  listToDraw.forEach((art, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(10, p2Y, 190, 8, 'F');

    doc.setDrawColor(gridColor[0], gridColor[1], gridColor[2]);
    doc.setLineWidth(0.25);
    doc.line(10, p2Y + 8, 200, p2Y + 8);

    doc.setFont('courier', 'normal');
    if (art.traumaLevel > 65) doc.setFont('courier', 'bold');

    doc.setFontSize(6.5);
    doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);

    tempX = 10;
    const cells = [
      art.id.toUpperCase(),
      `${art.depthM}m`,
      `${art.angleDeg}°`,
      `${art.radialLossMm} mm`,
      `${art.traumaLevel}%`,
      art.description.length > 51 ? art.description.slice(0, 48) + '...' : art.description
    ];

    cells.forEach((cell, cIdx) => {
      if (cIdx === 4) {
        // Highlight high rating
        if (art.traumaLevel > 65) doc.setTextColor(185, 28, 28);
        else if (art.traumaLevel > 30) doc.setTextColor(217, 119, 6);
        else doc.setTextColor(16, 185, 129);
      } else {
        doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
      }
      doc.text(cell, tempX + 2, p2Y + 5.2);
      tempX += artifactCols[cIdx];
    });

    p2Y += 8;
  });

  // Highlight bottom disclaimer
  if (sortedArtifacts.length > listToDraw.length) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`* Omitted ${sortedArtifacts.length - listToDraw.length} lighter stress/structural nodes from visual report to maintain pagination boundaries.`, 10, p2Y + 4);
  }

  // ==========================================
  // PAGE 3: CERTIFIED FORENSIC RECORD
  // ==========================================
  doc.addPage();
  drawPageShell(3);

  let p3Y = 15;

  // Page 3 Headers
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SECTION 6: REAL-TIME ANOMALIES & FLUID RUNNING ALERTS', 10, p3Y);
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.4);
  doc.line(10, p3Y + 2, 200, p3Y + 2);

  p3Y += 7;

  // Section Explanation
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text('Listing automated alerts identified by the Real-Time Leak Scanning Worker during active telemetry buffer scanning.', 10, p3Y);

  p3Y += 6;

  // Draw Forensic Events table
  const eventCols = [25, 20, 22, 123];
  const eventHeaders = ['ALERT DATE', 'SEVERITY', 'ELEVATION', 'SCANNER SIGNAL EVALUATION MESSAGE'];

  // Table header background
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(10, p3Y, 190, 6, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  let colX = 10;
  eventHeaders.forEach((h, idx) => {
    doc.text(h, colX + 2, p3Y + 4.5);
    colX += eventCols[idx];
  });

  p3Y += 6;

  // Gather active events
  const eventsToDraw = forensicEvents.slice(0, 12);

  if (eventsToDraw.length === 0) {
    // Elegant Placeholder
    doc.setFillColor(255, 255, 255);
    doc.rect(10, p3Y, 190, 24, 'F');
    doc.setDrawColor(gridColor[0], gridColor[1], gridColor[2]);
    doc.rect(10, p3Y, 190, 24, 'S');

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text('NOMINAL REPORT VERDICT: NO ACTIVE LEAKS DETECTED', 105, p3Y + 12, { align: 'center' });
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Hydro-stress vectors, thermal gradients, and mud flow buffers verify absolute casing containment.', 105, p3Y + 17, { align: 'center' });

    p3Y += 30;
  } else {
    eventsToDraw.forEach((evt, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(10, p3Y, 190, 8, 'F');

      doc.setDrawColor(gridColor[0], gridColor[1], gridColor[2]);
      doc.setLineWidth(0.25);
      doc.line(10, p3Y + 8, 200, p3Y + 8);

      doc.setFont('courier', 'normal');
      if (evt.severity === 'critical') doc.setFont('courier', 'bold');

      doc.setFontSize(6.5);
      doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);

      colX = 10;
      const cells = [
        evt.timestamp,
        evt.severity.toUpperCase(),
        evt.depthM ? `${evt.depthM}m` : 'N/A',
        evt.message.length > 92 ? evt.message.slice(0, 89) + '...' : evt.message
      ];

      cells.forEach((cell, cIdx) => {
        if (cIdx === 1) {
          if (evt.severity === 'critical') doc.setTextColor(185, 28, 28);
          else doc.setTextColor(217, 119, 6);
        } else {
          doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
        }
        doc.text(cell, colX + 2, p3Y + 5.2);
        colX += eventCols[cIdx];
      });

      p3Y += 8;
    });

    p3Y += 4;
  }

  p3Y += 4;

  // Historic Black Box Flight logs
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SECTION 7: HISTORIC COGNITIVE FORENSIC FLIGHT LOGS', 10, p3Y);
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.4);
  doc.line(10, p3Y + 2, 200, p3Y + 2);

  p3Y += 7;

  // Active terminal logs table
  const logCols = [25, 21, 144];
  const logHeaders = ['TIME_UTC', 'LOG_TYPE', 'DIAGNOSTIC LOG EXCERPT DETAILS'];

  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(10, p3Y, 190, 6, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  let colLogX = 10;
  logHeaders.forEach((h, idx) => {
    doc.text(h, colLogX + 2, p3Y + 4.5);
    colLogX += logCols[idx];
  });

  p3Y += 6;

  // Print top 15 logs from terminal history
  const activeLogs = forensicLogs.slice(0, 16);
  activeLogs.forEach((l, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 252, idx % 2 === 0 ? 255 : 254);
    doc.rect(10, p3Y, 190, 6.5, 'F');

    doc.setDrawColor(gridColor[0], gridColor[1], gridColor[2]);
    doc.setLineWidth(0.25);
    doc.line(10, p3Y + 6.5, 200, p3Y + 6.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.3);

    colLogX = 10;
    const cells = [
      l.timestamp,
      l.type.toUpperCase(),
      l.message.length > 108 ? l.message.slice(0, 105) + '...' : l.message
    ];

    cells.forEach((cell, cIdx) => {
      if (cIdx === 1) {
        if (l.type === 'error') doc.setTextColor(185, 28, 28);
        else if (l.type === 'warning') doc.setTextColor(217, 119, 6);
        else if (l.type === 'success') doc.setTextColor(16, 185, 129);
        else doc.setTextColor(100, 116, 139);
      } else {
        doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
      }
      doc.text(cell, colLogX + 2, p3Y + 4.4);
      colLogX += logCols[cIdx];
    });

    p3Y += 6.5;
  });

  p3Y += 10;

  // Signature validation block on bottom of Page 3
  doc.setLineWidth(0.25);
  doc.setDrawColor(203, 213, 225);
  doc.line(10, p3Y, 80, p3Y);
  doc.line(130, p3Y, 200, p3Y);

  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CERTIFYING OPERATOR SIGNATURE', 10, p3Y + 4);
  doc.text('WELL-TEGRA QA SYSTEM SEAL', 130, p3Y + 4);

  doc.setFont('courier', 'normal');
  doc.setFontSize(6);
  doc.text(`HASH: SH-892419_DIAL_ALIGN_SEAL`, 130, p3Y + 8);
  doc.text(`INTERLOCKED ID: ${operatorEmail.toUpperCase()}`, 10, p3Y + 8);

  // Save the constructed document
  const fileName = `WellTegra_ForensicReport_${terminalTheme}_${Math.floor(Date.now() / 1000)}.pdf`;
  doc.save(fileName);
}
