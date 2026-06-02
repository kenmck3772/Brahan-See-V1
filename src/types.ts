export interface Bookmark {
  id: string;
  name: string;
  path: string;
  createdAt: string;
}

export interface DirectoryNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  size?: string;
  traumaRating?: number; // 0 to 100 representing node distress
  anomalies?: string[];
  children?: DirectoryNode[];
  lastModified: string;
}

export interface ForensicLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface IngestedArtifact {
  id: string;
  name: string;
  size: string;
  type: string;
  hash: string;
  status: 'pending' | 'analyzing' | 'completed' | 'corrupted';
  anomaliesCount: number;
  detectedThreats: string[];
  ingestTime: string;
}
