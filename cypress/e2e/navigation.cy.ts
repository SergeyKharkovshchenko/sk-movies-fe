describe('Header navigation', () => {
	it('navigates to About via the header nav button', () => {
		cy.visit('/movies');

		cy.contains('button', 'About').click();

		cy.location('pathname').should('include', '/about');
		cy.contains('button', 'About').should('have.class', 'active');
		// Distinct from about.cy.ts's snapshot -- this one catches drift in the active-nav-item
		// styling specifically, not just the About page content.
		cy.argosScreenshot('navigation-active-state');
	});
});
