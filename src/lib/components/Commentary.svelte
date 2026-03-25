<script lang="ts">
	type Commentary = {
		user: { userId: string | number; name: string }
		movie: { movieId: string | number; title: string }
		text: string
		createdAt?: string
	}

	let { commentary }: { commentary: Commentary } = $props()
</script>

<div class="flex flex-col gap-4 rounded-md border border-primary-500 px-5 py-5">
	<!-- Header: user + movie -->
	<div class="flex items-center justify-between gap-3">
		<div class="flex items-center gap-3">
			<div
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white"
			>
				<i class="fa-solid fa-user text-sm"></i>
			</div>
			<div>
				<div class="font-semibold text-zinc-950">{commentary.user.name}</div>
				<div class="text-xs text-primary-500">User #{commentary.user.userId}</div>
			</div>
		</div>

		<div class="flex items-center gap-2 rounded-md bg-primary-50 px-3 py-1.5">
			<i class="fa-solid fa-film text-primary-500 text-sm"></i>
			<div class="text-right">
				<div class="text-sm font-semibold text-zinc-950">{commentary.movie.title}</div>
				<div class="text-xs text-primary-500">Movie #{commentary.movie.movieId}</div>
			</div>
		</div>
	</div>

	<!-- Divider -->
	<div class="border-t border-primary-100"></div>

	<!-- Commentary text -->
	<p class="text-sm leading-relaxed text-zinc-700">{commentary.text}</p>

	<!-- Footer: date -->
	{#if commentary.createdAt}
		<div class="flex items-center gap-1.5 text-xs text-primary-400">
			<i class="fa-regular fa-clock"></i>
			<span>{commentary.createdAt}</span>
		</div>
	{/if}
</div>
