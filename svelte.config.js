import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		// 200.html, not index.html -- SvelteKit's own docs warn index.html collides with (and
		// silently overwrites) the real prerendered homepage. This was happening on every build.
		adapter: adapter({ fallback: '200.html' }),
		paths: {
			base: process.env.BASE_PATH ?? '/sk-movies-fe'
		},
		alias: {
			$components: 'src/lib/components',
			$store: 'src/store',
			$services: 'src/services'
		}
	}
};

export default config;
