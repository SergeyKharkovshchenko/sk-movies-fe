<script lang="ts">
	import EarthquakeDaily from '$lib/components/EarthquakeDaily.svelte';
</script>

<div class="flex flex-col gap-6 m-6">
	<div class="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
		<h1 class="text-base font-semibold text-zinc-800 mb-1">Earthquakes</h1>
		<p class="text-xs text-zinc-500 mb-5">
			Daily earthquake count and average magnitude from the PostgreSQL data marts (<code
				class="bg-zinc-100 px-1 rounded">dm.fct_count_day_earthquake</code
			>,
			<code class="bg-zinc-100 px-1 rounded">dm.fct_avg_day_earthquake</code>), loaded from USGS
			data by an external pipeline.
		</p>
		<EarthquakeDaily />
	</div>
</div>
