<script lang="ts">
	import Button from '$components/Button.svelte';
	import { commentsStore, comments } from '$store/comments';

	let isCommentsOpen = $state(false);
	let { user } = $props();

	async function handleShowAllCommentsByUser(userId: any) {
		if (!$comments[userId]) {
			const result = await commentsStore.getAllCommentsByUser(userId);
		}
		isCommentsOpen = !isCommentsOpen;
	}

	function formatIsoToDDMMYYYY(isoString: any) {
		const d = new Date(isoString);
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${day}.${month}.${year}`;
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
