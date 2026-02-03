<script lang="ts">
	import '../app.css';
	// import 'svooltip/styles.css';
	import '@fortawesome/fontawesome-free/css/all.min.css';
	import { page } from '$app/stores';
	import { currentThemeStore } from '$store/store';
	import { afterNavigate } from '$app/navigation';
	import { AgGridModule } from '$lib/utils/agGridModule';

	const moviesThemeBasePaths = ['movies'];
	const contentThemeBasePaths = ['maintenance'];
	const publicationsThemeBasePaths = ['publications'];
	const importThemBasePaths = ['import'];

	/**
	 * Sets the style theme based on the route pathname
	 */
	function setTheme() {
		const urlPathArray = $page.url.pathname.split('/');
		// only checking the base pathname i.e. 'products', 'movies' or 'comments'
		const extractedBasePath = urlPathArray[1];

		if (moviesThemeBasePaths.includes(extractedBasePath)) {
			$currentThemeStore = 'movies';
		}

		if (contentThemeBasePaths.includes(extractedBasePath)) {
			$currentThemeStore = 'content';
		}

		if (publicationsThemeBasePaths.includes(extractedBasePath)) {
			$currentThemeStore = 'publications';
		}

		if (importThemBasePaths.includes(extractedBasePath)) {
			$currentThemeStore = 'import';
		}

		document.querySelector('html')?.setAttribute('data-theme', $currentThemeStore);
	}

	// function setVersion() {
	// 	document.querySelector('body')?.setAttribute('data-version', `${__VERSION__}`);
	// }

	// update the theme everytime when navigating / changing the route in the application:
	afterNavigate(() => {
		setTheme();
		// setVersion();
		AgGridModule.init();
	});

	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import PrimaryNavigation from '$lib/components/PrimaryNavigation.svelte';
		import { Toaster } from 'svelte-hot-french-toast';
		let { children } = $props();
</script>

<div class="h-full flex flex-col">
	<Header />
	<div class="grid grid-cols-[64px_1fr] flex-1">
		<PrimaryNavigation />
		{@render children()}
	</div>
	<Toaster />
</div>

