<script lang="ts">
	import ArticleMenuButton from '$lib/components/ArticleMenuButton.svelte';
	import { Tabs } from 'bits-ui';
	import UsersReviewsTabView from './UsersReviewsTabView.svelte';
	import RateTheMovieTabView from './RateTheMovieTabView.svelte';

	let modeViewState = $state('usersReviews');
	const tabClass = 'border-b-[3px] border-b-primary-200 data-[state=active]:border-b-primary-500';
</script>

<Tabs.Root bind:value={modeViewState}>
	<div class="flex items-center gap-2 bg-primary-50">
		<Tabs.List class="gap-2">
			<Tabs.Trigger value="usersReviews" class="{tabClass} ml-10">
				<ArticleMenuButton icon="fa-pen text-primary-500">Users Reviews</ArticleMenuButton>
			</Tabs.Trigger>
			<Tabs.Trigger value="rateTheMovie" class={tabClass}>
				<ArticleMenuButton icon="fa-database text-primary-500">Rate the movie</ArticleMenuButton>
			</Tabs.Trigger>
		</Tabs.List>
	</div>

	<div class="">
		<Tabs.Content value="usersReviews">
			<UsersReviewsTabView />
		</Tabs.Content>
		<Tabs.Content value="rateTheMovie"><RateTheMovieTabView /></Tabs.Content>
	</div>
</Tabs.Root>
