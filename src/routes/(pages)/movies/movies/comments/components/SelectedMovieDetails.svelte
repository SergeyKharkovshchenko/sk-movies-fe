<script lang="ts">
	import ArticleMenuButton from '$lib/components/ArticleMenuButton.svelte';
	import { Tabs } from 'bits-ui';
	import AboutTheMovie from './tabViews/AboutTheMovie.svelte';
	import { selectedGenres } from '$store/genres';

	let modeTabState = $state('edit');

	function handleClose() {
		// selectedGenres.reset()
	}

	const tabClass =
		'relative top-0.25 border border-zinc-200 border-b-primary-500 rounded-t-md data-[state=active]:bg-primary-50';
</script>

<Tabs.Root
	bind:value={modeTabState}
	class="border border-zinc-200 rounded-sm shadow-md pt-4 mr-4 h-[88vh] max-h-[88vh] bg-primary-50"
>
	<div class="flex border-b-1 border-primary-500">
		<button aria-label="close" class="py-1 px-2" onclick={handleClose}>
			<i class="fa-solid fa-circle-xmark text-xl text-gray-400 font-bold hover:text-red-500"></i>
		</button>

		<Tabs.List class="gap-2">
			<Tabs.Trigger
				value="edit"
				class="{tabClass} data-[state=active]:border-primary-500 
				data-[state=active]:border-b-primary-50 border"
			>
				<ArticleMenuButton icon="fa-cube text-primary-500">About the movie</ArticleMenuButton>
			</Tabs.Trigger>
		</Tabs.List>
	</div>

	<div class="bg-red-300">
		<Tabs.Content value="edit" class="">
			<AboutTheMovie />
		</Tabs.Content>
	</div>
</Tabs.Root>
