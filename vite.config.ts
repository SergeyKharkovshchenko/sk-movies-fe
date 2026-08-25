import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { sentrySvelteKit } from '@sentry/sveltekit';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode, command }) => {
	// SENTRY_AUTH_TOKEN is deliberately not VITE_-prefixed (must never reach the client bundle),
	// so it isn't in import.meta.env here — load it directly from .env for this Node-side config.
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [
			// Only load for a real production build — `command` is 'serve' for both `vite dev`
			// and vitest, and this plugin has no business running (or sending its own telemetry
			// to Sentry, which it otherwise does unconditionally) outside an actual `vite build`.
			...(command === 'build'
				? [
						sentrySvelteKit({
							org: 'kharkovshchenko',
							project: 'javascript-sveltekit',
							authToken: env.SENTRY_AUTH_TOKEN,
							// adapter-static isn't in the SDK's supported-adapter list (node/auto/vercel/
							// cloudflare), so auto-detection would guess wrong output paths — point it at
							// the real ones instead.
							adapter: 'other',
							sourcemaps: {
								assets: ['./build/**/*.js'],
								filesToDeleteAfterUpload: ['./build/**/*.js.map']
							}
						})
					]
				: []),
			tailwindcss(),
			sveltekit()
		],
		build: {
			sourcemap: true
		},
		test: {
			coverage: {
				provider: 'v8',
				reporter: ['text', 'lcov'],
				reportsDirectory: './coverage'
			},
			workspace: [
				{
					extends: './vite.config.ts',
					plugins: [svelteTesting()],
					test: {
						name: 'client',
						environment: 'jsdom',
						clearMocks: true,
						include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
						exclude: ['src/lib/server/**'],
						setupFiles: ['./vitest-setup-client.ts']
					}
				},
				{
					extends: './vite.config.ts',
					test: {
						name: 'server',
						environment: 'node',
						include: ['src/**/*.{test,spec}.{js,ts}'],
						exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
					}
				}
			]
		}
	};
});
