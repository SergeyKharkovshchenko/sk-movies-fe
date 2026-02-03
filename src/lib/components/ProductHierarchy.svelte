<script lang="ts">
	import { getProductHierarchy } from '$services/apiService';
	import { hierarchyStore } from '$store/store';
	import SidebarSearch from './SidebarSearch.svelte';
	import TreeView from './TreeView.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import { currentLanguage } from '$store/language';

	const dispatch = createEventDispatcher();

	export let showCheckboxes = false;

	let expandAll = false;
	let expanded = false;
	let searchStringHierarchy = '';
	let searchActiveHierarchy = false;
	let showNoResultsFoundMessage = false;

	function expandAllNodes() {
		expandAll = true;
	}

	function collapseAllNodes() {
		expandAll = false;
		expanded = false;
	}

	async function fetchProductHierarchy() {
		if ($hierarchyStore && $hierarchyStore.language === $currentLanguage) return;
		try {
			const result = await getProductHierarchy();

			if (result) {
				hierarchyStore.set({ ...result, language: $currentLanguage });
			} else {
				console.error('fetchData returned undefined');
			}
		} catch (error) {
			console.error('Error:', error);
		}
	}

	function resetProductHierarchy() {
		fetchProductHierarchy();
	}

	onMount(() => {
		// retrieve new product hierarchy when changing the language;
		currentLanguage.subscribe(() => resetProductHierarchy());
	});
</script>

{#if $hierarchyStore}
	<div>
		<SidebarSearch
			bind:searchString={searchStringHierarchy}
			bind:searchActive={searchActiveHierarchy}
			theme="content"
		/>
	</div>
	<div class="flex justify-between border-b-sky-300 border-b-[1px] mb-1.5">
		<button data-cy="products-expandAllButton" class="text-xs pb-1.5" on:click={expandAllNodes}>
			<i class="fa-solid fa-angles-down mr-2"></i>
			<span>Expand all</span>
		</button>
		<button data-cy="products-collapseAllButton" class="text-xs pr-[22px] pb-1.5" on:click={collapseAllNodes}>
			<i class="fa-solid fa-angles-right mr-2"></i>
			<span>Collapse all</span>
		</button>
	</div>
	<div class="-ml-2 overflow-y-auto sidebarMenuContainer grow">
		<div
			data-cy="products-show-No-Results-Found-Message"
			class="{showNoResultsFoundMessage ? '' : 'hidden'} text-gray-400 text-center text-xs mt-2"
		>
			No results found <br />
			check the spelling,<br />
			or try different keywords.
		</div>
		<div class="relative" class:hidden={showNoResultsFoundMessage} class:pl-4={showCheckboxes}>
			<TreeView
				tree={$hierarchyStore}
				{expandAll}
				bind:expanded
				bind:searchString={searchStringHierarchy}
				bind:showNoResultsFoundMessage
				searchActive={searchActiveHierarchy}
				{showCheckboxes}
				on:itemSelected={(item) => dispatch('itemSelected', item.detail)}
				on:checkboxChanged={(checkbox) => dispatch('checkboxChanged', checkbox.detail)}
			/>
		</div>
	</div>
{:else}
	<p>Loading...</p>
{/if}
