import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ fallback: 'index.html' }),
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
