
export interface LogEntry {
  depth: number;
  gr: number;
}

export interface TraumaData {
  fingerId: number;
  depth: number;
  deviation: number;
  corrosion: number;
  temperature: number;
  wallLoss: number;
  waterLeakage: number;
  stress: number;
  ici: number;
  metalLoss: number;
  ovality: number;
  uvIndex: number;
}

export interface TraumaEvent {
  id: string;
  timestamp: string;
  layer: string;
  depth: number;
  value: number;
  unit: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
}

export interface PressureData {
  timestamp: string;
  pressure: number;
  isHistorical?: boolean;
}

export interface BarrierEvent {
  id: string;
  date: string;
  type: 'TOPUP' | 'BLEED' | 'TEST' | 'SQUEEZE' | 'BREACH';
  annulus: 'A' | 'B' | 'C';
  summary: string;
  volume?: number;
  unit?: string;
  severity: 'CRITICAL' | 'MAINTENANCE' | 'INFO';
}

export interface AnalysisResult {
  id: string;
  title: string;
  status: 'VERIFIED' | 'PENDING' | 'CRITICAL';
  timestamp: string;
  summary: string;
}

export interface MissionTarget {
  REGION: string;
  ASSET: string;
  BLOCKS: string[];
  WELLS?: string[];
  ANOMALY_TYPE: string;
  DATA_PORTAL: string;
  PRIORITY: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  UWI?: string;
  DIRECTIVE?: string;
  SCENARIO?: 'A' | 'B' | 'C';
}

export interface MissionConfig {
  MISSION_ID: string;
  STATUS: string;
  TIMESTAMP: string;
  OPERATOR: string;
  TARGETS: MissionTarget[];
}

export interface NDRProject {
  projectId: string;
  name: string;
  quadrant: string;
  status: string;
  releaseDate: string;
  type: string;
  wellboreType: string;
  sizeGb: number;
  sha512: string;
  hasDatumShiftIssues?: boolean;
  hasIntegrityRecords?: boolean;
}

export interface TubingItem {
  id: number;
  type: string;
  od_in: number;
  id_in: number;
  weight_lbft: number;
  grade: string;
  length_m: number;
  cumulative_m: number;
  status: 'VALID' | 'DISCREPANT';
}

export interface WellReport {
  reportId: string;
  date: string;
  opType: string;
  summary: string;
  eodDepth_m: number;
}

export enum ActiveModule {
  MISSION_CONTROL = 'MISSION_CONTROL',
  GHOST_SYNC = 'GHOST_SYNC',
  TRAUMA_NODE = 'TRAUMA_NODE',
  PULSE_ANALYZER = 'PULSE_ANALYZER',
  REPORTS_SCANNER = 'REPORTS_SCANNER',
  VAULT = 'VAULT',
  LEGACY_RECOVERY = 'LEGACY_RECOVERY',
  NORWAY_SOVEREIGN = 'NORWAY_SOVEREIGN',
  CHANONRY_PROTOCOL = 'CHANONRY_PROTOCOL',
  PROTOCOL_MANUAL = 'PROTOCOL_MANUAL',
  NDR_MODERNIZATION = 'NDR_MODERNIZATION',
  CERBERUS_SIM = 'CERBERUS_SIM',
  WETE_SCANNER = 'WETE_SCANNER',
  NDR_CRAWLER = 'NDR_CRAWLER' // New module
}

export enum TraumaLayer {
  DEVIATION = 'DEVIATION',
  CORROSION = 'CORROSION',
  TEMPERATURE = 'TEMPERATURE',
  WALL_LOSS = 'WALL_LOSS',
  WATER_LEAKAGE = 'WATER_LEAKAGE',
  STRESS = 'STRESS',
  ICI = 'ICI',
  METAL_LOSS = 'METAL_LOSS',
  OVALITY = 'OVALITY',
  UV_INDEX = 'UV_INDEX'
}

export interface NDRForensicResult {
  uwi: string;
  datumAudit: {
    legacyDepth: number;
    modernDepth: number;
    shift: number;
  };
  rechargeClock: {
    pressureData: PressureData[];
    modelFit: number;
  };
  barrierForensic: {
    cblSawtooth: boolean;
    integrityStatus: string;
  };
  sha512: string;
}

export interface ForensicWell {
  id: string;
  reportedLat: number;
  reportedLon: number;
  actualLat: number;
  actualLon: number;
  reportedProd: number;
  auditedProd: number;
  status: 'conflict' | 'nominal' | 'critical';
  field: string;
  deviationAudit: string;
  lastAudit: string;
  forensicNote: string;
}
