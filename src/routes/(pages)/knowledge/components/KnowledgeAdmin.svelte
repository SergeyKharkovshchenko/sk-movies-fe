<script lang="ts">
	import { KnowledgeAPIService } from '$services/apiService';

	type OpState = 'idle' | 'loading' | 'ok' | 'error';

	interface StatusEntry {
		label: string;
		nodes?: number;
		relationships?: number;
		embeddings?: number;
		[key: string]: unknown;
	}

	let statusState = $state<OpState>('idle');
	let statusData = $state<StatusEntry[] | null>(null);

	let labelsState = $state<OpState>('idle');
	let labelsList = $state<string[]>([]);
	let deleteStates = $state<Record<string, OpState>>({});

	type CacheKey = 'all' | 'suggestGraph' | 'suggestSections';
	let cacheStates = $state<Record<CacheKey, OpState>>({
		all: 'idle',
		suggestGraph: 'idle',
		suggestSections: 'idle'
	});

	let open = $state(false);

	async function fetchStatus() {
		statusState = 'loading';
		statusData = null;
		try {
			const res = await KnowledgeAPIService.knowledgeStatus();
			if (Array.isArray(res)) {
				statusData = res;
			} else if (res?.knowledgeBases && Array.isArray(res.knowledgeBases)) {
				// BE returns { total, knowledgeBases: [{ label, nodes, relationships, embeddings }] }
				statusData = res.knowledgeBases;
			} else if (res && typeof res === 'object') {
				statusData = Object.entries(res).map(([label, v]) => ({
					label,
					...(typeof v === 'object' && v !== null ? (v as object) : {})
				}));
			}
			statusState = 'ok';
		} catch {
			statusState = 'error';
		}
		fetchLabels();
	}

	async function fetchLabels() {
		labelsState = 'loading';
		try {
			const res = await KnowledgeAPIService.knowledgeLabels();
			labelsList = Array.isArray(res) ? res : (res?.labels ?? []);
			labelsState = 'ok';
		} catch {
			labelsState = 'error';
		}
	}

	async function clearCache(key: CacheKey) {
		cacheStates = { ...cacheStates, [key]: 'loading' };
		try {
			await KnowledgeAPIService.knowledgeClearCache(key === 'all' ? undefined : key);
			cacheStates = { ...cacheStates, [key]: 'ok' };
			setTimeout(() => {
				cacheStates = { ...cacheStates, [key]: 'idle' };
			}, 2000);
		} catch {
			cacheStates = { ...cacheStates, [key]: 'error' };
		}
	}

	async function deleteLabel(label: string) {
		deleteStates = { ...deleteStates, [label]: 'loading' };
		try {
			await KnowledgeAPIService.knowledgeDelete(label);
			deleteStates = { ...deleteStates, [label]: 'ok' };
			labelsList = labelsList.filter((l) => l !== label);
			if (statusData) fetchStatus();
		} catch {
			deleteStates = { ...deleteStates, [label]: 'error' };
		}
	}
</script>

<div class="rounded-xl border border-zinc-200 bg-white text-xs overflow-hidden">
	<button
		onclick={() => (open = !open)}
		class="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
	>
		<span class="font-semibold text-zinc-500 uppercase tracking-wide text-[11px]"
			>Admin — Status & Labels</span
		>
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
		<div class="px-4 py-3 grid grid-cols-2 gap-6">
			<!-- Status column -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<span class="font-medium text-zinc-600">Status</span>
					<button
						onclick={fetchStatus}
						disabled={statusState === 'loading'}
						class="flex items-center gap-1 px-2 py-1 rounded-full border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-50 transition-colors"
					>
						{#if statusState === 'loading'}
							<span
								class="w-2.5 h-2.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"
							></span>
						{/if}
						Refresh
					</button>
				</div>
				{#if statusData && statusData.length > 0}
					<div class="rounded-lg border border-zinc-200 overflow-hidden">
						<table class="w-full text-[11px]">
							<thead>
								<tr class="bg-zinc-50 text-zinc-500">
									<th
										class="text-left px-2 py-1.5 font-medium"
										title="Knowledge base name — groups Neo4j graph, Postgres text chunks, and vector embeddings for one topic"
										>Knowledge Base</th
									>
									<th class="text-right px-2 py-1.5 font-medium" title="Neo4j graph nodes">Nodes</th
									>
									<th class="text-right px-2 py-1.5 font-medium" title="Neo4j relationships"
										>Rels</th
									>
									<th
										class="text-right px-2 py-1.5 font-medium"
										title="Vector embeddings (pgvector)">Emb</th
									>
								</tr>
							</thead>
							<tbody>
								{#each statusData as row (row.label)}
									<tr class="border-t border-zinc-100">
										<td class="px-2 py-1.5 font-mono text-zinc-700">{row.label}</td>
										<td class="px-2 py-1.5 text-right text-zinc-600">{row.nodes ?? '—'}</td>
										<td class="px-2 py-1.5 text-right text-zinc-600">{row.relationships ?? '—'}</td>
										<td class="px-2 py-1.5 text-right text-zinc-600">{row.embeddings ?? '—'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else if statusState === 'ok'}
					<p class="text-zinc-400">No data.</p>
				{/if}
			</div>

			<!-- Knowledge Bases column -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<span
						class="font-medium text-zinc-600"
						title="Each knowledge base is a named dataset: Neo4j graph + Postgres text chunks + pgvector embeddings"
						>Knowledge Bases</span
					>
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
						List
					</button>
				</div>
				{#if labelsList.length > 0}
					<div class="flex flex-wrap gap-1.5">
						{#each labelsList as label (label)}
							<div
								class="flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full border border-zinc-200 bg-zinc-50 font-mono text-zinc-700"
							>
								{label}
								<button
									onclick={() => deleteLabel(label)}
									disabled={deleteStates[label] === 'loading'}
									title="Delete '{label}' — removes: Neo4j graph nodes & relationships · Postgres text chunks · pgvector embeddings"
									aria-label="Delete knowledge base {label}"
									class="w-3.5 h-3.5 flex items-center justify-center rounded-full text-zinc-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
								>
									{#if deleteStates[label] === 'loading'}
										<span
											class="w-2 h-2 border border-zinc-400 border-t-transparent rounded-full animate-spin"
										></span>
									{:else if deleteStates[label] === 'ok'}
										✓
									{:else}
										<svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									{/if}
								</button>
							</div>
						{/each}
					</div>
				{:else if labelsState === 'ok'}
					<p class="text-zinc-400">No knowledge bases found.</p>
				{/if}
			</div>
		</div>

		<!-- Cache -->
		<div class="px-4 pb-3 border-t border-zinc-100 pt-3">
			<div class="flex items-center gap-3 flex-wrap">
				<span class="font-medium text-zinc-600 text-xs shrink-0">Cache</span>
				{#each [{ key: 'suggestGraph', label: 'suggestGraph', title: 'Clear cached suggest-graph LLM responses' }, { key: 'suggestSections', label: 'suggestSections', title: 'Clear cached suggest-sections LLM responses' }, { key: 'all', label: 'Clear all', title: 'Clear all LLM response caches (suggestGraph + suggestSections)' }] as const as item (item.key)}
					{@const s = cacheStates[item.key]}
					<button
						onclick={() => clearCache(item.key)}
						disabled={s === 'loading'}
						title={item.title}
						class="flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] transition-colors disabled:opacity-50"
						class:border-zinc-300={s === 'idle' || s === 'loading'}
						class:bg-white={s === 'idle' || s === 'loading'}
						class:hover:bg-zinc-50={s === 'idle'}
						class:border-emerald-300={s === 'ok'}
						class:bg-emerald-50={s === 'ok'}
						class:text-emerald-700={s === 'ok'}
						class:border-red-300={s === 'error'}
						class:bg-red-50={s === 'error'}
						class:text-red-600={s === 'error'}
					>
						{#if s === 'loading'}
							<span
								class="w-2.5 h-2.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"
							></span>
						{/if}
						{s === 'ok' ? '✓ cleared' : s === 'error' ? '✗ failed' : item.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
