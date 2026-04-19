
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Database, Search, ShieldCheck, Loader2, 
  AlertCircle, X, Factory, Microscope, 
  FileText, ShieldAlert, Download, Clock,
  Hash, Waves, GitBranch, Cpu, MessageSquareQuote,
  Upload
} from 'lucide-react';
import { authenticateNDR, searchNDRMetadata, harvestNDRProject } from '../services/ndrService';
import { getForensicInsight } from '../services/geminiService';
import { NDRProject } from '../types';

const NDRCrawler: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedWellboreType, setSelectedWellboreType] = useState('ALL');
  const [showGhostOnly, setShowGhostOnly] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [projects, setProjects] = useState<NDRProject[]>([]);
  const [harvestingProjects, setHarvestingProjects] = useState<Record<string, number>>({}); // projectId -> progress %
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Authenticate and fetch initial projects
  useEffect(() => {
    const init = async () => {
      try {
        await authenticateNDR();
        setIsAuthenticated(true);
        fetchProjects();
      } catch (error) {
        console.error("NDR Authentication failed:", error);
        setIsAuthenticated(false);
      }
    };
    init();
  }, []);

  // Fetch projects based on debounced search and filters
  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingSearch(true);
    setAiInsight(null); // Clear old insight
    try {
      const fetchedProjects = await searchNDRMetadata(
        debouncedSearchTerm,
        selectedStatus,
        selectedWellboreType,
        'ALL', // Assuming projectType is always 'ALL' for this crawler
        showGhostOnly
      );
      setProjects(fetchedProjects);
      
      // Trigger AI Insight if we have projects
      if (fetchedProjects.length > 0) {
        generateInsight(fetchedProjects);
      }
    } catch (error) {
      console.error("NDR Search failed:", error);
      setProjects([]);
    } finally {
      setLoadingSearch(false);
    }
  }, [isAuthenticated, debouncedSearchTerm, selectedStatus, selectedWellboreType, showGhostOnly]);

  const generateInsight = async (projectList: NDRProject[]) => {
    setLoadingInsight(true);
    try {
      const totalCount = projectList.length;
      const shiftIssuesCount = projectList.filter(p => p.hasDatumShiftIssues).length;
      const wellboreSummary = projectList.reduce((acc: Record<string, number>, p) => {
        acc[p.wellboreType] = (acc[p.wellboreType] || 0) + 1;
        return acc;
      }, {});

      const summary = `Total Projects: ${totalCount}, Datum Shift Issues: ${shiftIssuesCount}, Wellbore Distribution: ${JSON.stringify(wellboreSummary)}`;
      const insight = await getForensicInsight('NDR_CRAWLER', summary);
      setAiInsight(insight || "FORENSIC_SIGNAL_INTERRUPTED: NULL_RESPONSE.");
    } catch (error) {
      console.error("Failed to generate AI insight:", error);
      setAiInsight("FORENSIC_SIGNAL_INTERRUPTED: UNABLE_TO_SYNTHESIZE_DATA_FIELD.");
    } finally {
      setLoadingInsight(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'las' && extension !== 'csv') {
      alert("UNAUTHORIZED_DATA_FORMAT: System only accepts .LAS or .CSV artifacts.");
      return;
    }

    setIsUploading(true);
    // Simulate forensic ingestion delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newProject: NDRProject = {
      projectId: `INFUSION_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      name: file.name.replace(/\.[^/.]+$/, "").toUpperCase(),
      quadrant: `${Math.floor(Math.random() * 200)}/${Math.floor(Math.random() * 30)}`,
      status: "RELEASED",
      releaseDate: new Date().toISOString().split('T')[0],
      type: extension === 'las' ? "WIRELINE_LOG" : "WELL_METADATA",
      wellboreType: Math.random() > 0.5 ? "VERTICAL" : "DIRECTIONAL",
      sizeGb: parseFloat((file.size / (1024 * 1024 * 1024)).toFixed(4)) || 0.001,
      sha512: "LOCAL_INJECTION_" + Math.random().toString(16).slice(2, 10).toUpperCase(),
      hasDatumShiftIssues: Math.random() > 0.8,
      hasIntegrityRecords: true
    };

    setProjects(prev => [newProject, ...prev]);
    setIsUploading(false);
    
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Direct call to simulate the upload process logic
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'las' && extension !== 'csv') {
      alert("UNAUTHORIZED_DATA_FORMAT: System only accepts .LAS or .CSV artifacts.");
      return;
    }

    setIsUploading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newProject: NDRProject = {
      projectId: `INFUSION_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      name: file.name.replace(/\.[^/.]+$/, "").toUpperCase(),
      quadrant: `${Math.floor(Math.random() * 200)}/${Math.floor(Math.random() * 30)}`,
      status: "RELEASED",
      releaseDate: new Date().toISOString().split('T')[0],
      type: extension === 'las' ? "WIRELINE_LOG" : "WELL_METADATA",
      wellboreType: Math.random() > 0.5 ? "VERTICAL" : "DIRECTIONAL",
      sizeGb: parseFloat((file.size / (1024 * 1024 * 1024)).toFixed(4)) || 0.001,
      sha512: "LOCAL_INJECTION_" + Math.random().toString(16).slice(2, 10).toUpperCase(),
      hasDatumShiftIssues: Math.random() > 0.8,
      hasIntegrityRecords: true
    };

    setProjects(prev => [newProject, ...prev]);
    setIsUploading(false);
  };

  const handleHarvestProject = async (projectId: string) => {
    if (harvestingProjects[projectId] === 100) return; // Already harvested
    
    setHarvestingProjects(prev => ({ ...prev, [projectId]: 0 }));
    
    try {
      const success = await harvestNDRProject(projectId, (progress) => {
        setHarvestingProjects(prev => ({ ...prev, [projectId]: progress }));
      });

      if (!success) {
        console.error(`Failed to harvest project: ${projectId}`);
        setHarvestingProjects(prev => ({ ...prev, [projectId]: -1 })); // Indicate error
      }
    } catch (error) {
      console.error(`Error during harvest for project ${projectId}:`, error);
      setHarvestingProjects(prev => ({ ...prev, [projectId]: -1 })); // Indicate error
    }
  };

  return (
    <div 
      className="flex flex-col h-full space-y-4 p-6 bg-slate-950/40 relative font-terminal overflow-hidden border border-emerald-900/10"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      
      {/* Background HUD Decorations */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Database size={400} className="text-emerald-500 animate-spin-slow" />
      </div>

      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-emerald-500/10 backdrop-blur-md border-4 border-dashed border-emerald-500/50 flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-slate-950/90 p-12 rounded-3xl border border-emerald-400/50 shadow-[0_0_50px_rgba(16,185,129,0.4)] flex flex-col items-center space-y-6">
            <div className="p-6 bg-emerald-500/20 rounded-full animate-pulse">
              <Upload size={64} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-black text-emerald-400 uppercase tracking-tighter mb-2">Artifact_Injection_Ready</h3>
              <p className="text-sm font-bold text-emerald-800 uppercase tracking-widest">Drop .LAS or .CSV files to begin forensic ingestion</p>
            </div>
            <div className="flex space-x-4">
              <div className="px-4 py-2 bg-emerald-900/20 border border-emerald-900/40 rounded text-[10px] text-emerald-500 font-black uppercase">LAS_PROTOCOL_V3</div>
              <div className="px-4 py-2 bg-emerald-900/20 border border-emerald-900/40 rounded text-[10px] text-emerald-500 font-black uppercase">CSV_PARSER_ACTIVE</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-6 max-w-7xl mx-auto w-full relative z-10 h-full">
        {/* Module Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/30 pb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded shadow-lg">
              <Search size={24} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-tighter">{">>>"} NDR_CRAWLER_V2.0</h2>
              <p className="text-[10px] text-emerald-800 font-black uppercase tracking-[0.4em]">Data_Trust: Sovereign // Source: UK_NDR_API</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex flex-col items-end mr-4">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Active_Registry_Nodes</span>
                <span className="text-xl font-black text-emerald-400 font-mono tracking-tighter" data-testid="project-count">
                  {loadingSearch ? '--' : projects.length.toString().padStart(3, '0')}
                </span>
             </div>
             <div className="flex items-center space-x-2 text-[10px] font-black uppercase">
                <ShieldCheck size={14} className={`text-emerald-500 ${isAuthenticated ? 'animate-pulse' : 'text-red-500'}`} />
                <span className={isAuthenticated ? 'text-emerald-400' : 'text-red-500'}>
                  {isAuthenticated ? 'API_AUTH_VERIFIED' : 'AUTH_FAILED'}
                </span>
             </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-slate-900/50 border border-emerald-900/30 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-2xl">
          <div className="flex-1 w-full relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-emerald-900">
              <Search size={14} />
            </div>
            <input 
              type="text" 
              placeholder="Search Project ID, UWI, Quadrant, Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-emerald-900/40 rounded px-10 py-2 text-[10px] text-emerald-100 outline-none focus:border-emerald-500 transition-all font-terminal"
              data-testid="ndr-search-input"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-3 flex items-center text-emerald-900 hover:text-red-500 transition-colors"
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-emerald-900/40 rounded px-3 py-2 text-[10px] text-emerald-400 uppercase outline-none focus:border-emerald-500 font-terminal"
            >
              <option value="ALL">Status: ALL</option>
              <option value="RELEASED">Status: RELEASED</option>
              <option value="PENDING">Status: PENDING</option>
            </select>

            <select 
              value={selectedWellboreType}
              onChange={(e) => setSelectedWellboreType(e.target.value)}
              className="bg-slate-950 border border-emerald-900/40 rounded px-3 py-2 text-[10px] text-emerald-400 uppercase outline-none focus:border-emerald-500 font-terminal"
            >
              <option value="ALL">Wellbore: ALL</option>
              <option value="VERTICAL">Wellbore: VERTICAL</option>
              <option value="DIRECTIONAL">Wellbore: DIRECTIONAL</option>
            </select>

            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]`}
              title="Inject local forensic artifacts (.LAS, .CSV)"
            >
              {isUploading ? <Loader2 size={14} className="animate-spin text-emerald-500" /> : <Upload size={14} />}
              <span>{isUploading ? 'Injecting_Artifact...' : 'Local_Injection'}</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".las,.csv" 
              className="hidden" 
            />
            <div className="flex items-center space-x-3 bg-slate-950/50 px-4 py-2 rounded border border-emerald-900/40">
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${showGhostOnly ? 'text-red-500' : 'text-emerald-900'}`}>
                Datum_Shift_Gate
              </span>
              <button 
                onClick={() => setShowGhostOnly(!showGhostOnly)}
                className={`relative w-10 h-5 rounded-full transition-all duration-300 ${showGhostOnly ? 'bg-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-slate-800'}`}
                data-testid="datum-shift-toggle"
              >
                <div className={`absolute top-1 transition-all duration-300 w-3 h-3 rounded-full ${showGhostOnly ? 'left-6 bg-red-500 shadow-[0_0_8px_white]' : 'left-1 bg-emerald-900'}`} />
                {showGhostOnly && <ShieldAlert size={10} className="absolute top-1 left-2 text-red-500 animate-pulse" />}
              </button>
            </div>
            <button 
              onClick={fetchProjects}
              disabled={loadingSearch}
              className="px-6 py-2 bg-emerald-600 text-slate-950 rounded font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              data-testid="ndr-search-submit"
            >
              {loadingSearch ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              <span>{loadingSearch ? 'Crawling_NDR...' : 'Apply_Filters'}</span>
            </button>
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
          {!loadingSearch && projects.length > 0 && (
             <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
                <div className="bg-slate-900/60 border border-emerald-900/40 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-2 opacity-10">
                      <Cpu size={40} className="text-emerald-500" />
                   </div>
                   <div className="flex items-center space-x-3 mb-3 border-b border-emerald-900/20 pb-2">
                      <MessageSquareQuote size={18} className="text-emerald-400" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Architect_Forensic_Insight</span>
                   </div>
                   {loadingInsight ? (
                     <div className="flex items-center space-x-3 py-2">
                        <Loader2 size={14} className="text-emerald-500 animate-spin" />
                        <span className="text-[9px] font-black text-emerald-900 uppercase animate-pulse">De-cluttering data anomalies...</span>
                     </div>
                   ) : aiInsight ? (
                     <div className="relative">
                        <p className="text-[11px] text-emerald-100 font-mono leading-relaxed italic border-l-2 border-emerald-500/30 pl-4 py-1">
                           {aiInsight}
                        </p>
                        <div className="mt-2 flex justify-end">
                           <span className="text-[8px] font-black text-emerald-900 uppercase tracking-tighter">Verified // Sector_AI_9</span>
                        </div>
                     </div>
                   ) : (
                     <span className="text-[9px] font-black text-emerald-900 uppercase">Awaiting forensic trigger...</span>
                   )}
                </div>
             </div>
          )}

          {loadingSearch ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <Loader2 size={64} className="text-emerald-500 animate-spin mb-4" />
              <span className="text-[12px] font-black uppercase tracking-[0.5em] text-emerald-700">Accessing_NDR_Meta-Graph...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <Database size={64} className="text-emerald-500 mb-4" />
              <span className="text-[14px] font-black uppercase tracking-[0.5em]">No_Projects_Found</span>
              <span className="text-[10px] mt-2 font-bold uppercase tracking-widest text-emerald-900">Adjust filters or refine search query.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((project) => {
                const harvestProgress = harvestingProjects[project.projectId] || 0;
                const isHarvested = harvestProgress === 100;
                const isHarvesting = harvestProgress > 0 && harvestProgress < 100;
                const isError = harvestProgress === -1;

                return (
                  <div 
                    key={project.projectId} 
                    className={`glass-panel p-5 rounded-lg border flex flex-col space-y-4 shadow-xl transition-all duration-300 ${project.hasDatumShiftIssues ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-900/30 bg-slate-900/60'}`}
                  >
                    <div className="flex items-center justify-between border-b border-emerald-900/20 pb-3">
                      <div className="flex items-center space-x-3">
                        <Factory size={16} className="text-emerald-500" />
                        <span className="text-[11px] font-black text-emerald-400 uppercase tracking-tight">{project.name}</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${project.status === 'RELEASED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {project.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-2 text-[9px] text-emerald-700 font-mono">
                      <div className="flex items-center space-x-2"><Hash size={10} className="text-emerald-900" /> <span>ID: {project.projectId}</span></div>
                      <div className="flex items-center space-x-2"><GitBranch size={10} className="text-emerald-900" /> <span>Quadrant: {project.quadrant}</span></div>
                      <div className="flex items-center space-x-2"><Microscope size={10} className="text-emerald-900" /> <span>Type: {project.type}</span></div>
                      <div className="flex items-center space-x-2"><Waves size={10} className="text-emerald-900" /> <span>Wellbore: {project.wellboreType}</span></div>
                      <div className="flex items-center space-x-2"><Clock size={10} className="text-emerald-900" /> <span>Release: {project.releaseDate}</span></div>
                      <div className="flex items-center space-x-2"><FileText size={10} className="text-emerald-900" /> <span>Size: {project.sizeGb.toFixed(1)} GB</span></div>
                    </div>

                    {project.hasDatumShiftIssues && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded flex items-center space-x-3 animate-in zoom-in-95">
                        <AlertCircle size={14} className="text-red-500 animate-pulse" />
                        <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Datum Shift (GHOST_FLAG)</span>
                      </div>
                    )}
                    {project.hasIntegrityRecords && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center space-x-3">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Integrity Records Present</span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-emerald-900/10">
                      {!isHarvested && !isError ? (
                        <button 
                          onClick={() => handleHarvestProject(project.projectId)}
                          disabled={isHarvesting}
                          className="w-full py-3 bg-emerald-600 text-slate-950 rounded font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all"
                          data-testid={`harvest-btn-${project.projectId}`}
                        >
                          {isHarvesting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          <span>{isHarvesting ? `Harvesting... ${harvestProgress.toFixed(0)}%` : 'Harvest Project'}</span>
                        </button>
                      ) : isError ? (
                        <div className="w-full py-3 bg-red-500/10 text-red-500 rounded font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 border border-red-500/40">
                          <AlertCircle size={14} />
                          <span>Harvest_Error</span>
                        </div>
                      ) : (
                        <div className="w-full py-3 bg-emerald-500/10 text-emerald-500 rounded font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 border border-emerald-500/40">
                          <ShieldCheck size={14} />
                          <span>Harvested project {project.projectId}</span>
                        </div>
                      )}
                      {isHarvested && (
                        <div className="text-[8px] text-emerald-700 font-mono truncate mt-2 text-center" data-testid="harvested-project-sha">
                           SHA512: {project.sha512.substring(0, 32)}...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Module Footer */}
        <div className="pt-4 border-t border-emerald-900/20 flex flex-col md:flex-row items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] mt-auto gap-4 bg-slate-950/40 p-4 rounded-lg">
           <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-2 text-emerald-600">
                <Database size={12} />
                <span>NSTA_DATA_REPOSITORY_LINK</span>
              </span>
           </div>
           <div className="flex items-center space-x-4">
              <span className="text-emerald-950">NDR_CRAWLER_ACTIVE</span>
              <div className="flex items-center space-x-1">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default NDRCrawler;