describe('Home', () => {
	it('redirects from / to /movies and shows the header', () => {
		cy.visit('/');

		cy.location('pathname').should('include', '/movies');
		cy.contains('SK Movies').should('be.visible');
		cy.contains('button', 'Movies').should('be.visible');
		cy.contains('button', 'About').should('be.visible');
	});
});
