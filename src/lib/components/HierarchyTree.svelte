<script lang="ts">
	import HierarchyNode from './HierarchyNode.svelte';

	export let relations: { parent: string; child: string }[] = [];

	let expandToken = 0;
	let collapseToken = 0;

	$: childrenMap = buildChildrenMap(relations);
	$: roots = findRoots(relations);

	function buildChildrenMap(rels: { parent: string; child: string }[]) {
		const map = new Map<string, string[]>();
		for (const { parent, child } of rels) {
			const siblings = map.get(child) ?? [];
			siblings.push(parent);
			map.set(child, siblings);
		}
		return map;
	}

	function findRoots(rels: { parent: string; child: string }[]) {
		const namesWithParent = new Set(rels.map((r) => r.parent));
		const allNames = new Set<string>();
		for (const { parent, child } of rels) {
			allNames.add(parent);
			allNames.add(child);
		}
		return [...allNames].filter((name) => !namesWithParent.has(name));
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
