
import { NDRProject } from '../types';
import { MOCK_NDR_PROJECTS } from '../constants';

/**
 * Simulates the dual-token NDR authentication process.
 */
export async function authenticateNDR() {
  // Step 1: Metadata Auth (Simulated)
  await new Promise(r => setTimeout(r, 800));
  const metaToken = "ey_metadata_graph_token_" + Math.random().toString(36).substring(7);
  
  // Step 2: Data API Access Token (Simulated)
  await new Promise(r => setTimeout(r, 600));
  const dataToken = "ey_ndr_data_api_token_" + Math.random().toString(36).substring(7);
  
  return { metaToken, dataToken };
}

/**
 * Searches the NDR Metadata API for projects.
 * Enhanced to identify 'Data Ghosts' (Datum Shifts) and 'Wellbore Type' classification.
 */
export async function searchNDRMetadata(
  query: string, 
  status: string = 'ALL', 
  wellboreType: string = 'ALL', 
  projectType: string = 'ALL',
  ghostOnly: boolean = false
): Promise<NDRProject[]> {
  await new Promise(r => setTimeout(r, 1200)); // Simulate API latency
  
  const normalizedQuery = query.toLowerCase();
  
  console.log(`NDR_METADATA_API: Crawling for ${ghostOnly ? 'DATUM_SHIFT_ANOMALIES' : 'STANDARD_PROJECTS'} status: ${status}, wellbore: ${wellboreType}, type: ${projectType}...`);
  
  return MOCK_NDR_PROJECTS.filter(p => {
    const matchesQuery = !query || 
      p.projectId.toLowerCase().includes(normalizedQuery) || 
      p.quadrant.toLowerCase().includes(normalizedQuery) ||
      p.name.toLowerCase().includes(normalizedQuery);
    
    const matchesStatus = status === 'ALL' || p.status.toUpperCase() === status.toUpperCase();
    const matchesWellbore = wellboreType === 'ALL' || p.wellboreType === wellboreType;
    const matchesType = projectType === 'ALL' || p.type.toLowerCase() === projectType.toLowerCase();
    const matchesGhost = !ghostOnly || p.hasDatumShiftIssues === true;
    
    return matchesQuery && matchesStatus && matchesWellbore && matchesType && matchesGhost;
  });
}

/**
 * Simulates the Sovereign Batch Harvester with SHA512 Integrity Check.
 */
export async function harvestNDRProject(projectId: string, onProgress: (p: number) => void): Promise<boolean> {
  const project = MOCK_NDR_PROJECTS.find(p => p.projectId === projectId);
  if (!project) return false;

  let progress = 0;
  while (progress < 100) {
    await new Promise(r => setTimeout(r, Math.random() * 300 + 100));
    progress += Math.random() * 15;
    onProgress(Math.min(100, progress));
  }

  // Simulate SHA512 Integrity Check
  console.log(`NDR_HARVESTER: SHA512 Check for ${projectId} - [${project.sha512}] ... OK`);
  return true;
}
