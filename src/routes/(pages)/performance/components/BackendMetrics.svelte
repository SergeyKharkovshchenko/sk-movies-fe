<script lang="ts">
	import { untrack } from 'svelte';
	import { PerformanceAPIService } from '$services/apiService';
	import type { MetricResponse } from '$lib/utils/metrics';
	import MetricChart from './MetricChart.svelte';
	import MetricStat from './MetricStat.svelte';
	import TraceList from './TraceList.svelte';

	// Grafana Cloud forbids framing its pages (frame-ancestors 'none'), so everything here is drawn
	// from the backend's own API. Each trace panel also links to the public dashboard for digging deeper.
	const GRAFANA_BASE =
		import.meta.env.VITE_GRAFANA_PUBLIC_URL ?? 'https://heftyspringbok690.grafana.net';

	const RANGES = [
		{ key: '15m', label: '15 min' },
		{ key: '1h', label: '1 hour' },
		{ key: '6h', label: '6 hours' },
		{ key: '24h', label: '24 hours' },
		{ key: '7d', label: '7 days' }
	] as const;

	interface Explained {
		title: string;
		/** What the panel measures. */
		description: string;
		/** A concrete reading and how to interpret it. */
		example: string;
	}

	interface StatPanel extends Explained {
		metric: string;
		format?: 'value' | 'duration';
	}

	interface ChartPanel extends Explained {
		metric: string;
		height: number;
		/** Charts sharing a group colour the same entity the same way (e.g. an endpoint). */
		colorGroup: string;
	}

	interface TraceChartPanel extends Explained {
		metric: string;
		height: number;
		colorGroup: string;
		dashboardId: string;
	}

	interface TraceListPanel extends Explained {
		kind: 'recent' | 'slow';
		dashboardId: string;
	}

	const STATS: StatPanel[] = [
		{
			metric: 'uptime',
			format: 'duration',
			title: 'Uptime',
			description: 'How long the backend process has been running since its last (re)start.',
			example:
				'"3 d 4 h" means no restart for over three days. "2 min" right after a deploy is expected, but if it keeps resetting to small values the service is crash-looping.'
		},
		{
			metric: 'requests_total',
			title: 'Requests',
			description: 'Total HTTP requests the backend handled in the selected range.',
			example:
				'"12.4K" over 24 h is about 8.6 requests per minute. A sudden drop to 0 means the API is unreachable or the frontend stopped calling it.'
		},
		{
			metric: 'error_rate_5xx',
			title: 'Error rate (5xx)',
			description: 'Share of requests that failed with a server-side HTTP 5xx status.',
			example:
				'0% is healthy. A jump to a few percent right after a deploy points to a regression, e.g. database connection failures returning HTTP 500.'
		},
		{
			metric: 'heap_used',
			title: 'Heap used',
			description: 'Memory the JVM currently uses for Java objects.',
			example:
				'"180 MiB" on a 512 MiB container is comfortable. Staying close to the limit means frequent garbage collection and, eventually, an OutOfMemoryError.'
		}
	];

	interface ChartSection {
		title: string;
		intro: string;
		panels: ChartPanel[];
	}

	const CHART_SECTIONS: ChartSection[] = [
		{
			title: 'Traffic and latency',
			intro: 'How much load the API gets and how fast it answers, per endpoint.',
			panels: [
				{
					metric: 'requests_by_endpoint',
					height: 240,
					colorGroup: 'endpoint',
					title: 'Requests per second, by endpoint',
					description: 'Request rate over time, one line per endpoint (URI template).',
					example:
						'/getAllMovies at 0.5 req/s next to /similar at 0.02 req/s shows which endpoints dominate the load and where optimisation pays off most.'
				},
				{
					metric: 'latency_p95_by_endpoint',
					height: 240,
					colorGroup: 'endpoint',
					title: 'Latency p95, by endpoint',
					description:
						'The response time that 95% of requests beat; the slowest 5% take longer. It reveals tail latency that an average hides.',
					example:
						'p95 = 800 ms on /similar means 1 call in 20 takes more than 0.8 s (embedding plus similarity query). A rising line after a release signals a slowdown.'
				},
				{
					metric: 'responses_by_status',
					height: 240,
					colorGroup: 'status',
					title: 'Responses by status',
					description: 'Requests per second grouped by HTTP status code (200, 404, 500, ...).',
					example:
						'Steady 200s with an occasional 404 is normal. A growing 500 line is a server problem; a wave of 401/403 usually means an auth or token issue.'
				}
			]
		},
		{
			title: 'JVM and resources',
			intro: 'Health of the Java process and its database pool.',
			panels: [
				{
					metric: 'jvm_heap',
					height: 240,
					colorGroup: 'heap',
					title: 'JVM heap, by memory pool',
					description: 'Heap memory over time, split into the Eden, Survivor and Tenured pools.',
					example:
						'A saw-tooth in Eden is healthy garbage collection. A Tenured line that climbs and never drops back suggests a memory leak.'
				},
				{
					metric: 'cpu',
					height: 240,
					colorGroup: 'cpu',
					title: 'CPU usage',
					description: 'Share of CPU time used by the backend process and by the whole machine.',
					example:
						'~5% when idle, spiking to 80% while creating rating embeddings is expected. Sustained values above 70% make every request slower, especially on a small instance.'
				},
				{
					metric: 'db_connections',
					height: 240,
					colorGroup: 'pool',
					title: 'Database connections (Hikari)',
					description: 'Connection pool: active, idle and pending connections against the maximum.',
					example:
						'Active 2 and idle 6 of 10 is fine. Pending above 0, or active pinned at the maximum, means requests are waiting for the database (the "remaining connection slots" error).'
				},
				{
					metric: 'threads',
					height: 240,
					colorGroup: 'threads',
					title: 'JVM threads',
					description: 'Number of live, daemon and peak threads in the JVM.',
					example:
						'A flat ~46 is normal. A count that only ever goes up indicates a thread leak; a short spike during a bulk job is fine.'
				}
			]
		}
	];

	const TRACE_CHARTS: TraceChartPanel[] = [
		{
			metric: 'span_rate',
			height: 240,
			colorGroup: 'spans',
			dashboardId: '1c18fed49f2e40139e2dd2ec35bc908d',
			title: 'Span rate (server)',
			description: 'How many server-side spans (one per incoming request) are recorded per second.',
			example:
				'"3 spans/s" is roughly 3 requests/s. Compare it with the request rate above to confirm tracing covers all traffic.'
		},
		{
			metric: 'span_p95',
			height: 240,
			colorGroup: 'spans',
			dashboardId: '8b579a35bedc401280f69ebe027d5852',
			title: 'Span duration p95 (server)',
			description:
				'The p95 duration of server spans, the same idea as endpoint latency but measured from traces.',
			example:
				'"1.2 s" means the slowest 5% of requests take over a second. Open the slow traces below to see which step is responsible.'
		}
	];

	const TRACE_LISTS: TraceListPanel[] = [
		{
			kind: 'recent',
			dashboardId: 'caded55f0daa41c59e1449591c431c62',
			title: 'Recent traces',
			description:
				'The latest requests (uptime probes left out). Click a row to open a waterfall of its spans and how long each took.',
			example:
				'GET /comments/user/ur1293485 took 240 ms: controller 5 ms, Neo4j query 230 ms. The database call is the bottleneck.'
		},
		{
			kind: 'slow',
			dashboardId: 'eeccff32f3254ac1bae7d360d4efbb81',
			title: 'Slow traces (> 500 ms)',
			description: 'Only requests slower than 500 ms, so problems are easy to spot.',
			example:
				'A POST /createRatingsEmbedding trace at 2.3 s, mostly spent calling the embeddings API. An empty list means every request was fast.'
		}
	];

	const METRICS = [
		...STATS.map((p) => p.metric),
		...CHART_SECTIONS.flatMap((s) => s.panels.map((p) => p.metric)),
		...TRACE_CHARTS.map((p) => p.metric)
	];

	let range = $state<string>('1h');
	let results = $state<Record<string, MetricResponse | null>>({});
	let errors = $state<Record<string, string>>({});
	let loading = $state(false);
	let updatedAt = $state<Date | null>(null);
	let refreshKey = $state(0); // lets the trace lists refetch on the Refresh button
	let requestId = 0; // a late answer for an old range must not overwrite the current one

	async function loadOne(metric: string, id: number) {
		try {
			// Span charts come from the traces API, everything else from the metrics API.
			const res = metric.startsWith('span_')
				? await PerformanceAPIService.getTraceSeries(metric, range)
				: await PerformanceAPIService.getMetric(metric, range);
			if (id !== requestId) return;
			if (!res || res.error || !Array.isArray(res.series)) {
				errors[metric] = res?.error ?? 'Backend not reachable';
				return;
			}
			results[metric] = res;
			errors[metric] = '';
		} catch (err) {
			if (id === requestId) errors[metric] = `${err}`;
		}
	}

	async function load() {
		const id = ++requestId;
		loading = true;
		await Promise.all(METRICS.map((m) => loadOne(m, id)));
		if (id === requestId) {
			loading = false;
			updatedAt = new Date();
		}
	}

	function refresh() {
		refreshKey++;
		load();
	}

	// Refetch on range change. The previous data stays on screen (dimmed) until the new data lands.
	$effect(() => {
		void range;
		untrack(load);
	});

	function traceUrl(id: string): string {
		return `${GRAFANA_BASE}/public-dashboards/${id}?theme=light`;
	}
</script>

{#snippet grafanaLink(dashboardId: string)}
	<a
		href={traceUrl(dashboardId)}
		target="_blank"
		rel="noopener noreferrer"
		class="shrink-0 whitespace-nowrap text-xs text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
	>
		Open in Grafana <span aria-hidden="true">↗</span>
	</a>
{/snippet}

<div class="viz-root flex flex-col gap-6">
	<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
		<h2 class="mb-1 text-base font-semibold text-zinc-800">Backend metrics</h2>
		<p class="mb-4 text-xs text-zinc-500">
			Live data from the Spring Boot backend, collected with Micrometer and OpenTelemetry and stored
			in Grafana Cloud. Each panel has a short note on what it shows and how to read it.
		</p>

		<div class="flex flex-wrap items-center gap-3">
			<div
				class="flex overflow-hidden rounded-md border border-zinc-300 bg-white text-xs"
				role="group"
				aria-label="Time range"
			>
				{#each RANGES as r (r.key)}
					<button
						onclick={() => (range = r.key)}
						aria-pressed={range === r.key}
						class="px-3 py-2 transition-colors"
						class:bg-zinc-800={range === r.key}
						class:text-white={range === r.key}
						class:text-zinc-600={range !== r.key}
					>
						{r.label}
					</button>
				{/each}
			</div>
			<button
				onclick={refresh}
				disabled={loading}
				class="rounded-md border border-zinc-300 px-3 py-2 text-xs text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
			>
				{loading ? 'Loading…' : 'Refresh'}
			</button>
			{#if updatedAt}
				<span class="text-xs text-zinc-400">
					Updated {updatedAt.toLocaleTimeString('en-GB')}
				</span>
			{/if}
		</div>
	</div>

	<section class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
		<h3 class="mb-1 text-sm font-semibold text-zinc-800">At a glance</h3>
		<p class="mb-4 text-xs text-zinc-500">
			Single numbers for the selected time range. Check these first.
		</p>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{#each STATS as panel (panel.metric)}
				<article class="flex flex-col overflow-hidden rounded-lg border border-zinc-200">
					<div class="px-4 pb-2 pt-3">
						<h4 class="text-sm font-medium text-zinc-800">{panel.title}</h4>
						<p class="mt-1 text-xs text-zinc-600">{panel.description}</p>
						<p class="mt-1 text-xs text-zinc-500">
							<span class="font-medium text-zinc-600">Example:</span>
							{panel.example}
						</p>
					</div>
					<div class="mt-auto">
						<MetricStat
							data={results[panel.metric] ?? null}
							{loading}
							error={errors[panel.metric]}
							format={panel.format}
						/>
					</div>
				</article>
			{/each}
		</div>
	</section>

	{#each CHART_SECTIONS as section (section.title)}
		<section class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
			<h3 class="mb-1 text-sm font-semibold text-zinc-800">{section.title}</h3>
			<p class="mb-4 text-xs text-zinc-500">{section.intro}</p>
			<div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
				{#each section.panels as panel (panel.metric)}
					<article class="flex min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200">
						<div class="px-4 pb-1 pt-3">
							<h4 class="text-sm font-medium text-zinc-800">{panel.title}</h4>
							<p class="mt-1 text-xs text-zinc-600">{panel.description}</p>
							<p class="mt-1 text-xs text-zinc-500">
								<span class="font-medium text-zinc-600">Example:</span>
								{panel.example}
							</p>
						</div>
						<MetricChart
							data={results[panel.metric] ?? null}
							{loading}
							error={errors[panel.metric]}
							height={panel.height}
							colorGroup={panel.colorGroup}
						/>
					</article>
				{/each}
			</div>
		</section>
	{/each}

	<section class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
		<h3 class="mb-1 text-sm font-semibold text-zinc-800">Traces</h3>
		<p class="mb-4 text-xs text-zinc-500">
			Each incoming request is recorded as a trace made of spans (the request itself and the
			database calls inside it). Use these panels to find where time is spent.
		</p>
		<div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
			{#each TRACE_CHARTS as panel (panel.metric)}
				<article class="flex min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200">
					<div class="px-4 pb-1 pt-3">
						<div class="flex items-start justify-between gap-3">
							<h4 class="text-sm font-medium text-zinc-800">{panel.title}</h4>
							{@render grafanaLink(panel.dashboardId)}
						</div>
						<p class="mt-1 text-xs text-zinc-600">{panel.description}</p>
						<p class="mt-1 text-xs text-zinc-500">
							<span class="font-medium text-zinc-600">Example:</span>
							{panel.example}
						</p>
					</div>
					<MetricChart
						data={results[panel.metric] ?? null}
						{loading}
						error={errors[panel.metric]}
						height={panel.height}
						colorGroup={panel.colorGroup}
					/>
				</article>
			{/each}

			{#each TRACE_LISTS as panel (panel.kind)}
				<article class="flex min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200">
					<div class="px-4 pb-1 pt-3">
						<div class="flex items-start justify-between gap-3">
							<h4 class="text-sm font-medium text-zinc-800">{panel.title}</h4>
							{@render grafanaLink(panel.dashboardId)}
						</div>
						<p class="mt-1 text-xs text-zinc-600">{panel.description}</p>
						<p class="mt-1 text-xs text-zinc-500">
							<span class="font-medium text-zinc-600">Example:</span>
							{panel.example}
						</p>
					</div>
					<TraceList kind={panel.kind} {range} {refreshKey} />
				</article>
			{/each}
		</div>
	</section>
</div>

<style>
	/* Categorical slots in fixed order (validated: adjacent CVD ΔE ≥ 9.1, normal-vision ΔE ≥ 19.6).
	   The page is light-only, so only the light steps are defined. */
	.viz-root {
		--series-1: #2a78d6;
		--series-2: #eb6834;
		--series-3: #1baf7a;
		--series-4: #eda100;
		--series-5: #e87ba4;
		--series-6: #008300;
		--series-7: #6250d6;
		--series-8: #e34948;
		--viz-surface: #ffffff; /* the card background, used for the 2px rings on dots */
		--viz-grid: #e1e0d9;
		--viz-baseline: #c3c2b7;
		--viz-axis: #898781;
		--viz-muted: #898781;
	}
</style>
