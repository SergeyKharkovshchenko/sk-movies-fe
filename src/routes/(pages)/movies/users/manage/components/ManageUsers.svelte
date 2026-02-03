<script lang="ts">
	import Button from '$components/Button.svelte';
	import { commentsStore, comments } from '$store/comments';
	import { usersStore, users } from '$store/users';
	import { onMount } from 'svelte';
	import UserCard from './UseCard.svelte';

	async function handleShowAllUsers() {
		const result = await usersStore.fetchUsers();
	}

	async function handleShowAllCommentsByUser(userId: any) {
		const result = await commentsStore.getAllCommentsByUser(userId);
	}

	function formatIsoToDDMMYYYY(isoString: any) {
		const d = new Date(isoString);
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${day}.${month}.${year}`;
	}

	onMount(() => {
		handleShowAllUsers();
	});

	$effect(() => {
		// if ($comments.length){
		console.log($comments);
		// }
	});
</script>

<!-- <Button on:customclick={handleShowAllUsers}>Show all users</Button> -->
{#if $users.length}
	{#each $users as user}
		<UserCard {user} />
	{/each}
{/if}
