<!-- <script lang="ts">
	import { onMount, afterUpdate, createEventDispatcher } from 'svelte';
	import type { ProductHierarchyNode } from '$lib/interfaces/ProductHierarchyNode';
	import { baseFilterLevel } from '$store/store';
	import { selectedProducts } from '$store/templates';

	export let tree: ProductHierarchyNode;
	export let expandAll: boolean;
	export let expanded: boolean;
	export let showCheckboxes: boolean;
	export let searchString: string;
	export let searchActive: boolean = false;
	export let showNoResultsFoundMessage: boolean;
	export let productGroup: string | undefined = '';
	export let hierarchyPath: string = '';

	let localHierarchyPath = tree.nodeKey === 'producthierarchytree' ? '' : `${hierarchyPath} / ${tree.label?.text}`;
	let searchMatchCounter: number = 0;
	let checked = false;

	const dispatch = createEventDispatcher();

	$: expandAll === true ? (expanded = true) : (expanded = false);
	$: searchActive, checkIfStringExists(tree.children, searchString.toLowerCase());
	$: $selectedProducts, checkIfChecked();

	onMount(() => {
		if (tree.type === 'PRODUCT_GROUP') {
			productGroup = tree.nodeKey;
		}
	});

	afterUpdate(() => {
		searchMatchCounter = 0;
	});

	function checkIfChecked() {
		checked = false;
		checkIfCheckedWithRelations($selectedProducts);
	}

	function checkIfCheckedWithRelations(productList: any) {
		let isFound = productList?.some((p: any) => {
			return p.nodeKey === tree.nodeKey;
		});
		if (isFound) checked = true;
		if (!checked) {
			productList?.forEach((product: any) => {
				if (product.hasOwnProperty('children')) {
					checkIfCheckedWithRelations(product.children);
				}
			});
		}
	}

	// TODO find a better solution to handle undefined type in the function below
	function checkIfStringExists(nodes: ProductHierarchyNode[] | undefined, searchString: string) {
		showNoResultsFoundMessage = false;
		if (searchActive === false || !nodes || searchString === '') {
			return false;
		}
		nodes.forEach((node) => {
			if (node.label?.text?.toLowerCase().includes(searchString.toLowerCase())) {
				searchMatchCounter++;
				expanded = true;
			}
			if (node.children) {
				checkIfStringExists(node.children, searchString);
			}
		});
		// if no match has been found on the current nodes set expanded to false
		if (searchMatchCounter == 0) {
			expanded = false;
			showNoResultsFoundMessage = true;
			return false;
		}
	}

	// TODO find a better solution to handle undefined type in the function below
	// async function handleClick(treeType: string | undefined, treeLabelText: string) {
	async function handleClick(tree: any) {
		tree = { ...tree, PRODUCT_GROUP: productGroup };

		dispatch('itemSelected', tree);

		$baseFilterLevel.productGroup = tree.PRODUCT_GROUP;
		$baseFilterLevel.label = tree.label?.text;
		$baseFilterLevel.nodeKey = tree.nodeKey;
		$baseFilterLevel.type = tree.type;
		$baseFilterLevel.path = localHierarchyPath;
		$baseFilterLevel.productId = tree.id;
	}
</script>

<ul class="text-sm pl-2 my-1">
	<li>
		{#if showCheckboxes && tree.type != 'ROOT_NODE'}
			<div class="absolute left-0 w-4 h-4 publication-checkbox">
				<label class="flex items-center cursor-pointer relative">
					<input
						bind:checked
						on:change={() =>
							dispatch('checkboxChanged', {
								id: tree.id,
								nodeKey: tree.nodeKey,
								label: { text: tree.label.text, lang: tree.label.lang },
								type: tree.type,
								checked,
								children: tree.children
							})}
						type="checkbox"
						class="h-4 w-4 appearance-none"
						id="check-custom-icon"
					/>
					<i
						class="absolute left-0.5 top-2 fa-solid fa-square-plus fa-lg {checked
							? 'text-amber-400'
							: 'text-primary-950'} "
					></i>
				</label>
			</div>
		{/if}
		{#if tree.children && tree.children.length > 0}
			<button
				on:click={() => (expanded = !expanded)}
				aria-label="Expand"
				class="fa-solid fa-angle-down"
				class:-rotate-90={!expanded}
			></button>
		{/if}
		<button
			class="ml-0.5 w-40 text-left"
			class:font-semibold={expanded && tree.type !== 'PRODUCT'}
			on:click={() => handleClick(tree)}
		>
			<span class={tree.label?.text === $baseFilterLevel.label ? 'border-b-2 border-amber-500' : ''}>
				{tree.label?.text}
			</span>
		</button>
	</li>

	{#if tree.children}
		<div class:group={checked}>
			{#if checked}
				<div class="hidden group-hover:flex absolute left-6 mt-2 w-52 h-12 text-xs bg-primary-950 z-10">
					<span>If you want these nodes, <br /> first uncheck the group they belong to</span>
				</div>
			{/if}
			{#each tree.children as child}
				<div class="{expanded ? '' : 'hidden'} {checked ? 'opacity-50 pointer-events-none' : ''}">
					<svelte:self
						tree={child}
						{expandAll}
						{searchString}
						{searchActive}
						{showCheckboxes}
						{productGroup}
						hierarchyPath={localHierarchyPath}
						on:itemSelected={(item) => dispatch('itemSelected', item.detail)}
						on:checkboxChanged={(checkbox) => dispatch('checkboxChanged', checkbox.detail)}
					/>
				</div>
			{/each}
		</div>
	{/if}
</ul> -->
