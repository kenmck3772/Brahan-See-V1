
import { test, expect } from '@playwright/test';

/**
 * BRAHAN PERSONAL TERMINAL: FORENSIC DEMONSTRATION SUITE
 * This script showcases the high-level forensic abilities of the terminal.
 */
test('Execute Full Forensic Workflow', async ({ page }) => {
  // 1. Initial Access & System Check
  await page.goto('http://localhost:3000'); // Adjust to your local dev port
  await expect(page.getByText('Well-Tegra [WETE]')).toBeVisible(); // Changed to actual header text
  
  // Helper function to activate modules
  const activateModule = async (moduleId: string, label: string) => {
      const toggleButton = page.getByTestId(`module-toggle-${moduleId}`);
      // Ensure sidebar is open to click the toggle, if not already
      const isSidebarOpen = await page.locator('aside').first().evaluate(node => !node.classList.contains('w-16'));
      if (!isSidebarOpen) {
          await page.getByRole('button', { name: 'Toggle sidebar' }).click(); // Click the main menu button
          await page.waitForTimeout(300); // Wait for sidebar animation
      }
      await toggleButton.click();
      await expect(toggleButton).toHaveClass(/bg-\[\#22c55e\]/); // Check if engaged style is applied
      await expect(page.getByText(label)).toBeVisible(); // Check if module title is visible on stage
      await page.waitForTimeout(200); // Small pause for UI to settle
  };

  // 2. NDR Metadata Crawling (NDRCrawler is enabled by default in App.tsx initially)
  // We just need to ensure it's loaded.
  await expect(page.getByText('NDR_CRAWLER_V2.0')).toBeVisible();
  const searchInput = page.getByTestId('ndr-search-input');
  await searchInput.fill('Thistle');
  await page.getByTestId('ndr-search-submit').click();
  
  // Apply the 'Ghost-Scan' filter to identify projects with datum shift issues
  await page.getByTestId('datum-shift-filter').click();
  
  // Verify the Thistle project appears
  await expect(page.getByText('Thistle A7 Legacy')).toBeVisible();
  
  // 3. Sovereign Batch Harvesting
  // Trigger the data harvest from the NDR secure archive
  await page.getByTestId('harvest-btn-THISTLE1978well0001').click();
  
  // Wait for the simulated progress bar to complete the harvest
  await page.waitForTimeout(2000); 
  await expect(page.getByText('Harvested project THISTLE1978well0001')).toBeVisible({ timeout: 10000 });

  // 4. GHOST_SYNC: Datum Discordance Resolution
  await activateModule('ghostSync', 'Ghost_Sync_Engine'); // Activate GhostSync module
  await page.getByText('Auto_Lineup').click();
  
  // Wait for the sync engine to lock at the 14.5m offset
  await expect(page.getByText('14.500m')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Optimal_Sync_Achieved')).toBeVisible();

  // 5. TRAUMA_NODE: 3D Structural Forensics
  await activateModule('traumaNode', 'Trauma_Node_Forensics'); // Activate TraumaNode module
  await page.getByText('OVALITY').click(); // Select Ovality layer
  await page.getByText('CRITICAL').first().click(); // Click first critical log entry
  
  // Verify the forensic targeting HUD appears
  await expect(page.getByText('Voxel_Lock_Engaged')).toBeVisible(); // Changed to actual HUD text

  // 6. PULSE_ANALYZER: Annulus Leak Diagnosis
  await activateModule('pulseAnalyzer', 'Barrier_Integrity_Pulse'); // Activate PulseAnalyzer module
  await page.getByText('Integrity_Scavenger').click();
  
  // Scavenge the NDR for historical 10-year ghost pressure traces
  await page.getByText('Scavenge NDR for Logs').click();
  await page.waitForTimeout(1500); // Wait for scavenge animation
  
  // Verify the diagnostic status has updated based on the sawtooth slope
  await expect(page.getByText('Sovereign_Diagnosis')).toBeVisible();
  await expect(page.getByText('CRITICAL: RAPID FLOW BREACH')).toBeVisible();

  // 7. REPORTS_SCANNER: Tally Audit
  await activateModule('reportsScanner', 'Report_Scanner_v1.2'); // Activate ReportsScanner module
  
  // Audit the Daily Drilling Report (DDR) schema against the physical tally array
  await page.getByText('Audit_DDR').click(); // Corrected button text
  
  // Look for the "Discordance_Detected" flag in the joint tally
  await expect(page.getByText('Discordance_Detected')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('DISCREPANT')).toBeVisible();

  // 8. SOVEREIGN VETO: Final Audit Generation
  // Trigger the Gemini forensic architect to finalize the insight
  await page.getByRole('button', { name: 'Generate Gemini Insight' }).click(); // Click the new button
  await page.waitForTimeout(2000); // Wait for insight generation
  await expect(page.getByTestId('gemini-insight-text')).not.toBeEmpty();
  
  // Execute the final Sovereign Veto to generate the PDF Forensic Audit
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('sovereign-veto-btn').click();
  const download = await downloadPromise;
  
  // Validate the file naming convention
  expect(download.suggestedFilename()).toContain('BRAHAN_AUDIT');
  
  console.log('Forensic Demonstration Complete: Sovereign Audit Generated.');
});
