<script lang="ts">
	import Headline from '$components/Headline.svelte';
	import HeadlineSecondary from '$components/HeadlineSecondary.svelte';
	import SecondaryNavigation from '$lib/components/SecondaryNavigation.svelte';
	import { treeviewSidebarVisible } from '$store/store';
	import { goto } from '$app/navigation';
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

	<div class="m-8">Movies Home</div>
</div>
