<!-- <script lang="ts">
	type User = { userId: string | number; numberOfReviews: number }
	let { user }: { user: User } = $props()
</script>

<div class="flex flex-col items-center gap-3 rounded-md border border-primary-500 px-4 py-6">
	<div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white">
		<i class="fa-solid fa-user text-xl"></i>
	</div>
	<div class="text-center">
		<div class="font-semibold text-zinc-950">User #{user.userId}</div>
		<div class="mt-1 text-sm text-primary-500">{user.numberOfReviews} reviews</div>
	</div>
</div> -->

<script lang="ts">
	import Button from '$components/Button.svelte';
	import { commentsStore, comments } from '$store/comments';

	let isCommentsOpen = $state(false);
	let { user } = $props();

	async function handleShowAllCommentsByUser(userId: any) {
		if (!$comments[userId]) {
			await commentsStore.getAllCommentsByUser(userId);
		}
		isCommentsOpen = !isCommentsOpen;
	}

	// $effect(() => {
	// 	// if ($comments.length){
	// 	console.log($comments);
	// 	// }
	// });
</script>

<div class="">{user?.userId} ({user?.numberOfReviews})</div>
<Button on:customclick={() => handleShowAllCommentsByUser(user.userId)}
	>Show all comments by this user</Button
>
<!-- {JSON.stringify($comments)} -->
<!-- {JSON.stringify($comments[user.userId])} -->

{#if $comments[user.userId] && $comments[user.userId].length && isCommentsOpen}
	{#each $comments[user.userId] as comment}
		<div class="">({comment.movieId})</div>
		<div class="">({comment.movieTitle})</div>
		<div class="">({comment.rating})</div>
		<div class="">({comment.reviewText})</div>

		<!-- {JSON.stringify(comment)} -->
		<!-- <div class="font-bold">
					{comment.movie.title},
					{formatIsoToDDMMYYYY(comment.comment.createdAt)}
				</div>
				<div class="">{comment.comment.content}</div> -->
		<!-- {#each $comments[user.userId] as comment}
					<div class="">by {comment.userId}:</div>
					<div class="">({comment.rating})</div>
					<div class="mb-8 font-bold">{comment.reviewSummary}</div>
				{/each} -->
	{/each}
{/if}
