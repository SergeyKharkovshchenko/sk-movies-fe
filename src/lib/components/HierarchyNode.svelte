<script lang="ts">
	export let name: string;
	export let childrenMap: Map<string, string[]>;
	export let depth = 0;
	export let expandToken = 0;
	export let collapseToken = 0;

	let expanded = depth === 0;

	$: children = childrenMap.get(name) ?? [];
	$: childListId = `hierarchy-children-${depth}-${name.replace(/[^a-zA-Z0-9]+/g, '-')}`;
	$: if (expandToken) expanded = true;
	$: if (collapseToken) expanded = false;
</script>

<li>
	<div class="flex items-center gap-1.5 py-0.5">
		{#if children.length > 0}
			<button
				on:click={() => (expanded = !expanded)}
				aria-label={expanded ? `Collapse ${name}` : `Expand ${name}`}
				aria-expanded={expanded}
				aria-controls={children.length > 0 ? childListId : undefined}
				class="flex w-6 h-6 shrink-0 items-center justify-center text-xs text-zinc-500
					hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2
					focus-visible:outline-primary-500 rounded-sm"
			>
				{expanded ? '▾' : '▸'}
			</button>
			<button
				on:click={() => (expanded = !expanded)}
				class:font-semibold={depth === 0}
				class="text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2
					focus-visible:outline-primary-500 rounded-sm"
			>
				{name}
			</button>
		{:else}
			<span class="w-6 shrink-0"></span>
			<span class:font-semibold={depth === 0}>{name}</span>
		{/if}
	</div>

	{#if expanded && children.length > 0}
		<ul id={childListId} class="pl-4 border-l border-zinc-200 ml-2">
			{#each children as child (child)}
				<svelte:self name={child} {childrenMap} depth={depth + 1} {expandToken} {collapseToken} />
			{/each}
		</ul>
	{/if}
</li>
