<script lang="ts">
	import { PerformanceAPIService } from '$services/apiService';

	// Fixed deliberately -- this page benchmarks our own deployed app, not an arbitrary site.
	const TARGET_URL = 'https://sk-movies-fe.vercel.app/';

	interface Scores {
		performance: number | null;
		accessibility: number | null;
		bestPractices: number | null;
		seo: number | null;
	}

	interface BudgetRow {
		type: 'size' | 'count' | 'timing';
		name: string;
		budget: number;
		actual: number;
		passed: boolean;
	}

	interface ResourceSummaryRow {
		resourceType: string;
		requestCount: number;
		transferSize: number;
	}

	interface PagespeedResult {
		url: string;
		strategy: 'mobile' | 'desktop';
		scores: Scores;
		metrics: Record<string, number | null>;
		resourceSummary: ResourceSummaryRow[];
		budget: BudgetRow[];
	}

	// Friendly labels for Lighthouse's own kebab-case audit/resource-type ids, used for both the
	// metrics list and the budget table so the two stay visually consistent.
	const LABELS: Record<string, string> = {
		'first-contentful-paint': 'First Contentful Paint',
		'largest-contentful-paint': 'Largest Contentful Paint',
		'total-blocking-time': 'Total Blocking Time',
		'cumulative-layout-shift': 'Cumulative Layout Shift',
		'speed-index': 'Speed Index',
		interactive: 'Time to Interactive',
		script: 'Script',
		stylesheet: 'Stylesheet',
		image: 'Image',
		font: 'Font',
		total: 'Total',
		'third-party': 'Third-party'
	};
	// cumulative-layout-shift is unitless; every other timing metric here is milliseconds.
	const UNITLESS_METRICS = new Set(['cumulative-layout-shift']);

	function label(id: string): string {
		return LABELS[id] ?? id;
	}

	function formatMetric(id: string, value: number | null): string {
		if (value === null || value === undefined) return '—';
		return UNITLESS_METRICS.has(id) ? value.toFixed(3) : `${Math.round(value)} ms`;
	}

	function formatBudgetValue(row: BudgetRow): string {
		if (row.actual < 0) return '—';
		if (row.type === 'size') return `${row.actual.toFixed(1)} / ${row.budget} KB`;
		if (row.type === 'count') return `${Math.round(row.actual)} / ${row.budget}`;
		return `${formatMetric(row.name, row.actual)} / ${UNITLESS_METRICS.has(row.name) ? row.budget.toFixed(3) : `${row.budget} ms`}`;
	}

	function scoreClass(score: number | null): string {
		if (score === null) return 'bg-zinc-100 text-zinc-500';
		if (score >= 90) return 'bg-emerald-100 text-emerald-700';
		if (score >= 50) return 'bg-amber-100 text-amber-700';
		return 'bg-red-100 text-red-700';
	}

	let strategy = $state<'mobile' | 'desktop'>('mobile');
	let loading = $state(false);
	let error = $state('');
	let result = $state<PagespeedResult | null>(null);

	async function run() {
		loading = true;
		error = '';
		result = null;
		try {
			result = await PerformanceAPIService.runPagespeed(TARGET_URL, strategy);
		} catch (err) {
			error = `Failed to run PageSpeed Insights: ${err}`;
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col gap-6 m-6">
	<div class="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
		<h1 class="text-base font-semibold text-zinc-800 mb-1">Performance</h1>
		<p class="text-xs text-zinc-500 mb-5">
			Runs Google PageSpeed Insights (Lighthouse) against
			<code class="bg-zinc-100 px-1 rounded">{TARGET_URL}</code> and checks the result against a
			performance budget.
		</p>

		<div class="flex items-end gap-3 flex-wrap">
			<div class="flex rounded-md border border-zinc-300 bg-white text-xs overflow-hidden">
				{#each ['mobile', 'desktop'] as const as opt (opt)}
					<button
						onclick={() => (strategy = opt)}
						class="px-3 py-2 capitalize transition-colors"
						class:bg-zinc-800={strategy === opt}
						class:text-white={strategy === opt}
						class:text-zinc-600={strategy !== opt}
					>
						{opt}
					</button>
				{/each}
			</div>
			<button
				onclick={run}
				disabled={loading}
				class="flex items-center gap-2 px-5 py-2 rounded-lg bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
			>
				{#if loading}
					<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
					></span>
					Running…
				{:else}
					Run
				{/if}
			</button>
		</div>
		{#if loading}
			<p class="text-xs text-zinc-400 mt-2">
				A full Lighthouse audit typically takes 20-40 seconds — hang tight.
			</p>
		{/if}
		{#if error}
			<p class="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
				{error}
			</p>
		{/if}
	</div>

	{#if result}
		<div class="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
			<h2 class="text-sm font-semibold text-zinc-800 mb-4">
				Scores — {result.url} ({result.strategy})
			</h2>
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
				{#each [{ key: 'performance', title: 'Performance' }, { key: 'accessibility', title: 'Accessibility' }, { key: 'bestPractices', title: 'Best Practices' }, { key: 'seo', title: 'SEO' }] as s (s.key)}
					{@const score = result.scores[s.key as keyof Scores]}
					<div class="rounded-lg border border-zinc-200 p-4 text-center {scoreClass(score)}">
						<div class="text-2xl font-bold">{score ?? '—'}</div>
						<div class="text-xs mt-1">{s.title}</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
			<h2 class="text-sm font-semibold text-zinc-800 mb-4">Key metrics</h2>
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
				{#each Object.entries(result.metrics) as [id, value] (id)}
					<div>
						<div class="text-zinc-400 text-xs">{label(id)}</div>
						<div class="font-mono text-zinc-800">{formatMetric(id, value)}</div>
					</div>
				{/each}
			</div>
		</div>

		{#if result.budget.length > 0}
			<div class="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
				<h2 class="text-sm font-semibold text-zinc-800 mb-1">Performance budget</h2>
				<p class="text-xs text-zinc-500 mb-4">
					Evaluated against <code class="bg-zinc-100 px-1 rounded">budget.json</code> (sizes in KB,
					timings in ms except Cumulative Layout Shift).
				</p>
				<div class="overflow-hidden rounded-lg border border-zinc-200 divide-y divide-zinc-100">
					{#each result.budget as row, i (i)}
						<div class="flex items-center justify-between px-3 py-2 text-sm">
							<span class="text-zinc-600">{label(row.name)}</span>
							<div class="flex items-center gap-3">
								<span class="font-mono text-xs text-zinc-500">{formatBudgetValue(row)}</span>
								{#if row.passed}
									<span class="text-emerald-600 text-xs font-medium">✓ pass</span>
								{:else}
									<span class="text-red-600 text-xs font-medium">✗ fail</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
			<h2 class="text-sm font-semibold text-zinc-800 mb-4">Resource breakdown</h2>
			<div class="overflow-hidden rounded-lg border border-zinc-200 divide-y divide-zinc-100">
				{#each result.resourceSummary as row, i (i)}
					<div class="flex items-center justify-between px-3 py-2 text-sm">
						<span class="text-zinc-600">{label(row.resourceType)}</span>
						<span class="font-mono text-xs text-zinc-500">
							{row.requestCount} req · {(row.transferSize / 1024).toFixed(1)} KB
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
