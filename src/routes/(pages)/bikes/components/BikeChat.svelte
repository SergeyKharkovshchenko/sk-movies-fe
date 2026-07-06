<script lang="ts">
	import { fetchAuthToken } from '$lib/utils/token'
	import { BikesAPIService } from '$services/apiService'

	const apiUrl = import.meta.env.VITE_API_URL

	let { externalSuggestions = [] }: { externalSuggestions?: string[] } = $props()

	interface GraphEntry {
		node: string
		relationship: string
		neighbor: string
		neighborLabels: string[]
	}

	interface Message {
		id: string
		role: 'user' | 'assistant'
		content: string
		timestamp: Date
		error?: boolean
		model?: string
		graphContext?: GraphEntry[]
		suggestedQuestions?: string[]
	}

	interface Settings {
		temperature: number
		maxTokens: number
		systemPrompt: string
		stream: boolean
	}

	const DEFAULT_PROMPTS = [
		'What CUBE bike categories are available?',
		'Explain the drivetrain components of a bicycle',
		'What makes the Agree different from the Attain?',
		'Walk me through the Wheel Assembly hierarchy',
	]

	let dynamicSuggestions = $state<string[]>([])

	let suggestedPrompts = $derived(
		dynamicSuggestions.length > 0
			? dynamicSuggestions
			: externalSuggestions.length > 0
				? externalSuggestions
				: DEFAULT_PROMPTS
	)

	let ragMode = $state<'combined' | 'vector' | 'graph'>('combined')
	let embedder = $state('jina')

	let messages = $state<Message[]>([])
	let input = $state('')
	let loading = $state(false)
	let showSettings = $state(false)
	let copiedId = $state<string | null>(null)
	let messagesEl: HTMLElement

	let settings = $state<Settings>({
		temperature: 0.7,
		maxTokens: 512,
		systemPrompt:
			'You are an expert assistant for CUBE bicycles. You have deep knowledge of the CUBE product taxonomy including bike categories (Road, Mountain Bike, Gravel, Trekking, Hybrid, Kids, Cargo, E-Bike), model lines (Agree, Attain, Litening, Reaction, Stereo, etc.), and bicycle component hierarchy (Frame, Fork, Wheel Assembly, Drivetrain, Brake System, Cockpit, etc.). Answer questions accurately and helpfully based on this knowledge graph.',
		stream: false,
	})

	$effect(() => {
		const _ = messages.length
		setTimeout(() => messagesEl?.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' }), 0)
	})

	function uid() {
		return Math.random().toString(36).slice(2)
	}

	function formatTime(d: Date) {
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	}

	async function send(text?: string) {
		const content = (text ?? input).trim()
		if (!content || loading) return
		input = ''

		const userMsg: Message = { id: uid(), role: 'user', content, timestamp: new Date() }
		messages = [...messages, userMsg]
		loading = true

		const historyForPayload = messages
			.filter((m) => !m.error)
			.map((m) => ({ role: m.role, content: m.content }))

		const payload = {
			messages: [{ role: 'system', content: settings.systemPrompt }, ...historyForPayload],
			temperature: settings.temperature,
			maxTokens: settings.maxTokens,
			stream: settings.stream,
			ragMode,
			embedder,
		}

		const assistantId = uid()

		try {
			if (settings.stream) {
				const token = await fetchAuthToken()
				const response = await fetch(`${apiUrl}/bike-chat`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Authorization: String(token) },
					body: JSON.stringify(payload),
				})
				if (!response.ok) throw new Error(`HTTP ${response.status}`)

				messages = [
					...messages,
					{ id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
				]

				const reader = response.body!.getReader()
				const decoder = new TextDecoder()

				while (true) {
					const { done, value } = await reader.read()
					if (done) break
					for (const line of decoder.decode(value).split('\n')) {
						if (!line.startsWith('data: ')) continue
						const data = line.slice(6).trim()
						if (data === '[DONE]') break
						try {
							const parsed = JSON.parse(data)
							const delta =
								parsed.choices?.[0]?.delta?.content ?? parsed.content ?? parsed.delta ?? ''
							if (delta) {
								messages = messages.map((m) =>
									m.id === assistantId ? { ...m, content: m.content + delta } : m
								)
							}
						} catch {
							/* partial chunk */
						}
					}
				}
			} else {
				const result = await BikesAPIService.bikeChat(payload)
				const text = result?.choice?.message?.content ?? JSON.stringify(result)
				const graphContext: GraphEntry[] = result?.graphContext ?? []
				const suggestedQuestions: string[] = result?.suggestedQuestions ?? []
				const model: string | undefined = result?.model

				if (suggestedQuestions.length > 0) dynamicSuggestions = suggestedQuestions

				messages = [
					...messages,
					{
						id: assistantId,
						role: 'assistant',
						content: text,
						timestamp: new Date(),
						model,
						graphContext,
						suggestedQuestions,
					},
				]
			}
		} catch (err) {
			messages = [
				...messages,
				{
					id: assistantId,
					role: 'assistant',
					content: `Failed to get a response: ${err}`,
					timestamp: new Date(),
					error: true,
				},
			]
		} finally {
			loading = false
		}
	}

	async function copyMessage(id: string, content: string) {
		await navigator.clipboard.writeText(content)
		copiedId = id
		setTimeout(() => (copiedId = null), 2000)
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			send()
		}
	}
</script>

<div class="flex flex-col h-full bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50">
		<div class="flex items-center gap-2 flex-wrap">
			<div class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
			<span class="font-semibold text-sm text-zinc-800 shrink-0">Bike Expert AI</span>
			<!-- RAG mode segmented control -->
			<div class="flex rounded-md border border-zinc-300 bg-white text-[11px] overflow-hidden">
				{#each [
					{ value: 'combined', label: 'Combined', title: 'Vector + Graph (needs embeddings)' },
					{ value: 'vector', label: 'Vector', title: 'Vector search only (needs embeddings)' },
					{ value: 'graph', label: 'Graph', title: 'Graph traversal only (no embeddings needed)' },
				] as mode (mode.value)}
					<button
						onclick={() => (ragMode = mode.value as typeof ragMode)}
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
		</div>
		<div class="flex items-center gap-2">
			{#if messages.length > 0}
				<button
					onclick={() => (messages = [])}
					class="text-xs text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
					title="Clear conversation"
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

	<!-- Settings panel -->
	{#if showSettings}
		<div class="border-b border-zinc-200 bg-zinc-50 px-4 py-3 space-y-3 text-xs">
			<div class="flex items-center gap-4">
				<label for="setting-temp" class="flex items-center gap-2 min-w-30 text-zinc-600">
					Temperature
					<span class="font-mono text-zinc-800">{settings.temperature.toFixed(1)}</span>
				</label>
				<input
					id="setting-temp"
					type="range"
					min="0"
					max="2"
					step="0.1"
					bind:value={settings.temperature}
					class="flex-1 accent-zinc-700"
				/>
			</div>
			<div class="flex items-center gap-4">
				<label for="setting-tokens" class="min-w-30 text-zinc-600">Max tokens</label>
				<input
					id="setting-tokens"
					type="number"
					min="64"
					max="4096"
					step="64"
					bind:value={settings.maxTokens}
					class="w-24 border border-zinc-300 rounded px-2 py-1 text-xs"
				/>
			</div>
			<div class="flex items-center gap-4">
				<span class="min-w-30 text-zinc-600">Streaming</span>
				<button
					onclick={() => (settings.stream = !settings.stream)}
					class="relative w-9 h-5 rounded-full transition-colors"
					class:bg-zinc-700={settings.stream}
					class:bg-zinc-300={!settings.stream}
					role="switch"
					aria-checked={settings.stream}
					aria-label="Toggle streaming"
				>
					<span
						class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
						class:translate-x-4={settings.stream}
					></span>
				</button>
			</div>
			<div class="flex items-center gap-4">
				<label for="setting-embedder" class="min-w-30 text-zinc-600">Embedder</label>
				<input
					id="setting-embedder"
					bind:value={embedder}
					placeholder="jina"
					class="w-32 border border-zinc-300 rounded px-2 py-1 text-xs"
				/>
				<span class="text-zinc-400">
					{#if ragMode === 'graph'}used for graph traversal{:else}used for vector indexing{/if}
				</span>
			</div>
			<div class="flex flex-col gap-1">
				<label for="setting-sysprompt" class="text-zinc-600">System prompt</label>
				<textarea
					id="setting-sysprompt"
					bind:value={settings.systemPrompt}
					rows="3"
					class="border border-zinc-300 rounded px-2 py-1 text-xs resize-none w-full"
				></textarea>
			</div>
		</div>
	{/if}

	<!-- Messages -->
	<div
		bind:this={messagesEl}
		class="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
	>
		{#if messages.length === 0}
			<div class="flex flex-col items-center justify-center h-full gap-4 text-center">
				<p class="text-sm text-zinc-500">Ask anything about the bike hierarchy or taxonomy</p>
				<div class="flex flex-wrap gap-2 justify-center">
					{#each suggestedPrompts as prompt}
						<button
							onclick={() => send(prompt)}
							class="text-xs px-3 py-1.5 rounded-full border border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
						>
							{prompt}
						</button>
					{/each}
				</div>
			</div>
		{:else}
			{#each messages as msg (msg.id)}
				{@const isAssistant = msg.role === 'assistant'}
				{@const isTyping = isAssistant && loading && msg === messages[messages.length - 1] && !msg.content}
				<div class="flex flex-col" class:items-end={msg.role === 'user'}>
					<!-- Bubble -->
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
								<span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style="animation-delay:0ms"></span>
								<span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style="animation-delay:150ms"></span>
								<span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style="animation-delay:300ms"></span>
							</span>
						{:else}
							<span class="whitespace-pre-wrap">{msg.content}</span>
						{/if}
					</div>

					<!-- Graph context -->
					{#if isAssistant && msg.graphContext && msg.graphContext.length > 0}
						{@const gc = msg.graphContext}
						<details class="max-w-[85%] mt-1.5 text-[11px]">
							<summary class="cursor-pointer text-zinc-400 hover:text-zinc-600 select-none list-none flex items-center gap-1">
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
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

					<!-- Footer: time, model, copy -->
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

					<!-- Follow-up questions (only on last message) -->
					{#if isAssistant && msg.suggestedQuestions?.length && msg === messages[messages.length - 1]}
						<div class="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
							{#each msg.suggestedQuestions as q (q)}
								<button
									onclick={() => send(q)}
									class="text-[11px] px-2.5 py-1 rounded-full border border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:bg-zinc-50 transition-colors"
								>
									{q}
								</button>
							{/each}
						</div>
					{/if}
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
				placeholder="Ask about bike taxonomy or components… (Enter to send)"
				rows="2"
				disabled={loading}
				class="flex-1 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50"
			></textarea>
			<button
				onclick={() => send()}
				disabled={!input.trim() || loading}
				class="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
				aria-label="Send"
			>
				<svg class="w-4 h-4 translate-x-[1px]" fill="currentColor" viewBox="0 0 20 20">
					<path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
				</svg>
			</button>
		</div>
		<p class="text-[10px] text-zinc-400 mt-1.5 px-1">Shift+Enter for new line</p>
	</div>
</div>
