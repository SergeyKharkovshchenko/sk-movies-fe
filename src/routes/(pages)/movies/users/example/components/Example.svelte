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
	<!-- Enhanced layout with user info and buttons -->
	<div class="flex flex-col">
		<div class="flex flex-row items-center mb-4">
			<h3 class="mr-2 text-xl font-semibold">User: {$comments[userId].name}</h3>
			<div class="text-gray-600">({userId})</div>
		</div>
		<!-- Buttons with more descriptive labels -->
		<div class="flex flex-row justify-between mb-4">
			<Button on:click={() => handleCreateEmbeddings(userId)}>Create User Embeddings</Button>
			<Button on:click={() => findMostSimilarUsers(userId)}>Find Most Similar Users</Button>
		</div>
		<!-- Display user comments with more details -->
		{#if $comments[userId] && $comments[userId].length}
			{#each $comments[userId] as comment}
				<div class="bg-white p-4 mb-2 rounded-lg">
					<h4 class="text-lg font-semibold">{comment.movieTitle}</h4>
					<p class="text-gray-600">Rating: {comment.rating}</p>
					<p class="text-gray-600">Comment: {comment.comment}</p>
				</div>
			{/each}
		{/if}
	</div>
	<div>
		{#each $similarityTable as similarity}
			<div>
				{similarity.userId} - {similarity.similarity} - {similarity.rank}
			</div>
		{/each}
	</div>
</div>
