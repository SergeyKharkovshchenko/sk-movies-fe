<script lang="ts">
	import SecondaryNavigation from '$lib/components/SecondaryNavigation.svelte';
	import ComplexProperties from './components/ComplexProperties.svelte';
	import { treeviewSidebarVisible } from '$store/store';
	import Headline from '$lib/components/Headline.svelte';
	import { goto } from '$app/navigation';
</script>

<div class="grid {$treeviewSidebarVisible ? 'grid-cols-[280px_1fr]' : ''}">
	{#if $treeviewSidebarVisible}
		<SecondaryNavigation>
			<Headline isSelected={false} on:handleClick={() => goto('/movies/comments/manage')}>PROPERTY BARS</Headline
			>
			<Headline isSelected={true} on:handleClick={() => goto('/movies/comments/complexcomments')}
				>COMPLEX PROPERTIES</Headline
			>
			<Headline isSelected={false} on:handleClick={() => goto('/movies/comments/comments')}>PROPERTIES</Headline>
		</SecondaryNavigation>
	{/if}

	<div class="">
		<ComplexProperties />
	</div>
</div>
