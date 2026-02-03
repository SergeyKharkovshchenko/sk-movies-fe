<script lang="ts">
	import { onMount } from 'svelte';
	let {
		selectedRowsPerPage = $bindable(),
		page = $bindable(),
		productsQty,
		pageStart = $bindable(),
		pageEnd = $bindable(),
		isPagePerPageSelectable = true
	} = $props();

	let footer_menu = $state<HTMLButtonElement>();
	let disablePreviousButton = $state(true);
	let disableNextButton = $state(false);
	let showLocaleMenu = $state(false);
	const options = [10, 20, 30, 40];

	$effect(() => {
		pageStart = selectedRowsPerPage * (page - 1);
		pageEnd = selectedRowsPerPage * page;
		disablePreviousButton = page == 1;
		disableNextButton = selectedRowsPerPage * page >= productsQty;
	});

	function changeRowsPerPage(RowsPerPage: number) {
		showLocaleMenu = false;
		selectedRowsPerPage = RowsPerPage;
		page = 1;
	}

	const handleClickOutside = (event: MouseEvent) => {
		if (footer_menu && !footer_menu.contains(event.target as Node)) {
			showLocaleMenu = false;
		}
	};

	onMount(() => {
		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<section class="flex justify-start h-12 p-3 pl-7 bg-zinc-50 tracking-wide text-xs text-gray-500 items-center">
	{#if productsQty}
		<div class="flex items-center text-gray-500 relative">
			<button
				class="cursor-pointer flex items-center py-1.5"
				bind:this={footer_menu}
				onclick={() => {
					showLocaleMenu = !showLocaleMenu;
				}}
			>
				<span data-cy="products-footer-selectedRowsPerPage" class="mr-2">Rows per page: {selectedRowsPerPage}</span>
				{#if isPagePerPageSelectable}
					<i class="fa-solid fa-angle-up mr-2"></i>
				{/if}
			</button>
			{#if showLocaleMenu}
				<div class="absolute z-10 h-5 -top-32 left-4">
					<ul>
						{#each options as option}
							<li
								class="cursor-pointer mx-3 w-36 p-2 bg-gray-200 text-center"
								class:font-bold={selectedRowsPerPage == option}
							>
								<button data-cy={`rows-per-page-${option}`} onclick={() => changeRowsPerPage(option)}>
									Rows per page: {option}
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
		<button
			aria-label="Previous page"
			data-cy="products-footer-previous-button"
			onclick={() => {
				page--;
			}}
			disabled={disablePreviousButton}
		>
			<i class="fa-solid fa-md fa-circle-arrow-left mr-2 {disablePreviousButton ? 'opacity-50' : 'cursor-pointer'}"></i>
		</button>
		<p data-cy="products-footer-pagenumber-totalpages" class="mr-2">
			{page}/ {Math.ceil(productsQty / selectedRowsPerPage)}
		</p>
		<button
			aria-label="Next page"
			data-cy="products-footer-next-button"
			onclick={() => {
				page++;
			}}
			disabled={disableNextButton}
		>
			<i class="fa-solid fa-md fa-circle-arrow-right mr-2 {disableNextButton ? 'opacity-50' : 'cursor-pointer'}"></i>
		</button>
	{/if}
</section>

<style>
</style>
