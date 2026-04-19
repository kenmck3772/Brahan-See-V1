describe('Brahan Sovereign Terminal: Multi-Module Forensic Flow', () => {
  beforeEach(() => {
    // Start at root
    cy.visit('/');
    // Clear localStorage to ensure fresh state for tests
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('should execute a full metadata scavenger flow in NDRCrawler', () => {
    // NDRCrawler is enabled by default, but let's confirm engagement
    cy.get('[data-testid="module-toggle-ndrCrawler"]').should('have.class', 'bg-[var(--emerald-primary)]/10');
    
    // 1. Initial State Check
    cy.get('[data-testid="project-count"]').should('be.visible');
    
    // 2. Perform Search
    cy.get('[data-testid="ndr-search-input"]').type('Thistle');
    cy.get('[data-testid="ndr-search-submit"]').click();
    
    // 3. Verify Results
    cy.contains('Thistle A7 Legacy').should('be.visible');
    cy.get('[data-testid="project-count"]').invoke('text').then((text) => {
      const count = parseInt(text);
      expect(count).to.be.at.least(1);
    });

    // 4. Test Filters
    cy.get('select').first().select('RELEASED'); // Status filter
    cy.get('select').eq(1).select('VERTICAL');   // Wellbore filter
    cy.get('[data-testid="ndr-search-submit"]').click();
    
    // Verify list updates (Thistle A7 is Released and Vertical)
    cy.contains('Thistle A7 Legacy').should('be.visible');
    
    // 5. Verify AI Insight Generation
    cy.contains('Architect_Forensic_Insight').should('be.visible');
    // Check for some forensic-style text (italic font-mono)
    cy.get('.italic.font-mono').should('not.be.empty');
  });

  it('should correlate datum shifts and detect anomalies in GhostSync', () => {
    // 1. Engage GhostSync
    cy.get('[data-testid="module-toggle-ghostSync"]').click();
    cy.contains('Ghost_Sync_Engine').should('be.visible');

    // 2. Perform Auto-Lineup
    cy.contains('Auto_Lineup').click();
    // Wait for the simulated sync animation (approx 1.5s in code)
    cy.wait(2000); 
    cy.get('span.text-[16px]').contains('14.500m').should('be.visible');

    // 3. Adjust Anomaly Threshold Slider
    // Find the threshold slider (usually the last range input if both modules are open)
    cy.get('input[type="range"]').last().as('thresholdSlider');
    cy.get('@thresholdSlider').invoke('val', 15).trigger('change');
    
    // 4. Run Forensic Scan
    cy.contains('Forensic_Scan').click();
    // Progress should move
    cy.get('.animate-spin').should('exist');
    cy.wait(2000); // Wait for scan completion

    // 5. Verify Detected Anomalies
    cy.contains('Detected_Anomalies').should('be.visible');
    cy.get('.glass-panel').contains('ANOM-').should('be.visible');
    
    // 6. Inspect Anomaly Details
    cy.get('.glass-panel').contains('ANOM-').first().click();
    cy.contains('Anomaly_Forensic_Report').should('be.visible');
    cy.contains('Mark_Valid').should('be.visible');
  });

  it('should demonstrate cross-module persistence via terminal state', () => {
    // 1. Engage Multiple Modules
    cy.get('[data-testid="module-toggle-ghostSync"]').click();
    cy.get('[data-testid="module-toggle-traumaNode"]').click();
    
    // 2. Verify Taskbar Icons
    cy.get('footer').contains('Ghost Sync Engine').should('be.visible');
    cy.get('footer').contains('Trauma Node').should('be.visible');

    // 3. Reload Page
    cy.reload();

    // 4. Verify Persistent Engagement
    cy.get('[data-testid="module-toggle-ghostSync"]').should('have.class', 'bg-[var(--emerald-primary)]/10');
    cy.get('[data-testid="module-toggle-traumaNode"]').should('have.class', 'bg-[var(--emerald-primary)]/10');
    
    // Taskbar should still show them
    cy.get('footer').contains('Ghost Sync Engine').should('be.visible');
    cy.get('footer').contains('Trauma Node').should('be.visible');
  });
});
