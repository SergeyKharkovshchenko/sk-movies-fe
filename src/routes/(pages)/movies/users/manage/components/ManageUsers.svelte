<script lang="ts">
	import { comments } from '$store/comments';
	import { usersStore, users } from '$store/users';
	import { onMount } from 'svelte';
	import UserCard from '$components/UserCard.svelte';

	async function handleShowAllUsers() {
		await usersStore.fetchUsers();
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
