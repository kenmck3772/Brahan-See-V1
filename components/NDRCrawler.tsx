
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Database, Search, ShieldCheck, Loader2, 
  AlertCircle, X, Factory, Microscope, 
  FileText, ShieldAlert, Download, Clock,
  Hash, Waves, GitBranch
} from 'lucide-react';
import { authenticateNDR, searchNDRMetadata, harvestNDRProject } from '../services/ndrService';
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
    try {
      const fetchedProjects = await searchNDRMetadata(
        debouncedSearchTerm,
        selectedStatus,
        selectedWellboreType,
        'ALL', // Assuming projectType is always 'ALL' for this crawler
        showGhostOnly
      );
      setProjects(fetchedProjects);
    } catch (error) {
      console.error("NDR Search failed:", error);
      setProjects([]);
    } finally {
      setLoadingSearch(false);
    }
  }, [isAuthenticated, debouncedSearchTerm, selectedStatus, selectedWellboreType, showGhostOnly]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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
    <div className="flex flex-col h-full space-y-4 p-6 bg-slate-950/40 relative font-terminal overflow-hidden border border-emerald-900/10">
      
      {/* Background HUD Decorations */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Database size={400} className="text-emerald-500 animate-spin-slow" />
      </div>

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
              onClick={() => setShowGhostOnly(!showGhostOnly)}
              className={`flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border ${showGhostOnly ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-slate-950 border-emerald-900/40 text-emerald-400 hover:border-emerald-400'}`}
              data-testid="datum-shift-filter"
            >
              <ShieldAlert size={14} className={showGhostOnly ? 'animate-pulse' : ''} />
              <span>Display only projects with datum shift issues</span>
            </button>
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