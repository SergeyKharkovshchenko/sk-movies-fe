import { defineConfig } from 'cypress';

export default defineConfig({
	e2e: {
		// vite preview serves the adapter-static build at this path (see svelte.config.js's
		// kit.paths.base), so every cy.visit() needs to account for the /sk-movies-fe prefix.
		baseUrl: 'http://localhost:4173/sk-movies-fe',
		specPattern: 'cypress/e2e/**/*.cy.ts',
		supportFile: 'cypress/support/e2e.ts',
		video: false
	}
});
