<script lang="ts">
	import toast_ from 'svelte-hot-french-toast';
	import { goto } from '$app/navigation';
	export let toast: { customMessage: string; locationLink: string; id: string };
</script>

<div class={`flex items-center h-8`}>
	<span class="text-primary-950 mr-4">
		{toast.customMessage}
	</span>
	{#if toast.locationLink}
		<button class="text-primary-500 underline underline-offset-4 mr-4" on:click={() => goto(`${toast.locationLink}`)}
			>see location</button
		>
	{/if}

	<button on:click={() => toast_.dismiss(toast.id)} aria-label="Close">
		<i class="fa-regular fa-circle-xmark text-gray-400 fa-xl hover:cursor-pointer" />
	</button>
</div>
