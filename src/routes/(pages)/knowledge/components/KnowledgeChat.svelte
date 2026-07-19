<script lang="ts">
	import { KnowledgeAPIService } from '$services/apiService';

	interface GraphEntry {
		node: string;
		relationship: string;
		neighbor: string;
		neighborLabels?: string[];
	}

	interface RetrievalInfo {
		seedNodes?: string[];
		contextTriplets?: number;
		topK?: number;
		neighborLimit?: number;
		temperature?: number;
		seedPriority?: 'graph' | 'vector';
	}

	interface Message {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		timestamp: Date;
		error?: boolean;
		model?: string;
		graphContext?: GraphEntry[];
		sources?: unknown[];
		retrievalInfo?: RetrievalInfo;
		ragMode?: 'combined' | 'vector' | 'graph';
		strict?: boolean;
		temperature?: number;
		seedPriority?: 'graph' | 'vector';
	}

	let {
		initialLabel = 'napoleon',
		stats = null
	}: {
		initialLabel?: string;
		stats?: { nodes?: number; relationships?: number } | null;
	} = $props();

	const PROBE_QUESTIONS: { q: string; why: string }[] = [
		{
			q: 'Which commanders were enemies of Napoleon at Waterloo, and what forces did they lead?',
			why: 'Requires Wellington/Blücher → COMMANDS → their armies in a single answer.'
		},
		{
			q: 'Who did Wellington ally with, and who commanded those allied forces?',
			why: '2-hop: Wellington → ALLIED_WITH → Blücher → COMMANDS → Prussian Army.'
		},
		{
			q: 'Why did the Seventh Coalition mobilize against Napoleon?',
			why: "Napoleon's Return → LED_TO → Coalition Mobilization → Seventh Coalition."
		},
		{
			q: "What caused Napoleon's abdication?",
			why: "Battle of Waterloo → RESULTED_IN → Napoleon's Abdication — not likely to be in one chunk."
		},
		{
			q: 'Why did Napoleon lose the battle?',
			why: 'Multiple CAUSED/RESULTED_IN paths converging.'
		},
		{
			q: 'What were all the long-term consequences of the Battle of Waterloo?',
			why: 'Graph has RESULTED_IN → End of French Empire, Congress of Vienna, Pax Britannica.'
		},
		{
			q: 'What happened to Napoleon personally after Waterloo?',
			why: 'Abdication → exile → Saint Helena chain.'
		},
		{
			q: 'What key locations were part of the Battle of Waterloo battlefield?',
			why: 'Hougoumont, La Belle Alliance, Mont-Saint-Jean all linked via PART_OF / LOCATED_IN.'
		},
		{
			q: 'How did Hougoumont and La Haye Sainte contribute to the battle outcome?',
			why: 'PART_OF → Battle of Waterloo → RESULTED_IN — no single chunk covers this.'
		},
		{
			q: 'What battles were fought in the days before Waterloo, and what was their outcome?',
			why: 'Battle of Ligny, Quatre Bras → PRECEDED → Battle of Waterloo, then expanding to their results.'
		}
	];

	let label = $state(initialLabel);
	let ragMode = $state<'combined' | 'vector' | 'graph'>('combined');
	let seedPriority = $state<'graph' | 'vector'>('graph');
	let strict = $state(false);
	let temperature = $state(0.2);
	let topK = $state(5);
	let neighborLimit = $state(100);
	let messages = $state<Message[]>([]);
	let input = $state('');
	let loading = $state(false);
	let showSettings = $state(false);
	let copiedId = $state<string | null>(null);
	let messagesEl: HTMLElement;

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- read to register as an $effect dependency
		const _ = messages.length;
		setTimeout(() => messagesEl?.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' }), 0);
	});

	function uid() {
		return Math.random().toString(36).slice(2);
	}

	function formatTime(d: Date) {
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function buildHistory() {
		return messages
			.filter((m) => !m.error)
			.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
	}

	async function send(text?: string) {
		const question = (text ?? input).trim();
		if (!question || loading) return;
		input = '';

		const userMsg: Message = { id: uid(), role: 'user', content: question, timestamp: new Date() };
		messages = [...messages, userMsg];
		loading = true;

		const assistantId = uid();
		try {
			const history = buildHistory();
			const result = await KnowledgeAPIService.napoleonChat({
				question,
				label,
				history,
				topK,
				neighborLimit,
				ragMode,
				strict,
				temperature,
				seedPriority
			});

			const content: string =
				result?.answer ??
				result?.choice?.message?.content ??
				result?.response ??
				result?.message ??
				(typeof result === 'string' ? result : JSON.stringify(result));

			const graphContext: GraphEntry[] = result?.graphContext ?? result?.context ?? [];
			const sources: unknown[] = result?.sources ?? [];
			const model: string | undefined = result?.model;
			const retrievalInfo: RetrievalInfo | undefined = result?.retrievalInfo;

			messages = [
				...messages,
				{
					id: assistantId,
					role: 'assistant',
					content,
					timestamp: new Date(),
					model,
					graphContext,
					sources,
					retrievalInfo,
					ragMode,
					strict,
					temperature,
					seedPriority
				}
			];
		} catch (err) {
			messages = [
				...messages,
				{
					id: assistantId,
					role: 'assistant',
					content: `Failed to get a response: ${err}`,
					timestamp: new Date(),
					error: true
				}
			];
		} finally {
			loading = false;
		}
	}

	async function copyMessage(id: string, content: string) {
		await navigator.clipboard.writeText(content);
		copiedId = id;
		setTimeout(() => (copiedId = null), 2000);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}
</script>

<div
	class="flex flex-col h-full bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden"
>
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50">
		<div class="flex items-center gap-2 flex-wrap">
			<div class="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
			<span class="font-semibold text-sm text-zinc-800 shrink-0">Knowledge Chat</span>
			<!-- RAG mode segmented control -->
			<div class="flex rounded-md border border-zinc-300 bg-white text-[11px] overflow-hidden">
				{#each [{ value: 'combined', label: 'Combined', title: 'Vector + Graph retrieval' }, { value: 'vector', label: 'Vector', title: 'Vector search only' }, { value: 'graph', label: 'Graph', title: 'Graph traversal only' }] as const as mode (mode.value)}
					<button
						onclick={() => (ragMode = mode.value)}
						class="px-2.5 py-1 transition-colors border-r border-zinc-300 last:border-r-0"
						class:bg-zinc-800={ragMode === mode.value}
						class:text-white={ragMode === mode.value}
						class:text-zinc-500={ragMode !== mode.value}
						class:hover:bg-zinc-50={ragMode !== mode.value}
						title={mode.title}
					>
						{mode.label}
					</button>
				{/each}
			</div>
			{#if stats?.nodes || stats?.relationships}
				<span class="text-xs text-zinc-400">
					{#if stats.nodes}<span class="font-mono">{stats.nodes}</span> nodes{/if}
					{#if stats.nodes && stats.relationships}
						·
					{/if}
					{#if stats.relationships}<span class="font-mono">{stats.relationships}</span> relationships{/if}
				</span>
			{/if}
			<div class="flex items-center gap-1 text-xs">
				<span class="text-zinc-400">label:</span>
				<input
					bind:value={label}
					class="w-28 border border-zinc-300 rounded px-1.5 py-0.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
					placeholder="napoleon"
				/>
			</div>
			<button
				onclick={() => (showSettings = !showSettings)}
				class="text-[11px] font-mono text-zinc-400 hover:text-zinc-600 transition-colors"
				title="Click to adjust retrieval settings"
			>
				topK={topK} · neighbors={neighborLimit}
			</button>
		</div>
		<div class="flex items-center gap-2">
			{#if messages.length > 0}
				<button
					onclick={() => (messages = [])}
					class="text-xs text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
				>
					Clear
				</button>
			{/if}
			<button
				onclick={() => (showSettings = !showSettings)}
				class="text-zinc-500 hover:text-zinc-800 p-1.5 rounded hover:bg-zinc-100 transition-colors"
				class:text-zinc-800={showSettings}
				class:bg-zinc-100={showSettings}
				title="Settings"
				aria-label="Toggle settings"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Settings -->
	{#if showSettings}
		<div class="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500 space-y-3">
			<p class="leading-relaxed">
				Each question is sent to <code class="font-mono bg-zinc-100 px-1 rounded"
					>POST /napoleon-chat</code
				>
				with
				<code class="font-mono bg-zinc-100 px-1 rounded"
					>&#123; question, label, history, topK, neighborLimit, ragMode &#125;</code
				>. History includes all prior messages in this session.
			</p>
			<div class="flex items-center gap-5 flex-wrap">
				<label class="flex items-center gap-2">
					<span
						class="text-zinc-600 shrink-0"
						title="Number of seed nodes retrieved from pgvector per query">topK</span
					>
					<input
						type="number"
						bind:value={topK}
						min="1"
						max="50"
						class="w-14 border border-zinc-300 rounded px-1.5 py-0.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
					/>
					<span class="text-zinc-400">(default 5)</span>
				</label>
				<label class="flex items-center gap-2">
					<span
						class="text-zinc-600 shrink-0"
						title="Max graph neighbors to expand per seed node in Neo4j">neighborLimit</span
					>
					<input
						type="number"
						bind:value={neighborLimit}
						min="1"
						max="100"
						class="w-14 border border-zinc-300 rounded px-1.5 py-0.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
					/>
					<span class="text-zinc-400">(default 100)</span>
				</label>
				<label class="flex items-center gap-2">
					<span
						class="text-zinc-600 shrink-0"
						title="LLM sampling temperature — lower = more deterministic">temp</span
					>
					<input
						type="number"
						bind:value={temperature}
						min="0"
						max="2"
						step="0.1"
						class="w-14 border border-zinc-300 rounded px-1.5 py-0.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
					/>
					<span class="text-zinc-400">(default 0.2)</span>
				</label>
				<label
					class="flex items-center gap-2 cursor-pointer select-none"
					title="Strict mode — hard-blocks pre-training knowledge. System prompt: 'Answer ONLY using the knowledge graph context. If not present, respond: that information is not in the knowledge base.'"
				>
					<input
						type="checkbox"
						bind:checked={strict}
						class="rounded border-zinc-300 text-zinc-800 focus:ring-zinc-400"
					/>
					<span class="text-zinc-600">strict</span>
					{#if strict}
						<span class="text-amber-600 text-[10px]">knowledge-only</span>
					{/if}
				</label>
			</div>
			<div class="flex items-center gap-3 flex-wrap">
				<span class="text-zinc-600 shrink-0">Seed priority</span>
				<div class="flex rounded-md border border-zinc-300 bg-white text-[11px] overflow-hidden">
					{#each [{ value: 'graph', label: 'Graph first', title: 'Neo4j keyword matches first, vector second — best for explicit entity names ("First French Empire", "Duke of Wellington")' }, { value: 'vector', label: 'Vector first', title: 'pgvector cosine matches first, graph second — best for semantic/conceptual questions ("who led the French forces?")' }] as const as opt (opt.value)}
						<button
							onclick={() => (seedPriority = opt.value)}
							class="px-2.5 py-1 transition-colors border-r border-zinc-300 last:border-r-0"
							class:bg-zinc-800={seedPriority === opt.value}
							class:text-white={seedPriority === opt.value}
							class:text-zinc-500={seedPriority !== opt.value}
							class:hover:bg-zinc-50={seedPriority !== opt.value}
							title={opt.title}
						>
							{opt.label}
						</button>
					{/each}
				</div>
				<span class="text-zinc-400 text-[10px]">
					{#if seedPriority === 'graph'}Neo4j first — use for explicit entity names{:else}pgvector
						first — use for semantic queries{/if}
				</span>
			</div>

			<!-- Probe questions -->
			<div class="space-y-1 pt-1 border-t border-zinc-200">
				<p class="text-[11px] font-medium text-zinc-500 mb-2">
					Probe questions — Vector vs Graph+Vector
				</p>
				<div class="space-y-1 max-h-56 overflow-y-auto pr-1">
					{#each PROBE_QUESTIONS as item, i (i)}
						<button
							onclick={() => {
								send(item.q);
								showSettings = false;
							}}
							class="w-full text-left rounded-lg border border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-colors px-3 py-2 group"
						>
							<p
								class="text-zinc-700 group-hover:text-indigo-800 font-medium text-[11px] leading-snug"
							>
								{i + 1}. {item.q}
							</p>
							<p class="text-zinc-400 group-hover:text-indigo-500 text-[10px] leading-snug mt-0.5">
								{item.why}
							</p>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Messages -->
	<div bind:this={messagesEl} class="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
		{#if messages.length > 0}
			{#each messages as msg (msg.id)}
				{@const isAssistant = msg.role === 'assistant'}
				{@const isTyping =
					isAssistant && loading && msg === messages[messages.length - 1] && !msg.content}
				<div class="flex flex-col" class:items-end={msg.role === 'user'}>
					<div
						class="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
						class:bg-zinc-800={msg.role === 'user'}
						class:text-white={msg.role === 'user'}
						class:rounded-br-sm={msg.role === 'user'}
						class:bg-zinc-100={isAssistant && !msg.error}
						class:text-zinc-900={isAssistant && !msg.error}
						class:rounded-bl-sm={isAssistant}
						class:bg-red-50={msg.error}
						class:text-red-700={msg.error}
						class:border={msg.error}
						class:border-red-200={msg.error}
					>
						{#if isTyping}
							<span class="flex gap-1 py-1">
								<span
									class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
									style="animation-delay:0ms"
								></span>
								<span
									class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
									style="animation-delay:150ms"
								></span>
								<span
									class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
									style="animation-delay:300ms"
								></span>
							</span>
						{:else}
							<span class="whitespace-pre-wrap">{msg.content}</span>
						{/if}
					</div>

					{#if isAssistant && msg.graphContext && msg.graphContext.length > 0}
						{@const gc = msg.graphContext}
						<details class="max-w-[85%] mt-1.5 text-[11px]">
							<summary
								class="cursor-pointer text-zinc-400 hover:text-zinc-600 select-none list-none flex items-center gap-1"
							>
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
									/>
								</svg>
								{gc.length} graph {gc.length === 1 ? 'node' : 'nodes'} used
							</summary>
							<div class="mt-1 rounded-lg border border-zinc-200 bg-white overflow-hidden">
								<table class="w-full text-[10px]">
									<thead>
										<tr class="bg-zinc-50 text-zinc-500">
											<th class="text-left px-2 py-1 font-medium">Node</th>
											<th class="text-left px-2 py-1 font-medium">Relationship</th>
											<th class="text-left px-2 py-1 font-medium">Neighbor</th>
										</tr>
									</thead>
									<tbody>
										{#each gc as row, i (i)}
											<tr class="border-t border-zinc-100">
												<td class="px-2 py-1 text-zinc-700">{row.node}</td>
												<td class="px-2 py-1 font-mono text-indigo-600">{row.relationship}</td>
												<td class="px-2 py-1 text-zinc-700">
													{row.neighbor}
													{#if row.neighborLabels?.length}
														<span class="text-zinc-400">({row.neighborLabels.join(', ')})</span>
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</details>
					{/if}

					{#if isAssistant && (msg.retrievalInfo || msg.ragMode)}
						{@const ri = msg.retrievalInfo}
						<div
							class="max-w-[85%] mt-1 flex items-center gap-2 flex-wrap text-[10px] text-zinc-400 px-0.5"
						>
							{#if msg.ragMode}
								<span
									class="px-1.5 py-0.5 rounded font-medium text-[10px]"
									class:bg-zinc-100={msg.ragMode === 'combined'}
									class:text-zinc-500={msg.ragMode === 'combined'}
									class:bg-indigo-100={msg.ragMode === 'vector'}
									class:text-indigo-600={msg.ragMode === 'vector'}
									class:bg-emerald-100={msg.ragMode === 'graph'}
									class:text-emerald-700={msg.ragMode === 'graph'}
									title="Retrieval mode used for this request">{msg.ragMode}</span
								>
								<span class="text-zinc-300">·</span>
							{/if}
							{#if ri?.seedNodes && ri.seedNodes.length > 0}
								<span title="Seed nodes retrieved from pgvector">
									seeds: {ri.seedNodes.slice(0, 3).join(', ')}{ri.seedNodes.length > 3
										? ` +${ri.seedNodes.length - 3}`
										: ''}
								</span>
								<span class="text-zinc-300">·</span>
							{/if}
							{#if ri?.contextTriplets !== undefined}
								<span title="Total graph triplets used as context"
									>{ri.contextTriplets} triplets</span
								>
								<span class="text-zinc-300">·</span>
							{/if}
							{#if ri}
								<span title="topK used for this request">topK={ri.topK ?? topK}</span>
								<span class="text-zinc-300">·</span>
								<span title="neighborLimit used for this request"
									>neighbors={ri.neighborLimit ?? neighborLimit}</span
								>
								<span class="text-zinc-300">·</span>
								<span title="LLM temperature used for this request"
									>temp={ri.temperature ?? msg.temperature}</span
								>
							{/if}
							{#if msg.strict}
								<span class="text-zinc-300">·</span>
								<span
									class="text-amber-600 font-medium"
									title="Strict mode — pre-training knowledge blocked">strict</span
								>
							{/if}
							{#if msg.seedPriority || ri?.seedPriority}
								<span class="text-zinc-300">·</span>
								<span title="Seed priority used for this request"
									>seeds: {ri?.seedPriority ?? msg.seedPriority}-first</span
								>
							{/if}
						</div>
					{/if}

					{#if isAssistant && msg.sources && msg.sources.length > 0}
						<details class="max-w-[85%] mt-1 text-[11px]">
							<summary
								class="cursor-pointer text-zinc-400 hover:text-zinc-600 select-none list-none flex items-center gap-1"
							>
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
								{msg.sources.length}
								{msg.sources.length === 1 ? 'source' : 'sources'}
							</summary>
							<div
								class="mt-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-[10px] text-zinc-600 overflow-x-auto"
							>
								<pre class="whitespace-pre-wrap">{JSON.stringify(msg.sources, null, 2)}</pre>
							</div>
						</details>
					{/if}

					<div class="flex items-center gap-2 mt-1 px-1">
						<span class="text-[10px] text-zinc-400">{formatTime(msg.timestamp)}</span>
						{#if msg.model}
							<span class="text-[10px] text-zinc-300 font-mono">{msg.model}</span>
						{/if}
						{#if isAssistant && msg.content && !msg.error}
							<button
								onclick={() => copyMessage(msg.id, msg.content)}
								class="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
								title="Copy"
							>
								{copiedId === msg.id ? '✓ copied' : 'copy'}
							</button>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Input -->
	<div class="border-t border-zinc-200 px-3 py-3">
		<div class="flex items-end gap-2">
			<textarea
				bind:value={input}
				onkeydown={handleKeydown}
				placeholder="Ask about the knowledge base… (Enter to send)"
				rows="2"
				disabled={loading}
				class="flex-1 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50"
			></textarea>
			<button
				onclick={() => send()}
				disabled={!input.trim() || loading}
				class="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
				aria-label="Send"
			>
				{#if loading}
					<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
					></span>
				{:else}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
						/>
					</svg>
				{/if}
			</button>
		</div>
		<p class="text-[10px] text-zinc-400 mt-1.5 pl-1">Shift+Enter for newline</p>
	</div>
</div>
