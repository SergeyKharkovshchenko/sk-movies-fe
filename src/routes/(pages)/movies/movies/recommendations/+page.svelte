<script lang="ts">
	import SecondaryNavigation from '$lib/components/SecondaryNavigation.svelte';
	import Recommendations from './components/Recommendations.svelte';
	import { treeviewSidebarVisible } from '$store/store';
	import Headline from '$lib/components/Headline.svelte';
	import { goto } from '$app/navigation';
</script>

<div class="grid {$treeviewSidebarVisible ? 'grid-cols-[280px_1fr]' : ''}">
	{#if $treeviewSidebarVisible}
		<SecondaryNavigation>
			<Headline isSelected={false} on:handleClick={() => goto('/movies/movies/comments')}
				>COMMENTS</Headline
			>
			<Headline isSelected={true} on:handleClick={() => goto('/movies/movies/recommendations')}
				>RECOMMENDATIONS</Headline
			>
		</SecondaryNavigation>
	{/if}

	<div class="">
		<Recommendations />
	</div>
</div>
