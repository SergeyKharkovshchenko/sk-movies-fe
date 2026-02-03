<script lang="ts">
	import Divider from '$lib/components/Divider.svelte';
	import { selectedGenres } from '$store/genres';
	import SelectedMovieDetails from './SelectedMovieDetails.svelte';
	import MovieRow from './MovieRow.svelte';
	import Button from '$lib/components/Button.svelte';
	import { filteredMovies, filters, moviesStore } from '$store/movies';
	import { onMount } from 'svelte';
	let minimizeTable = $derived($selectedGenres.key !== '');

	onMount(() => {
		moviesStore.getAllMovies();
	});
</script>

<div class="flex justify-between p-4">
	<div class="flex relative">
		<input
			id="search"
			class="border border-gray-400 rounded px-2 w-64"
			placeholder="search"
			bind:value={$filters.search}
		/>
		<i class="absolute fa fa-search text-gray-400 right-2 top-[10px]"></i>
	</div>
</div>
<!-- {#if $isLoading}
	<span class="flex flex-col items-center">
		<i class="fa-solid fa-spinner text-2xl animate-spin"></i>
	</span>
{:else} -->
<div class={minimizeTable ? 'grid grid-cols-[auto_1fr] pr-8' : ''}>
	<div class="px-4 pb-0">
		<section
			class="border-gray-200 shadow-lg border-2 rounded-md max-h-[calc(100vh_-_110px)] overflow-y-scroll"
		>
			<div class="sticky top-0">
				<div
					class="h-10 grid {minimizeTable
						? 'grid-cols-[60px_300px]'
						: 'grid-cols-[60px_repeat(6,_minmax(10%,_300px))]'}
            justify-items-start items-center text-primary-900 text-sm font-semibold bg-zinc-50"
				>
					<div class=""></div>
					<div class="">Movie</div>
					{#if !minimizeTable}
						<div class="">Key</div>
						<div class="">Datatype</div>

						<div class="">Required</div>
						<div class="">Read only</div>
						<div class="">Active</div>
					{/if}
				</div>
				<Divider class="bg-primary-900" />
			</div>

			{#each $filteredMovies as movie, i}
				<MovieRow {movie} {minimizeTable} />
			{/each}
		</section>
	</div>
	{#if minimizeTable}
		<div>
			{#key $selectedGenres}
				<SelectedMovieDetails />
			{/key}
		</div>
	{/if}
</div>
<!-- {/if} -->
