describe('Header navigation', () => {
	it('navigates to About via the header nav button', () => {
		cy.visit('/movies');

		cy.contains('button', 'About').click();

		cy.location('pathname').should('include', '/about');
		cy.contains('button', 'About').should('have.class', 'active');
	});
});
