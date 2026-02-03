<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let isSelected: boolean;
	export let icon: string = '';
	export let disabled = false;
</script>

<button
	class="w-full flex items-center py-2 pl-4 rounded text-white h-9 text-sm
	{isSelected === true ? 'bg-primary-950 ' : ''} 
	{isSelected === false ? 'border border-primary-950 cursor-pointer ' : ''} 
	hover:bg-primary-950/60 hover:border-0
	{$$restProps.class ?? ''} 
	{disabled ? '' : ''}"
	on:click={() => {
		if (!disabled) {
			dispatch('handleClick');
		}
	}}
>
	{#if icon}
		<i class={icon + ' mr-2'} />
	{/if}
	<slot />
</button>
