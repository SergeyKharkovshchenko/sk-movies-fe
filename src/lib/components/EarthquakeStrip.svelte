<script lang="ts">
	// Header strip: daily earthquake count and average magnitude for a chosen date range, read by
	// the backend from the PostgreSQL data marts (dm.fct_count_day_earthquake /
	// dm.fct_avg_day_earthquake). Two separate charts rather than one dual-axis chart -- the two
	// measures have unrelated scales. One filter row scopes both; a table view carries the same
	// numbers without hovering.
	import { onMount } from 'svelte';
	import { EarthquakeAPIService } from '$services/apiService';
	import MiniDailyChart, { type DailyPoint } from './MiniDailyChart.svelte';

	interface Day {
		date: string;
		count: number | null;
		avgMag: number | null;
	}

	const OPEN_KEY = 'earthquakeStripOpen';

	let open = $state(true);
	let minDate = $state('');
	let maxDate = $state('');
	let from = $state('');
	let to = $state('');
	let days = $state<Day[]>([]);
	let loading = $state(false);
	let error = $state('');
	let view = $state<'chart' | 'table'>('chart');
	let requestId = 0;

	const countPoints = $derived<DailyPoint[]>(days.map((d) => ({ date: d.date, value: d.count })));
	const avgPoints = $derived<DailyPoint[]>(days.map((d) => ({ date: d.date, value: d.avgMag })));
	const rangeInvalid = $derived(!!from && !!to && from > to);

	function shiftDays(iso: string, delta: number): string {
		const d = new Date(`${iso}T00:00:00Z`);
		d.setUTCDate(d.getUTCDate() + delta);
		return d.toISOString().slice(0, 10);
	}

	function applyPreset(lastDays: number | 'all') {
		if (!maxDate) return;
		to = maxDate;
		from = lastDays === 'all' ? minDate : maxOf(minDate, shiftDays(maxDate, -(lastDays - 1)));
	}

	function maxOf(a: string, b: string) {
		return a > b ? a : b;
	}

	function isPreset(lastDays: number | 'all') {
		if (!maxDate || to !== maxDate) return false;
		return lastDays === 'all'
			? from === minDate
			: from === maxOf(minDate, shiftDays(maxDate, -(lastDays - 1)));
	}

	function toggleOpen() {
		open = !open;
		try {
			localStorage.setItem(OPEN_KEY, open ? '1' : '0');
		} catch {
			// storage unavailable (private mode etc.) -- the toggle still works for this visit
		}
	}

	async function load(f: string, t: string) {
		const id = ++requestId;
		loading = true;
		error = '';
		try {
			const res = await EarthquakeAPIService.earthquakeDaily(f, t);
			if (id !== requestId) return; // a newer range was requested meanwhile
			if (res?.error) error = res.error;
			else days = Array.isArray(res?.days) ? res.days : [];
		} catch (e) {
			if (id === requestId) error = `Could not load earthquake data (${e})`;
		} finally {
			if (id === requestId) loading = false;
		}
	}

	// Refetch whenever the range changes (and is valid). Previous data stays on screen, dimmed.
	$effect(() => {
		if (from && to && !rangeInvalid) load(from, to);
	});

	onMount(async () => {
		try {
			open = localStorage.getItem(OPEN_KEY) !== '0';
		} catch {
			open = true;
		}
		try {
			const r = await EarthquakeAPIService.earthquakeRange();
			if (r?.error || !r?.maxDate) {
				error = r?.error ?? 'No earthquake data available';
				return;
			}
			minDate = r.minDate;
			maxDate = r.maxDate;
			applyPreset(30);
		} catch (e) {
			error = `Could not load earthquake data (${e})`;
		}
	});

	const fmtCount = (v: number) => Math.round(v).toLocaleString('en');
	const fmtMag = (v: number) => `M ${v.toFixed(2)}`;
</script>

<section class="eq-strip border-t border-zinc-200 px-4 py-2" aria-label="Daily earthquakes">
	<div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
		<button
			onclick={toggleOpen}
			class="flex items-center gap-1 font-medium text-zinc-800 hover:text-zinc-950"
			aria-expanded={open}
			aria-controls="eq-strip-body"
		>
			<span class="inline-block w-3 text-zinc-500">{open ? '▾' : '▸'}</span>
			Earthquakes
			<span class="font-normal text-zinc-500">· daily, data marts</span>
		</button>

		{#if open}
			<label class="flex items-center gap-1 text-zinc-600">
				From
				<input
					type="date"
					bind:value={from}
					min={minDate}
					max={to || maxDate}
					class="rounded border border-zinc-300 px-1.5 py-0.5 text-xs text-zinc-800"
				/>
			</label>
			<label class="flex items-center gap-1 text-zinc-600">
				To
				<input
					type="date"
					bind:value={to}
					min={from || minDate}
					max={maxDate}
					class="rounded border border-zinc-300 px-1.5 py-0.5 text-xs text-zinc-800"
				/>
			</label>
			<div
				class="flex overflow-hidden rounded-md border border-zinc-300 text-[11px]"
				role="group"
				aria-label="Date presets"
			>
				{#each [{ v: 7, l: '7d' }, { v: 30, l: '30d' }, { v: 'all' as const, l: 'All' }] as p (p.l)}
					<button
						onclick={() => applyPreset(p.v)}
						class="border-r border-zinc-300 px-2 py-0.5 last:border-r-0"
						class:bg-zinc-800={isPreset(p.v)}
						class:text-white={isPreset(p.v)}
						class:text-zinc-600={!isPreset(p.v)}
						class:hover:bg-zinc-50={!isPreset(p.v)}
						aria-pressed={isPreset(p.v)}>{p.l}</button
					>
				{/each}
			</div>
			<button
				onclick={() => (view = view === 'chart' ? 'table' : 'chart')}
				class="text-[11px] text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
				aria-pressed={view === 'table'}
			>
				{view === 'chart' ? 'Show table' : 'Show charts'}
			</button>
			{#if minDate}
				<span class="text-[11px] text-zinc-400">data {minDate} – {maxDate}</span>
			{/if}
		{/if}
	</div>

	{#if open}
		<div id="eq-strip-body" class="mt-1.5">
			{#if rangeInvalid}
				<p class="text-xs text-amber-700">“From” must not be after “To”.</p>
			{:else if error && days.length === 0}
				<p class="text-xs text-red-600">{error}</p>
			{:else}
				{#if error}
					<p class="mb-1 text-xs text-red-600">{error}</p>
				{/if}
				<div class="transition-opacity" class:opacity-50={loading}>
					{#if view === 'chart'}
						<div class="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
							<MiniDailyChart
								points={countPoints}
								kind="column"
								title="Earthquakes per day"
								format={fmtCount}
							/>
							<MiniDailyChart
								points={avgPoints}
								kind="line"
								title="Average magnitude per day"
								format={fmtMag}
							/>
						</div>
					{:else}
						<div class="max-h-40 overflow-y-auto">
							<table class="w-full max-w-md text-xs text-zinc-700">
								<thead class="sticky top-0 bg-white text-zinc-500">
									<tr>
										<th class="py-0.5 pr-4 text-left font-medium">Date</th>
										<th class="py-0.5 pr-4 text-right font-medium">Earthquakes</th>
										<th class="py-0.5 text-right font-medium">Avg magnitude</th>
									</tr>
								</thead>
								<tbody class="tabular-nums">
									{#each days as d (d.date)}
										<tr class="border-t border-zinc-100">
											<td class="py-0.5 pr-4">{d.date}</td>
											<td class="py-0.5 pr-4 text-right"
												>{d.count === null ? '—' : fmtCount(d.count)}</td
											>
											<td class="py-0.5 text-right"
												>{d.avgMag === null ? '—' : d.avgMag.toFixed(2)}</td
											>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
					{#if days.length === 0 && !loading}
						<p class="text-xs text-zinc-500">No data in this range.</p>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</section>
