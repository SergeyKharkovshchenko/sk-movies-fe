<script lang="ts">
	import SecondaryNavigation from '$lib/components/SecondaryNavigation.svelte';
	import { treeviewSidebarVisible } from '$store/store';
	import Headline from '$lib/components/Headline.svelte';
	import { goto } from '$app/navigation';
	import HeadlineSecondary from '$lib/components/HeadlineSecondary.svelte';
	import Movies from './components/Movies.svelte';

	let selectedDatatype: string = $state('all');

	const propertiesFilters = [
		{ title: 'All genres', icon: 'fa-film', genre: 'all' },
		{ title: 'Comedy', icon: 'fa-film', genre: 'Comedy' },
		{ title: 'Drama', icon: 'fa-film', genre: 'Drama' },
		{ title: 'Thriller', icon: 'fa-film', genre: 'Thriller' }
	];
</script>

<div class="grid {$treeviewSidebarVisible ? 'grid-cols-[280px_1fr]' : ''}">
	{#if $treeviewSidebarVisible}
		<SecondaryNavigation>
			<Headline isSelected={true} on:handleClick={() => goto('/movies/movies/comments/')}
				>COMMENTS</Headline
			>

			{#each propertiesFilters as filter}
				<HeadlineSecondary
					isSelected={filter.genre === selectedDatatype}
					handleClick={() => {
						selectedDatatype = filter.genre;
					}}
					icon={filter.icon}
					disabled={false}>{filter.title}</HeadlineSecondary
				>
			{/each}

			<Headline isSelected={false} on:handleClick={() => goto('/movies/movies/recommendations')}
				>RECOMMENDATIONS</Headline
			>
		</SecondaryNavigation>
	{/if}

	<div class="">
		<Movies />
	</div>
</div>
