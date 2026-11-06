<script lang="ts">
	import { formatDuration, formatValue, type MetricResponse } from '$lib/utils/metrics';

	let {
		data,
		loading = false,
		error = '',
		format = 'value'
	}: {
		data: MetricResponse | null;
		loading?: boolean;
		error?: string;
		/** "duration" renders milliseconds as e.g. "3 d 4 h". */
		format?: 'value' | 'duration';
	} = $props();

	const value = $derived(data?.series[0]?.points[0]?.[1] ?? null);

	const text = $derived.by(() => {
		if (value === null || !data) return '—';
		return format === 'duration' ? formatDuration(value) : formatValue(data.unit, value);
	});
</script>

<div class="px-4 pb-3 pt-2">
	<div
		class="flex h-24 flex-col items-start justify-center rounded-md bg-zinc-50 px-4 transition-opacity"
		class:opacity-60={loading}
	>
		<div class="text-3xl font-semibold text-zinc-900">{text}</div>
		{#if error && !data}
			<div class="mt-1 text-xs text-red-600">{error}</div>
		{:else if data && value === null}
			<div class="mt-1 text-xs text-zinc-500">No data in this range</div>
		{/if}
	</div>
</div>
