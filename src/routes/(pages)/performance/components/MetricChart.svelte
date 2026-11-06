<script lang="ts">
	import {
		formatTick,
		formatTime,
		colorSlots,
		formatValue,
		niceScale,
		seriesStats,
		splitSegments,
		topSeries,
		type MetricResponse
	} from '$lib/utils/metrics';

	let {
		data,
		loading = false,
		error = '',
		height = 240,
		colorGroup
	}: {
		data: MetricResponse | null;
		loading?: boolean;
		error?: string;
		height?: number;
		/** Charts in the same group show the same entity in the same colour. */
		colorGroup: string;
	} = $props();

	const MARGIN = { top: 10, right: 14, bottom: 24, left: 56 };
	const MAX_SERIES = 8; // the palette has eight slots; extra series stay in the table view
	const TOOLTIP_W = 210;

	let width = $state(0);
	let hoverTs = $state<number | null>(null);

	const view = $derived(data ? topSeries(data.series, MAX_SERIES) : null);
	const shown = $derived(view?.shown ?? []);
	const unit = $derived(data?.unit ?? '');

	// Colour follows the entity, never its rank: a label keeps its slot across range changes and
	// across charts in the same group, so a refetch or a filter never repaints the survivors.
	const colorOf = $derived.by(() => {
		const slots = colorSlots(
			colorGroup,
			shown.map((s) => s.label)
		);
		return (label: string) => `var(--series-${(slots.get(label) ?? 0) + 1})`;
	});

	const plotW = $derived(Math.max(0, width - MARGIN.left - MARGIN.right));
	const plotH = $derived(height - MARGIN.top - MARGIN.bottom);

	const scale = $derived(
		niceScale(Math.max(0, ...shown.flatMap((s) => s.points.map((p) => p[1]))))
	);

	function x(t: number): number {
		if (!data) return MARGIN.left;
		const span = Math.max(1, data.to - data.from);
		return MARGIN.left + ((t - data.from) / span) * plotW;
	}

	function y(v: number): number {
		return MARGIN.top + plotH - (v / scale.max) * plotH;
	}

	const xTicks = $derived.by(() => {
		if (!data) return [];
		const n = Math.max(2, Math.min(5, Math.floor(plotW / 110)));
		return Array.from({ length: n }, (_, i) => data.from + ((data.to - data.from) * i) / (n - 1));
	});

	const lines = $derived(
		shown.map((s) => {
			const runs = splitSegments(s.points, (data?.step ?? 30) * 3);
			const path = runs
				.filter((r) => r.length > 1)
				.map((r) =>
					r.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)}`).join(' ')
				)
				.join(' ');
			// A run of one point has no line to draw; give it a marker so it is not lost.
			const dots = runs.filter((r) => r.length === 1).map((r) => r[0]);
			return { label: s.label, path, dots, last: s.points[s.points.length - 1] };
		})
	);

	const timestamps = $derived(
		[...new Set(shown.flatMap((s) => s.points.map((p) => p[0])))].sort((a, b) => a - b)
	);

	const hoverRows = $derived.by(() => {
		if (hoverTs === null) return [];
		return shown
			.map((s) => ({ label: s.label, point: s.points.find((p) => p[0] === hoverTs) }))
			.filter((r) => r.point)
			.map((r) => ({ label: r.label, value: (r.point as [number, number])[1] }));
	});

	const tooltipLeft = $derived.by(() => {
		if (hoverTs === null) return 0;
		const px = x(hoverTs);
		return px > width - TOOLTIP_W - 24 ? px - TOOLTIP_W - 12 : px + 12;
	});

	function nearest(t: number): number | null {
		if (!timestamps.length) return null;
		return timestamps.reduce((best, c) => (Math.abs(c - t) < Math.abs(best - t) ? c : best));
	}

	function onPointerMove(e: PointerEvent) {
		if (!data || plotW <= 0) return;
		const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
		const t = data.from + ((e.clientX - rect.left) / plotW) * (data.to - data.from);
		hoverTs = nearest(t);
	}

	function onKeydown(e: KeyboardEvent) {
		if (!timestamps.length) return;
		const i = hoverTs === null ? timestamps.length : timestamps.indexOf(hoverTs);
		if (e.key === 'ArrowLeft') hoverTs = timestamps[Math.max(0, i - 1)];
		else if (e.key === 'ArrowRight') hoverTs = timestamps[Math.min(timestamps.length - 1, i + 1)];
		else if (e.key === 'Escape') hoverTs = null;
		else return;
		e.preventDefault();
	}

	const hasData = $derived(shown.length > 0);
	const summary = $derived(
		hasData
			? `Line chart with ${shown.length} series, ${data?.range} range. Use the left and right arrow keys to read values; a data table follows.`
			: 'No data'
	);
</script>

<div class="px-4 pb-3 pt-2">
	{#if error && !data}
		<p
			class="flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-xs text-red-600"
			style="height: {height}px"
		>
			{error}
		</p>
	{:else if data && !hasData}
		<p
			class="flex items-center justify-center rounded-md bg-zinc-50 px-6 text-center text-xs text-zinc-500"
			style="height: {height}px"
		>
			No data in this range. The backend reports metrics only while it is running, so idle periods
			show up as gaps.
		</p>
	{:else if data}
		<!-- A focusable chart that reads values with the arrow keys (WAI-ARIA "application" pattern); the
		     pointer path has the same readout, and the data table below is the text alternative. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<div
			class="relative transition-opacity"
			class:opacity-60={loading}
			bind:clientWidth={width}
			role="application"
			aria-label={summary}
			tabindex="0"
			onkeydown={onKeydown}
			onblur={() => (hoverTs = null)}
		>
			<svg {width} {height} role="presentation" class="block overflow-visible">
				{#each scale.ticks as t (t)}
					<line
						x1={MARGIN.left}
						x2={MARGIN.left + plotW}
						y1={y(t)}
						y2={y(t)}
						stroke={t === 0 ? 'var(--viz-baseline)' : 'var(--viz-grid)'}
						stroke-width="1"
					/>
					<text
						x={MARGIN.left - 8}
						y={y(t)}
						dy="0.32em"
						text-anchor="end"
						class="text-[10px]"
						fill="var(--viz-muted)">{formatTick(unit, t)}</text
					>
				{/each}

				{#each xTicks as t, i (i)}
					<text
						x={x(t)}
						y={height - 6}
						text-anchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
						class="text-[10px]"
						fill="var(--viz-muted)">{formatTime(t, data.range)}</text
					>
				{/each}

				{#each lines as l (l.label)}
					{#if l.path}
						<path
							d={l.path}
							fill="none"
							stroke={colorOf(l.label)}
							stroke-width="2"
							stroke-linejoin="round"
							stroke-linecap="round"
						/>
					{/if}
					{#each l.dots as d (d[0])}
						<circle
							cx={x(d[0])}
							cy={y(d[1])}
							r="4"
							fill={colorOf(l.label)}
							stroke="var(--viz-surface)"
							stroke-width="2"
						/>
					{/each}
					<!-- End dot with a 2px surface ring, so it stays legible where lines cross. -->
					<circle
						cx={x(l.last[0])}
						cy={y(l.last[1])}
						r="4"
						fill={colorOf(l.label)}
						stroke="var(--viz-surface)"
						stroke-width="2"
					/>
				{/each}

				{#if hoverTs !== null}
					<line
						x1={x(hoverTs)}
						x2={x(hoverTs)}
						y1={MARGIN.top}
						y2={MARGIN.top + plotH}
						stroke="var(--viz-axis)"
						stroke-width="1"
					/>
					{#each shown as s (s.label)}
						{@const p = s.points.find((q) => q[0] === hoverTs)}
						{#if p}
							<circle
								cx={x(p[0])}
								cy={y(p[1])}
								r="4"
								fill={colorOf(s.label)}
								stroke="var(--viz-surface)"
								stroke-width="2"
							/>
						{/if}
					{/each}
				{/if}

				<!-- Hit layer: the whole plot area, so readers aim at a time, not at a 2px line. -->
				<rect
					x={MARGIN.left}
					y={MARGIN.top}
					width={plotW}
					height={plotH}
					fill="transparent"
					role="presentation"
					onpointermove={onPointerMove}
					onpointerleave={() => (hoverTs = null)}
				/>
			</svg>

			{#if hoverTs !== null && hoverRows.length}
				<div
					class="pointer-events-none absolute z-10 rounded-md border border-zinc-200 bg-white px-3 py-2 shadow-md"
					style="left: {tooltipLeft}px; top: {MARGIN.top}px; width: {TOOLTIP_W}px"
				>
					<div class="mb-1 text-[11px] text-zinc-500">{formatTime(hoverTs, data.range, true)}</div>
					{#each hoverRows as r (r.label)}
						<div class="flex items-center justify-between gap-3 text-xs">
							<span class="flex min-w-0 items-center gap-2">
								<span class="h-0.5 w-3 shrink-0 rounded" style="background: {colorOf(r.label)}"
								></span>
								<span class="truncate text-zinc-500" title={r.label}>{r.label}</span>
							</span>
							<span class="shrink-0 whitespace-nowrap font-semibold text-zinc-900"
								>{formatValue(unit, r.value)}</span
							>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		{#if shown.length >= 2}
			<ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
				{#each lines as l (l.label)}
					<li class="flex min-w-0 items-center gap-2 text-xs">
						<span class="h-0.5 w-3 shrink-0 rounded" style="background: {colorOf(l.label)}"></span>
						<span class="max-w-[14rem] truncate text-zinc-600" title={l.label}>{l.label}</span>
						<span class="text-zinc-900">{formatValue(unit, l.last[1])}</span>
					</li>
				{/each}
				{#if view && view.hidden > 0}
					<li class="text-xs text-zinc-400">+{view.hidden} more in the table</li>
				{/if}
			</ul>
		{/if}

		<details class="mt-2">
			<summary class="cursor-pointer text-xs text-zinc-500 hover:text-zinc-800">Data table</summary>
			<div class="mt-2 overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead class="text-zinc-400">
						<tr>
							<th class="py-1 pr-3 font-normal">Series</th>
							<th class="px-2 py-1 text-right font-normal">Latest</th>
							<th class="px-2 py-1 text-right font-normal">Min</th>
							<th class="px-2 py-1 text-right font-normal">Max</th>
							<th class="px-2 py-1 text-right font-normal">Avg</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-zinc-100">
						{#each view?.all ?? [] as s (s.label)}
							{@const st = seriesStats(s.points)}
							<tr>
								<td class="max-w-[16rem] truncate py-1 pr-3 text-zinc-600" title={s.label}
									>{s.label}</td
								>
								<td class="px-2 py-1 text-right tabular-nums">{formatValue(unit, st.latest)}</td>
								<td class="px-2 py-1 text-right tabular-nums">{formatValue(unit, st.min)}</td>
								<td class="px-2 py-1 text-right tabular-nums">{formatValue(unit, st.max)}</td>
								<td class="px-2 py-1 text-right tabular-nums">{formatValue(unit, st.avg)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</details>
	{:else}
		<div class="rounded-md bg-zinc-50" style="height: {height}px"></div>
	{/if}
</div>
