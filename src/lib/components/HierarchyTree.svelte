<script lang="ts">
	import HierarchyNode from './HierarchyNode.svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';

	export let relations: { parent: string; child: string }[] = [];

	let expandToken = 0;
	let collapseToken = 0;

	$: childrenMap = buildChildrenMap(relations);
	$: roots = findRoots(relations);

	// Broad -> specific: each parent lists its children, and roots are the names that are never
	// anyone's child (e.g. "nut" -> "tree nut" -> "walnuts").
	function buildChildrenMap(rels: { parent: string; child: string }[]) {
		const map = new SvelteMap<string, string[]>();
		for (const { parent, child } of rels) {
			const children = map.get(parent) ?? [];
			if (!children.includes(child)) children.push(child);
			map.set(
				parent,
				children.sort((a, b) => a.localeCompare(b))
			);
		}
		return map;
	}

	function findRoots(rels: { parent: string; child: string }[]) {
		const namesWithParent = new Set(rels.map((r) => r.child));
		const allNames = new SvelteSet<string>();
		for (const { parent, child } of rels) {
			allNames.add(parent);
			allNames.add(child);
		}
		return [...allNames]
			.filter((name) => !namesWithParent.has(name))
			.sort((a, b) => a.localeCompare(b));
	}
</script>

<div class="flex justify-end gap-4 border-b border-zinc-200 pb-1.5 mb-1.5 text-xs">
	<button on:click={() => (expandToken += 1)}>
		<i class="fa-solid fa-angles-down mr-1"></i>
		Expand all
	</button>
	<button on:click={() => (collapseToken += 1)}>
		<i class="fa-solid fa-angles-right mr-1"></i>
		Collapse all
	</button>
</div>

<ul class="text-sm">
	{#each roots as root (root)}
		<HierarchyNode name={root} {childrenMap} {expandToken} {collapseToken} />
	{/each}
</ul>
