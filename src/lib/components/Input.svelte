<script lang="ts">
	import type { ChangeEvent } from '$lib/interfaces/generic/event';
	import TooltipComponent from './TooltipComponent.svelte';

	let {
		value = '',
		name = '',
		label = '',
		inputClass = '',
		required = false,
		error = null,
		tooltipInfo = undefined,
		disabled = false,
		oninput,
		placeholder = '',
		defaultValue = ''
	}: {
		value?: any;
		name?: string;
		label?: string;
		inputClass?: string;
		required?: boolean;
		error?: string | string[] | null;
		tooltipInfo?: string;
		disabled?: boolean;
		oninput?: (event: ChangeEvent<any>) => void;
		placeholder?: string;
		defaultValue?: string;
	} = $props();
</script>

<div class="flex flex-col">
	{#if label}
		<label for={name} class="text-primary-950 font-medium mb-1">
			{required ? '*' : ''}{label}:
		</label>
	{/if}
	<div class="relative flex items-center">
		<input
			class="px-2 py-1 border-[1px] rounded-sm text-primary-950 flex-grow transition-all mr-2 bg-white {inputClass} placeholder:text-primary-950"
			class:border-primary-400={!error && !disabled}
			class:border-red-500={error}
			class:border-secondary-400={disabled}
			class:bg-zinc-200={disabled}
			class:text-secondary-400={disabled}
			bind:value
			{name}
			id={name}
			{required}
			{disabled}
			{oninput}
			{placeholder}
			{defaultValue}
		/>
		{#if required}
			<TooltipComponent type={error ? 'error' : 'info'} tooltipInfo={error || tooltipInfo || ''} />
		{/if}
	</div>
</div>
