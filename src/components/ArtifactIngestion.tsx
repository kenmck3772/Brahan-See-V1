import React, { useState, useRef } from 'react';
import { IngestedArtifact } from '../types';
import { Upload, FileCode, Cpu } from 'lucide-react';

interface ArtifactIngestionProps {
  onArtifactIngested: (art: IngestedArtifact) => void;
  addLog: (msg: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const ArtifactIngestion: React.FC<ArtifactIngestionProps> = ({
  onArtifactIngested,
  addLog
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateMockMD5 = () => {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 32; i++) {
      hash += chars[Math.floor(Math.random() * 16)];
    }
    return hash;
  };

  const processFile = (file: File) => {
    setIngesting(true);
    setProgress(0);
    addLog(`Forensic Artifact Ingestion initiated: [${file.name}] (${(file.size / 1024).toFixed(1)} KB)`, 'info');

    let currentProg = 0;
    const interval = setInterval(() => {
      currentProg += 20;
      setProgress(currentProg);
      addLog(`Synthesizing Data Fields... [${currentProg}% completed]`, 'info');

      if (currentProg >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIngesting(false);
          setProgress(0);

          // Generate result
          const hasAnomalies = Math.random() > 0.4;
          const detectedThreats = hasAnomalies 
            ? ['Unscheduled admin bypass', 'MD5 signature mismatch on auth gate']
            : [];
          
          const newArtifact: IngestedArtifact = {
            id: 'art-' + Math.floor(Math.random() * 10000),
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: file.type || 'application/octet-stream',
            hash: generateMockMD5(),
            status: hasAnomalies ? 'corrupted' : 'completed',
            anomaliesCount: detectedThreats.length,
            detectedThreats,
            ingestTime: new Date().toISOString().slice(11, 19) + ' UTC'
          };

          onArtifactIngested(newArtifact);

          if (hasAnomalies) {
            addLog(`Logic Fault / Integrity Compromised in [${file.name}]. ${detectedThreats.length} anomalies flagged!`, 'error');
          } else {
            addLog(`Forensic Artifact [${file.name}] ingested successfully. Nominally aligned.`, 'success');
          }
        }, 300);
      }
    }, 500);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-[#020617]/90 border border-emerald-500/20 rounded-md p-4 flex flex-col gap-3 scanline-glow relative select-text" id="artifact-ingestion-system">
      <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2 flex-shrink-0">
        <h3 className="font-mono text-emerald-400 text-sm font-bold flex items-center gap-2 glow-text-emerald">
          <Upload className="w-4 h-4 text-emerald-400 animate-bounce" />
          FORENSIC ARTIFACT INGESTION
        </h3>
        <span className="font-mono text-[10px] text-emerald-500/60 uppercase">
          Binary File Audit
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 min-h-[120px] ${
          dragActive
            ? 'border-emerald-400 bg-emerald-500/10'
            : 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
        }`}
      >
        {ingesting ? (
          <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
            <Cpu className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="font-mono text-center text-xs text-emerald-400 font-semibold animate-pulse">
              Synthesizing Data Fields...
            </span>
            <div className="w-full bg-black/40 border border-emerald-500/10 h-2 rounded overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-white/50">{progress}%</span>
          </div>
        ) : (
          <>
            <FileCode className="w-8 h-8 text-emerald-500/50 animate-pulse" />
            <span className="font-mono text-[11px] text-emerald-400 text-center font-medium leading-relaxed">
              Drag & Drop file or <span className="underline decoration-emerald-500/40">Select</span>
            </span>
            <span className="font-mono text-[9px] text-emerald-500/40 text-center uppercase">
              Supports .db, .bin, .log, .conf, .txt
            </span>
          </>
        )}
      </div>
    </div>
  );
};
