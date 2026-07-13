describe('About page', () => {
	it('renders directly when deep-linked', () => {
		cy.visit('/about');

		cy.get('h2').should('contain.text', 'About');
		cy.contains('SK Movies is a movie recommendation app').should('be.visible');
	});
});
