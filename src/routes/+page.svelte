<!-- <script lang="ts">
	import Headline from '$components/Headline.svelte';
	import HeadlineSecondary from '$components/HeadlineSecondary.svelte';
	import SecondaryNavigation from '$lib/components/SecondaryNavigation.svelte';
	import { treeviewSidebarVisible } from '$store/store';
	import { goto } from '$app/navigation';
</script>

<div class="grid {$treeviewSidebarVisible ? 'grid-cols-[280px_1fr]' : ''}">
	{#if $treeviewSidebarVisible}
		<SecondaryNavigation
			><Headline isSelected={true} handleClick={() => goto('/movies/comments/manage')}
				>PROPERTY BARS</Headline
			>
			<HeadlineSecondary
				isSelected={false}
				handleClick={() => goto('/movies/comments/manage/edit')}
				icon="fa-file-pen"
				disabled={false}>Manage&Edit 111</HeadlineSecondary
			>
			<HeadlineSecondary
				isSelected={true}
				handleClick={() => goto('/movies/comments/manage/assign')}
				icon="fa-sitemap"
				disabled={false}>Assign</HeadlineSecondary
			>
			<div class="grow"></div>
			<Headline isSelected={false} handleClick={() => goto('/movies/comments/complexcomments')}
				>COMPLEX PROPERTIES</Headline
			>
			<Headline isSelected={false} handleClick={() => goto('/movies/comments/comments')}
				>PROPERTIES</Headline
			></SecondaryNavigation
		>
	{/if}

	<div class="">Home</div>
</div> -->

<script lang="ts">
	import Headline from '$components/Headline.svelte';
	import HeadlineSecondary from '$components/HeadlineSecondary.svelte';
	import SecondaryNavigation from '$lib/components/SecondaryNavigation.svelte';
	import { treeviewSidebarVisible } from '$store/store';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	onMount(() => {
		goto('/movies');
	});
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
