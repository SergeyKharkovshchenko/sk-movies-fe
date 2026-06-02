<script lang="ts">
	import Button from '$components/Button.svelte';
	import { filteredMovies, moviesStore } from '$store/movies';
	import { onMount } from 'svelte';

	type PosterState = { loading: boolean; data: string | null };
	type SimilarityResult = { movieId: string; similarity: number; movieTitle: string };

	let posterMap = $state<Record<string, PosterState>>({});
	let selectedMovieId = $state<string | null>(null);
	let similarityResults = $state<SimilarityResult[]>([]);
	let loadingSimilarity = $state(false);

	onMount(async () => {
		await moviesStore.getAllMovies();
		for (const movie of $filteredMovies) {
			loadPoster(movie.movieId);
		}
	});

	async function loadPoster(movieId: string) {
		posterMap[movieId] = { loading: true, data: null };
		const res = await moviesStore.getPoster(movieId);
		posterMap[movieId] = { loading: false, data: res?.imageBase64 ?? null };
	}

	async function embedAndLoad(movieId: string) {
		posterMap[movieId] = { loading: true, data: null };
		await moviesStore.embedPoster(movieId);
		const res = await moviesStore.getPoster(movieId);
		posterMap[movieId] = { loading: false, data: res?.imageBase64 ?? null };
	}

	async function findSimilar() {
		if (!selectedMovieId) return;
		loadingSimilarity = true;
		similarityResults = [];
		const res = await moviesStore.getPosterSimilarity(selectedMovieId);
		similarityResults = res ?? [];
		loadingSimilarity = false;
	}

	function toggleSelect(movieId: string) {
		selectedMovieId = selectedMovieId === movieId ? null : movieId;
		similarityResults = [];
	}

	function getMovieTitle(movieId: string) {
		return $filteredMovies.find((m: any) => m.movieId === movieId)?.movieTitle ?? movieId;
	}
</script>

<div class="p-6 flex flex-col gap-8">
	<div class="flex items-center gap-4">
		<h2 class="text-xl font-semibold">Movie Posters</h2>
		{#if selectedMovieId}
			<span class="text-sm text-zinc-500">
				Selected: <span class="font-medium text-zinc-800">{getMovieTitle(selectedMovieId)}</span>
			</span>
			<Button on:customclick={findSimilar}>Find Similar</Button>
		{/if}
	</div>

	<div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
		{#each $filteredMovies as movie (movie.movieId)}
			{@const state = posterMap[movie.movieId]}
			{@const isSelected = selectedMovieId === movie.movieId}
			<div class="flex flex-col gap-2">
				<button
					type="button"
					onclick={() => toggleSelect(movie.movieId)}
					class="w-full aspect-[2/3] rounded-md overflow-hidden flex items-center justify-center border-2 transition-colors
						{isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-zinc-200 bg-zinc-100'}"
				>
					{#if state?.loading}
						<i class="fa-solid fa-spinner animate-spin text-zinc-400 text-2xl"></i>
					{:else if state?.data}
						<img
							src="data:image/jpeg;base64,{state.data}"
							alt="Poster for {movie.movieTitle}"
							class="w-full h-full object-cover"
						/>
					{:else}
						<div class="flex flex-col items-center gap-3 p-3 text-center">
							<i class="fa-solid fa-image text-zinc-300 text-3xl"></i>
							<Button on:customclick={() => embedAndLoad(movie.movieId)}>Embed</Button>
						</div>
					{/if}
				</button>
				<p class="text-sm font-medium leading-tight line-clamp-2">{movie.movieTitle}</p>
			</div>
		{/each}
	</div>

	{#if loadingSimilarity}
		<div class="flex items-center gap-2 text-zinc-500">
			<i class="fa-solid fa-spinner animate-spin"></i>
			<span>Finding similar posters…</span>
		</div>
	{:else if similarityResults.length > 0}
		<div>
			<h3 class="text-lg font-semibold mb-3">Similar Posters</h3>
			<table class="w-full text-sm border border-zinc-200 rounded-md overflow-hidden">
				<thead class="bg-zinc-50 text-zinc-700 font-semibold">
					<tr>
						<th class="text-left px-4 py-2 border-b border-zinc-200">#</th>
						<th class="text-left px-4 py-2 border-b border-zinc-200">Movie</th>
						<th class="text-left px-4 py-2 border-b border-zinc-200">Movie ID</th>
						<th class="text-left px-4 py-2 border-b border-zinc-200">Similarity</th>
					</tr>
				</thead>
				<tbody>
					{#each similarityResults as result, i (result.movieId)}
						<tr class="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
							<td class="px-4 py-2 text-zinc-400">{i + 1}</td>
							<td class="px-4 py-2 font-medium">{result.movieTitle || getMovieTitle(result.movieId)}</td>
							<td class="px-4 py-2 text-zinc-500">{result.movieId}</td>
							<td class="px-4 py-2">
								<div class="flex items-center gap-2">
									<div class="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden max-w-32">
										<div
											class="h-full bg-blue-500 rounded-full"
											style="width: {(result.similarity * 100).toFixed(1)}%"
										></div>
									</div>
									<span class="text-zinc-600 tabular-nums">{(result.similarity * 100).toFixed(1)}%</span>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
