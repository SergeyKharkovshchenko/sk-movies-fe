<script lang="ts">
	import { onMount } from 'svelte';
	import cytoscape from 'cytoscape';
	import { KnowledgeAPIService } from '$services/apiService';
	import HierarchyTree from '$components/HierarchyTree.svelte';
	import {
		buildLegend,
		formatValue,
		nodeClass,
		nodeSize,
		STRUCTURAL_CLASSES,
		visibleGraph,
		type GraphEdge,
		type GraphNode,
		type NodeDetails
	} from '$lib/utils/graphView';

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

	// The full graph as loaded; what Cytoscape shows is this minus hidden classes and the search.
	let allNodes = $state<GraphNode[]>([]);
	let allEdges = $state<GraphEdge[]>([]);
	let hiddenClasses = $state<Set<string>>(new Set());
	let query = $state('');
	const legend = $derived(buildLegend(allNodes));
	const colorOf = $derived(new Map(legend.map((l) => [l.name, l.color])));

	// Node detail panel
	let selected = $state<string | null>(null);
	let details = $state<NodeDetails | null>(null);
	let detailsState = $state<OpState>('idle');
	let detailsRequest = 0;

	// Parent-child pairs only (from the opt-in "deep analysis" taxonomy step at process time) --
	// rendered separately as a collapsible tree via the shared HierarchyTree component.
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
			allNodes = Array.isArray(res?.nodes) ? res.nodes : [];
			allEdges = Array.isArray(res?.edges) ? res.edges : [];
			hiddenClasses = new Set(
				buildLegend(allNodes)
					.filter((l) => l.structural)
					.map((l) => l.name)
			);
			selected = null;
			details = null;
			redraw();
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

	function redraw() {
		const shown = visibleGraph(allNodes, allEdges, hiddenClasses, query);
		nodeCount = shown.nodes.length;
		edgeCount = shown.edges.length;
		render(shown.nodes, shown.edges);
	}

	function toggleClass(name: string) {
		const next = new Set(hiddenClasses);
		if (next.has(name)) next.delete(name);
		else next.add(name);
		hiddenClasses = next;
		redraw();
	}

	async function select(name: string) {
		selected = name;
		details = null;
		detailsState = 'loading';
		const mine = ++detailsRequest;
		try {
			const res = await KnowledgeAPIService.knowledgeNode(selectedLabel, name);
			if (mine !== detailsRequest) return;
			if (!res || res.error) {
				detailsState = 'error';
				return;
			}
			details = res;
			detailsState = 'ok';
			cy?.nodes().unselect();
			cy?.getElementById(name).select();
		} catch {
			if (mine === detailsRequest) detailsState = 'error';
		}
	}

	function closeDetails() {
		detailsRequest++;
		selected = null;
		details = null;
		cy?.nodes().unselect();
	}

	function render(nodes: GraphNode[], edges: GraphEdge[]) {
		cy?.destroy();

		cy = cytoscape({
			container,
			elements: [
				...nodes.map((n) => ({
					data: {
						id: n.id,
						label: n.id,
						type: nodeClass(n),
						color: colorOf.get(nodeClass(n)) ?? '#71717a',
						size: nodeSize(n.degree, STRUCTURAL_CLASSES.has(nodeClass(n)))
					}
				})),
				...edges.map((e, i) => ({
					data: {
						id: `e${i}`,
						source: e.source,
						target: e.target,
						label: e.type,
						inferred: e.inferred ? 1 : 0
					}
				}))
			],
			style: [
				{
					selector: 'node',
					style: {
						label: 'data(label)',
						'font-size': 10,
						color: '#3f3f46',
						'background-color': 'data(color)',
						width: 'data(size)',
						height: 'data(size)',
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
					style: { 'font-size': 8 }
				},
				{
					selector: 'node:selected',
					style: { 'border-width': 3, 'border-color': '#18181b' }
				},
				{
					// Edges the importer derived (e.g. dish -> dairy via mascarpone) are dashed.
					selector: 'edge[inferred = 1]',
					style: { 'line-style': 'dashed' }
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
		cy.on('tap', 'node', (evt) => select(evt.target.id()));
		cy.on('tap', (evt) => {
			if (evt.target === cy) closeDetails();
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

			{#if graphState === 'ok' && allNodes.length > 0}
				<div class="flex items-center gap-2 flex-wrap">
					<input
						type="search"
						bind:value={query}
						oninput={redraw}
						placeholder="Search nodes…"
						aria-label="Search nodes"
						class="w-40 rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-400"
					/>
					{#each legend as l (l.name)}
						<button
							onclick={() => toggleClass(l.name)}
							aria-pressed={!hiddenClasses.has(l.name)}
							title={hiddenClasses.has(l.name) ? 'Show this class' : 'Hide this class'}
							class="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors"
							class:border-zinc-300={!hiddenClasses.has(l.name)}
							class:bg-white={!hiddenClasses.has(l.name)}
							class:text-zinc-700={!hiddenClasses.has(l.name)}
							class:border-zinc-200={hiddenClasses.has(l.name)}
							class:bg-zinc-50={hiddenClasses.has(l.name)}
							class:text-zinc-400={hiddenClasses.has(l.name)}
						>
							<span
								class="h-2.5 w-2.5 rounded-full"
								style="background: {l.color}; opacity: {hiddenClasses.has(l.name) ? 0.35 : 1}"
							></span>
							{l.name}
							<span class="tabular-nums text-zinc-400">{l.count}</span>
						</button>
					{/each}
				</div>
				<p class="text-[10px] text-zinc-400">
					Size shows how many links a node has. Dashed edges were derived from the taxonomy. Click a
					node for its details.
				</p>
			{/if}

			<div class="flex gap-3 items-stretch" class:hidden={labelsList.length === 0}>
				<!-- Cytoscape mounts here regardless of state -- kept in the DOM so bind:this is always
				     available by the time loadGraph() runs. -->
				<div
					bind:this={container}
					class="h-[500px] min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50"
				></div>

				{#if selected}
					<aside
						class="h-[500px] w-72 shrink-0 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3 space-y-3"
						aria-label="Node details"
					>
						<div class="flex items-start justify-between gap-2">
							<h3 class="font-semibold text-zinc-800 text-sm break-words">{selected}</h3>
							<button
								onclick={closeDetails}
								class="text-zinc-400 hover:text-zinc-700"
								aria-label="Close details">✕</button
							>
						</div>
						{#if detailsState === 'loading'}
							<p class="text-zinc-400">Loading…</p>
						{:else if detailsState === 'error' || !details}
							<p class="text-red-500">Could not load this node.</p>
						{:else}
							<div class="flex flex-wrap gap-1">
								{#each details.labels as lbl (lbl)}
									<span class="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600"
										>{lbl}</span
									>
								{/each}
								<span class="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600"
									>{details.degree} links</span
								>
							</div>

							{#if details.definition}
								<section>
									<h4 class="text-[10px] uppercase tracking-wide text-zinc-400">Definition</h4>
									<p class="text-zinc-700">{details.definition}</p>
								</section>
							{/if}
							{#if details.description}
								<section>
									<h4 class="text-[10px] uppercase tracking-wide text-zinc-400">From the source</h4>
									<p class="text-zinc-700">{details.description}</p>
								</section>
							{/if}
							{#if details.aliases.length > 0}
								<section>
									<h4 class="text-[10px] uppercase tracking-wide text-zinc-400">Also known as</h4>
									<p class="text-zinc-700">{details.aliases.join(', ')}</p>
								</section>
							{/if}
							{#if Object.keys(details.properties).length > 0}
								<section>
									<h4 class="text-[10px] uppercase tracking-wide text-zinc-400">Properties</h4>
									<dl class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
										{#each Object.entries(details.properties) as [k, v] (k)}
											<dt class="text-zinc-400 break-words">{k}</dt>
											<dd class="text-zinc-700 tabular-nums break-words">{formatValue(v)}</dd>
										{/each}
									</dl>
								</section>
							{/if}
							{#if details.ancestors.length > 0 || details.children.length > 0}
								<section>
									<h4 class="text-[10px] uppercase tracking-wide text-zinc-400">Taxonomy</h4>
									{#if details.ancestors.length > 0}
										<p class="text-zinc-700">
											<span class="text-zinc-400">is a kind of</span>
											{#each details.ancestors as a, i (a)}{i > 0 ? ', ' : ' '}<button
													class="underline decoration-dotted"
													onclick={() => select(a)}>{a}</button
												>{/each}
										</p>
									{/if}
									{#if details.children.length > 0}
										<p class="text-zinc-700">
											<span class="text-zinc-400">includes</span>
											{#each details.children as c, i (c)}{i > 0 ? ', ' : ' '}<button
													class="underline decoration-dotted"
													onclick={() => select(c)}>{c}</button
												>{/each}
										</p>
									{/if}
								</section>
							{/if}
							{#each [{ title: 'Links out', rows: details.outgoing }, { title: 'Links in', rows: details.incoming }] as group (group.title)}
								{#if group.rows.length > 0}
									<section>
										<h4 class="text-[10px] uppercase tracking-wide text-zinc-400">
											{group.title} ({group.rows.length})
										</h4>
										<ul class="space-y-0.5">
											{#each group.rows as r, i (i)}
												<li class="text-zinc-700">
													<span class="font-mono text-[10px] text-indigo-600">{r.type}</span>
													<button class="underline decoration-dotted" onclick={() => select(r.node)}
														>{r.node}</button
													>
													{#if r.inferred}<span class="text-zinc-400">
															(derived{r.via?.length ? ` via ${r.via.join(', ')}` : ''})</span
														>{/if}
												</li>
											{/each}
										</ul>
									</section>
								{/if}
							{/each}
							{#if details.tables.length > 0}
								<p class="text-[10px] text-zinc-400">From tables: {details.tables.join(', ')}</p>
							{/if}
						{/if}
					</aside>
				{/if}
			</div>

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
