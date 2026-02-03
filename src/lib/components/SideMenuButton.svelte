<script lang="ts">
	// import type { SideMenuButtonProperties } from '$lib/interfaces';

	let {
		datacy = '',
		disabled = false,
		icon = '',
		class: className,
		type = 'button' as 'button' | 'submit' | 'reset',
		loading = false,
		children,
		onclick
	} = $props();
</script>

<button
	data-cy={datacy}
	{type}
	class={'relative group h-[28px] w-full border items-center rounded-md bg-white text-sm font-medium text-primary-950/100 ' +
		'hover:bg-primary-950 hover:text-white hover:border-white ' +
		'group-disabled:border-gray-400 disabled:text-secondary-400 disabled:bg-primary-900 ' +
		className}
	disabled={disabled || loading}
	{onclick}
>
	{#if icon}
		<i class={'mr-2 text-primary-500 group-hover:text-white! group-disabled:text-secondary-400! ' + icon}></i>
	{/if}
	{@render children()}

	{#if loading}
		<div class="absolute top-0 left-0 right-0 w-full h-full flex items-center justify-center bg-green-500 rounded-md">
			<i class="fa-solid fa-circle-notch text-white animate-spin"></i>
		</div>
	{/if}
</button>
