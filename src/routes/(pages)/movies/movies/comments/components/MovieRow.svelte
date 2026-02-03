<script lang="ts">
	import Divider from '$lib/components/Divider.svelte';
	import { moviesStore, selectedMovie } from '$store/movies';
	// import type { Property } from '$lib/interfaces';

	type Property = any;

	let { movie, minimizeTable } = $props();

	async function handleProductRowClick(movie: Property) {
		const result = await moviesStore.getCommentsByMovieId(movie.movieId);

		// if ($selectedMovie.movieId == movie.genre0.movieId) {
		// 	// selectedMovie.reset();
		// } else {
		selectedMovie.set(movie);
		// }
	}
</script>

<button
	data-cy="products-articles-list"
	class="group hover:bg-primary-100 h-10 grid {minimizeTable
		? 'grid-cols-[100px_200px]'
		: 'grid-cols-[60px_repeat(6,_minmax(10%,_300px))]'}
             justify-items-start items-center text-primary-900 text-sm cursor-pointer w-full"
	class:bg-primary-100={$selectedMovie.movieId === movie.movieId ? 'bg-primary-100' : ''}
	onclick={() => handleProductRowClick(movie)}
>
	<input
		type="checkbox"
		class="ml-7 mr-2 w-5 h-5 accent-primary-500 cursor-pointer"
		checked={$selectedMovie.movieId === movie.movieId}
	/>
	<div class="">{movie.movieTitle}</div>
	{#if !minimizeTable}
		<div class="">{movie.movieId}</div>
		<div class="">{movie.genre}</div>
		<div class="">{movie.required ? 'Yes' : 'No'}</div>
		<div class="">{movie.readonly ? 'Yes' : 'No'}</div>
		<div class="">{movie.active ? 'Yes' : 'No'}</div>
	{/if}
</button>
<Divider class="col-span-7" />
