<script lang="ts">
	import { onMount } from 'svelte';
	import type { DropdownSelector } from '$lib/interfaces';
	import TooltipComponent from '$lib/components/TooltipComponent.svelte';

	interface $$Events {
		change: CustomEvent<{ text: string; value: string }>;
	}

	let {
		disabled = false,
		options,
		defaultValue,
		label = '',
		name = '',
		required = false,
		selected = $bindable({ text: '', value: '' }),
		error = null,
		class: className,
		tooltipInfo = '',
		onChange
	}: DropdownSelector = $props();

	let showMenu = $state(false);
	let selectorMenu: HTMLElement | undefined = $state();
	let selectorButton: HTMLElement | undefined = $state();

	function handleSortByPublicationsClick(selectedOption: { text: string; value: string }) {
		showMenu = false;
		selected = selectedOption;
		if (onChange) {
			onChange({ name, text: selectedOption.text, value: selectedOption.value });
		}
	}

	const handleClickOutside = (event: Event) => {
		if (
			selectorButton &&
			!selectorButton.contains(event.target as Node) &&
			selectorMenu &&
			!selectorMenu.contains(event.target as Node) &&
			showMenu
		) {
			showMenu = false;
		}
	};

	onMount(() => {
		if (defaultValue && (!selected.text || !selected.value)) {
			selected = defaultValue;
		}
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function toggleMenu() {
		if (!disabled) {
			showMenu = !showMenu;
		}
	}
</script>

<div class={`flex flex-col ${className ?? ''}`} data-name={name}>
	{#if label}
		<label for={name} class="text-primary-900 font-medium mb-1">
			{required ? '*' : ''}{label}:
		</label>
	{/if}

	<div class="relative flex items-center">
		<div
			role="button"
			tabindex="0"
			class="relative flex items-center rounded-sm border px-2.5 hover:cursor-pointer w-full mr-2 bg-white"
			class:border-primary-400={!error && !disabled}
			class:border-red-500={error}
			class:border-secondary-400={disabled}
			class:bg-zinc-200={disabled}
			class:text-secondary-400={disabled}
			bind:this={selectorButton}
			onclick={toggleMenu}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					toggleMenu();
				}
			}}
		>
			<p class="flex-grow mr-2.5 py-1 text-primary-950 truncate w-64" class:text-secondary-400={disabled}>
				{selected.text || defaultValue?.text || 'Select'}
			</p>
			<i
				class="fa-solid fa-chevron-right text-primary-950 {showMenu ? 'rotate-90' : ''}"
				class:text-secondary-400={disabled}
			></i>
			{#if showMenu && !disabled}
				<div
					bind:this={selectorMenu}
					role="listbox"
					class="absolute z-10 top-12 left-0 border rounded-sm shadow-lg border-zinc-200 px-2.5 pt-3 pb-2 text-green-950 bg-white overflow-y-auto max-h-[260px] w-full"
				>
					<ul>
						{#each options as option}
							<li
								role="option"
								tabindex="0"
								aria-disabled={option.disabled}
								aria-selected={selected.value === option.value}
								class="p-2 flex items-center cursor-pointer bg-zinc-100 text-left rounded-sm text-sm mb-1 break-all
                aria-selected:bg-primary-100 hover:bg-zinc-200
                aria-disabled:pointer-events-none aria-disabled:opacity-40"
								onclick={() => handleSortByPublicationsClick(option)}
								onkeydown={(e) => {
									if ((e.key === 'Enter' || e.key === ' ') && !option.disabled) {
										e.preventDefault();
										handleSortByPublicationsClick(option);
									}
								}}
							>
								<p>{option.text}</p>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
		{#if required}
			<TooltipComponent type={error ? 'error' : 'info'} tooltipInfo={error || tooltipInfo || ''} />
		{/if}
	</div>
</div>
