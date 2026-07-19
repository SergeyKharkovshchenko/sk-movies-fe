<script lang="ts">
	import { onMount } from 'svelte';
	import { KnowledgeAPIService } from '$services/apiService';
	import { fetchAuthToken } from '$lib/utils/token';
	import KnowledgeChat from './KnowledgeChat.svelte';
	import { napoleonSampleText } from '$lib/data/napoleonSample';

	const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

	type WizardStep = 1 | 2 | 3 | 4 | 5;

	interface Entity {
		name: string;
		type: string;
		description?: string;
	}

	interface EntityRelationship {
		source: string;
		target: string;
		relationship: string;
	}

	interface GraphSection {
		title: string;
		text: string;
		forEntity?: string;
	}

	interface StepInfo {
		done: boolean;
		detail?: string;
		progress?: number;
	}

	interface SectionProgress {
		title: string;
		forEntity: string;
		state: 'pending' | 'active' | 'done';
		chunk: StepInfo;
		extract: StepInfo;
		graph: StepInfo;
		embed: StepInfo;
	}

	interface EntityProgress {
		name: string;
		type: string;
		stored: boolean;
	}

	const STEP_LABELS: Record<WizardStep, string> = {
		1: 'Input',
		2: 'Entities',
		3: 'Sections',
		4: 'Processing',
		5: 'Chat'
	};

	let step = $state<WizardStep>(1);
	let label = $state('napoleon');
	let readyLabels = $state<string[]>([]);

	onMount(() => {
		KnowledgeAPIService.knowledgeLabels()
			.then((res) => {
				readyLabels = Array.isArray(res) ? res : (res?.labels ?? []);
			})
			.catch(() => {});
	});
	let rawText = $state('');

	// Step 2+3 data
	let suggesting = $state(false);
	let suggestError = $state('');
	let entities = $state<Entity[]>([]);
	let entityRelationships = $state<EntityRelationship[]>([]);
	let graphSections = $state<GraphSection[]>([]);

	// Step 4 SSE progress
	let processing = $state(false);
	let processError = $state('');
	let entityProgress = $state<EntityProgress[]>([]);
	let sectionProgress = $state<SectionProgress[]>([]);
	let relationshipsStored = $state(false);
	let entitiesEmbedded = $state(false);
	let processingDone = $state(false);
	let labelAlreadyExists = $state(false);
	let streamEnded = $state(false);
	let completionStats = $state<{ nodes: number; relationships: number } | null>(null);
	let logEl = $state<HTMLElement | undefined>(undefined);
	let sseLog = $state<string[]>([]);

	let allEntitiesStored = $derived(
		entityProgress.length > 0 && entityProgress.every((e) => e.stored)
	);
	let allSectionsDone = $derived(
		sectionProgress.length > 0 && sectionProgress.every((s) => s.state === 'done')
	);
	// Stream closed without an explicit "complete" event but everything looks finished
	let looksComplete = $derived(
		streamEnded && !processingDone && allEntitiesStored && allSectionsDone
	);
	// Stream closed without an explicit "complete" event and some work is unfinished
	let looksIncomplete = $derived(streamEnded && !processingDone && !looksComplete);

	// Step 2 entity editing
	let newEntityName = $state('');
	let newEntityType = $state('');
	let newRelSource = $state('');
	let newRelTarget = $state('');
	let newRelType = $state('');

	$effect(() => {
		if (sseLog.length > 0) {
			setTimeout(() => logEl?.scrollTo({ top: logEl.scrollHeight, behavior: 'smooth' }), 0);
		}
	});

	async function runSuggestGraph() {
		if (!rawText.trim()) return;
		suggesting = true;
		suggestError = '';
		entities = [];
		entityRelationships = [];
		graphSections = [];
		try {
			const res = await KnowledgeAPIService.suggestGraph(rawText);
			entities = (res?.entities ?? []).map((e: Entity) => ({
				name: e.name,
				type: e.type,
				description: e.description ?? ''
			}));
			entityRelationships = (res?.entityRelationships ?? res?.relationships ?? []).map(
				(r: Record<string, string>) => ({
					source: r.source ?? r.from ?? '',
					relationship: r.relationship ?? r.predicate ?? '',
					target: r.target ?? r.to ?? ''
				})
			);
			graphSections = (res?.sections ?? []).map((s: GraphSection) => ({
				title: s.title,
				text: s.text,
				forEntity: s.forEntity ?? ''
			}));
			step = 2;
		} catch (err) {
			suggestError = `Failed to analyze: ${err}`;
		} finally {
			suggesting = false;
		}
	}

	function addEntity() {
		if (!newEntityName.trim()) return;
		entities = [
			...entities,
			{ name: newEntityName.trim(), type: newEntityType.trim() || 'Entity', description: '' }
		];
		newEntityName = '';
		newEntityType = '';
	}

	function removeEntity(i: number) {
		entities = entities.filter((_, idx) => idx !== i);
	}

	function addRelationship() {
		if (!newRelSource.trim() || !newRelTarget.trim() || !newRelType.trim()) return;
		entityRelationships = [
			...entityRelationships,
			{ source: newRelSource.trim(), target: newRelTarget.trim(), relationship: newRelType.trim() }
		];
		newRelSource = '';
		newRelTarget = '';
		newRelType = '';
	}

	function removeRelationship(i: number) {
		entityRelationships = entityRelationships.filter((_, idx) => idx !== i);
	}

	function removeSection(i: number) {
		graphSections = graphSections.filter((_, idx) => idx !== i);
	}

	async function runProcessGraph() {
		processing = true;
		processError = '';
		sseLog = [];
		relationshipsStored = false;
		entitiesEmbedded = false;
		processingDone = false;
		labelAlreadyExists = false;
		streamEnded = false;
		completionStats = null;

		entityProgress = entities.map((e) => ({ name: e.name, type: e.type, stored: false }));
		sectionProgress = graphSections.map((s) => ({
			title: s.title,
			forEntity: s.forEntity ?? '',
			state: 'pending' as const,
			chunk: { done: false },
			extract: { done: false },
			graph: { done: false },
			embed: { done: false }
		}));

		try {
			const token = await fetchAuthToken();
			const headers: Record<string, string> = { 'Content-Type': 'application/json' };
			if (token) headers['Authorization'] = `Bearer ${token}`;

			const res = await fetch(`${API_URL}/knowledge/process-graph`, {
				method: 'POST',
				headers,
				body: JSON.stringify({ label, entities, sections: graphSections, entityRelationships })
			});

			if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			let currentEventType = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() ?? '';
				for (const line of lines) {
					if (line.startsWith('event:')) {
						currentEventType = line.slice(6).trim();
					} else if (line.startsWith('data:')) {
						const raw = line.slice(5).trim();
						if (!raw || raw === '[DONE]') continue;
						try {
							const parsed = JSON.parse(raw);
							// Inject SSE event type into payload if data doesn't carry its own type field
							if (currentEventType && !parsed.event && !parsed.type) {
								parsed.event = currentEventType;
							}
							handleSSEEvent(parsed);
						} catch {
							sseLog = [...sseLog, raw];
						}
					} else if (line === '') {
						currentEventType = '';
					}
				}
			}
			streamEnded = true;
		} catch (err) {
			processError = `Processing failed: ${err}`;
		} finally {
			processing = false;
		}
	}

	function handleSSEEvent(parsed: Record<string, unknown>) {
		const type = (parsed.event ?? parsed.type ?? '') as string;
		const msg = (parsed.message ??
			parsed.name ??
			parsed.title ??
			parsed.data ??
			JSON.stringify(parsed)) as string;

		sseLog = [...sseLog, `[${type}] ${msg}`];

		if (type === 'entity_stored') {
			const name = (parsed.entity ?? parsed.name ?? '') as string;
			entityProgress = entityProgress.map((ep) =>
				ep.name === name ? { ...ep, stored: true } : ep
			);
		} else if (type === 'section_start') {
			const title = (parsed.section ?? parsed.title ?? '') as string;
			sectionProgress = sectionProgress.map((sp) =>
				sp.title === title ? { ...sp, state: 'active' } : sp
			);
		} else if (type === 'chunk_done') {
			const title = (parsed.section ?? parsed.title ?? '') as string;
			const n = parsed.chunks ?? parsed.count ?? '';
			sectionProgress = sectionProgress.map((sp) =>
				sp.title === title
					? { ...sp, chunk: { done: true, detail: n ? `(${n} chunks)` : undefined } }
					: sp
			);
		} else if (type === 'extract_progress') {
			const title = (parsed.section ?? parsed.title ?? '') as string;
			const x = parsed.current ?? parsed.x ?? '';
			const y = parsed.total ?? parsed.y ?? '';
			sectionProgress = sectionProgress.map((sp) =>
				sp.title === title
					? { ...sp, extract: { done: false, detail: x && y ? `(${x}/${y})` : undefined } }
					: sp
			);
		} else if (type === 'graph_stored') {
			const title = (parsed.section ?? parsed.title ?? '') as string;
			const n = parsed.triples ?? parsed.count ?? '';
			sectionProgress = sectionProgress.map((sp) =>
				sp.title === title
					? {
							...sp,
							extract: { ...sp.extract, done: true },
							graph: { done: true, detail: n ? `(${n} triples)` : undefined }
						}
					: sp
			);
		} else if (type === 'embed_progress') {
			const title = (parsed.section ?? parsed.title ?? '') as string;
			const n = parsed.nodes ?? parsed.count ?? '';
			const prog = typeof parsed.progress === 'number' ? parsed.progress : undefined;
			sectionProgress = sectionProgress.map((sp) =>
				sp.title === title
					? {
							...sp,
							embed: { done: false, detail: n ? `(${n} nodes)` : undefined, progress: prog }
						}
					: sp
			);
		} else if (type === 'section_done') {
			const title = (parsed.section ?? parsed.title ?? '') as string;
			sectionProgress = sectionProgress.map((sp) =>
				sp.title === title
					? {
							...sp,
							state: 'done',
							chunk: { ...sp.chunk, done: true },
							extract: { ...sp.extract, done: true },
							graph: { ...sp.graph, done: true },
							embed: { ...sp.embed, done: true }
						}
					: sp
			);
		} else if (type === 'relationships_stored') {
			relationshipsStored = true;
		} else if (type === 'entities_embedded') {
			entitiesEmbedded = true;
		} else if (type === 'complete' || type === 'done') {
			processingDone = true;
			const nodes = (parsed.nodes ?? parsed.node_count ?? 0) as number;
			const relationships = (parsed.relationships ?? parsed.relationship_count ?? 0) as number;
			if (nodes || relationships) completionStats = { nodes, relationships };
		} else if (type === 'already_exists' || type === 'already_ready') {
			labelAlreadyExists = true;
			const nodes = (parsed.nodes ?? 0) as number;
			if (nodes) completionStats = { nodes, relationships: 0 };
		} else if (type === 'error') {
			processError = `Error: ${msg}`;
		}
	}
</script>

<!-- Step indicator -->
<div class="flex items-center gap-0 mb-6">
	{#each [1, 2, 3, 4, 5] as s (s)}
		{@const past = step > s}
		{@const current = step === s}
		{@const future = step < s}
		{@const chatReady = s === 5 && readyLabels.length > 0 && !current && !past}
		<div class="flex items-center gap-0">
			<button
				onclick={() => (past || chatReady) && (step = s as WizardStep)}
				class="flex flex-col items-center gap-1 cursor-default"
				class:cursor-pointer={past || chatReady}
				title={chatReady ? `Chat ready — ${readyLabels.join(', ')}` : undefined}
				aria-label="Step {s}"
			>
				<div
					class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all"
					class:bg-emerald-500={past}
					class:border-emerald-500={past}
					class:text-white={past || current || chatReady}
					class:bg-zinc-800={current}
					class:border-zinc-800={current}
					class:bg-indigo-500={chatReady}
					class:border-indigo-500={chatReady}
					class:bg-white={future && !chatReady}
					class:border-zinc-300={future && !chatReady}
					class:text-zinc-400={future && !chatReady}
				>
					{#if past}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					{:else}
						{s}
					{/if}
				</div>
				<span
					class="text-[10px] font-medium"
					class:text-emerald-600={past}
					class:text-zinc-800={current}
					class:text-indigo-600={chatReady}
					class:text-zinc-400={future && !chatReady}
				>
					{STEP_LABELS[s as WizardStep]}
				</span>
			</button>
			{#if s < 5}
				<div
					class="h-0.5 w-10 mx-1 mb-4 rounded-full transition-colors"
					class:bg-emerald-400={step > s}
					class:bg-zinc-200={step <= s}
				></div>
			{/if}
		</div>
	{/each}
</div>

<!-- Step 1: Input -->
{#if step === 1}
	<div class="space-y-4">
		{#if readyLabels.length > 0}
			<div
				class="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs"
			>
				<div class="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
				<span class="text-indigo-700">
					{readyLabels.length === 1
						? `'${readyLabels[0]}' is ready to chat`
						: `${readyLabels.length} knowledge bases ready: ${readyLabels.join(', ')}`}
				</span>
				<button
					onclick={() => {
						if (!readyLabels.includes(label)) label = readyLabels[0];
						step = 5;
					}}
					class="ml-auto shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
				>
					Open Chat →
				</button>
			</div>
		{/if}
		<div>
			<label class="block text-sm font-medium text-zinc-700 mb-1" for="kg-label"
				>Knowledge Base Label</label
			>
			<input
				id="kg-label"
				bind:value={label}
				class="w-full max-w-xs border border-zinc-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400"
				placeholder="napoleon"
			/>
		</div>
		<div>
			<div class="flex items-center justify-between mb-1">
				<label class="block text-sm font-medium text-zinc-700" for="kg-text">Raw Text</label>
				<button
					onclick={() => {
						rawText = napoleonSampleText;
						label = 'napoleon';
					}}
					class="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
					title="Load Napoleon / Waterloo / Talleyrand sample text"
				>
					Load sample ↓
				</button>
			</div>
			<textarea
				id="kg-text"
				bind:value={rawText}
				rows="12"
				class="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-y"
				placeholder="Paste raw text to be ingested into the knowledge graph…"
			></textarea>
		</div>
		{#if suggestError}
			<p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
				{suggestError}
			</p>
		{/if}
		<button
			onclick={runSuggestGraph}
			disabled={!rawText.trim() || suggesting}
			class="flex items-center gap-2 px-5 py-2 rounded-lg bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
		>
			{#if suggesting}
				<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
				></span>
				Analyzing…
			{:else}
				Analyze →
			{/if}
		</button>
	</div>
{/if}

<!-- Step 2: Entity & Structure -->
{#if step === 2}
	<div class="space-y-6">
		<div class="grid grid-cols-2 gap-6">
			<!-- Entities -->
			<div class="space-y-2">
				<h3 class="text-sm font-semibold text-zinc-700">Entities</h3>
				<div class="rounded-lg border border-zinc-200 overflow-hidden">
					<table class="w-full text-xs">
						<thead>
							<tr class="bg-zinc-50 text-zinc-500">
								<th class="text-left px-2 py-1.5 font-medium">Name</th>
								<th class="text-left px-2 py-1.5 font-medium">Type</th>
								<th class="w-6"></th>
							</tr>
						</thead>
						<tbody>
							{#each entities as entity, i (i)}
								<tr class="border-t border-zinc-100">
									<td class="px-2 py-1.5">
										<input
											bind:value={entity.name}
											class="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-zinc-300 rounded px-1"
										/>
									</td>
									<td class="px-2 py-1.5">
										<input
											bind:value={entity.type}
											class="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-zinc-300 rounded px-1"
										/>
									</td>
									<td class="px-1">
										<button
											onclick={() => removeEntity(i)}
											class="text-zinc-300 hover:text-red-500 transition-colors"
											aria-label="Remove entity"
										>
											<svg
												class="w-3.5 h-3.5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</td>
								</tr>
							{/each}
							<tr class="border-t border-zinc-100 bg-zinc-50">
								<td class="px-2 py-1">
									<input
										bind:value={newEntityName}
										list="entity-names"
										placeholder="Name…"
										class="w-full border-0 bg-transparent text-xs focus:outline-none"
									/>
									<datalist id="entity-names">
										{#each entities as e (e.name)}<option value={e.name}></option>{/each}
									</datalist>
								</td>
								<td class="px-2 py-1">
									<input
										bind:value={newEntityType}
										list="entity-types"
										placeholder="Type…"
										class="w-full border-0 bg-transparent text-xs focus:outline-none"
									/>
									<datalist id="entity-types">
										{#each [...new Set(entities.map((e) => e.type))] as t (t)}<option value={t}
											></option>{/each}
									</datalist>
								</td>
								<td class="px-1">
									<button
										onclick={addEntity}
										disabled={!newEntityName.trim()}
										class="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors"
										aria-label="Add entity"
									>
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 4v16m8-8H4"
											/>
										</svg>
									</button>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- Relationships -->
			<div class="space-y-2">
				<h3 class="text-sm font-semibold text-zinc-700">Relationships</h3>
				<div class="rounded-lg border border-zinc-200 overflow-hidden">
					<table class="w-full text-xs">
						<thead>
							<tr class="bg-zinc-50 text-zinc-500">
								<th class="text-left px-2 py-1.5 font-medium">Source</th>
								<th class="text-left px-2 py-1.5 font-medium">Relationship</th>
								<th class="text-left px-2 py-1.5 font-medium">Target</th>
								<th class="w-6"></th>
							</tr>
						</thead>
						<tbody>
							{#each entityRelationships as rel, i (i)}
								<tr class="border-t border-zinc-100">
									<td class="px-2 py-1.5">
										<input
											bind:value={rel.source}
											class="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-zinc-300 rounded px-1"
										/>
									</td>
									<td class="px-2 py-1.5">
										<input
											bind:value={rel.relationship}
											class="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-zinc-300 rounded px-1 font-mono text-indigo-600"
										/>
									</td>
									<td class="px-2 py-1.5">
										<input
											bind:value={rel.target}
											class="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-zinc-300 rounded px-1"
										/>
									</td>
									<td class="px-1">
										<button
											onclick={() => removeRelationship(i)}
											class="text-zinc-300 hover:text-red-500 transition-colors"
											aria-label="Remove relationship"
										>
											<svg
												class="w-3.5 h-3.5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</td>
								</tr>
							{/each}
							<tr class="border-t border-zinc-100 bg-zinc-50 text-[11px]">
								<td class="px-2 py-1">
									<input
										bind:value={newRelSource}
										list="rel-sources"
										placeholder="Source…"
										class="w-full border-0 bg-transparent focus:outline-none"
									/>
									<datalist id="rel-sources"
										>{#each entities as e (e.name)}<option value={e.name}></option>{/each}</datalist
									>
								</td>
								<td class="px-2 py-1">
									<input
										bind:value={newRelType}
										placeholder="RELATION…"
										class="w-full border-0 bg-transparent font-mono text-indigo-500 focus:outline-none"
									/>
								</td>
								<td class="px-2 py-1">
									<input
										bind:value={newRelTarget}
										list="rel-targets"
										placeholder="Target…"
										class="w-full border-0 bg-transparent focus:outline-none"
									/>
									<datalist id="rel-targets"
										>{#each entities as e (e.name)}<option value={e.name}></option>{/each}</datalist
									>
								</td>
								<td class="px-1">
									<button
										onclick={addRelationship}
										disabled={!newRelSource.trim() || !newRelTarget.trim() || !newRelType.trim()}
										class="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors"
										aria-label="Add relationship"
									>
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 4v16m8-8H4"
											/>
										</svg>
									</button>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<div class="flex gap-2">
			<button
				onclick={() => (step = 1)}
				class="px-4 py-2 text-sm text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
				>← Back</button
			>
			<button
				onclick={() => (step = 3)}
				disabled={entities.length === 0}
				class="px-5 py-2 text-sm font-medium bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
				>Next →</button
			>
		</div>
	</div>
{/if}

<!-- Step 3: Section Assignment -->
{#if step === 3}
	<div class="space-y-4">
		<div class="space-y-3">
			{#each graphSections as section, i (i)}
				<div class="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-2">
					<div class="flex items-start gap-2">
						<div class="flex-1 space-y-1.5">
							<div class="flex items-center gap-2">
								<input
									bind:value={section.title}
									class="flex-1 text-sm font-medium border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-zinc-300 rounded px-1 text-zinc-800"
									placeholder="Section title"
								/>
								<div class="flex items-center gap-1 text-xs text-zinc-500 shrink-0">
									<span>Entity:</span>
									<input
										bind:value={section.forEntity}
										list="section-entities-{i}"
										class="w-28 border border-zinc-300 rounded px-1.5 py-0.5 text-xs bg-white font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
										placeholder="entity name"
									/>
									<datalist id="section-entities-{i}">
										{#each entities as e (e.name)}<option value={e.name}></option>{/each}
									</datalist>
								</div>
							</div>
							<textarea
								bind:value={section.text}
								rows="3"
								class="w-full text-xs border border-zinc-200 rounded-lg bg-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-300 resize-y font-mono"
								placeholder="Section text…"
							></textarea>
						</div>
						<button
							onclick={() => removeSection(i)}
							class="text-zinc-300 hover:text-red-500 transition-colors mt-0.5 shrink-0"
							aria-label="Remove section"
						>
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				</div>
			{/each}
		</div>

		<button
			onclick={() => (graphSections = [...graphSections, { title: '', text: '', forEntity: '' }])}
			class="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
		>
			<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add section
		</button>

		<div class="flex gap-2">
			<button
				onclick={() => (step = 2)}
				class="px-4 py-2 text-sm text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
				>← Back</button
			>
			<button
				onclick={() => {
					step = 4;
					runProcessGraph();
				}}
				disabled={graphSections.length === 0}
				class="px-5 py-2 text-sm font-medium bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
				>Process →</button
			>
		</div>
	</div>
{/if}

<!-- Step 4: Processing -->
{#if step === 4}
	<div class="space-y-5">
		{#if processError}
			<div
				class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2"
			>
				<span class="shrink-0">⚠</span>
				<span>{processError}</span>
			</div>
		{/if}

		<!-- Entity progress -->
		<div>
			<div class="flex items-center gap-2 mb-2">
				<h3 class="text-sm font-semibold text-zinc-700">Entities</h3>
				{#if entitiesEmbedded}
					<span class="text-[11px] text-emerald-600 font-medium">embeddings done ✓</span>
				{/if}
				{#if relationshipsStored}
					<span class="text-[11px] text-emerald-600 font-medium">relationships stored ✓</span>
				{/if}
			</div>
			<div class="flex flex-wrap gap-1.5">
				{#each entityProgress as ep (ep.name)}
					<div
						class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors"
						class:bg-emerald-50={ep.stored}
						class:border-emerald-300={ep.stored}
						class:text-emerald-700={ep.stored}
						class:bg-zinc-50={!ep.stored}
						class:border-zinc-200={!ep.stored}
						class:text-zinc-500={!ep.stored}
					>
						{#if ep.stored}
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						{:else if processing}
							<span
								class="w-2 h-2 border border-zinc-400 border-t-transparent rounded-full animate-spin"
							></span>
						{/if}
						<span class="font-mono">{ep.name}</span>
						<span class="text-[10px] opacity-70">{ep.type}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Section progress -->
		<div class="space-y-2">
			<h3 class="text-sm font-semibold text-zinc-700">Sections</h3>
			{#each sectionProgress as sp (sp.title)}
				{@const steps = [
					{ key: 'chunk', label: 'Chunk', info: sp.chunk },
					{ key: 'extract', label: 'Extract', info: sp.extract },
					{ key: 'graph', label: 'Graph', info: sp.graph },
					{ key: 'embed', label: 'Embed', info: sp.embed }
				]}
				<div
					class="rounded-lg border overflow-hidden transition-colors"
					class:border-emerald-200={sp.state === 'done'}
					class:border-zinc-300={sp.state === 'active'}
					class:border-zinc-200={sp.state === 'pending'}
				>
					<div
						class="flex items-center justify-between px-3 py-1.5 text-xs"
						class:bg-emerald-50={sp.state === 'done'}
						class:bg-zinc-50={sp.state !== 'done'}
					>
						<div class="flex items-center gap-1.5">
							{#if sp.state === 'done'}
								<svg
									class="w-3.5 h-3.5 text-emerald-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2.5"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							{:else if sp.state === 'active'}
								<span
									class="w-3 h-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"
								></span>
							{:else}
								<span class="w-3 h-3 border border-zinc-300 rounded-full"></span>
							{/if}
							<span class="font-medium text-zinc-700">{sp.title}</span>
							{#if sp.forEntity}
								<span class="font-mono text-indigo-500">{sp.forEntity}</span>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							{#each steps as s (s.key)}
								<span
									class="px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors"
									class:bg-emerald-100={s.info.done}
									class:text-emerald-700={s.info.done}
									class:bg-zinc-100={!s.info.done}
									class:text-zinc-400={!s.info.done}
								>
									{s.label}{s.info.detail ? ' ' + s.info.detail : ''}
								</span>
							{/each}
						</div>
					</div>
					{#if sp.state === 'active' && sp.embed.progress !== undefined}
						<div class="h-0.5 bg-zinc-100">
							<div
								class="h-full bg-indigo-400 transition-all"
								style="width: {sp.embed.progress * 100}%"
							></div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Completion / status banner -->
		{#if processingDone}
			<div
				class="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700"
			>
				<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span class="font-medium">Processing complete!</span>
				{#if completionStats}
					<span class="text-emerald-600 text-xs">
						{completionStats.nodes} nodes · {completionStats.relationships} relationships
					</span>
				{/if}
			</div>
		{:else if labelAlreadyExists}
			<div
				class="flex items-start gap-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700"
			>
				<svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div>
					<p class="font-medium">
						This knowledge base already exists{completionStats?.nodes
							? ` (${completionStats.nodes} nodes)`
							: ''}.
					</p>
					<p class="text-blue-600 text-xs mt-0.5">
						You can go to chat now. To re-process from scratch, delete it first via the Admin panel
						below.
					</p>
				</div>
			</div>
		{:else if looksComplete}
			<div
				class="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700"
			>
				<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span class="font-medium"
					>Stream ended without an explicit completion signal, but all entities and sections
					finished — looks done.</span
				>
			</div>
		{:else if looksIncomplete}
			<div
				class="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700"
			>
				<svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 003.93 21h16.14a2 2 0 001.82-2.96L13.71 3.86a2 2 0 00-3.42 0z"
					/>
				</svg>
				<div>
					<p class="font-medium">
						Stream ended without a completion signal, and some work looks unfinished.
					</p>
					<p class="text-amber-600 text-xs mt-0.5">
						{entityProgress.filter((e) => e.stored).length}/{entityProgress.length} entities stored ·
						{sectionProgress.filter((s) => s.state === 'done').length}/{sectionProgress.length} sections
						done. Retry to resume.
					</p>
				</div>
			</div>
		{/if}

		<!-- SSE log -->
		<details>
			<summary class="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer select-none"
				>Event log ({sseLog.length})</summary
			>
			<div
				bind:this={logEl}
				class="mt-1.5 h-32 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-950 p-2 font-mono text-[10px] text-zinc-300 space-y-0.5"
			>
				{#each sseLog as line, i (i)}
					<div>{line}</div>
				{/each}
			</div>
		</details>

		<div class="flex gap-2">
			{#if !processing && !processingDone}
				<button
					onclick={() => (step = 3)}
					class="px-4 py-2 text-sm text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
					>← Back</button
				>
				{#if looksComplete || labelAlreadyExists}
					<button
						onclick={runProcessGraph}
						class="px-4 py-2 text-sm text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
						>Retry</button
					>
					<button
						onclick={() => (step = 5)}
						class="px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
						>Open Chat →</button
					>
				{:else}
					<button
						onclick={runProcessGraph}
						class="px-5 py-2 text-sm font-medium bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
						>Retry</button
					>
				{/if}
			{/if}
			{#if processingDone}
				<button
					onclick={() => (step = 5)}
					class="px-5 py-2 text-sm font-medium bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
					>Open Chat →</button
				>
			{/if}
		</div>
	</div>
{/if}

<!-- Step 5: Chat -->
{#if step === 5}
	<div class="h-[calc(100vh-22rem)]">
		<KnowledgeChat initialLabel={label} stats={completionStats} />
	</div>
{/if}
