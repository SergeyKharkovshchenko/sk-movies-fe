<script lang="ts">
	import { onMount } from 'svelte';
	import cytoscape from 'cytoscape';
	import { KnowledgeAPIService } from '$services/apiService';
	import HierarchyTree from '$components/HierarchyTree.svelte';

	type OpState = 'idle' | 'loading' | 'ok' | 'error';

	let container = $state<HTMLDivElement>();
	let cy: cytoscape.Core | null = null;

	let open = $state(false);
	let labelsList = $state<string[]>([]);
	let labelsState = $state<OpState>('idle');
	let selectedLabel = $state('');
	let graphState = $state<OpState>('idle');
	let nodeCount = $state(0);
	let edgeCount = $state(0);

	// Parent-child pairs only (from the opt-in "deep analysis" taxonomy step at process time) --
	// rendered separately as a collapsible tree via the same component the Bikes page uses.
	let hierarchyState = $state<OpState>('idle');
	let hierarchyRelations = $state<{ parent: string; child: string }[]>([]);

	async function fetchLabels() {
		labelsState = 'loading';
		try {
			const res = await KnowledgeAPIService.knowledgeLabels();
			labelsList = Array.isArray(res) ? res : (res?.labels ?? []);
			labelsState = 'ok';
			if (!selectedLabel && labelsList.length > 0) {
				selectedLabel = labelsList[0];
				loadSelected();
			}
		} catch {
			labelsState = 'error';
		}
	}

	function loadSelected() {
		loadGraph();
		loadHierarchy();
	}

	async function loadGraph() {
		if (!selectedLabel || !container) return;
		graphState = 'loading';
		try {
			const res = await KnowledgeAPIService.knowledgeGraph(selectedLabel);
			const nodes = Array.isArray(res?.nodes) ? res.nodes : [];
			const edges = Array.isArray(res?.edges) ? res.edges : [];
			nodeCount = nodes.length;
			edgeCount = edges.length;
			render(nodes, edges);
			graphState = 'ok';
		} catch {
			graphState = 'error';
		}
	}

	async function loadHierarchy() {
		if (!selectedLabel) return;
		hierarchyState = 'loading';
		try {
			const res = await KnowledgeAPIService.knowledgeHierarchy(selectedLabel);
			hierarchyRelations = Array.isArray(res) ? res : [];
			hierarchyState = 'ok';
		} catch {
			hierarchyState = 'error';
		}
	}

	function render(
		nodes: { id: string; labels: string[] }[],
		edges: { source: string; target: string; type: string }[]
	) {
		cy?.destroy();

		cy = cytoscape({
			container,
			elements: [
				...nodes.map((n) => ({
					data: { id: n.id, label: n.id, type: n.labels?.[0] ?? 'Entity' }
				})),
				...edges.map((e, i) => ({
					data: { id: `e${i}`, source: e.source, target: e.target, label: e.type }
				}))
			],
			style: [
				{
					selector: 'node',
					style: {
						label: 'data(label)',
						'font-size': 10,
						color: '#3f3f46',
						'background-color': '#0ea5e9',
						width: 28,
						height: 28,
						'text-valign': 'bottom',
						'text-margin-y': 4,
						'text-wrap': 'ellipsis',
						'text-max-width': '100px'
					}
				},
				{
					// Structural nodes (document sections/chunks) vs. actual extracted entities --
					// dim the former so the real graph reads clearly.
					selector: 'node[type = "Section"], node[type = "Chunk"]',
					style: { 'background-color': '#d4d4d8', width: 18, height: 18, 'font-size': 8 }
				},
				{
					selector: 'edge',
					style: {
						label: 'data(label)',
						'font-size': 8,
						color: '#71717a',
						width: 1.5,
						'line-color': '#d4d4d8',
						'target-arrow-color': '#d4d4d8',
						'target-arrow-shape': 'triangle',
						'curve-style': 'bezier',
						'text-rotation': 'autorotate'
					}
				}
			],
			layout: { name: 'cose', animate: false, padding: 30 }
		});
	}

	let hasLoadedOnce = false;

	function toggleOpen() {
		open = !open;
		// Fetch on first expand rather than on page mount (this section starts collapsed, and
		// bind:this={container} isn't in the DOM until it's open) -- matches KnowledgeAdmin's
		// manual-refresh convention rather than querying Neo4j on every page load regardless of
		// whether this panel gets opened at all.
		if (open && !hasLoadedOnce) {
			hasLoadedOnce = true;
			fetchLabels();
		}
	}

	onMount(() => () => cy?.destroy());
</script>

<div class="rounded-xl border border-zinc-200 bg-white text-xs overflow-hidden">
	<button
		onclick={toggleOpen}
		class="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
	>
		<span class="font-semibold text-zinc-500 uppercase tracking-wide text-[11px]">Graph View</span>
		<svg
			class="w-3.5 h-3.5 text-zinc-400 transition-transform"
			class:rotate-180={open}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if open}
		<div class="px-4 py-3 space-y-3">
			<div class="flex items-center gap-2 flex-wrap">
				<span class="font-medium text-zinc-600">Knowledge base</span>
				<select
					bind:value={selectedLabel}
					onchange={loadSelected}
					disabled={labelsState === 'loading' || labelsList.length === 0}
					class="rounded-full border border-zinc-300 bg-white px-2 py-1 text-[11px] disabled:opacity-50"
				>
					{#each labelsList as label (label)}
						<option value={label}>{label}</option>
					{/each}
				</select>
				<button
					onclick={fetchLabels}
					disabled={labelsState === 'loading'}
					class="flex items-center gap-1 px-2 py-1 rounded-full border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-50 transition-colors"
				>
					{#if labelsState === 'loading'}
						<span
							class="w-2.5 h-2.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"
						></span>
					{/if}
					Refresh labels
				</button>
				{#if graphState === 'ok'}
					<span class="text-zinc-400">{nodeCount} nodes · {edgeCount} edges</span>
				{/if}
			</div>

			{#if labelsState === 'ok' && labelsList.length === 0}
				<p class="text-zinc-400">No knowledge bases found.</p>
			{:else if graphState === 'error'}
				<p class="text-red-500">Failed to load graph for "{selectedLabel}".</p>
			{/if}

			<!-- Cytoscape mounts here regardless of state -- kept in the DOM so bind:this is always
			     available by the time loadGraph() runs. -->
			<div
				bind:this={container}
				class="h-[500px] w-full rounded-lg border border-zinc-200 bg-zinc-50"
				class:hidden={labelsList.length === 0}
			></div>

			<!-- Hierarchy tree: parent-child pairs only, from the opt-in deep-analysis taxonomy
			     step. Empty unless that toggle was checked when this knowledge base was built. -->
			{#if labelsList.length > 0}
				<div class="border-t border-zinc-100 pt-3">
					<h3 class="font-medium text-zinc-600 mb-1.5">Hierarchy Tree (parent-child only)</h3>
					{#if hierarchyState === 'loading'}
						<p class="text-zinc-400 flex items-center gap-1.5">
							<span
								class="w-2.5 h-2.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"
							></span>
							Loading…
						</p>
					{:else if hierarchyState === 'error'}
						<p class="text-red-500">Failed to load hierarchy for "{selectedLabel}".</p>
					{:else if hierarchyState === 'ok' && hierarchyRelations.length === 0}
						<p class="text-zinc-400">
							No parent-child relations found for "{selectedLabel}" — this knowledge base was likely
							built without the "deep analysis (taxonomy)" option checked.
						</p>
					{:else if hierarchyRelations.length > 0}
						<HierarchyTree relations={hierarchyRelations} />
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
