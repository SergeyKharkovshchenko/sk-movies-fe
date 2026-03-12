<script lang="ts">
	import Button from '$components/Button.svelte';
	import Headline from '$components/Headline.svelte';
	import { comments, commentsStore, similarityTable } from '$store/comments';

	async function handleCreateEmbeddings(userId: string) {
		console.log(userId);
		commentsStore.handleCreateEmbeddings(userId);
	}

	async function findMostSimilarUsers(userId: string) {
		console.log(userId);
		commentsStore.findMostSimilarUsers(userId);
	}
</script>

<Headline isSelected={false}>EXAMPLE</Headline>

<div class="grid grid-cols-2">
	<div>
		{#each Object.keys($comments) as userId}
			<h3 class="mt-6 mb-2 text-xl font-semibold">User: {userId}</h3>
			<Button on:customclick={() => handleCreateEmbeddings(userId)}>Create Embeddings</Button>
			<Button on:customclick={() => findMostSimilarUsers(userId)}>Find most similar users</Button>

			{#if $comments[userId] && $comments[userId].length}
				{#each $comments[userId] as comment}
					<div class="">{comment.movieTitle} - ({comment.rating})</div>
				{/each}
			{/if}
		{/each}
	</div>
	<div>
		{#each $similarityTable as similarity}
			<div>
				{similarity.userId} - {similarity.similarity} - {similarity.rank}
			</div>
		{/each}
	</div>
</div>
