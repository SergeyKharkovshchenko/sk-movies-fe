<script lang="ts">
	import { comments, moviesStore, selectedMovie } from '$store/movies';
	import { onMount } from 'svelte';

	onMount(async () => {
		// if ($selectedMovie.movieId! in $comments) {
		console.log($selectedMovie.movieId);
		// }
	});
</script>

{#each $comments[$selectedMovie.movieId] as comment}
	<div class="">by {comment.userId}:</div>
	<div class="">({comment.rating})</div>
	<div class="">({comment.movieTitle})</div>
	<div class="mb-8 font-bold">{comment.reviewSummary}</div>
{/each}
