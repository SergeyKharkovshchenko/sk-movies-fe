<script lang="ts">
	let {
		isSelected,
		icon,
		disabled,
		handleClick,
		class: className,
		children
	}: {
		isSelected: boolean;
		icon: string;
		disabled: boolean;
		handleClick: () => void;
		class?: string;
		children(): any;
	} = $props();
</script>

<button
	class="p-2 mb-2 w-full text-left rounded-md disabled:opacity-50 disabled:border disabled:border-gray-500
	{className} 
	{disabled ? '' : ''}
	{isSelected ? 'bg-primary-950' : ''}"
	onclick={() => {
		if (!disabled) {
			handleClick();
		}
	}}
>
	{#if icon}
		<i class="mr-4 text-xl fa-solid {icon}"></i>
	{/if}
	{@render children()}
</button>
