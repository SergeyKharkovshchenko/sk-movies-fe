<script lang="ts">
	import { currentRoute } from '$store/store';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		currentLanguage,
		LANGUAGE_STORAGE_KEY,
		languagesStore,
		languages
	} from '$store/language';
	import { onMount } from 'svelte';
	import type { Language } from '$lib/interfaces/Language';

	let showLocaleMenu = false;
	let availableLanguages: Language[] = [];

	onMount(async () => {
		await languagesStore.fetchLanguages();
		availableLanguages = $languages;

		// verify and set language
		const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? '';
		const initLanguage = availableLanguages.map((l) => l.key).includes(storedLanguage)
			? storedLanguage
			: availableLanguages[0].key;

		if (storedLanguage !== initLanguage) {
			currentLanguage.set(initLanguage);
		}
	});

	function changeLanguage(l: string) {
		showLocaleMenu = false;
		currentLanguage.set(l);
	}

	function handleRoute(routeName: string) {
		$currentRoute = routeName;
		goto(`/${routeName}`);
	}
</script>

<header
	class="grid grid-cols-3 h-12 w-full px-4 border-b-zinc-200 border-b border-solid items-center"
>
	<a
		href="/"
		class="flex items-center gap-2 no-underline transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded"
	>
		<img src="/favicon.png" alt="SK Movies logo" width="32" height="32" class="h-8 w-8" />
		<span class="font-semibold text-zinc-950 text-sm">SK Movies</span>
	</a>

	<div class="flex justify-center gap-6 font-normal underline-offset-8">
		<!-- <button
			class:active={$page.url.pathname.includes('import')}
			class=" [&.active]:font-semibold [&.active]:underline"
			on:click={() => handleRoute('import')}
		>
			Import
		</button>
		<button
			class:active={$page.url.pathname.includes('maintenance')}
			class=" [&.active]:font-semibold [&.active]:underline"
			on:click={() => handleRoute('maintenance')}
		>
			Maintenance
		</button>
		<button
			class:active={$page.url.pathname.includes('publications') ||
				$page.url.pathname.includes('publications')}
			class="text-[#00585D] [&.active]:font-semibold [&.active]:underline"
			on:click={() => handleRoute('publications')}
		>
			Publications
		</button> -->
		<button
			class:active={$page.url.pathname.includes('movies') ||
				$page.url.pathname.includes('comments')}
			class="text-zinc-950 [&.active]:font-semibold [&.active]:underline"
			on:click={() => handleRoute('movies')}
		>
			Movies
		</button>
		<button
			class:active={$page.url.pathname.includes('about')}
			class="text-zinc-950 [&.active]:font-semibold [&.active]:underline"
			on:click={() => handleRoute('about')}
		>
			About
		</button>
	</div>

	<div class="flex h-10 items-center justify-end">
		<div class=" relative border-2 rounded-lg h-10">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="cursor-pointer flex items-center p-1.5"
				on:click={() => (showLocaleMenu = !showLocaleMenu)}
			>
				<span class=" text-gray-800 w-14 mx-2">{$currentLanguage}</span>
				<i class="fa-solid fa-angle-right text-gray-500 mr-2" />
			</div>
			{#if showLocaleMenu}
				<div class="absolute rounded-lg ring-2 ring-gray-300 bg-white z-10 shadow-lg top-12">
					<ul>
						{#each availableLanguages as l}
							<!-- svelte-ignore a11y-click-events-have-key-events -->
							<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
							<li
								class="rounded-lg cursor-pointer w-max p-2"
								class:font-bold={$currentLanguage == l.key}
								on:click={() => changeLanguage(l.key)}
							>
								{l.key}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
</header>
