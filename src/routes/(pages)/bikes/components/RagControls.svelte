<script lang="ts">
	import { BikesAPIService } from '$services/apiService';

	let { onExamples }: { onExamples?: (questions: string[]) => void } = $props();

	type OpState = 'idle' | 'loading' | 'ok' | 'error';

	interface OpStatus {
		state: OpState;
		message?: string;
	}

	let embedder = $state('jina');
	let batchSize = $state(50);
	let deleteType = $state<'all' | 'nodes' | 'relationships'>('all');

	let statusEmbed = $state<Record<'nodes' | 'relationships' | 'all', OpStatus>>({
		nodes: { state: 'idle' },
		relationships: { state: 'idle' },
		all: { state: 'idle' }
	});
	let statusDelete = $state<OpStatus>({ state: 'idle' });
	let statusDedupe = $state<OpStatus>({ state: 'idle' });
	let dedupeResult = $state<{ duplicatesRemoved: number; remainingDuplicates: number } | null>(
		null
	);
	let statusInfo = $state<OpStatus>({ state: 'idle' });
	let statusInfoData = $state<Record<string, unknown> | null>(null);
	let statusExamples = $state<OpStatus>({ state: 'idle' });
	let examplesList = $state<string[]>([]);

	async function runEmbed(target: 'nodes' | 'relationships' | 'all') {
		statusEmbed[target] = { state: 'loading' };
		try {
			const fn =
				target === 'nodes'
					? BikesAPIService.ragEmbedNodes
					: target === 'relationships'
						? BikesAPIService.ragEmbedRelationships
						: BikesAPIService.ragEmbedAll;
			const res = await fn(embedder, batchSize);
			const summary = res?.embedded ?? res?.count ?? res?.message ?? 'done';
			statusEmbed[target] = { state: 'ok', message: String(summary) };
		} catch (e) {
			statusEmbed[target] = { state: 'error', message: String(e) };
		}
	}

	async function runDelete() {
		statusDelete = { state: 'loading' };
		try {
			const res = await BikesAPIService.ragDeleteEmbeddings(deleteType);
			statusDelete = { state: 'ok', message: res?.message ?? 'deleted' };
		} catch (e) {
			statusDelete = { state: 'error', message: String(e) };
		}
	}

	async function runDeduplicate() {
		statusDedupe = { state: 'loading' };
		dedupeResult = null;
		try {
			const res = await BikesAPIService.ragDeduplicateGraph();
			dedupeResult = res;
			statusDedupe = { state: 'ok' };
		} catch (e) {
			statusDedupe = { state: 'error', message: String(e) };
		}
	}

	async function fetchStatus() {
		statusInfo = { state: 'loading' };
		statusInfoData = null;
		try {
			const res = await BikesAPIService.ragGetStatus();
			statusInfoData = res;
			statusInfo = { state: 'ok' };
		} catch (e) {
			statusInfo = { state: 'error', message: String(e) };
		}
	}

	async function fetchExamples() {
		statusExamples = { state: 'loading' };
		examplesList = [];
		try {
			const res = await BikesAPIService.ragGetExampleQuestions();
			const questions: string[] = Array.isArray(res) ? res : (res?.questions ?? []);
			examplesList = questions;
			statusExamples = { state: 'ok', message: `${questions.length} questions` };
			onExamples?.(questions);
		} catch (e) {
			statusExamples = { state: 'error', message: String(e) };
		}
	}

	function stateIcon(s: OpState) {
		if (s === 'loading') return '⏳';
		if (s === 'ok') return '✓';
		if (s === 'error') return '✕';
		return '';
	}

	function stateClass(s: OpState) {
		if (s === 'ok') return 'text-emerald-600';
		if (s === 'error') return 'text-red-500';
		return 'text-zinc-400';
	}
</script>

<div class="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 space-y-3 text-xs">
	<!-- Params row -->
	<div class="flex items-center gap-4 flex-wrap">
		<span class="font-semibold text-zinc-600 uppercase tracking-wide">RAG Controls</span>
		<label class="flex items-center gap-1.5 text-zinc-500">
			Embedder
			<input
				bind:value={embedder}
				class="border border-zinc-300 rounded px-2 py-0.5 w-24 bg-white"
				placeholder="jina"
			/>
		</label>
		<label class="flex items-center gap-1.5 text-zinc-500">
			Batch size
			<input
				type="number"
				bind:value={batchSize}
				min="1"
				max="500"
				class="border border-zinc-300 rounded px-2 py-0.5 w-16 bg-white"
			/>
		</label>
	</div>

	<!-- Embed row -->
	<div class="flex items-center gap-2 flex-wrap">
		<span class="text-zinc-400 w-20 shrink-0">Embed</span>

		{#each ['nodes', 'relationships', 'all'] as target (target)}
			{@const st = statusEmbed[target as 'nodes' | 'relationships' | 'all']}
			<button
				onclick={() => runEmbed(target as 'nodes' | 'relationships' | 'all')}
				disabled={st.state === 'loading'}
				class="flex items-center gap-1 px-3 py-1 rounded-full border border-zinc-300 bg-white
					hover:border-zinc-500 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors capitalize"
			>
				{#if st.state === 'loading'}
					<span
						class="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"
					></span>
				{/if}
				{target}
			</button>
			{#if st.state !== 'idle'}
				<span class="font-mono {stateClass(st.state)} flex items-center gap-0.5">
					{stateIcon(st.state)}
					{#if st.message}<span class="text-zinc-500">{st.message}</span>{/if}
				</span>
			{/if}
		{/each}
	</div>

	<!-- Delete row -->
	<div class="flex items-center gap-2 flex-wrap">
		<span class="text-zinc-400 w-20 shrink-0">Delete</span>
		<select bind:value={deleteType} class="border border-zinc-300 rounded px-2 py-0.5 bg-white">
			<option value="all">all</option>
			<option value="nodes">nodes</option>
			<option value="relationships">relationships</option>
		</select>
		<button
			onclick={runDelete}
			disabled={statusDelete.state === 'loading'}
			class="flex items-center gap-1 px-3 py-1 rounded-full border border-red-200 text-red-600 bg-white
				hover:border-red-400 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>
			{#if statusDelete.state === 'loading'}
				<span class="w-3 h-3 border-2 border-red-300 border-t-transparent rounded-full animate-spin"
				></span>
			{/if}
			Delete embeddings
		</button>
		{#if statusDelete.state !== 'idle'}
			<span class="font-mono {stateClass(statusDelete.state)} flex items-center gap-0.5">
				{stateIcon(statusDelete.state)}
				{#if statusDelete.message}<span class="text-zinc-500">{statusDelete.message}</span>{/if}
			</span>
		{/if}
	</div>

	<!-- Deduplicate row -->
	<div class="flex items-center gap-2 flex-wrap">
		<span class="text-zinc-400 w-20 shrink-0">Dedupe</span>
		<button
			onclick={runDeduplicate}
			disabled={statusDedupe.state === 'loading'}
			class="flex items-center gap-1 px-3 py-1 rounded-full border border-amber-200 text-amber-700 bg-white
				hover:border-amber-400 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>
			{#if statusDedupe.state === 'loading'}
				<span
					class="w-3 h-3 border-2 border-amber-300 border-t-transparent rounded-full animate-spin"
				></span>
			{/if}
			Deduplicate graph
		</button>
		{#if statusDedupe.state !== 'idle'}
			<span class="font-mono {stateClass(statusDedupe.state)} flex items-center gap-0.5">
				{stateIcon(statusDedupe.state)}
				{#if statusDedupe.message}<span class="text-zinc-500">{statusDedupe.message}</span>{/if}
			</span>
		{/if}
		{#if dedupeResult}
			<span class="text-zinc-600">
				<span class="font-semibold">{dedupeResult.duplicatesRemoved}</span> removed ·
				<span class="font-semibold">{dedupeResult.remainingDuplicates}</span> remaining
			</span>
		{/if}
	</div>

	<!-- Status + Examples row -->
	<div class="flex items-center gap-2 flex-wrap">
		<span class="text-zinc-400 w-20 shrink-0">Inspect</span>

		<button
			onclick={fetchStatus}
			disabled={statusInfo.state === 'loading'}
			class="flex items-center gap-1 px-3 py-1 rounded-full border border-zinc-300 bg-white
				hover:border-zinc-500 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
		>
			{#if statusInfo.state === 'loading'}
				<span
					class="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"
				></span>
			{/if}
			Embedding status
		</button>

		<button
			onclick={fetchExamples}
			disabled={statusExamples.state === 'loading'}
			class="flex items-center gap-1 px-3 py-1 rounded-full border border-zinc-300 bg-white
				hover:border-zinc-500 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
		>
			{#if statusExamples.state === 'loading'}
				<span
					class="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"
				></span>
			{/if}
			Example questions
		</button>

		{#if statusExamples.state !== 'idle'}
			<span class="font-mono {stateClass(statusExamples.state)} flex items-center gap-0.5">
				{stateIcon(statusExamples.state)}
				{#if statusExamples.message}<span class="text-zinc-500">{statusExamples.message}</span>{/if}
			</span>
		{/if}
	</div>

	<!-- Status data -->
	{#if statusInfoData}
		<div
			class="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-[11px] text-zinc-600 overflow-x-auto"
		>
			<pre class="whitespace-pre-wrap">{JSON.stringify(statusInfoData, null, 2)}</pre>
		</div>
	{/if}

	<!-- Example questions chips -->
	{#if examplesList.length > 0}
		<div class="flex flex-wrap gap-1.5">
			{#each examplesList as q (q)}
				<span class="px-2 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600"
					>{q}</span
				>
			{/each}
		</div>
	{/if}
</div>
