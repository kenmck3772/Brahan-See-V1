describe('Well-Tegra Sovereign Audit Terminal E2E', () => {
  beforeEach(() => {
    // Intercept potential API calls if needed, or just let them hit the mock services
    cy.visit('/');
  });

  it('should engage NDRCrawler and verify its presence', () => {
    // Open the sidebar if it's not open (assuming it's open by default as per App.tsx line 15)
    
    // Toggle NDRCrawler (id: ndrCrawler)
    // Note: It's enabled by default in App.tsx state, but let's toggle it off and on to be sure
    cy.get('[data-testid="module-toggle-ndrCrawler"]').click();
    // It's a toggle, so if it was on, it's now off. Let's toggle it back on.
    cy.get('[data-testid="module-toggle-ndrCrawler"]').click();

    // Verify NDR Crawler is visible in the main stage
    cy.contains('NDR_Harvest_Crawler').should('be.visible');
    
    // Interact with NDRCrawler search
    cy.get('input[placeholder="Scavenge Metadata..."]').type('test project');
    // Check if loading indicator appears (mock service might be fast)
    // cy.get('.animate-spin').should('exist');
  });

  it('should engage GhostSync and adjust anomaly detection threshold', () => {
    // Engage GhostSync
    cy.get('[data-testid="module-toggle-ghostSync"]').click();

    // Verify GhostSync is visible
    cy.contains('Ghost_Sync_Engine').should('be.visible');

    // Check the anomaly threshold slider
    // We can't easily "slide" in Cypress exactly like a human, but we can invoke 'val' and 'trigger'
    cy.get('input[type="range"]').last().as('thresholdSlider'); // The threshold slider is usually the last range input if multiple modules are open
    
    cy.get('@thresholdSlider').invoke('val', 50).trigger('change');
    
    // Verify the value display updates
    cy.contains('50 API').should('be.visible');
  });

  it('should preserve module engagement across mock session reloads', () => {
    // Engage NDRCrawler and GhostSync
    // ndrCrawler is already on by default in my tests usually, but let's be explicit
    // Actually, App.tsx has: ndrCrawler: true
    
    cy.get('[data-testid="module-toggle-ghostSync"]').click();
    
    // Module should be active
    cy.get('[data-testid="module-toggle-ghostSync"]').should('have.class', 'bg-[var(--emerald-primary)]/10');

    // Reload the page
    cy.reload();

    // Verify GhostSync is still active due to localStorage persistence
    cy.get('[data-testid="module-toggle-ghostSync"]').should('have.class', 'bg-[var(--emerald-primary)]/10');
  });
});
