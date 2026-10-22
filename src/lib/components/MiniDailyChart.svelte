<script module lang="ts">
	export interface DailyPoint {
		date: string; // YYYY-MM-DD
		value: number | null;
	}
</script>

<script lang="ts">
	// Compact single-series daily chart (plain SVG, no chart library): columns for a magnitude
	// that starts at zero (counts), a line for a level whose range matters more than zero
	// (averages). One series, so no legend -- the title names it. Spec follows the dataviz
	// method: <=24px columns with a 4px rounded data-end and a 2px gap, 2px line, ringed end
	// dot, hairline grid, per-column hover / snapping crosshair, keyboard stepping.

	let {
		points = [],
		kind = 'column',
		title,
		format = (v: number) => String(v),
		plotHeight = 64
	}: {
		points?: DailyPoint[];
		kind?: 'column' | 'line';
		title: string;
		format?: (v: number) => string;
		plotHeight?: number;
	} = $props();

	const PLOT_H = $derived(plotHeight);
	const TOP = 12;
	const AXIS_H = 16;
	const LEFT = 32;
	const RIGHT = $derived(kind === 'line' ? 34 : 8); // line charts need room for the end label
	const HEIGHT = $derived(TOP + PLOT_H + AXIS_H);

	let width = $state(320);
	let active = $state<number | null>(null);

	const plotW = $derived(Math.max(40, width - LEFT - RIGHT));
	const band = $derived(points.length > 0 ? plotW / points.length : plotW);
	const xAt = (i: number) => LEFT + band * (i + 0.5);

	const values = $derived(points.map((p) => p.value).filter((v): v is number => v !== null));

	// Clean ticks: columns grow from 0; the line uses a padded nice range around its data.
	const ticks = $derived.by(() => {
		if (values.length === 0) return [0, 1];
		const lo = kind === 'column' ? 0 : Math.min(...values);
		const hi = Math.max(...values);
		return niceTicks(lo, hi === lo ? lo + 1 : hi, PLOT_H >= 120 ? 5 : 3); // taller plot, more ticks
	});
	const yMin = $derived(ticks[0]);
	const yMax = $derived(ticks[ticks.length - 1]);
	const yAt = (v: number) => TOP + PLOT_H - ((v - yMin) / (yMax - yMin || 1)) * PLOT_H;
	const baseline = $derived(TOP + PLOT_H);

	function niceTicks(lo: number, hi: number, count: number): number[] {
		const raw = (hi - lo) / count;
		const mag = Math.pow(10, Math.floor(Math.log10(raw)));
		const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
		const start = Math.floor(lo / step) * step;
		const end = Math.ceil(hi / step) * step;
		const out: number[] = [];
		for (let t = start; t <= end + step / 2; t += step) out.push(Number(t.toFixed(10)));
		return out;
	}

	function tickLabel(v: number): string {
		if (Math.abs(v) >= 1000) return `${Number((v / 1000).toFixed(1))}K`;
		return Number.isInteger(v) ? String(v) : v.toFixed(1);
	}

	function shortDate(d: string): string {
		return new Date(`${d}T00:00:00Z`).toLocaleDateString('en', {
			month: 'short',
			day: 'numeric',
			timeZone: 'UTC'
		});
	}

	const barW = $derived(Math.max(1, Math.min(24, band - 2)));

	function columnPath(i: number, v: number): string {
		const x = xAt(i) - barW / 2;
		const y = yAt(v);
		const h = baseline - y;
		if (h <= 0) return '';
		const r = Math.min(4, barW / 2, h);
		return `M${x},${baseline}V${y + r}Q${x},${y} ${x + r},${y}H${x + barW - r}Q${x + barW},${y} ${x + barW},${y + r}V${baseline}Z`;
	}

	// One path per run of consecutive non-null days, so a missing day breaks the line.
	const linePaths = $derived.by(() => {
		const paths: string[] = [];
		let current = '';
		points.forEach((p, i) => {
			if (p.value === null) {
				if (current) paths.push(current);
				current = '';
				return;
			}
			current += `${current ? 'L' : 'M'}${xAt(i)},${yAt(p.value)}`;
		});
		if (current) paths.push(current);
		return paths;
	});

	const lastIndex = $derived.by(() => {
		for (let i = points.length - 1; i >= 0; i--) if (points[i].value !== null) return i;
		return -1;
	});

	const xLabels = $derived.by(() => {
		const n = points.length;
		if (n === 0) return [];
		const idx = n <= 2 ? [...Array(n).keys()] : [0, Math.floor((n - 1) / 2), n - 1];
		return idx.map((i) => ({ i, text: shortDate(points[i].date) }));
	});

	function pointerToIndex(e: PointerEvent) {
		const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
		const x = e.clientX - rect.left;
		const i = Math.floor((x - LEFT) / band);
		active = i >= 0 && i < points.length ? i : null;
	}

	function onKey(e: KeyboardEvent) {
		if (points.length === 0) return;
		if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
			e.preventDefault();
			const cur = active ?? lastIndex;
			const next = cur + (e.key === 'ArrowRight' ? 1 : -1);
			active = Math.max(0, Math.min(points.length - 1, next));
		}
	}

	const summary = $derived(
		points.length === 0
			? `${title}: no data`
			: `${title}, ${shortDate(points[0].date)} to ${shortDate(points[points.length - 1].date)}` +
					(lastIndex >= 0 ? `, latest ${format(points[lastIndex].value as number)}` : '') +
					'. Use left and right arrow keys to read each day.'
	);

	// Keep the tooltip inside the chart: anchor it to the left/right edge near the ends.
	const tooltipStyle = $derived.by(() => {
		if (active === null) return '';
		const x = xAt(active);
		if (x < width * 0.25) return `left:${Math.max(0, x - 12)}px`;
		if (x > width * 0.75) return `right:${Math.max(0, width - x - 12)}px`;
		return `left:${x}px;transform:translateX(-50%)`;
	});
</script>

<div class="mini-chart" bind:clientWidth={width}>
	<p class="mini-title">{title}</p>
	<div class="relative">
		<!-- Focusable on purpose: keyboard users step through days with the arrow keys and get the
		     same tooltip as on hover, while aria-label gives screen readers a summary. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<svg
			{width}
			height={HEIGHT}
			role="img"
			aria-label={summary}
			tabindex="0"
			onpointermove={pointerToIndex}
			onpointerleave={() => (active = null)}
			onfocus={() => (active = lastIndex >= 0 ? lastIndex : null)}
			onblur={() => (active = null)}
			onkeydown={onKey}
		>
			<!-- grid + y ticks -->
			{#each ticks as t (t)}
				<line class="grid" x1={LEFT} x2={LEFT + plotW} y1={yAt(t)} y2={yAt(t)} />
				<text class="tick" x={LEFT - 6} y={yAt(t)} dy="0.32em" text-anchor="end"
					>{tickLabel(t)}</text
				>
			{/each}
			<line class="axis" x1={LEFT} x2={LEFT + plotW} y1={baseline} y2={baseline} />

			{#if kind === 'column'}
				{#each points as p, i (p.date)}
					{#if p.value !== null}
						<path
							class="column"
							class:dim={active !== null && active !== i}
							d={columnPath(i, p.value)}
						/>
					{/if}
				{/each}
			{:else}
				{#if active !== null}
					<line class="crosshair" x1={xAt(active)} x2={xAt(active)} y1={TOP} y2={baseline} />
				{/if}
				{#each linePaths as d, k (k)}
					<path class="line" {d} />
				{/each}
				{#if active !== null && points[active]?.value !== null}
					<circle class="dot" cx={xAt(active)} cy={yAt(points[active].value as number)} r="4" />
				{/if}
				{#if lastIndex >= 0}
					<circle
						class="dot"
						cx={xAt(lastIndex)}
						cy={yAt(points[lastIndex].value as number)}
						r="4"
					/>
					<text
						class="end-label"
						x={xAt(lastIndex) + 8}
						y={yAt(points[lastIndex].value as number)}
						dy="0.32em">{format(points[lastIndex].value as number)}</text
					>
				{/if}
			{/if}

			<!-- x axis: first / middle / last date -->
			{#each xLabels as l, k (l.i)}
				<text
					class="tick"
					x={xAt(l.i)}
					y={baseline + 12}
					text-anchor={k === 0 && xLabels.length > 1
						? 'start'
						: k === xLabels.length - 1 && xLabels.length > 1
							? 'end'
							: 'middle'}>{l.text}</text
				>
			{/each}
		</svg>

		{#if active !== null && points[active]}
			<div class="tooltip" style={tooltipStyle} role="status">
				<span class="tooltip-value"
					>{points[active].value === null
						? 'no data'
						: format(points[active].value as number)}</span
				>
				<span class="tooltip-date">{shortDate(points[active].date)}</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.mini-chart {
		--surface: #ffffff;
		--series: #2a78d6;
		--text-secondary: #52514e;
		--text-muted: #898781;
		--grid: #e1e0d9;
		--axis: #c3c2b7;
		min-width: 0;
	}
	.mini-title {
		font-size: 11px;
		font-weight: 500;
		color: var(--text-secondary);
		margin: 0 0 2px;
	}
	svg {
		display: block;
		overflow: visible;
		outline: none;
		touch-action: pan-y;
	}
	svg:focus-visible {
		outline: 2px solid var(--series);
		outline-offset: 2px;
		border-radius: 4px;
	}
	.grid {
		stroke: var(--grid);
		stroke-width: 1;
		shape-rendering: crispEdges;
	}
	.axis {
		stroke: var(--axis);
		stroke-width: 1;
		shape-rendering: crispEdges;
	}
	.tick {
		font-size: 10px;
		fill: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}
	.column {
		fill: var(--series);
		transition: opacity 120ms;
	}
	.column.dim {
		opacity: 0.45;
	}
	.line {
		fill: none;
		stroke: var(--series);
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.crosshair {
		stroke: var(--axis);
		stroke-width: 1;
		shape-rendering: crispEdges;
	}
	.dot {
		fill: var(--series);
		stroke: var(--surface);
		stroke-width: 2;
	}
	.end-label {
		font-size: 10px;
		fill: var(--text-secondary);
	}
	.tooltip {
		position: absolute;
		top: -6px;
		pointer-events: none;
		display: flex;
		gap: 6px;
		align-items: baseline;
		white-space: nowrap;
		background: var(--surface);
		border: 1px solid rgba(11, 11, 11, 0.1);
		border-radius: 6px;
		padding: 2px 6px;
		box-shadow: 0 1px 3px rgba(11, 11, 11, 0.08);
	}
	.tooltip-value {
		font-size: 11px;
		font-weight: 600;
		color: #0b0b0b;
	}
	.tooltip-date {
		font-size: 10px;
		color: var(--text-secondary);
	}
</style>
