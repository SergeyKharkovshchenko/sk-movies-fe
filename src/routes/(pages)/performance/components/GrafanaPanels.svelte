<script lang="ts">
	// Public (no-login) Grafana Cloud dashboards fed by the backend's OTLP metrics and traces.
	// The base URL can be overridden per environment; the ids below are public share links.
	const GRAFANA_BASE =
		import.meta.env.VITE_GRAFANA_PUBLIC_URL ?? 'https://heftyspringbok690.grafana.net';

	interface Panel {
		id: string;
		title: string;
		/** What the panel measures. */
		description: string;
		/** A concrete reading and how to interpret it. */
		example: string;
		/** px height of the iframe. */
		height: number;
	}

	interface Section {
		title: string;
		intro: string;
		/** Tailwind grid classes controlling how many panels sit side by side. */
		grid: string;
		panels: Panel[];
	}

	const SECTIONS: Section[] = [
		{
			title: 'At a glance',
			intro: 'Single numbers for the selected time range. Check these first.',
			grid: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
			panels: [
				{
					id: '610592c4dbd540cf98c2b2370c273734',
					title: 'Uptime',
					description: 'How long the backend process has been running since its last (re)start.',
					example:
						'"3 d 4 h" means no restart for over three days. "2 min" right after a deploy is expected, but if it keeps resetting to small values the service is crash-looping.',
					height: 260
				},
				{
					id: '2c6f2a284e844d629dd6a014e84323d6',
					title: 'Requests (range)',
					description: 'Total number of HTTP requests the backend handled in the selected range.',
					example:
						'"12.4k" over 24 h is about 8.6 requests per minute. A sudden drop to 0 means the API is unreachable or the frontend stopped calling it.',
					height: 260
				},
				{
					id: '0837629cd3394e27b9c9fb3f8ebecbfa',
					title: 'Error rate (5xx)',
					description: 'Server-side failures: responses with an HTTP 5xx status.',
					example:
						'0 is healthy. A jump to a few percent right after a deploy points to a regression, e.g. database connection failures returning HTTP 500.',
					height: 260
				},
				{
					id: '756284c39c6e4596a367f736ce89c69a',
					title: 'Heap used',
					description: 'Memory the JVM currently uses for Java objects.',
					example:
						'"180 MiB" on a 512 MiB container is comfortable. Staying close to the limit means frequent garbage collection and, eventually, an OutOfMemoryError.',
					height: 260
				}
			]
		},
		{
			title: 'Traffic and latency',
			intro: 'How much load the API gets and how fast it answers, per endpoint.',
			grid: 'grid-cols-1 xl:grid-cols-2',
			panels: [
				{
					id: 'e2041f05a58d49ae9e0d8940bbb7bb13',
					title: 'Requests/s by endpoint',
					description: 'Request rate over time, one line per endpoint (URI template).',
					example:
						'/getAllMovies at 0.5 req/s next to /similar at 0.02 req/s shows which endpoints dominate the load and where optimisation pays off most.',
					height: 420
				},
				{
					id: '218abb064bd2470ea3b225ead6fe4b4f',
					title: 'Latency p95 by endpoint',
					description:
						'The response time that 95% of requests beat; the slowest 5% take longer. It reveals tail latency that an average hides.',
					example:
						'p95 = 800 ms on /similar means 1 call in 20 takes more than 0.8 s (embedding plus similarity query). A rising line after a release signals a slowdown.',
					height: 420
				},
				{
					id: '94fc5febcd5d4d5ebec42e9e4dcd7a1a',
					title: 'Responses by status',
					description: 'Requests grouped by HTTP status code (200, 404, 500, ...) over time.',
					example:
						'Steady 200s with an occasional 404 is normal. A growing 500 line is a server problem; a wave of 401/403 usually means an auth or token issue.',
					height: 420
				}
			]
		},
		{
			title: 'JVM and resources',
			intro: 'Health of the Java process and its database pool.',
			grid: 'grid-cols-1 xl:grid-cols-2',
			panels: [
				{
					id: '2a52af4f7060440190e9f56e25e915c0',
					title: 'JVM heap',
					description: 'Heap memory over time, to see how it grows and gets reclaimed.',
					example:
						'A saw-tooth between 150 and 300 MiB is healthy garbage collection. A line that climbs and never drops back suggests a memory leak.',
					height: 420
				},
				{
					id: 'd6ea3b12fa31404b9919e6c83fa4d89b',
					title: 'CPU',
					description: 'Share of CPU time used by the backend process.',
					example:
						'~5% when idle, spiking to 80% while creating rating embeddings is expected. Sustained values above 70% make every request slower, especially on a small instance.',
					height: 420
				},
				{
					id: '1cd298efe4e449c990794de6900f21f8',
					title: 'DB connections (Hikari)',
					description: 'Database connection pool: active, idle and pending connections.',
					example:
						'active = 2, idle = 1 is fine. Pending above 0, or active pinned at the pool maximum, means requests are waiting for the database (the "remaining connection slots" error).',
					height: 420
				},
				{
					id: 'a9577de71bb64d29a7391d79f691b8f0',
					title: 'Threads',
					description: 'Number of live JVM threads.',
					example:
						'A flat ~40 is normal. A count that only ever goes up indicates a thread leak; a short spike during a bulk job is fine.',
					height: 420
				}
			]
		},
		{
			title: 'Traces',
			intro:
				'Each incoming request is recorded as a trace made of spans (controller, database call, external API). Use these panels to find where time is spent.',
			grid: 'grid-cols-1 xl:grid-cols-2',
			panels: [
				{
					id: '1c18fed49f2e40139e2dd2ec35bc908d',
					title: 'Span rate (server)',
					description:
						'How many server-side spans (one per incoming request) are recorded per second.',
					example:
						'"3 spans/s" is roughly 3 requests/s. Compare it with Requests/s by endpoint to confirm tracing covers all traffic.',
					height: 420
				},
				{
					id: '8b579a35bedc401280f69ebe027d5852',
					title: 'Span duration p95 (server)',
					description:
						'The p95 duration of server spans, the same idea as endpoint latency but measured from traces.',
					example:
						'"1.2 s" means the slowest 5% of requests take over a second. Open the slow traces below to see which step is responsible.',
					height: 420
				},
				{
					id: 'caded55f0daa41c59e1449591c431c62',
					title: 'Recent traces',
					description:
						'The latest requests. Open one to see a waterfall of its spans and how long each took.',
					example:
						'GET /comments/user/ur1293485 took 240 ms: controller 5 ms, Neo4j query 230 ms. The database call is the bottleneck.',
					height: 560
				},
				{
					id: 'eeccff32f3254ac1bae7d360d4efbb81',
					title: 'Slow traces (> 500 ms)',
					description: 'Only requests slower than 500 ms, so problems are easy to spot.',
					example:
						'A POST /createRatingsEmbedding trace at 2.3 s, mostly spent calling the embeddings API. An empty list means every request was fast.',
					height: 560
				}
			]
		}
	];

	function src(id: string): string {
		return `${GRAFANA_BASE}/public-dashboards/${id}?theme=light`;
	}
</script>

<div class="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
	<h2 class="text-base font-semibold text-zinc-800 mb-1">Backend metrics (live)</h2>
	<p class="text-xs text-zinc-500">
		Live data from the Spring Boot backend, collected with Micrometer and OpenTelemetry and shown
		through Grafana Cloud. Each panel has a short note on what it shows and how to read it.
	</p>
</div>

{#each SECTIONS as section (section.title)}
	<section class="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
		<h3 class="text-sm font-semibold text-zinc-800 mb-1">{section.title}</h3>
		<p class="text-xs text-zinc-500 mb-4">{section.intro}</p>

		<div class="grid gap-4 {section.grid}">
			{#each section.panels as panel (panel.id)}
				<article class="flex flex-col rounded-lg border border-zinc-200 overflow-hidden">
					<div class="px-4 pt-3 pb-2">
						<h4 class="text-sm font-medium text-zinc-800">{panel.title}</h4>
						<p class="text-xs text-zinc-600 mt-1">{panel.description}</p>
						<p class="text-xs text-zinc-500 mt-1">
							<span class="font-medium text-zinc-600">Example:</span>
							{panel.example}
						</p>
					</div>
					<iframe
						title={panel.title}
						src={src(panel.id)}
						loading="lazy"
						class="w-full border-0 border-t border-zinc-100"
						style="height: {panel.height}px"
					></iframe>
				</article>
			{/each}
		</div>
	</section>
{/each}
