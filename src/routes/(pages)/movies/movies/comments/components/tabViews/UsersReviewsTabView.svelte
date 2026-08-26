<script lang="ts">
	import Button from '$components/Button.svelte';
	import { comments, moviesStore, selectedMovie } from '$store/movies';

	// moviesStore.getPoster() goes through handleFetch(), which has no explicit return type (it's
	// effectively `any`) -- this interface is just the one field actually read below.
	let poster = $state<{ imageBase64?: string } | undefined>();

	// $effect callbacks must be synchronous (return void or a cleanup function) -- an async
	// callback implicitly returns a Promise, which doesn't type-check. Delegate to an async
	// helper instead, called from within the (still synchronous) effect.
	async function loadPoster(movieId: string) {
		poster = await moviesStore.getPoster(movieId);
		console.log(poster);
	}

	$effect(() => {
		if ($selectedMovie?.movieId) {
			loadPoster($selectedMovie.movieId);
		}
	});

	async function embedPoster() {
		await moviesStore.embedPoster($selectedMovie.movieId);
		poster = await moviesStore.getPoster($selectedMovie.movieId);
	}
</script>

{#key $selectedMovie}
	{#if poster?.imageBase64}
		<img src="data:image/jpeg;base64,{poster.imageBase64}" alt="Movie poster" />
	{:else}
		<Button on:customclick={embedPoster}>Embed</Button>
	{/if}
{/key}

{#each $comments[$selectedMovie.movieId] as comment (comment.id)}
	<div class="">by {comment.userId}:</div>
	<div class="">({comment.rating})</div>
	<div class="">({$selectedMovie?.movieId})</div>
	<div class="">({comment.movieTitle})</div>
	<div class="mb-8 font-bold">{comment.reviewSummary}</div>
{/each}
