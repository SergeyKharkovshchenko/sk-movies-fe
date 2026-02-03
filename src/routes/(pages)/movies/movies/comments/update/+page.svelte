<script lang="ts">
	import SecondaryNavigation from '$lib/components/SecondaryNavigation.svelte';
	import Update from './components/Update.svelte';
	import { treeviewSidebarVisible } from '$store/store';
	import Headline from '$lib/components/Headline.svelte';
	import { goto } from '$app/navigation';
	import HeadlineSecondary from '$lib/components/HeadlineSecondary.svelte';

</script>

<div class="grid {$treeviewSidebarVisible ? 'grid-cols-[280px_1fr]' : ''}">
	{#if $treeviewSidebarVisible}
		<SecondaryNavigation>
			<Headline isSelected={true} on:handleClick={() => goto('/movies/movies/comments/manage')}
				>COMMENTS</Headline
			>

			<HeadlineSecondary
				isSelected={false}
				handleClick={() => goto('/movies/movies/comments/manage')}
				icon="fa-file-pen"
				disabled={false}>Manage</HeadlineSecondary
			>
			<HeadlineSecondary
				isSelected={true}
				handleClick={() => goto('/movies/movies/comments/update')}
				icon="fa-sitemap"
				disabled={false}>Update</HeadlineSecondary
			>
			<Headline isSelected={false} on:handleClick={() => goto('/movies/movies/recommendations')}
				>RECOMMENDATIONS</Headline
			>
		</SecondaryNavigation>
	{/if}

	<div class="">
		<Update />
	</div>
</div>
