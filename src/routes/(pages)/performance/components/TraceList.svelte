<script lang="ts">
	import { untrack } from 'svelte';
	import { PerformanceAPIService } from '$services/apiService';
	import {
		formatClock,
		formatMs,
		formatTraceName,
		type TraceList,
		type TraceSummary
	} from '$lib/utils/metrics';
	import TraceWaterfall from './TraceWaterfall.svelte';

	let {
		kind,
		range,
		refreshKey = 0
	}: {
		/** "recent" or "slow" (requests above 500 ms). */
		kind: 'recent' | 'slow';
		range: string;
		/** Bump to refetch without changing the range. */
		refreshKey?: number;
	} = $props();

	let data = $state<TraceList | null>(null);
	let error = $state('');
	let loading = $state(false);
	let open = $state<string | null>(null);
	let requestId = 0;

	async function load() {
		const mine = ++requestId;
		loading = true;
		try {
			const res = await PerformanceAPIService.getTraceList(kind, range);
			if (mine !== requestId) return;
			if (!res || res.error || !Array.isArray(res.traces)) {
				error = res?.error ?? 'Backend not reachable';
				return;
			}
			data = res;
			error = '';
		} catch (err) {
			if (mine === requestId) error = `${err}`;
		} finally {
			if (mine === requestId) loading = false;
		}
	}

	// Refetch on range change or refresh; the previous rows stay (dimmed) until the new ones land.
	$effect(() => {
		void range;
		void refreshKey;
		untrack(load);
	});

	const slowest = $derived(Math.max(1, ...(data?.traces ?? []).map((t) => t.durationMs)));

	function toggle(t: TraceSummary) {
		open = open === t.traceId ? null : t.traceId;
	}
</script>

<div class="px-4 pb-3 pt-2">
	{#if error && !data}
		<p
			class="flex h-24 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-xs text-red-600"
		>
			{error}
		</p>
	{:else if !data}
		<div class="h-24 rounded-md bg-zinc-50"></div>
	{:else if data.traces.length === 0}
		<p
			class="flex h-24 items-center justify-center rounded-md bg-zinc-50 px-6 text-center text-xs text-zinc-500"
		>
			{kind === 'slow'
				? 'No requests slower than 500 ms in this range.'
				: 'No traces in this range. The backend records them only while it is running.'}
		</p>
	{:else}
		<div
			class="overflow-hidden rounded-md border border-zinc-200 transition-opacity"
			class:opacity-60={loading}
		>
			<ul class="max-h-[28rem] divide-y divide-zinc-100 overflow-y-auto">
				{#each data.traces as t (t.traceId)}
					<li>
						<button
							type="button"
							onclick={() => toggle(t)}
							aria-expanded={open === t.traceId}
							class="grid w-full grid-cols-[5.5rem_1fr_6rem_4.5rem] items-center gap-3 px-3 py-2 text-left text-xs hover:bg-zinc-50"
							class:bg-zinc-50={open === t.traceId}
						>
							<span class="tabular-nums text-zinc-500">{formatClock(t.startMs, data.range)}</span>
							<span class="truncate text-zinc-800" title={formatTraceName(t.name)}
								>{formatTraceName(t.name)}</span
							>
							<span class="h-1.5 rounded-sm bg-zinc-100" aria-hidden="true">
								<span
									class="block h-1.5 rounded-sm"
									style="width: {Math.max(
										2,
										(t.durationMs / slowest) * 100
									)}%; background: var(--series-1)"
								></span>
							</span>
							<span class="text-right font-semibold tabular-nums text-zinc-900"
								>{formatMs(t.durationMs)}</span
							>
						</button>
						{#if open === t.traceId}
							<TraceWaterfall traceId={t.traceId} />
						{/if}
					</li>
				{/each}
			</ul>
		</div>
		<p class="mt-1 text-[11px] text-zinc-400">
			Latest {data.traces.length} traces. Click a row to see its spans.
		</p>
	{/if}
</div>
