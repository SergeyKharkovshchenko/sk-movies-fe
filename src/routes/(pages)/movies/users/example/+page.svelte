<script lang="ts">
	import SecondaryNavigation from '$lib/components/SecondaryNavigation.svelte';
	import { treeviewSidebarVisible } from '$store/store';
	import Headline from '$lib/components/Headline.svelte';
	import { goto } from '$app/navigation';
</script>

<div class="grid {$treeviewSidebarVisible ? 'grid-cols-[280px_1fr]' : ''}">
	{#if $treeviewSidebarVisible}
		<SecondaryNavigation>
			<Headline isSelected={false} on:handleClick={() => goto('/movies/users/manage')}
				>RATINGS BY USERS</Headline
			>
			<Headline isSelected={false} on:handleClick={() => goto('/movies/users/thirdparty')}
				>3rd PARTY AUTH</Headline
			>
			<Headline isSelected={false} on:handleClick={() => goto('/movies/users/example')}
				>EXAMPLE</Headline
			>
		</SecondaryNavigation>
	{/if}

	<div class="">
		Example
	</div>
</div>
