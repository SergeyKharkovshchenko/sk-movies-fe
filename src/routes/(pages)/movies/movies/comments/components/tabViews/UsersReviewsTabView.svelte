<script lang="ts">
	import Button from '$components/Button.svelte';
	import { comments, moviesStore, selectedMovie } from '$store/movies';
	import { onMount } from 'svelte';

	let poster = $state<string | undefined>();

	$effect(async () => {
		if ($selectedMovie?.movieId) {
			poster = await moviesStore.getPoster($selectedMovie.movieId);
			console.log(poster);
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

{#each $comments[$selectedMovie.movieId] as comment}
	<div class="">by {comment.userId}:</div>
	<div class="">({comment.rating})</div>
	<div class="">({$selectedMovie?.movieId})</div>
	<div class="">({comment.movieTitle})</div>
	<div class="mb-8 font-bold">{comment.reviewSummary}</div>
{/each}
