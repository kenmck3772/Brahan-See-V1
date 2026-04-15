
import { LogEntry, TraumaData, PressureData, NDRProject, TubingItem, WellReport, BarrierEvent, MissionConfig, ForensicWell } from './types';

// Global Mission Hub Data (WETE Forensic Modernization)
export const GHOST_HUNTER_MISSION: MissionConfig = {
  "MISSION_ID": "WETE_FORENSIC_MODERNIZATION",
  "STATUS": "ACTIVE",
  "TIMESTAMP": "2026-01-23T09:00:00Z",
  "OPERATOR": "BRAHAN_CORE_v.92",
  "TARGETS": [
    {
      "REGION": "UK_NORTH_SEA",
      "ASSET": "THISTLE_A45",
      "BLOCKS": ["211/18"],
      "UWI": "211/18-A45",
      "ANOMALY_TYPE": "NESTED_COMPLETION_PHANTOM",
      "DATA_PORTAL": "NSTA_NDR",
      "PRIORITY": "CRITICAL",
      "DIRECTIVE": "Verify undocumented adapter spool and inverse completion stack.",
      "SCENARIO": "A"
    },
    {
      "REGION": "UK_NORTH_SEA",
      "ASSET": "THISTLE_A7",
      "BLOCKS": ["211/18"],
      "UWI": "211/18-A7",
      "ANOMALY_TYPE": "DATA_DEADZONE_AUDIT",
      "DATA_PORTAL": "NSTA_NDR",
      "PRIORITY": "CRITICAL",
      "DIRECTIVE": "Analyze 48-hour deadzone during fishing operation; identify hidden C-lock recovery.",
      "SCENARIO": "B"
    },
    {
      "REGION": "UK_NORTH_SEA",
      "ASSET": "NINIAN_CENTRAL",
      "BLOCKS": ["03/03"],
      "UWI": "03/03-C12",
      "ANOMALY_TYPE": "STRESS_SHADOW_POROSITY",
      "DATA_PORTAL": "NSTA_NDR",
      "PRIORITY": "CRITICAL",
      "DIRECTIVE": "Analyze fault-block stress interactions and undocumented completion nesting."
    },
    {
      "REGION": "UK_NORTH_SEA",
      "ASSET": "BRENT_CHARLIE",
      "BLOCKS": ["211/26"],
      "UWI": "211/26-C3",
      "ANOMALY_TYPE": "MATRIX_PRESSURE_RECHARGE",
      "DATA_PORTAL": "NSTA_NDR",
      "PRIORITY": "CRITICAL",
      "DIRECTIVE": "Apply Warren and Root model to shut-in trends to verify true reservoir re-pressurization (Recharge Clock)."
    }
  ]
};

// Mock Log Data for Ghost-Sync
export const MOCK_BASE_LOG: LogEntry[] = Array.from({ length: 100 }, (_, i) => ({
  depth: 1200 + i * 2,
  gr: 40 + Math.sin(i * 0.2) * 20 + Math.random() * 10
}));

export const MOCK_GHOST_LOG: LogEntry[] = MOCK_BASE_LOG.map(entry => ({
  depth: entry.depth + 14.5, // 14.5m offset
  gr: entry.gr + (Math.random() - 0.5) * 5
}));

// Mock Historical Barrier Records
export const MOCK_HISTORICAL_BARRIER_LOGS: BarrierEvent[] = [
  { id: 'BE-2012-01', date: '2012-04-12', type: 'SQUEEZE', annulus: 'A', summary: 'Scale squeeze operation. Injected 50bbl inhibitor.', severity: 'INFO' },
  { id: 'BE-2015-04', date: '2015-08-20', type: 'TEST', annulus: 'A', summary: 'Annual barrier test. 5000 PSI / 30 mins. PASSED.', severity: 'MAINTENANCE' },
  { id: 'BE-2018-09', date: '2018-11-02', type: 'TOPUP', annulus: 'B', summary: 'B-Annulus low pressure. Topped up with 15bbl brine.', severity: 'MAINTENANCE', volume: 15, unit: 'bbl' },
  { id: 'BE-2021-02', date: '2021-03-15', type: 'BREACH', annulus: 'A', summary: 'First sustained pressure detected. Cross-flow suspect.', severity: 'CRITICAL' },
  { id: 'BE-2023-11', date: '2023-12-05', type: 'TOPUP', annulus: 'A', summary: 'Aggressive top-up needed. Delta P rising.', severity: 'CRITICAL', volume: 45, unit: 'bbl' }
];

export const MOCK_SCAVENGED_PRESSURE_TESTS: PressureData[] = [
  { timestamp: '00:00', pressure: 150, isHistorical: true },
  { timestamp: '04:00', pressure: 250, isHistorical: true },
  { timestamp: '08:00', pressure: 350, isHistorical: true },
  { timestamp: '12:00', pressure: 450, isHistorical: true },
  { timestamp: '12:01', pressure: 150, isHistorical: true },
  { timestamp: '16:00', pressure: 250, isHistorical: true },
  { timestamp: '20:00', pressure: 350, isHistorical: true },
  { timestamp: '23:59', pressure: 450, isHistorical: true },
];

// Mock Tubing Tally
export const MOCK_TUBING_TALLY: TubingItem[] = [
  { id: 1, type: 'Tubing', od_in: 3.5, id_in: 2.992, weight_lbft: 9.2, grade: 'L80', length_m: 12.05, cumulative_m: 12.05, status: 'VALID' },
  { id: 2, type: 'Tubing', od_in: 3.5, id_in: 2.992, weight_lbft: 9.2, grade: 'L80', length_m: 12.10, cumulative_m: 24.15, status: 'VALID' },
  { id: 3, type: 'SSSV (Safety Valve)', od_in: 4.5, id_in: 2.8, weight_lbft: 12.5, grade: 'X-95', length_m: 2.45, cumulative_m: 26.60, status: 'VALID' },
  { id: 4, type: 'Tubing', od_in: 3.5, id_in: 2.992, weight_lbft: 9.2, grade: 'L80', length_m: 12.08, cumulative_m: 38.68, status: 'DISCREPANT' },
  { id: 5, type: 'Crossover', od_in: 3.5, id_in: 2.7, weight_lbft: 10.1, grade: 'L80', length_m: 0.85, cumulative_m: 39.53, status: 'VALID' },
  { id: 6, type: 'Tubing', od_in: 3.5, id_in: 2.992, weight_lbft: 9.2, grade: 'L80', length_m: 12.12, cumulative_m: 51.65, status: 'VALID' },
];

export const MOCK_INTERVENTION_REPORTS: WellReport[] = [
  { reportId: 'DDR-2024-001', date: '2024-05-10', opType: 'INTERVENTION', summary: 'Pulled completion to 1200m. Identified heavy scale build-up. Commenced tally for re-run.', eodDepth_m: 1200.0 },
  { reportId: 'DDR-2024-002', date: '2024-05-11', opType: 'COMPLETION', summary: 'Running in hole with new L80 completion string. Tally mismatch noted at joint #4.', eodDepth_m: 1245.5 },
];

// Mock NDR Projects
export const MOCK_NDR_PROJECTS: NDRProject[] = [
  {
    projectId: 'THISTLE1978well0001',
    name: 'Thistle A7 Legacy',
    quadrant: '211',
    status: 'RELEASED',
    releaseDate: '1985-06-01',
    type: 'well',
    wellboreType: 'VERTICAL',
    sizeGb: 1.2,
    sha512: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    hasDatumShiftIssues: true,
    hasIntegrityRecords: true
  },
  {
    projectId: 'NINIAN_N42_FORENSIC',
    name: 'Ninian Central N-42 Audit',
    quadrant: '3/3',
    status: 'RELEASED',
    releaseDate: '2026-01-22',
    type: 'well',
    wellboreType: 'DIRECTIONAL',
    sizeGb: 0.8,
    sha512: 'f8d2e1a9b...ASPHALTENE_UNSTABLE',
    hasDatumShiftIssues: false,
    hasIntegrityRecords: true
  }
];

// Mock Trauma Data for 3D Node
export const MOCK_TRAUMA_DATA: TraumaData[] = [];
for (let d = 1240; d < 1250; d += 0.5) {
  for (let f = 1; f <= 40; f++) {
    let deviation = Math.random() * 0.5;
    let corrosion = Math.random() * 15; 
    let temperature = 60 + (d - 1240) * 2 + Math.random() * 5; 
    let wallLoss = Math.random() * 5; 
    let waterLeakage = Math.random() * 5; 
    let stress = Math.random() * 10; 
    let ici = Math.random() * 20; 
    let metalLoss = Math.random() * 8;
    let ovality = Math.random() * 2;
    let uvIndex = 1 + Math.random() * 3;

    if (d === 1245.5 && f > 10 && f < 15) {
      deviation = 4.8;
      corrosion = 72; 
      temperature = 88; 
      wallLoss = 22; 
      waterLeakage = 92; 
      stress = 88; 
      ici = 95; 
      metalLoss = 28;
      ovality = 5.5;
      uvIndex = 12.4;
    }
    
    MOCK_TRAUMA_DATA.push({ 
      fingerId: f, depth: d, deviation, corrosion, temperature, wallLoss, 
      waterLeakage, stress, ici, metalLoss, ovality, uvIndex 
    });
  }
}

// Mock Pressure Data for Sawtooth Pulse
export const MOCK_PRESSURE_DATA: PressureData[] = [
  { timestamp: '00:00', pressure: 250 },
  { timestamp: '04:00', pressure: 450 },
  { timestamp: '08:00', pressure: 650 },
  { timestamp: '12:00', pressure: 850 },
  { timestamp: '12:01', pressure: 250 },
  { timestamp: '16:00', pressure: 450 },
  { timestamp: '20:00', pressure: 650 },
  { timestamp: '23:59', pressure: 850 },
];

export const MOCK_WELLS: ForensicWell[] = [
  { 
    id: 'STELLA-001', 
    reportedLat: 56.500, reportedLon: 1.200, 
    actualLat: 56.505, actualLon: 1.208, 
    reportedProd: 10000, auditedProd: 8500, 
    status: 'conflict',
    field: 'Stella',
    deviationAudit: '5.2° Azimuth Drift @ 1200m',
    lastAudit: '2024-02-15',
    forensicNote: 'Mass-balance discrepancy suggests unmetered flow or sensor drift in A-Annulus.'
  },
  { 
    id: 'GANNET-A', 
    reportedLat: 57.100, reportedLon: 0.800, 
    actualLat: 57.101, actualLon: 0.802, 
    reportedProd: 15000, auditedProd: 14800, 
    status: 'nominal',
    field: 'Gannet',
    deviationAudit: '0.1° Azimuth Drift (Nominal)',
    lastAudit: '2024-03-01',
    forensicNote: 'Data alignment within 2% threshold. No significant forensic discordance.'
  },
  { 
    id: 'VIKING-X', 
    reportedLat: 53.500, reportedLon: 2.100, 
    actualLat: 53.515, actualLon: 2.125, 
    reportedProd: 5000, auditedProd: 3200, 
    status: 'critical',
    field: 'Viking',
    deviationAudit: '12.8° Vertical Deviation @ 850m',
    lastAudit: '2024-01-20',
    forensicNote: 'Critical structural autopsy required. Casing integrity compromised by tectonic shift.'
  },
];
