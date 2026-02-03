<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import { createEventDispatcher, onMount } from 'svelte';

  const SIDE_OPTIONS = ['top', 'right', 'bottom', 'left'] as const;
  const ALIGN_OPTIONS = ['start', 'center', 'end'] as const;
 type Side = (typeof SIDE_OPTIONS)[number];
 type Align = (typeof ALIGN_OPTIONS)[number];


	type Variant = 'primary' | 'secondary' | 'tertiary';
	type ButtonType = 'button' | 'submit' | 'reset';

	let loaded = false;

	const dispatch = createEventDispatcher();
	export let variant: Variant = 'primary';
	export let disabled = false;
	export let disabledTooltipMessage = 'Something went wrong';
	export let type: ButtonType = 'button';
	export let datacy = '';
	export let icon = '';
	export let loading = false;
	export let tooltipSide: Side = 'top';
	export let tooltipAlign: Align = 'center';
	onMount(() => (loaded = true));
</script>

{#if loaded}
	<Tooltip.Provider disabled={!disabled}>
		<Tooltip.Root delayDuration={0}>
			<Tooltip.Trigger>
				<button
					data-cy={datacy}
					data-variant={variant}
					{type}
					class="relative px-4 py-2 rounded-md
          {variant === 'primary' ? 'bg-primary-500 text-white hover:bg-primary-400 hover:text-white' : ''}
          {variant === 'secondary'
						? 'text-primary-500 border border-primary-500 hover:bg-primary-400 hover:text-white'
						: ''}
          {variant === 'tertiary' ? 'text-primary-500 underline hover:text-primary-400' : ''}
          {$$restProps.class ?? ''}
          {disabled
						? 'bg-transparent hover:bg-transparent text-gray-400! hover:text-gray-400 border-gray-400! opacity-50'
						: ''}
          "
					{disabled}
					on:click={() => {
						if (!loading) dispatch('customclick');
					}}
				>
					{#if icon}
						<i class={icon + ' mr-2'}></i>
					{/if}
					<slot />

					{#if loading}
						<div
							class="absolute top-0 left-0 right-0 w-full h-full flex items-center justify-center bg-green-500 rounded-md"
						>
							<i class="fa-solid fa-circle-notch text-white animate-spin"></i>
						</div>
					{/if}
				</button>
			</Tooltip.Trigger>
			<Tooltip.Content side={tooltipSide} align={tooltipAlign} sideOffset={10}>
				<span class="text-sm bg-primary-950 text-white py-1 px-2 rounded-sm">{disabledTooltipMessage}</span>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}
