<script lang="ts">
	import { PerformanceAPIService } from '$services/apiService';
	import {
		barStyle,
		formatMs,
		formatTraceName,
		type TraceDetail,
		type TraceSpan
	} from '$lib/utils/metrics';

	let { traceId }: { traceId: string } = $props();

	let detail = $state<TraceDetail | null>(null);
	let error = $state('');
	let loading = $state(true);
	let selected = $state<string | null>(null);
	let requestId = 0; // ignore a late answer for a trace the reader already closed or replaced

	async function load(id: string) {
		const mine = ++requestId;
		loading = true;
		error = '';
		detail = null;
		selected = null;
		try {
			const res = await PerformanceAPIService.getTrace(id);
			if (mine !== requestId) return;
			if (!res || res.error || !Array.isArray(res.spans)) {
				error = res?.error ?? 'Backend not reachable';
			} else {
				detail = res;
			}
		} catch (err) {
			if (mine === requestId) error = `${err}`;
		} finally {
			if (mine === requestId) loading = false;
		}
	}

	$effect(() => {
		load(traceId);
	});

	// Colour only echoes the span's kind, which the row text already states, so it carries no
	// meaning on its own (it is never the only way to tell spans apart).
	function colorFor(span: TraceSpan): string {
		if (span.error) return 'var(--series-8)';
		if (span.name.startsWith('neo4j')) return 'var(--series-2)';
		if (span.depth === 0) return 'var(--series-1)';
		return 'var(--series-3)';
	}

	const selectedSpan = $derived(detail?.spans.find((s) => s.spanId === selected) ?? null);
</script>

<div class="border-t border-zinc-100 bg-zinc-50 px-4 py-3">
	{#if loading}
		<p class="text-xs text-zinc-500">Loading trace…</p>
	{:else if error}
		<p class="text-xs text-red-600">{error}</p>
	{:else if detail}
		<p class="mb-2 text-xs text-zinc-500">
			Trace <span class="font-mono text-zinc-700">{detail.traceId.slice(0, 8)}</span> ·
			<span class="font-medium text-zinc-700">{formatMs(detail.durationMs)}</span> ·
			{detail.spans.length}
			{detail.spans.length === 1 ? 'span' : 'spans'}
		</p>

		<ul class="flex flex-col gap-1" aria-label="Spans of this trace">
			{#each detail.spans as span (span.spanId)}
				{@const bar = barStyle(span.offsetMs, span.durationMs, detail.durationMs)}
				<li>
					<button
						type="button"
						onclick={() => (selected = selected === span.spanId ? null : span.spanId)}
						aria-expanded={selected === span.spanId}
						class="grid w-full grid-cols-[minmax(7rem,14rem)_1fr_4.5rem] items-center gap-3 rounded px-1 py-0.5 text-left text-xs hover:bg-white"
						class:bg-white={selected === span.spanId}
					>
						<span
							class="truncate text-zinc-700"
							style="padding-left: {span.depth * 12}px"
							title={formatTraceName(span.name)}>{formatTraceName(span.name)}</span
						>
						<span class="relative h-3 rounded-sm bg-zinc-200/60" aria-hidden="true">
							<span
								class="absolute top-0 h-3 rounded-sm"
								style="left: {bar.left}%; width: {bar.width}%; background: {colorFor(span)}"
							></span>
						</span>
						<span class="text-right tabular-nums text-zinc-900">{formatMs(span.durationMs)}</span>
					</button>
					{#if selected === span.spanId}
						<dl
							class="ml-1 mt-1 grid grid-cols-[minmax(8rem,14rem)_1fr] gap-x-3 gap-y-0.5 rounded border border-zinc-200 bg-white p-2 text-xs"
						>
							<dt class="text-zinc-400">starts at</dt>
							<dd class="tabular-nums text-zinc-700">+{formatMs(span.offsetMs)}</dd>
							{#each Object.entries(span.attributes) as [key, value] (key)}
								<dt class="truncate text-zinc-400" title={key}>{key}</dt>
								<dd class="break-all text-zinc-700">{value}</dd>
							{/each}
						</dl>
					{/if}
				</li>
			{/each}
		</ul>

		{#if detail.spans.length === 1}
			<p class="mt-2 text-xs text-zinc-400">
				Only the request itself was recorded for this trace; there are no instrumented calls inside
				it.
			</p>
		{/if}
	{/if}
</div>
