<script lang="ts">
	import SecondaryNavigation from '$lib/components/SecondaryNavigation.svelte';
	import MoviesStartPage from './components/MoviesStartPage.svelte';
	import { treeviewSidebarVisible } from '$store/store';
	import Headline from '$lib/components/Headline.svelte';
	import { goto } from '$app/navigation';
	import HeadlineSecondary from '$components/HeadlineSecondary.svelte';
</script>

<div class="grid {$treeviewSidebarVisible ? 'grid-cols-[280px_1fr]' : ''}">
	{#if $treeviewSidebarVisible}
		<SecondaryNavigation>
			<Headline isSelected={true} on:handleClick={() => goto('/movies/movies/comments/')}
				>COMMENTS</Headline
			>

			<Headline isSelected={false} on:handleClick={() => goto('/movies/movies/recommendations')}
				>RECOMMENDATIONS</Headline
			>
		</SecondaryNavigation>
	{/if}

	<div class="">
		<MoviesStartPage />
	</div>
</div>
