<script lang="ts">
	import { KnowledgeAPIService } from '$services/apiService'
	import { fetchAuthToken } from '$lib/utils/token'

	const apiUrl = import.meta.env.VITE_API_URL

	const SECTION_STEPS = [
		{ key: 'chunk_done', label: 'Chunk' },
		{ key: 'extract_progress', label: 'Extract' },
		{ key: 'graph_stored', label: 'Graph' },
		{ key: 'embed_progress', label: 'Embed' },
	] as const

	type OpState = 'idle' | 'loading' | 'ok' | 'error'
	type ProcessMode = 'sections' | 'graph'
	type ProcessStage = 'input' | 'suggesting' | 'reviewing' | 'processing' | 'done'

	interface Section {
		id: string
		title: string
		text: string
	}

	interface SectionStatus {
		state: 'pending' | 'active' | 'done' | 'error'
		reachedSteps: Set<string>
	}

	interface Entity {
		id: string
		name: string
		type: string
	}

	interface GraphSection {
		id: string
		title: string
		forEntity: string
		sectionRelationship: string
		text: string
	}

	interface EntityRelationship {
		id: string
		from: string
		predicate: string
		to: string
	}

	interface ProgressEvent {
		type: string
		message: string
		timestamp: Date
	}

	interface StatusEntry {
		label: string
		nodes?: number
		relationships?: number
		embeddings?: number
		[key: string]: unknown
	}

	// ── Shared ───────────────────────────────────────────────
	let mode = $state<ProcessMode>('sections')
	let stage = $state<ProcessStage>('input')
	let processLabel = $state('napoleon')
	let rawText = $state('')
	let suggestError = $state<string | null>(null)
	let progressLog = $state<ProgressEvent[]>([])
	let processError = $state<string | null>(null)
	let logEl = $state<HTMLElement | undefined>(undefined)

	// ── Sections mode ────────────────────────────────────────
	let sections = $state<Section[]>([])
	let sectionStatuses = $state<Record<string, SectionStatus>>({})

	// ── Graph mode ───────────────────────────────────────────
	let entities = $state<Entity[]>([])
	let graphSections = $state<GraphSection[]>([])
	let entityRelationships = $state<EntityRelationship[]>([])
	let entityStoredCount = $state(0)
	let graphSectionStatuses = $state<Record<string, SectionStatus>>({})
	let relationshipsStored = $state(false)
	let entitiesEmbedded = $state(false)

	// ── Sub-panels open state (graph review) ─────────────────
	let openEntities = $state(true)
	let openGraphSections = $state(true)
	let openRelationships = $state(true)

	// ── Status / Labels ──────────────────────────────────────
	let statusState = $state<OpState>('idle')
	let statusData = $state<StatusEntry[] | null>(null)
	let labelsState = $state<OpState>('idle')
	let labelsList = $state<string[]>([])
	let deleteStates = $state<Record<string, OpState>>({})

	// ── Accordion open ───────────────────────────────────────
	let openProcess = $state(true)
	let openStatus = $state(false)
	let openLabels = $state(false)

	$effect(() => {
		const _ = progressLog.length
		setTimeout(() => logEl?.scrollTo({ top: logEl.scrollHeight, behavior: 'smooth' }), 0)
	})

	function uid() {
		return Math.random().toString(36).slice(2)
	}

	function switchMode(m: ProcessMode) {
		if (mode === m) return
		mode = m
		resetProcess()
	}

	// ── Suggest ──────────────────────────────────────────────
	async function suggestSections() {
		if (!rawText.trim()) return
		stage = 'suggesting'
		suggestError = null
		try {
			const result = await KnowledgeAPIService.suggestSections(rawText)
			const raw: { title: string; text: string }[] = Array.isArray(result) ? result : []
			sections = raw.map((s) => ({ id: uid(), title: s.title, text: s.text }))
			stage = 'reviewing'
		} catch (e) {
			suggestError = String(e)
			stage = 'input'
		}
	}

	async function suggestGraph() {
		if (!rawText.trim()) return
		stage = 'suggesting'
		suggestError = null
		try {
			const result = await KnowledgeAPIService.suggestGraph(rawText)
			entities = (result?.entities ?? []).map((e: { name: string; type: string }) => ({
				id: uid(),
				name: e.name,
				type: e.type,
			}))
			graphSections = (result?.sections ?? []).map(
				(s: { title: string; forEntity?: string; sectionRelationship?: string; text: string }) => ({
					id: uid(),
					title: s.title,
					forEntity: s.forEntity ?? '',
					sectionRelationship: s.sectionRelationship ?? '',
					text: s.text,
				})
			)
			entityRelationships = (result?.entityRelationships ?? []).map(
				(r: { from: string; predicate: string; to: string }) => ({
					id: uid(),
					from: r.from,
					predicate: r.predicate,
					to: r.to,
				})
			)
			stage = 'reviewing'
		} catch (e) {
			suggestError = String(e)
			stage = 'input'
		}
	}

	// ── Sections CRUD ────────────────────────────────────────
	function addSection() {
		sections = [...sections, { id: uid(), title: 'New section', text: '' }]
	}
	function removeSection(id: string) {
		sections = sections.filter((s) => s.id !== id)
	}
	function moveSection(id: string, dir: -1 | 1) {
		const idx = sections.findIndex((s) => s.id === id)
		if (idx < 0) return
		const next = idx + dir
		if (next < 0 || next >= sections.length) return
		const copy = [...sections]
		;[copy[idx], copy[next]] = [copy[next], copy[idx]]
		sections = copy
	}

	// ── Graph CRUD ───────────────────────────────────────────
	function addEntity() {
		entities = [...entities, { id: uid(), name: '', type: 'Person' }]
	}
	function removeEntity(id: string) {
		entities = entities.filter((e) => e.id !== id)
	}
	function addGraphSection() {
		graphSections = [
			...graphSections,
			{ id: uid(), title: '', forEntity: '', sectionRelationship: 'HAS_INFO', text: '' },
		]
	}
	function removeGraphSection(id: string) {
		graphSections = graphSections.filter((s) => s.id !== id)
	}
	function addRelationship() {
		entityRelationships = [
			...entityRelationships,
			{ id: uid(), from: '', predicate: 'RELATED_TO', to: '' },
		]
	}
	function removeRelationship(id: string) {
		entityRelationships = entityRelationships.filter((r) => r.id !== id)
	}

	// ── Process: sections (SSE) ──────────────────────────────
	async function processAll() {
		if (!sections.length || !processLabel.trim()) return
		stage = 'processing'
		progressLog = []
		processError = null
		sectionStatuses = Object.fromEntries(
			sections.map((s) => [s.title, { state: 'pending' as const, reachedSteps: new Set<string>() }])
		)
		let currentTitle = ''
		try {
			const token = await fetchAuthToken()
			const response = await fetch(`${apiUrl}/knowledge/process`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: String(token) },
				body: JSON.stringify({
					label: processLabel,
					sections: sections.map((s) => ({ title: s.title, text: s.text })),
				}),
			})
			if (!response.ok) throw new Error(`HTTP ${response.status}`)
			const reader = response.body!.getReader()
			const decoder = new TextDecoder()
			while (true) {
				const { done, value } = await reader.read()
				if (done) break
				for (const line of decoder.decode(value).split('\n')) {
					if (!line.startsWith('data: ')) continue
					const raw = line.slice(6).trim()
					if (!raw || raw === '[DONE]') continue
					try {
						const parsed = JSON.parse(raw)
						const type: string = parsed.event ?? parsed.type ?? 'event'
						const message: string =
							parsed.message ?? parsed.title ?? parsed.data ?? JSON.stringify(parsed)
						progressLog = [...progressLog, { type, message, timestamp: new Date() }]
						if (type === 'section_start') {
							currentTitle = parsed.title ?? message
							sectionStatuses = {
								...sectionStatuses,
								[currentTitle]: { state: 'active', reachedSteps: new Set() },
							}
						} else if (type === 'section_done') {
							const t = parsed.title ?? currentTitle
							const prev = sectionStatuses[t]
							sectionStatuses = {
								...sectionStatuses,
								[t]: { state: 'done', reachedSteps: prev?.reachedSteps ?? new Set() },
							}
						} else if (type === 'complete') {
							stage = 'done'
						} else if (currentTitle && sectionStatuses[currentTitle]) {
							const prev = sectionStatuses[currentTitle]
							sectionStatuses = {
								...sectionStatuses,
								[currentTitle]: {
									...prev,
									reachedSteps: new Set([...prev.reachedSteps, type]),
								},
							}
						}
					} catch {
						progressLog = [...progressLog, { type: 'raw', message: raw, timestamp: new Date() }]
					}
				}
			}
			if (stage === 'processing') stage = 'done'
		} catch (e) {
			processError = String(e)
			stage = 'reviewing'
		}
	}

	// ── Process: graph (SSE) ─────────────────────────────────
	async function processGraph() {
		if (!processLabel.trim()) return
		stage = 'processing'
		progressLog = []
		processError = null
		entityStoredCount = 0
		relationshipsStored = false
		entitiesEmbedded = false
		graphSectionStatuses = Object.fromEntries(
			graphSections.map((s) => [
				s.title,
				{ state: 'pending' as const, reachedSteps: new Set<string>() },
			])
		)
		let currentTitle = ''
		try {
			const token = await fetchAuthToken()
			const response = await fetch(`${apiUrl}/knowledge/process-graph`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: String(token) },
				body: JSON.stringify({
					label: processLabel,
					entities: entities.map((e) => ({ name: e.name, type: e.type })),
					sections: graphSections.map((s) => ({
						title: s.title,
						forEntity: s.forEntity,
						sectionRelationship: s.sectionRelationship,
						text: s.text,
					})),
					entityRelationships: entityRelationships.map((r) => ({
						from: r.from,
						predicate: r.predicate,
						to: r.to,
					})),
				}),
			})
			if (!response.ok) throw new Error(`HTTP ${response.status}`)
			const reader = response.body!.getReader()
			const decoder = new TextDecoder()
			while (true) {
				const { done, value } = await reader.read()
				if (done) break
				for (const line of decoder.decode(value).split('\n')) {
					if (!line.startsWith('data: ')) continue
					const raw = line.slice(6).trim()
					if (!raw || raw === '[DONE]') continue
					try {
						const parsed = JSON.parse(raw)
						const type: string = parsed.event ?? parsed.type ?? 'event'
						const message: string =
							parsed.message ?? parsed.name ?? parsed.title ?? parsed.data ?? JSON.stringify(parsed)
						progressLog = [...progressLog, { type, message, timestamp: new Date() }]
						if (type === 'entity_stored') {
							entityStoredCount += 1
						} else if (type === 'section_start') {
							currentTitle = parsed.title ?? message
							graphSectionStatuses = {
								...graphSectionStatuses,
								[currentTitle]: { state: 'active', reachedSteps: new Set() },
							}
						} else if (type === 'section_done') {
							const t = parsed.title ?? currentTitle
							const prev = graphSectionStatuses[t]
							graphSectionStatuses = {
								...graphSectionStatuses,
								[t]: { state: 'done', reachedSteps: prev?.reachedSteps ?? new Set() },
							}
						} else if (type === 'relationships_stored') {
							relationshipsStored = true
						} else if (type === 'entities_embedded') {
							entitiesEmbedded = true
						} else if (type === 'complete') {
							stage = 'done'
						} else if (currentTitle && graphSectionStatuses[currentTitle]) {
							const prev = graphSectionStatuses[currentTitle]
							graphSectionStatuses = {
								...graphSectionStatuses,
								[currentTitle]: {
									...prev,
									reachedSteps: new Set([...prev.reachedSteps, type]),
								},
							}
						}
					} catch {
						progressLog = [...progressLog, { type: 'raw', message: raw, timestamp: new Date() }]
					}
				}
			}
			if (stage === 'processing') stage = 'done'
		} catch (e) {
			processError = String(e)
			stage = 'reviewing'
		}
	}

	function resetProcess() {
		stage = 'input'
		rawText = ''
		suggestError = null
		processError = null
		progressLog = []
		sections = []
		sectionStatuses = {}
		entities = []
		graphSections = []
		entityRelationships = []
		graphSectionStatuses = {}
		entityStoredCount = 0
		relationshipsStored = false
		entitiesEmbedded = false
	}

	// ── Status ───────────────────────────────────────────────
	async function fetchStatus() {
		statusState = 'loading'
		statusData = null
		try {
			const res = await KnowledgeAPIService.knowledgeStatus()
			if (Array.isArray(res)) {
				statusData = res
			} else if (res && typeof res === 'object') {
				statusData = Object.entries(res).map(([label, v]) => ({
					label,
					...(typeof v === 'object' && v !== null ? (v as object) : {}),
				}))
			}
			statusState = 'ok'
		} catch {
			statusState = 'error'
		}
	}

	// ── Labels ───────────────────────────────────────────────
	async function fetchLabels() {
		labelsState = 'loading'
		try {
			const res = await KnowledgeAPIService.knowledgeLabels()
			labelsList = Array.isArray(res) ? res : (res?.labels ?? [])
			labelsState = 'ok'
		} catch {
			labelsState = 'error'
		}
	}

	async function deleteLabel(label: string) {
		deleteStates = { ...deleteStates, [label]: 'loading' }
		try {
			await KnowledgeAPIService.knowledgeDelete(label)
			deleteStates = { ...deleteStates, [label]: 'ok' }
			labelsList = labelsList.filter((l) => l !== label)
			if (statusData) fetchStatus()
		} catch {
			deleteStates = { ...deleteStates, [label]: 'error' }
		}
	}

	// ── Helpers ──────────────────────────────────────────────
	function eventIcon(type: string) {
		if (type === 'entity_stored') return '◈'
		if (type === 'section_start') return '▶'
		if (type === 'section_done') return '✓'
		if (type === 'chunk_done') return '✂'
		if (type === 'extract_progress') return '⬡'
		if (type === 'graph_stored') return '⬡'
		if (type === 'embed_progress') return '⊛'
		if (type === 'relationships_stored') return '⟷'
		if (type === 'entities_embedded') return '⊛'
		if (type === 'complete') return '★'
		if (type === 'error') return '✕'
		return '·'
	}

	function eventColor(type: string) {
		if (type === 'entity_stored') return 'text-violet-500'
		if (type === 'section_start') return 'text-indigo-500'
		if (type === 'section_done') return 'text-emerald-500'
		if (type === 'relationships_stored') return 'text-sky-500'
		if (type === 'entities_embedded') return 'text-amber-500'
		if (type === 'complete') return 'text-emerald-600 font-semibold'
		if (type === 'error') return 'text-red-500'
		if (type === 'graph_stored') return 'text-indigo-600'
		return 'text-zinc-400'
	}

	// entity names for datalist
	let entityNames = $derived(entities.map((e) => e.name).filter(Boolean))
</script>

<!-- datalists for graph editing -->
<datalist id="entity-names">
	{#each entityNames as name (name)}
		<option value={name}></option>
	{/each}
</datalist>
<datalist id="entity-types">
	{#each ['Person', 'Organization', 'Event', 'Place', 'Concept', 'Work', 'Product'] as t (t)}
		<option value={t}></option>
	{/each}
</datalist>

<div class="flex flex-col gap-3 text-xs">

	<!-- ── Process section ─────────────────────────────────── -->
	<div class="rounded-xl border border-zinc-200 bg-white overflow-hidden">
		<button
			onclick={() => (openProcess = !openProcess)}
			class="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
		>
			<span class="font-semibold text-zinc-700 uppercase tracking-wide">Process text</span>
			<div class="flex items-center gap-2">
				{#if stage === 'reviewing'}
					<span class="text-indigo-600 font-medium">Review</span>
				{:else if stage === 'processing'}
					<span class="text-amber-600 font-medium flex items-center gap-1">
						<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block"></span>
						Processing…
					</span>
				{:else if stage === 'done'}
					<span class="text-emerald-600 font-medium">✓ Complete</span>
				{/if}
				<svg
					class="w-3.5 h-3.5 text-zinc-400 transition-transform"
					class:rotate-180={openProcess}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</div>
		</button>

		{#if openProcess}
			<div class="px-4 pt-3 pb-4 space-y-3">

				<!-- Mode toggle -->
				{#if stage === 'input' || stage === 'suggesting'}
					<div class="flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5 w-fit text-[11px]">
						<button
							onclick={() => switchMode('sections')}
							class="px-3 py-1 rounded transition-colors"
							class:bg-white={mode === 'sections'}
							class:shadow-sm={mode === 'sections'}
							class:text-zinc-800={mode === 'sections'}
							class:font-medium={mode === 'sections'}
							class:text-zinc-400={mode !== 'sections'}
						>
							Sections
						</button>
						<button
							onclick={() => switchMode('graph')}
							class="px-3 py-1 rounded transition-colors"
							class:bg-white={mode === 'graph'}
							class:shadow-sm={mode === 'graph'}
							class:text-zinc-800={mode === 'graph'}
							class:font-medium={mode === 'graph'}
							class:text-zinc-400={mode !== 'graph'}
						>
							Graph
						</button>
					</div>
				{/if}

				<!-- ── SHARED: input stage ── -->
				{#if stage === 'input' || stage === 'suggesting'}
					<div class="flex items-center gap-2">
						<label class="text-zinc-500 shrink-0" for="proc-label">Label</label>
						<input
							id="proc-label"
							bind:value={processLabel}
							placeholder="napoleon"
							class="flex-1 border border-zinc-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
						/>
					</div>
					<textarea
						bind:value={rawText}
						placeholder="Paste raw text to extract knowledge from…"
						rows="6"
						class="w-full border border-zinc-300 rounded-lg px-3 py-2 resize-y placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
					></textarea>
					{#if suggestError}
						<p class="text-red-500">{suggestError}</p>
					{/if}
					{#if mode === 'sections'}
						<button
							onclick={suggestSections}
							disabled={stage === 'suggesting' || !rawText.trim() || !processLabel.trim()}
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 text-white
								hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
						>
							{#if stage === 'suggesting'}
								<span class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
								Suggesting…
							{:else}
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
								Suggest sections
							{/if}
						</button>
					{:else}
						<button
							onclick={suggestGraph}
							disabled={stage === 'suggesting' || !rawText.trim() || !processLabel.trim()}
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600 text-white
								hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
						>
							{#if stage === 'suggesting'}
								<span class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
								Suggesting…
							{:else}
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
								</svg>
								Suggest graph
							{/if}
						</button>
					{/if}

				<!-- ── SECTIONS: reviewing ── -->
				{:else if stage === 'reviewing' && mode === 'sections'}
					<div class="flex items-center justify-between">
						<span class="text-zinc-500">{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
						<button onclick={resetProcess} class="text-zinc-400 hover:text-zinc-600 transition-colors">← Start over</button>
					</div>

					<div class="space-y-2">
						{#each sections as sec, i (sec.id)}
							<div class="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-2">
								<div class="flex items-center gap-2">
									<div class="flex flex-col gap-0.5 shrink-0">
										<button
											onclick={() => moveSection(sec.id, -1)}
											disabled={i === 0}
											class="w-4 h-4 flex items-center justify-center text-zinc-300 hover:text-zinc-600 disabled:opacity-20 transition-colors"
										>
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
											</svg>
										</button>
										<button
											onclick={() => moveSection(sec.id, 1)}
											disabled={i === sections.length - 1}
											class="w-4 h-4 flex items-center justify-center text-zinc-300 hover:text-zinc-600 disabled:opacity-20 transition-colors"
										>
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
											</svg>
										</button>
									</div>
									<input
										bind:value={sec.title}
										class="flex-1 font-semibold text-zinc-700 bg-white border border-zinc-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
										placeholder="Section title"
									/>
									<button
										onclick={() => removeSection(sec.id)}
										class="shrink-0 w-5 h-5 flex items-center justify-center rounded text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors"
									>
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
								<textarea
									bind:value={sec.text}
									rows="3"
									class="w-full border border-zinc-200 rounded px-2 py-1.5 resize-y bg-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
									placeholder="Section text…"
								></textarea>
							</div>
						{/each}
					</div>

					<div class="flex items-center gap-2 pt-1">
						<button
							onclick={addSection}
							class="flex items-center gap-1 px-3 py-1.5 rounded-full border border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:bg-zinc-50 transition-colors"
						>
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
							</svg>
							Add section
						</button>
						<button
							onclick={processAll}
							disabled={!sections.length}
							class="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-zinc-800 text-white
								hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto"
						>
							Process all
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
							</svg>
						</button>
					</div>
					{#if processError}<p class="text-red-500">{processError}</p>{/if}

				<!-- ── GRAPH: reviewing ── -->
				{:else if stage === 'reviewing' && mode === 'graph'}
					<div class="flex items-center justify-between">
						<span class="text-zinc-500">
							{entities.length} entit{entities.length !== 1 ? 'ies' : 'y'} ·
							{graphSections.length} section{graphSections.length !== 1 ? 's' : ''} ·
							{entityRelationships.length} relationship{entityRelationships.length !== 1 ? 's' : ''}
						</span>
						<button onclick={resetProcess} class="text-zinc-400 hover:text-zinc-600 transition-colors">← Start over</button>
					</div>

					<!-- Entities sub-panel -->
					<div class="rounded-lg border border-zinc-200 overflow-hidden">
						<button
							onclick={() => (openEntities = !openEntities)}
							class="w-full flex items-center justify-between px-3 py-2 bg-violet-50 hover:bg-violet-100 transition-colors text-left"
						>
							<span class="font-medium text-violet-700">Entities ({entities.length})</span>
							<svg class="w-3 h-3 text-violet-400 transition-transform" class:rotate-180={openEntities} fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</button>
						{#if openEntities}
							<div class="p-2 space-y-1">
								{#each entities as ent (ent.id)}
									<div class="flex items-center gap-1.5">
										<input
											bind:value={ent.name}
											list="entity-names"
											placeholder="Entity name"
											class="flex-1 border border-zinc-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-400"
										/>
										<input
											bind:value={ent.type}
											list="entity-types"
											placeholder="Type"
											class="w-28 border border-zinc-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-400"
										/>
										<button
											onclick={() => removeEntity(ent.id)}
											class="w-5 h-5 flex items-center justify-center rounded text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
										>
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>
								{/each}
								<button onclick={addEntity} class="flex items-center gap-1 text-violet-600 hover:text-violet-800 mt-1 transition-colors">
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
									</svg>
									Add entity
								</button>
							</div>
						{/if}
					</div>

					<!-- Sections sub-panel -->
					<div class="rounded-lg border border-zinc-200 overflow-hidden">
						<button
							onclick={() => (openGraphSections = !openGraphSections)}
							class="w-full flex items-center justify-between px-3 py-2 bg-indigo-50 hover:bg-indigo-100 transition-colors text-left"
						>
							<span class="font-medium text-indigo-700">Sections ({graphSections.length})</span>
							<svg class="w-3 h-3 text-indigo-400 transition-transform" class:rotate-180={openGraphSections} fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</button>
						{#if openGraphSections}
							<div class="p-2 space-y-2">
								{#each graphSections as sec (sec.id)}
									<div class="rounded border border-zinc-100 bg-zinc-50 p-2 space-y-1.5">
										<div class="flex items-center gap-1.5">
											<input
												bind:value={sec.title}
												placeholder="Section title"
												class="flex-1 font-medium border border-zinc-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
											/>
											<button
												onclick={() => removeGraphSection(sec.id)}
												class="w-5 h-5 flex items-center justify-center rounded text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
											>
												<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										</div>
										<div class="flex items-center gap-1.5">
											<input
												bind:value={sec.forEntity}
												list="entity-names"
												placeholder="For entity"
												class="flex-1 border border-zinc-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
											/>
											<input
												bind:value={sec.sectionRelationship}
												placeholder="Relationship"
												class="w-36 font-mono border border-zinc-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
											/>
										</div>
										<textarea
											bind:value={sec.text}
											rows="2"
											class="w-full border border-zinc-200 rounded px-2 py-1 resize-y bg-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
											placeholder="Section text…"
										></textarea>
									</div>
								{/each}
								<button onclick={addGraphSection} class="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 mt-1 transition-colors">
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
									</svg>
									Add section
								</button>
							</div>
						{/if}
					</div>

					<!-- Relationships sub-panel -->
					<div class="rounded-lg border border-zinc-200 overflow-hidden">
						<button
							onclick={() => (openRelationships = !openRelationships)}
							class="w-full flex items-center justify-between px-3 py-2 bg-sky-50 hover:bg-sky-100 transition-colors text-left"
						>
							<span class="font-medium text-sky-700">Relationships ({entityRelationships.length})</span>
							<svg class="w-3 h-3 text-sky-400 transition-transform" class:rotate-180={openRelationships} fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</button>
						{#if openRelationships}
							<div class="p-2 space-y-1">
								{#each entityRelationships as rel (rel.id)}
									<div class="flex items-center gap-1.5">
										<input
											bind:value={rel.from}
											list="entity-names"
											placeholder="From"
											class="flex-1 border border-zinc-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-sky-400"
										/>
										<input
											bind:value={rel.predicate}
											placeholder="PREDICATE"
											class="w-32 font-mono uppercase border border-zinc-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-sky-400"
										/>
										<input
											bind:value={rel.to}
											list="entity-names"
											placeholder="To"
											class="flex-1 border border-zinc-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-sky-400"
										/>
										<button
											onclick={() => removeRelationship(rel.id)}
											class="w-5 h-5 flex items-center justify-center rounded text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
										>
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>
								{/each}
								<button onclick={addRelationship} class="flex items-center gap-1 text-sky-600 hover:text-sky-800 mt-1 transition-colors">
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
									</svg>
									Add relationship
								</button>
							</div>
						{/if}
					</div>

					<div class="flex items-center gap-2 pt-1">
						{#if processError}<p class="text-red-500 flex-1">{processError}</p>{/if}
						<button
							onclick={processGraph}
							disabled={!entities.length && !graphSections.length}
							class="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-violet-700 text-white
								hover:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto"
						>
							Process graph
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
							</svg>
						</button>
					</div>

				<!-- ── SHARED: processing / done ── -->
				{:else if stage === 'processing' || stage === 'done'}

					{#if mode === 'graph'}
						<!-- Entity storage counter -->
						<div
							class="flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors"
							class:border-violet-200={entityStoredCount > 0}
							class:bg-violet-50={entityStoredCount > 0}
							class:border-zinc-100={entityStoredCount === 0}
							class:bg-zinc-50={entityStoredCount === 0}
						>
							<span
								class="shrink-0"
								class:text-violet-500={entityStoredCount > 0}
								class:text-zinc-300={entityStoredCount === 0}
							>
								{entityStoredCount > 0 ? '◈' : '○'}
							</span>
							<span
								class="font-medium"
								class:text-violet-700={entityStoredCount > 0}
								class:text-zinc-400={entityStoredCount === 0}
							>
								Entities stored: {entityStoredCount} / {entities.length}
							</span>
						</div>
					{/if}

					<!-- Section status cards -->
					{@const activeStatuses = mode === 'graph' ? graphSectionStatuses : sectionStatuses}
					{@const activeSections = mode === 'graph' ? graphSections : sections}
					<div class="space-y-1.5">
						{#each activeSections as sec (sec.id)}
							{@const st = activeStatuses[sec.title]}
							<div
								class="flex items-start gap-3 rounded-lg border px-3 py-2 transition-colors"
								class:border-zinc-100={!st || st.state === 'pending'}
								class:bg-zinc-50={!st || st.state === 'pending'}
								class:border-indigo-200={st?.state === 'active'}
								class:bg-indigo-50={st?.state === 'active'}
								class:border-emerald-200={st?.state === 'done'}
								class:bg-emerald-50={st?.state === 'done'}
							>
								<div class="shrink-0 mt-0.5">
									{#if st?.state === 'done'}
										<span class="text-emerald-500 font-bold">✓</span>
									{:else if st?.state === 'active'}
										<span class="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
									{:else}
										<span class="text-zinc-300">○</span>
									{/if}
								</div>
								<div class="flex-1 min-w-0 space-y-1">
									<p
										class="font-medium truncate"
										class:text-zinc-400={!st || st.state === 'pending'}
										class:text-indigo-700={st?.state === 'active'}
										class:text-emerald-700={st?.state === 'done'}
									>
										{sec.title}
									</p>
									{#if st?.state === 'active' || st?.state === 'done'}
										<div class="flex gap-1 flex-wrap">
											{#each SECTION_STEPS as step (step.key)}
												<span
													class="px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors"
													class:bg-emerald-100={st.reachedSteps.has(step.key)}
													class:text-emerald-700={st.reachedSteps.has(step.key)}
													class:bg-zinc-100={!st.reachedSteps.has(step.key)}
													class:text-zinc-400={!st.reachedSteps.has(step.key)}
												>
													{step.label}
												</span>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>

					{#if mode === 'graph'}
						<!-- Relationships + Embeddings status rows -->
						<div class="flex gap-2">
							<div
								class="flex items-center gap-1.5 flex-1 rounded-lg border px-3 py-2 transition-colors"
								class:border-sky-200={relationshipsStored}
								class:bg-sky-50={relationshipsStored}
								class:border-zinc-100={!relationshipsStored}
								class:bg-zinc-50={!relationshipsStored}
							>
								<span class:text-sky-500={relationshipsStored} class:text-zinc-300={!relationshipsStored}>
									{relationshipsStored ? '⟷' : '○'}
								</span>
								<span
									class="font-medium"
									class:text-sky-700={relationshipsStored}
									class:text-zinc-400={!relationshipsStored}
								>
									Relationships
								</span>
								{#if relationshipsStored}<span class="text-sky-500 ml-auto">✓</span>{/if}
							</div>
							<div
								class="flex items-center gap-1.5 flex-1 rounded-lg border px-3 py-2 transition-colors"
								class:border-amber-200={entitiesEmbedded}
								class:bg-amber-50={entitiesEmbedded}
								class:border-zinc-100={!entitiesEmbedded}
								class:bg-zinc-50={!entitiesEmbedded}
							>
								<span class:text-amber-500={entitiesEmbedded} class:text-zinc-300={!entitiesEmbedded}>
									{entitiesEmbedded ? '⊛' : '○'}
								</span>
								<span
									class="font-medium"
									class:text-amber-700={entitiesEmbedded}
									class:text-zinc-400={!entitiesEmbedded}
								>
									Embeddings
								</span>
								{#if entitiesEmbedded}<span class="text-amber-500 ml-auto">✓</span>{/if}
							</div>
						</div>
					{/if}

					<!-- Event log -->
					{#if progressLog.length > 0}
						<div
							bind:this={logEl}
							class="max-h-48 overflow-y-auto rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 space-y-0.5 font-mono"
						>
							{#each progressLog as ev (ev.timestamp.getTime() + ev.type + ev.message)}
								<div class="flex items-start gap-2 leading-snug">
									<span class="{eventColor(ev.type)} shrink-0 mt-px">{eventIcon(ev.type)}</span>
									<span class="text-zinc-400 shrink-0 text-[9px] mt-px">
										{ev.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
									</span>
									<span class="text-zinc-600 break-all text-[10px]">{ev.message}</span>
								</div>
							{/each}
						</div>
					{/if}

					{#if stage === 'done'}
						<div class="flex items-center justify-between pt-1">
							<span class="text-emerald-600 font-medium">All done ✓</span>
							<button
								onclick={resetProcess}
								class="text-zinc-500 hover:text-zinc-800 px-3 py-1 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors"
							>
								Process new text
							</button>
						</div>
					{/if}
				{/if}

			</div>
		{/if}
	</div>

	<!-- ── Status section ──────────────────────────────────── -->
	<div class="rounded-xl border border-zinc-200 bg-white overflow-hidden">
		<button
			onclick={() => (openStatus = !openStatus)}
			class="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
		>
			<span class="font-semibold text-zinc-700 uppercase tracking-wide">Status</span>
			<svg
				class="w-3.5 h-3.5 text-zinc-400 transition-transform"
				class:rotate-180={openStatus}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>
		{#if openStatus}
			<div class="px-4 py-3 space-y-3">
				<button
					onclick={fetchStatus}
					disabled={statusState === 'loading'}
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-300 bg-white
						hover:border-zinc-500 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
				>
					{#if statusState === 'loading'}
						<span class="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></span>
					{/if}
					Refresh status
				</button>
				{#if statusData && statusData.length > 0}
					<div class="rounded-lg border border-zinc-200 overflow-hidden">
						<table class="w-full text-[11px]">
							<thead>
								<tr class="bg-zinc-50 text-zinc-500">
									<th class="text-left px-3 py-1.5 font-medium">Label</th>
									<th class="text-right px-3 py-1.5 font-medium">Nodes</th>
									<th class="text-right px-3 py-1.5 font-medium">Relations</th>
									<th class="text-right px-3 py-1.5 font-medium">Embeddings</th>
								</tr>
							</thead>
							<tbody>
								{#each statusData as row (row.label)}
									<tr class="border-t border-zinc-100">
										<td class="px-3 py-1.5 font-mono text-zinc-700">{row.label}</td>
										<td class="px-3 py-1.5 text-right text-zinc-600">{row.nodes ?? '—'}</td>
										<td class="px-3 py-1.5 text-right text-zinc-600">{row.relationships ?? '—'}</td>
										<td class="px-3 py-1.5 text-right text-zinc-600">{row.embeddings ?? '—'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else if statusState === 'ok'}
					<p class="text-zinc-400">No data yet.</p>
				{/if}
			</div>
		{/if}
	</div>

	<!-- ── Labels section ─────────────────────────────────── -->
	<div class="rounded-xl border border-zinc-200 bg-white overflow-hidden">
		<button
			onclick={() => (openLabels = !openLabels)}
			class="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
		>
			<span class="font-semibold text-zinc-700 uppercase tracking-wide">Labels</span>
			<svg
				class="w-3.5 h-3.5 text-zinc-400 transition-transform"
				class:rotate-180={openLabels}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>
		{#if openLabels}
			<div class="px-4 py-3 space-y-3">
				<button
					onclick={fetchLabels}
					disabled={labelsState === 'loading'}
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-300 bg-white
						hover:border-zinc-500 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
				>
					{#if labelsState === 'loading'}
						<span class="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></span>
					{/if}
					List labels
				</button>
				{#if labelsList.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each labelsList as label (label)}
							<div class="flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full border border-zinc-200 bg-zinc-50 font-mono text-zinc-700">
								{label}
								<button
									onclick={() => deleteLabel(label)}
									disabled={deleteStates[label] === 'loading'}
									title="Delete {label}"
									class="w-4 h-4 flex items-center justify-center rounded-full text-zinc-400
										hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
								>
									{#if deleteStates[label] === 'loading'}
										<span class="w-2.5 h-2.5 border border-zinc-400 border-t-transparent rounded-full animate-spin"></span>
									{:else if deleteStates[label] === 'ok'}
										✓
									{:else}
										<svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
										</svg>
									{/if}
								</button>
							</div>
						{/each}
					</div>
				{:else if labelsState === 'ok'}
					<p class="text-zinc-400">No labels found.</p>
				{/if}
			</div>
		{/if}
	</div>

</div>
