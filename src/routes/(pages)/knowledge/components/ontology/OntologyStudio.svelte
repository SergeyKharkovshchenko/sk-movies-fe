<script lang="ts">
	import { KnowledgeAPIService } from '$services/apiService';
	import EditableTable from './EditableTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import KnowledgeChat from '../KnowledgeChat.svelte';
	import {
		STAGES,
		STATUS_STYLE,
		DATATYPES,
		blankAttribute,
		blankClass,
		blankPair,
		blankRelation,
		blankTerm,
		classNames,
		currentStage,
		deepClone,
		isUnlocked,
		stageInfo,
		missingTaxonomyTerms,
		taxonomyTree,
		termNames,
		typeSuggestions,
		typesWithoutGroupTerm,
		withoutBlankRows,
		type Attribute,
		type ClassDef,
		type Pair,
		type RejectedTriple,
		type RelationDef,
		type StageEntry,
		type StageKey,
		type MissingTerm,
		type TreeNode,
		type Term
	} from '$lib/utils/ontology';

	import { napoleonSampleText } from '$lib/data/napoleonSample';
	import { munichSampleText } from '$lib/data/munichSample';
	import { cubeBikesSampleText } from '$lib/data/cubeBikesSample';
	import { nolanSampleText } from '$lib/data/nolanSample';
	import { insuranceSampleText } from '$lib/data/insuranceSample';
	import { insuranceCsvSamples } from '$lib/data/insuranceCsvSamples';
	import { foodCsvSamples } from '$lib/data/foodCsvSamples';

	type Sample =
		| { id: string; name: string; label: string; text: string }
		| { id: string; name: string; label: string; files: Record<string, string> };
	const SAMPLES: Sample[] = [
		{
			id: 'napoleon',
			name: 'Napoleon / Waterloo (text)',
			label: 'napoleon',
			text: napoleonSampleText
		},
		{ id: 'munich', name: 'Munich trip plan (text)', label: 'munich-trip', text: munichSampleText },
		{ id: 'cube', name: 'CUBE bikes (text)', label: 'cube-bikes', text: cubeBikesSampleText },
		{ id: 'nolan', name: 'Nolan filmography (text)', label: 'nolan', text: nolanSampleText },
		{
			id: 'insurance',
			name: 'Insurance claims (text)',
			label: 'insurance-claims',
			text: insuranceSampleText
		},
		{
			id: 'insurance-csv',
			name: 'Insurance claims (CSV tables)',
			label: 'insurance-csv',
			files: insuranceCsvSamples
		},
		{
			id: 'food-csv',
			name: 'Food: dishes + taxonomy (CSV)',
			label: 'food-onto',
			files: foodCsvSamples
		}
	];

	// Pick a sample from the top bar: set the label, open its drafts, then fill the source stage.
	async function pickSample(id: string) {
		const sample = SAMPLES.find((x) => x.id === id);
		if (!sample) return;
		label = sample.label;
		await load('source');
		loadSample(id);
	}

	function loadSample(id: string) {
		const sample = SAMPLES.find((x) => x.id === id);
		if (!sample) return;
		if (!label.trim()) label = sample.label;
		if ('text' in sample) {
			sourceKind = 'text';
			sourceText = sample.text;
		} else {
			sourceKind = 'csv';
			sourceFiles = Object.entries(sample.files).map(([name, content]) => ({ name, content }));
		}
		dirty = true;
	}

	let label = $state('');
	let entries = $state<StageEntry[]>([]);
	let active = $state<StageKey>('source');
	let loaded = $state(false);
	// The chat is a seventh step, not a server stage: open once the graph has been built.
	let showChat = $state(false);
	let chatStats = $state<{ nodes?: number; relationships?: number } | null>(null);
	let busy = $state('');
	let message = $state('');
	let errors = $state<string[]>([]);
	let dirty = $state(false);

	// What the user is editing for the active stage (a copy of the saved payload).
	let terms = $state<Term[]>([]);
	let pairs = $state<Pair[]>([]);
	let classes = $state<ClassDef[]>([]);
	let relations = $state<RelationDef[]>([]);
	let entityAttributes = $state<Attribute[]>([]);
	let relationAttributes = $state<Attribute[]>([]);
	let sourceKind = $state<'text' | 'csv'>('text');
	let sourceText = $state('');
	let sourceFiles = $state<{ name: string; content: string }[]>([]);
	// By-products of the text analysis, carried along untouched with the vocabulary.
	let vocabularyExtras = $state<Record<string, unknown>>({});
	// Attributes the AI proposed for this source, offered in the Name field even after a row is removed.
	let attributeSuggestions = $state<Attribute[]>([]);

	// Build stage
	let replace = $state(false);
	let building = $state(false);
	let log = $state<string[]>([]);
	let rejected = $state<RejectedTriple[]>([]);
	let buildSummary = $state('');
	let embeddedCount = $state(0);

	const entry = (key: StageKey) => entries.find((e) => e.stage === key);
	const status = (key: StageKey) => entry(key)?.status ?? 'EMPTY';
	const info = $derived(stageInfo(active));
	const chatUnlocked = $derived(loaded && status('population') === 'APPROVED');
	const activeIndex = $derived(STAGES.findIndex((s) => s.key === active));
	const prevStage = $derived(STAGES[activeIndex - 1]);
	const nextStage = $derived(STAGES[activeIndex + 1]);
	const nextUnlocked = $derived(nextStage ? isUnlocked(entries, nextStage.key) : false);
	const vocabularyTerms = $derived(termNames(entry('vocabulary')?.payload ?? {}));
	// Term types of the approved vocabulary: what a metadata attribute can be attached to.
	const vocabularyTypes = $derived([
		...new Set(
			((entry('vocabulary')?.payload?.terms as Term[] | undefined) ?? [])
				.map((t) => t.type)
				.filter(Boolean)
		)
	]);
	let droppedPairs = $state<string[]>([]);
	const vocabularyRows = $derived(
		((entry('vocabulary')?.payload?.terms as Term[] | undefined) ?? []).filter((t) => t.term)
	);
	const tree = $derived(taxonomyTree(pairs));
	const suggestedByType = $derived(typeSuggestions(vocabularyRows, pairs));
	const missingGroupTerms = $derived(typesWithoutGroupTerm(vocabularyRows));
	const missingTerms = $derived(missingTaxonomyTerms(pairs, vocabularyRows));

	// Adds the names the taxonomy uses to the vocabulary, approves it again, and keeps the pairs
	// being edited. Later stages are marked out of date by the server, as for any vocabulary edit.
	async function addMissingTerms() {
		const add: MissingTerm[] = missingTerms;
		if (add.length === 0) return;
		busy = 'vocabulary';
		message = '';
		try {
			const base = deepClone(entry('vocabulary')?.payload ?? {}) as Record<string, any>;
			const rows = (base.terms as Term[]) ?? [];
			base.terms = [
				...rows,
				...add.map((m) => ({
					term: m.name,
					type: m.type,
					aliases: [],
					definition: '',
					origin: 'taxonomy'
				}))
			];
			const saved = await KnowledgeAPIService.ontologySave(label.trim(), 'vocabulary', base);
			if (!saved?.stage) {
				errors = [saved?.error ?? 'Could not update the vocabulary.'];
				return;
			}
			const approved = await KnowledgeAPIService.ontologyApprove(label.trim(), 'vocabulary');
			if (!approved?.approved) {
				errors = approved?.errors ?? [approved?.error ?? 'The vocabulary could not be approved.'];
				return;
			}
			await KnowledgeAPIService.ontologySave(label.trim(), 'taxonomy', payload());
			const overview = await KnowledgeAPIService.ontologyOverview(label.trim());
			entries = (overview?.stages ?? entries) as StageEntry[];
			open('taxonomy');
			message = `Added ${add.length} term${add.length === 1 ? '' : 's'} to the vocabulary and approved it again. Metadata is out of date: review and approve it when you get there.`;
		} catch (e) {
			errors = [`${e}`];
		} finally {
			busy = '';
		}
	}

	const attributeNameOptions = $derived(
		attributeSuggestions
			.map((a) => a.name)
			.filter((n) => !entityAttributes.some((r) => r.name.trim().toLowerCase() === n.toLowerCase()))
	);

	// Picking a suggested name in the Name field fills the rest of that row (only cells still empty).
	function fillFromSuggestion() {
		for (const row of entityAttributes) {
			const hit = attributeSuggestions.find(
				(s) => s.name.toLowerCase() === row.name.trim().toLowerCase()
			);
			if (!hit || row.example || row.description) continue;
			row.name = hit.name;
			row.datatype = hit.datatype;
			row.appliesTo = [...(hit.appliesTo ?? [])];
			row.description = hit.description ?? '';
			row.example = hit.example ?? '';
		}
	}

	function groupByType() {
		pairs = [...pairs, ...suggestedByType];
		mark();
	}
	const typeNames = $derived([...new Set(terms.map((t) => t.type).filter(Boolean))]);
	const ontologyClasses = $derived(
		active === 'ontology'
			? classes.map((c) => c.name).filter(Boolean)
			: classNames(entry('ontology')?.payload ?? {})
	);

	function load(next?: StageKey) {
		if (!label.trim()) return Promise.resolve();
		busy = 'load';
		return KnowledgeAPIService.ontologyOverview(label.trim())
			.then((res) => {
				entries = (res?.stages ?? []) as StageEntry[];
				loaded = true;
				open(next ?? currentStage(entries));
			})
			.catch((e) => (message = `Could not load: ${e}`))
			.finally(() => (busy = ''));
	}

	function open(key: StageKey) {
		showChat = false;
		active = key;
		errors = [];
		message = '';
		dirty = false;
		const p = deepClone(entry(key)?.payload ?? {}) as Record<string, any>;
		terms = (p.terms as Term[]) ?? [];
		pairs = (p.pairs as Pair[]) ?? [];
		classes = (p.classes as ClassDef[]) ?? [];
		relations = (p.relations as RelationDef[]) ?? [];
		entityAttributes = (p.entityAttributes as Attribute[]) ?? [];
		relationAttributes = (p.relationAttributes as Attribute[]) ?? [];
		sourceKind = Array.isArray(p.files) && p.files.length > 0 && !p.text ? 'csv' : 'text';
		sourceText = (p.text as string) ?? '';
		sourceFiles = (p.files as { name: string; content: string }[]) ?? [];
		droppedPairs = key === 'taxonomy' && Array.isArray(p.dropped) ? p.dropped.map(String) : [];
		const { terms: _t, ...rest } = p;
		vocabularyExtras = key === 'vocabulary' ? rest : {};
		attributeSuggestions =
			key === 'metadata' && Array.isArray(p.suggestions) ? (p.suggestions as Attribute[]) : [];
	}

	function payload(): Record<string, unknown> {
		switch (active) {
			case 'source':
				return sourceKind === 'csv'
					? { kind: 'csv', files: sourceFiles }
					: { kind: 'text', text: sourceText };
			case 'vocabulary':
				return { ...vocabularyExtras, terms: withoutBlankRows(terms, ['term']) };
			case 'metadata':
				return {
					provenance: (entry('metadata')?.payload.provenance as string[]) ?? [],
					entityAttributes: withoutBlankRows(entityAttributes, ['name']),
					suggestions: attributeSuggestions,
					relationAttributes: withoutBlankRows(relationAttributes, ['name'])
				};
			case 'taxonomy':
				return {
					...(droppedPairs.length ? { dropped: droppedPairs } : {}),
					pairs: withoutBlankRows(pairs, ['parent', 'child'])
				};
			case 'ontology':
				return {
					classes: withoutBlankRows(classes, ['name']),
					relations: withoutBlankRows(relations, ['name'])
				};
			default:
				return {};
		}
	}

	function applyResult(res: StageEntry | undefined) {
		if (!res?.stage) return false;
		entries = entries.map((e) => (e.stage === res.stage ? { ...e, ...res } : e));
		errors = res.errors ?? [];
		return true;
	}

	async function save(): Promise<boolean> {
		busy = 'save';
		try {
			const res = await KnowledgeAPIService.ontologySave(label.trim(), active, payload());
			if (!applyResult(res)) {
				message = res?.error ?? 'Saving failed.';
				return false;
			}
			// a change to an approved stage makes the later ones stale: refresh their status
			const overview = await KnowledgeAPIService.ontologyOverview(label.trim());
			entries = (overview?.stages ?? entries) as StageEntry[];
			dirty = false;
			message = 'Saved.';
			return true;
		} finally {
			busy = '';
		}
	}

	async function approve() {
		if (dirty || status(active) === 'EMPTY') {
			if (!(await save())) return;
		}
		busy = 'approve';
		try {
			const res = await KnowledgeAPIService.ontologyApprove(label.trim(), active);
			if (res?.approved) {
				applyResult(res);
				errors = [];
				message = 'Approved.';
				const next = STAGES[STAGES.findIndex((s) => s.key === active) + 1];
				if (next) open(next.key);
			} else {
				errors = res?.errors ?? [res?.error ?? 'Could not approve.'];
			}
		} finally {
			busy = '';
		}
	}

	// In-app replacement for window.confirm: resolves true when the user confirms.
	let dialog = $state<{ title: string; message: string; confirm: string; danger: boolean } | null>(
		null
	);
	let dialogOpen = $state(false);
	let dialogResolve: ((ok: boolean) => void) | null = null;

	function ask(title: string, message: string, confirm = 'Replace', danger = false) {
		dialog = { title, message, confirm, danger };
		dialogOpen = true;
		return new Promise<boolean>((resolve) => (dialogResolve = resolve));
	}

	function answer(ok: boolean) {
		dialogOpen = false;
		dialogResolve?.(ok);
		dialogResolve = null;
	}

	async function propose() {
		if (
			dirty &&
			!(await ask(
				'Replace your unsaved edits?',
				'The AI proposal will overwrite what you changed on this stage and have not saved yet.'
			))
		)
			return;
		if (
			status(active) !== 'EMPTY' &&
			!dirty &&
			!(await ask(
				'Replace this stage?',
				'This stage already has content. A new AI proposal will replace it. You can still edit the result before approving.'
			))
		)
			return;
		busy = 'propose';
		message = '';
		try {
			const res = await KnowledgeAPIService.ontologyPropose(label.trim(), active);
			if (res?.error) {
				errors = [res.error];
				return;
			}
			applyResult(res);
			const overview = await KnowledgeAPIService.ontologyOverview(label.trim());
			entries = (overview?.stages ?? entries) as StageEntry[];
			open(active);
			errors = res?.errors ?? [];
			message = 'Proposal ready: review it, edit what is wrong, then approve.';
		} catch (e) {
			errors = [`${e}`];
		} finally {
			busy = '';
		}
	}

	async function reset() {
		if (
			!(await ask(
				'Discard all drafts?',
				`Every draft stage of "" will be deleted. The published graph is not touched.`,
				'Discard',
				true
			))
		)
			return;
		await KnowledgeAPIService.ontologyReset(label.trim());
		load('source');
	}

	function readFiles(list: FileList | null) {
		if (!list) return;
		Promise.all(
			[...list].map(
				(f) =>
					new Promise<{ name: string; content: string }>((resolve, reject) => {
						const r = new FileReader();
						r.onload = () => resolve({ name: f.name, content: String(r.result ?? '') });
						r.onerror = () => reject(r.error);
						r.readAsText(f);
					})
			)
		).then((files) => {
			sourceFiles = [...sourceFiles.filter((e) => !files.some((f) => f.name === e.name)), ...files];
			dirty = true;
		});
	}

	async function build() {
		building = true;
		log = [];
		rejected = [];
		buildSummary = '';
		embeddedCount = 0;
		try {
			await KnowledgeAPIService.ontologyPopulate(label.trim(), replace, ({ event, data }) => {
				if (event === 'triple_rejected') {
					rejected = [...rejected, data as unknown as RejectedTriple];
				} else if (event === 'section_done') {
					embeddedCount += Number(data.embedded ?? 0);
					log = [...log, `Section "${data.section}": ${data.triples} links stored`];
				} else if (event === 'stage_start') {
					log = [...log, `Stage: ${String(data.stage).replace('_', ' ')}`];
				} else if (event === 'terms_written') {
					log = [...log, `${data.count} vocabulary terms written`];
				} else if (event === 'csv_imported') {
					log = [
						...log,
						`CSV imported: ${data.entityRows} rows, ${data.relationshipsCreated} links`
					];
				} else if (event === 'reconciled') {
					log = [
						...log,
						`Checked against the ontology: ${data.nodesRemoved} nodes and ${data.edgesRemoved} links removed`
					];
				} else if (event === 'already_exists') {
					buildSummary = String(data.message);
				} else if (event === 'error') {
					buildSummary = `Failed: ${data.message}`;
				} else if (event === 'complete') {
					chatStats = { nodes: Number(data.nodes ?? 0), relationships: 0 };
					buildSummary = `Done: ${data.nodes} nodes, ${data.accepted} links stored, ${data.rejected} for review.`;
					if (Array.isArray(data.rejectedList)) rejected = data.rejectedList as RejectedTriple[];
				}
			});
			const overview = await KnowledgeAPIService.ontologyOverview(label.trim());
			entries = (overview?.stages ?? entries) as StageEntry[];
			const saved = entry('population')?.payload.rejected;
			if (Array.isArray(saved)) rejected = saved as RejectedTriple[];
		} catch (e) {
			buildSummary = `Build failed: ${e}`;
		} finally {
			building = false;
		}
	}

	const mark = () => (dirty = true);
</script>

{#snippet treeNode(n: TreeNode)}
	<li>
		<span class="font-medium text-zinc-800">{n.name}</span>
		{#if n.children.length > 0}
			<ul class="ml-3 space-y-0.5 border-l border-zinc-200 pl-2">
				{#each n.children as c (c.name)}{@render treeNode(c)}{/each}
			</ul>
		{/if}
	</li>
{/snippet}

<div class="space-y-4 text-xs">
	<div class="flex flex-wrap items-center gap-2">
		<label class="flex items-center gap-2">
			<span class="font-medium text-zinc-600">Knowledge base label</span>
			<input
				bind:value={label}
				placeholder="e.g. napoleon"
				onkeydown={(e) => e.key === 'Enter' && load()}
				class="w-48 rounded border border-zinc-300 bg-white px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
			/>
		</label>
		<button
			onclick={() => load()}
			disabled={!label.trim() || busy === 'load'}
			class="rounded-md bg-zinc-800 px-3 py-1 text-white hover:bg-zinc-700 disabled:opacity-40"
			>{loaded ? 'Reload' : 'Open'}</button
		>
		{#if loaded}
			<button
				onclick={reset}
				class="rounded-md border border-zinc-300 px-3 py-1 text-zinc-600 hover:bg-zinc-50"
				>Discard drafts</button
			>
		{/if}
		<select
			class="rounded border border-zinc-300 bg-white px-1.5 py-1 text-zinc-600"
			title="Open a ready-made example: sets the label and fills the source stage"
			onchange={(e) => {
				pickSample(e.currentTarget.value);
				e.currentTarget.value = '';
			}}
		>
			<option value="">Load sample ↓</option>
			{#each SAMPLES as sample (sample.id)}
				<option value={sample.id}>{sample.name}</option>
			{/each}
		</select>
	</div>

	<!-- Flow: always visible, like the Quick import steps -->
	<ol class="flex items-start overflow-x-auto pb-1" aria-label="Pipeline stages">
		{#each STAGES as s, i (s.key)}
			{@const st = loaded ? status(s.key) : 'EMPTY'}
			{@const done = st === 'APPROVED'}
			{@const current = loaded && !showChat && active === s.key}
			{@const unlocked = loaded && isUnlocked(entries, s.key)}
			<li class="flex items-start">
				<button
					onclick={() => unlocked && open(s.key)}
					disabled={!unlocked}
					aria-current={current ? 'step' : undefined}
					aria-label="{i + 1}. {s.label}: {STATUS_STYLE[st].label}"
					class="flex w-24 flex-col items-center gap-1 disabled:cursor-default"
				>
					<span
						class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all"
						class:bg-emerald-500={done && !current}
						class:border-emerald-500={done}
						class:text-white={done || current}
						class:bg-zinc-800={current}
						class:border-zinc-800={current}
						class:bg-white={!done && !current}
						class:border-amber-400={st === 'STALE' && !current}
						class:border-zinc-300={!done && !current && st !== 'STALE'}
						class:text-zinc-400={!done && !current}
					>
						{#if done && !current}✓{:else}{i + 1}{/if}
					</span>
					<span
						class="text-center text-[10px] font-medium leading-tight"
						class:text-emerald-600={done && !current}
						class:text-zinc-800={current}
						class:text-zinc-400={!done && !current}>{s.label}</span
					>
					{#if loaded}
						<span class="rounded px-1.5 py-0.5 text-[9px] {STATUS_STYLE[st].cls}"
							>{STATUS_STYLE[st].label}</span
						>
					{/if}
				</button>
				{#if true}
					<span
						class="mx-0.5 mt-4 h-0.5 w-6 shrink-0 rounded-full transition-colors"
						class:bg-emerald-400={done}
						class:bg-zinc-200={!done}
					></span>
				{/if}
			</li>
		{/each}
		<li class="flex items-start">
			<button
				onclick={() => chatUnlocked && (showChat = true)}
				disabled={!chatUnlocked}
				aria-current={showChat ? 'step' : undefined}
				aria-label="7. Chat"
				class="flex w-24 flex-col items-center gap-1 disabled:cursor-default"
			>
				<span
					class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all"
					class:bg-zinc-800={showChat}
					class:border-zinc-800={showChat}
					class:text-white={showChat}
					class:bg-white={!showChat}
					class:border-indigo-500={chatUnlocked && !showChat}
					class:text-indigo-600={chatUnlocked && !showChat}
					class:border-zinc-300={!chatUnlocked}
					class:text-zinc-400={!chatUnlocked}>7</span
				>
				<span
					class="text-center text-[10px] font-medium leading-tight"
					class:text-zinc-800={showChat}
					class:text-indigo-600={chatUnlocked && !showChat}
					class:text-zinc-400={!chatUnlocked}>Chat</span
				>
			</button>
		</li>
	</ol>

	{#if !loaded}
		<p class="text-zinc-400">
			Type a label and press Open, or load a sample. You will walk through these steps in order,
			editing and approving each one before the next unlocks.
		</p>
	{/if}

	{#if loaded && showChat}
		<div class="h-[calc(100vh-22rem)]">
			<KnowledgeChat initialLabel={label.trim()} stats={chatStats} />
		</div>
	{:else if loaded}
		<div class="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-1">
			<h2 class="text-sm font-semibold text-zinc-800">{info.title}</h2>
			<p class="text-zinc-600">{info.help}</p>
			{#if info.example}<p class="text-zinc-400">{info.example}</p>{/if}
			{#if status(active) === 'STALE'}
				<p class="text-red-600">
					An earlier stage changed after this one was approved. Propose again or review, then
					approve.
				</p>
			{/if}
		</div>

		<!-- Stage editors -->
		{#if active === 'source'}
			<div class="space-y-3">
				<div class="flex gap-4">
					<label class="flex items-center gap-1.5"
						><input type="radio" bind:group={sourceKind} value="text" onchange={mark} /> Text</label
					>
					<label class="flex items-center gap-1.5"
						><input type="radio" bind:group={sourceKind} value="csv" onchange={mark} /> CSV tables</label
					>
				</div>
				{#if sourceKind === 'text'}
					<textarea
						bind:value={sourceText}
						oninput={mark}
						rows="10"
						aria-label="Source text"
						placeholder="Paste the text the knowledge base should be built from…"
						class="w-full rounded border border-zinc-300 bg-white p-2 focus:outline-none focus:ring-1 focus:ring-zinc-400"
					></textarea>
				{:else}
					<input
						type="file"
						accept=".csv,text/csv"
						multiple
						aria-label="CSV files"
						onchange={(e) => readFiles(e.currentTarget.files)}
					/>
					<ul class="space-y-0.5">
						{#each sourceFiles as f (f.name)}
							<li class="flex items-center gap-2 text-zinc-700">
								<span class="font-mono">{f.name}</span>
								<span class="text-zinc-400">{f.content.split('\n').length - 1} lines</span>
								<button
									class="text-zinc-400 hover:text-red-600"
									aria-label="Remove {f.name}"
									onclick={() => {
										sourceFiles = sourceFiles.filter((x) => x.name !== f.name);
										mark();
									}}>✕</button
								>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{:else if active === 'vocabulary'}
			<EditableTable
				bind:rows={terms}
				blank={blankTerm}
				addLabel="Add term"
				onchange={mark}
				columns={[
					{ key: 'term', label: 'Term', width: '20%', locked: (r) => r.origin === 'csv' },
					{ key: 'type', label: 'Type (class)', width: '14%', options: typeNames },
					{ key: 'aliases', label: 'Aliases', kind: 'tags', width: '24%' },
					{ key: 'definition', label: 'Definition', kind: 'textarea' }
				]}
			/>
			{#if Array.isArray(vocabularyExtras.sections)}
				<p class="text-zinc-400">
					Analysis kept alongside: {(vocabularyExtras.sections as unknown[]).length} sections and
					{(vocabularyExtras.relationshipHints as unknown[] | undefined)?.length ?? 0} evidence-backed
					links to base the ontology on.
				</p>
			{/if}
			<p class="text-zinc-400">
				Names of terms taken from CSV rows are fixed, because renaming would break the link to the
				imported row.
			</p>
		{:else if active === 'metadata'}
			t <ol class="list-decimal space-y-0.5 pl-5 text-zinc-600">
				<li>
					Press <b>✨ Suggest with AI</b> below: it proposes attributes the source states a value for,
					each with a quoted sentence.
				</li>
				<li>Edit any cell, tick the term types an attribute applies to, or remove a row with ✕.</li>
				<li>Use <b>+ Add attribute</b> for your own, then <b>Approve and continue</b>.</li>
			</ol>
			{#if Array.isArray(entry('metadata')?.payload.provenance)}
				<p class="text-zinc-600">
					Always recorded: <span class="font-mono"
						>{(entry('metadata')?.payload.provenance as string[]).join(', ')}</span
					>
				</p>
			{/if}
			<EditableTable
				bind:rows={entityAttributes}
				blank={blankAttribute}
				addLabel="Add attribute"
				caption="Attributes of terms: pick the term types each one can be added to (none picked = all types)"
				onchange={() => {
					fillFromSuggestion();
					mark();
				}}
				columns={[
					{
						key: 'name',
						label: 'Name',
						width: '16%',
						options: attributeNameOptions,
						placeholder: 'pick a suggestion or type'
					},
					{ key: 'datatype', label: 'Type', kind: 'select', options: DATATYPES, width: '9%' },
					{
						key: 'appliesTo',
						label: 'Applies to',
						kind: 'chips',
						options: vocabularyTypes,
						width: '22%'
					},
					{ key: 'description', label: 'Meaning', kind: 'textarea', width: '18%' },
					{
						key: 'example',
						label: 'Example from the source',
						kind: 'textarea',
						placeholder: 'AI suggestions quote the sentence here',
						locked: (r) => Boolean(r.example)
					},
					{ key: 'required', label: 'Required', kind: 'checkbox', width: '6%' }
				]}
			/>
			<EditableTable
				bind:rows={relationAttributes}
				blank={blankAttribute}
				addLabel="Add attribute"
				caption="Attributes of links"
				onchange={mark}
				columns={[
					{ key: 'name', label: 'Name', width: '40%' },
					{ key: 'datatype', label: 'Type', kind: 'select', options: DATATYPES, width: '25%' },
					{ key: 'required', label: 'Required', kind: 'checkbox' }
				]}
			/>
		{:else if active === 'taxonomy'}
			<div class="flex flex-wrap items-center gap-2">
				<button
					type="button"
					onclick={groupByType}
					disabled={suggestedByType.length === 0}
					title="Put terms under the vocabulary term that is named like their type"
					class="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
					>Group by type{suggestedByType.length ? ` (${suggestedByType.length})` : ''}</button
				>
				<span class="text-zinc-400"
					>AI suggestion: the "Suggest with AI" button below. It keeps only pairs the source states
					in one sentence.</span
				>
			</div>
			{#if missingTerms.length > 0}
				<div class="space-y-1.5 rounded-md border border-amber-200 bg-amber-50 p-2.5">
					<p class="font-medium text-amber-900">
						{missingTerms.length} name{missingTerms.length === 1 ? '' : 's'} used here
						{missingTerms.length === 1 ? 'is' : 'are'} not in the vocabulary yet
					</p>
					<ul class="flex flex-wrap gap-1.5">
						{#each missingTerms as m (m.name)}
							<li class="rounded-full border border-amber-300 bg-white px-2 py-0.5 text-amber-900">
								{m.name}
								<span class="text-amber-600">· {m.role === 'parent' ? 'category' : m.type}</span>
							</li>
						{/each}
					</ul>
					<button
						type="button"
						onclick={addMissingTerms}
						disabled={!!busy}
						class="rounded-md bg-amber-700 px-3 py-1 text-white hover:bg-amber-600 disabled:opacity-40"
						>{busy === 'vocabulary'
							? 'Adding…'
							: `Add ${missingTerms.length} to the vocabulary`}</button
					>
					<p class="text-amber-800">
						Adds them with the suggested types, approves the vocabulary again, and keeps your pairs.
						Rename or retype them later in the Vocabulary stage if needed.
					</p>
				</div>
			{/if}
			{#if missingGroupTerms.length > 0}
				<p class="text-zinc-400">
					To group by type, add a term named like the type in the Vocabulary stage:
					{missingGroupTerms.join(', ')}.
				</p>
			{/if}
			<div class="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
				<EditableTable
					bind:rows={pairs}
					blank={blankPair}
					addLabel="Add pair"
					onchange={mark}
					columns={[
						{
							key: 'child',
							label: 'Is a kind of… (child)',
							options: vocabularyTerms,
							width: '28%'
						},
						{ key: 'parent', label: '…this parent', options: vocabularyTerms, width: '28%' },
						{ key: 'evidence', label: 'Evidence from the source', kind: 'textarea' }
					]}
				/>
				<div class="space-y-2 rounded-md border border-zinc-200 bg-white p-2">
					<h3 class="font-semibold text-zinc-700">Tree</h3>
					{#if tree.roots.length === 0}
						<p class="text-zinc-400">No pairs yet.</p>
					{:else}
						<ul class="space-y-0.5">
							{#each tree.roots as root (root.name)}
								{@render treeNode(root)}
							{/each}
						</ul>
					{/if}
					{#if tree.issues.length > 0}
						<ul class="space-y-0.5 text-red-600" role="alert">
							{#each tree.issues as issue (issue)}<li>{issue}</li>{/each}
						</ul>
					{/if}
				</div>
			</div>
			{#if droppedPairs.length > 0}
				<details class="text-zinc-500">
					<summary class="cursor-pointer">
						{droppedPairs.length} suggested pair{droppedPairs.length === 1 ? '' : 's'} left out because
						the source does not state them
					</summary>
					<ul class="mt-1 list-disc pl-5">
						{#each droppedPairs as d, i (i)}<li>{d}</li>{/each}
					</ul>
				</details>
			{:else if pairs.length === 0}
				<p class="text-zinc-400">
					The AI found no "is a / kind of / part of" statement in the source, so nothing is
					suggested. Add pairs yourself, or use "Group by type".
				</p>
			{/if}
		{:else if active === 'ontology'}
			<EditableTable
				bind:rows={classes}
				blank={blankClass}
				addLabel="Add class"
				caption="Classes"
				onchange={mark}
				columns={[
					{ key: 'name', label: 'Class', width: '25%' },
					{ key: 'parent', label: 'Subclass of', options: ontologyClasses, width: '25%' },
					{ key: 'description', label: 'Description', kind: 'textarea' }
				]}
			/>
			<EditableTable
				bind:rows={relations}
				blank={blankRelation}
				addLabel="Add relation"
				caption="Relations allowed between classes (strict: anything else is rejected)"
				onchange={mark}
				columns={[
					{ key: 'name', label: 'Relation', width: '22%', placeholder: 'UPPER_SNAKE_CASE' },
					{
						key: 'domain',
						label: 'From class',
						kind: 'select',
						options: ontologyClasses,
						width: '18%'
					},
					{
						key: 'range',
						label: 'To class',
						kind: 'select',
						options: ontologyClasses,
						width: '18%'
					},
					{ key: 'description', label: 'Description', kind: 'textarea' }
				]}
			/>
		{:else}
			<!-- Build -->
			<div class="space-y-3">
				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={replace} />
					Replace the existing graph of "{label}" if there is one
				</label>
				<button
					onclick={build}
					disabled={building || !isUnlocked(entries, 'population')}
					class="rounded-md bg-zinc-800 px-3 py-1.5 text-white hover:bg-zinc-700 disabled:opacity-40"
					>{building ? 'Building…' : 'Build graph and vector index'}</button
				>
				{#if !isUnlocked(entries, 'population')}
					<p class="text-zinc-400">Approve all earlier stages to enable the build.</p>
				{/if}

				<div class="rounded-lg border border-zinc-200 bg-white p-3 space-y-1">
					<h3 class="font-semibold text-zinc-700">Vector index (standard pipeline)</h3>
					<p class="text-zinc-600">
						<span class="font-medium">1 Chunking</span>: sections are split into sentence-aware
						chunks of about 1,500 characters →
						<span class="font-medium">2 Embedding</span>: each chunk and each term is turned into a
						Jina vector →
						<span class="font-medium">3 Indexing</span>: vectors are stored in pgvector for
						similarity search.
					</p>
					<p class="text-zinc-400">
						This runs automatically during the build, and it does not use the ontology.
						{#if embeddedCount > 0}Embedded this run: {embeddedCount}.{/if}
					</p>
				</div>

				{#if log.length > 0}
					<ul
						class="max-h-40 overflow-auto rounded-md bg-zinc-50 p-2 font-mono text-[11px] text-zinc-600"
					>
						{#each log as line, i (i)}<li>{line}</li>{/each}
					</ul>
				{/if}
				{#if buildSummary}<p class="font-medium text-zinc-800">{buildSummary}</p>{/if}
				{#if status('population') === 'APPROVED' && !building}
					<button
						onclick={() => (showChat = true)}
						class="rounded-md bg-emerald-700 px-3 py-1.5 text-white hover:bg-emerald-600"
						>Chat with this knowledge base →</button
					>
				{/if}

				{#if rejected.length > 0}
					<div class="space-y-1">
						<h3 class="font-semibold text-zinc-700">
							For review: {rejected.length} links kept out of the graph
						</h3>
						<p class="text-zinc-400">
							To accept one, add the missing term or alias in Vocabulary, or allow the relation in
							Ontology, then build again with "Replace".
						</p>
						<div class="max-h-72 overflow-auto rounded-md border border-zinc-200">
							<table class="w-full min-w-[36rem] text-left">
								<thead class="sticky top-0 bg-zinc-50 text-zinc-500">
									<tr>
										<th class="px-2 py-1 font-medium">Link</th>
										<th class="px-2 py-1 font-medium">Why not</th>
										<th class="px-2 py-1 font-medium">Source sentence</th>
									</tr>
								</thead>
								<tbody>
									{#each rejected as r, i (i)}
										<tr class="border-t border-zinc-100 align-top">
											<td class="px-2 py-1"
												>{r.subject} <span class="font-mono text-indigo-600">{r.predicate}</span>
												{r.object}</td
											>
											<td class="px-2 py-1 text-red-600">{r.reason}</td>
											<td class="px-2 py-1 text-zinc-500">{r.evidence ?? ''}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Stage actions -->
		{#if active !== 'population'}
			{#if errors.length > 0}
				<ul
					class="space-y-0.5 rounded-md border border-red-200 bg-red-50 p-2 text-red-700"
					role="alert"
				>
					{#each errors as err, i (i)}<li>{err}</li>{/each}
				</ul>
			{/if}
			<div class="flex flex-wrap items-center gap-2">
				{#if active !== 'source'}
					<button
						onclick={propose}
						disabled={!!busy}
						class="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
						>{busy === 'propose' ? 'Working…' : '✨ Suggest with AI'}</button
					>
				{/if}
				<button
					onclick={save}
					disabled={!!busy || !dirty}
					class="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
					>Save draft</button
				>
				<button
					onclick={approve}
					disabled={!!busy}
					class="rounded-md bg-emerald-700 px-3 py-1.5 text-white hover:bg-emerald-600 disabled:opacity-40"
					>{status(active) === 'APPROVED' && !dirty ? 'Approved' : 'Approve and continue'}</button
				>
				{#if message}<span class="text-zinc-500">{message}</span>{/if}
			</div>
		{/if}
		{#if prevStage || nextStage}
			<div class="flex items-center justify-between border-t border-zinc-200 pt-3">
				{#if prevStage}
					<button
						onclick={() => open(prevStage.key)}
						class="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
						>← {prevStage.label}</button
					>
				{:else}<span></span>{/if}
				{#if nextStage}
					<button
						onclick={() => open(nextStage.key)}
						disabled={!nextUnlocked || dirty}
						title={dirty
							? 'Save or approve your edits first'
							: nextUnlocked
								? ''
								: 'Approve this stage to unlock the next one'}
						class="rounded-md bg-zinc-800 px-3 py-1.5 text-white hover:bg-zinc-700 disabled:opacity-40"
						>Next: {nextStage.label} →</button
					>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<Modal bind:open={dialogOpen} title={dialog?.title ?? ''} width="sm" onclose={() => answer(false)}>
	<p>{dialog?.message}</p>
	<svelte:fragment slot="footer">
		<button
			type="button"
			onclick={() => answer(false)}
			class="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
			>Cancel</button
		>
		<button
			type="button"
			onclick={() => answer(true)}
			class="rounded-md px-3 py-1.5 text-white {dialog?.danger
				? 'bg-red-600 hover:bg-red-500'
				: 'bg-zinc-800 hover:bg-zinc-700'}">{dialog?.confirm ?? 'OK'}</button
		>
	</svelte:fragment>
</Modal>
