<script lang="ts">
	import Headline from '$components/Headline.svelte'
	import SecondaryNavigation from '$lib/components/SecondaryNavigation.svelte'
	import HierarchyTree from '$lib/components/HierarchyTree.svelte'
	import BikeChat from './components/BikeChat.svelte'
	import RagControls from './components/RagControls.svelte'
	import { treeviewSidebarVisible } from '$store/store'
	import { goto } from '$lib/utils/navigate'
	import { BikesAPIService } from '$services/apiService'
	import { onMount } from 'svelte'

	let relations: { parent: string; child: string }[] = []
	let exampleQuestions: string[] = []

	onMount(async () => {
		relations = (await BikesAPIService.getRelations()) ?? []
	})
</script>

<div class="grid {$treeviewSidebarVisible ? 'grid-cols-[280px_1fr]' : ''}">
	{#if $treeviewSidebarVisible}
		<SecondaryNavigation>
			<Headline isSelected={false} on:handleClick={() => goto('/movies/movies/comments')}
				>COMMENTS</Headline
			>
			<Headline isSelected={false} on:handleClick={() => goto('/movies/movies/recommendations')}
				>RECOMMENDATIONS</Headline
			>
		</SecondaryNavigation>
	{/if}

	<div class="flex flex-col gap-4 m-6 h-[calc(100vh-6rem)]">
		<RagControls onExamples={(q) => (exampleQuestions = q)} />

		<div class="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 min-h-0 flex-1">
			<div class="overflow-y-auto">
				{#if relations.length > 0}
					<HierarchyTree {relations} />
				{:else}
					<p class="text-sm text-zinc-400">Loading...</p>
				{/if}
			</div>
			<BikeChat externalSuggestions={exampleQuestions} />
		</div>
	</div>
</div>
