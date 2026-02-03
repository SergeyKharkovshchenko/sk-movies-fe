<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { beforeUpdate } from 'svelte';

	interface MenuItem {
		path: string;
		img?: string;
		linktext?: string;
		icon?: string;
	}

	export let menuItem: MenuItem;
	let showLinkText = false;

	const navigate = (path: string) => {
		goto(path);
	};

	/**
	 * this checks if the current menu item has been selected and is matching the current route.
	 */
	function itemIsActive() {
		let path = menuItem.path;

		if (path !== '') {
			path = path.replace('/', '');
			return $page.url.pathname.includes(path);
		} else {
			return false;
		}
	}

	let isActive = false;

	beforeUpdate(() => {
		isActive = itemIsActive();
	});
</script>

<button
	class="
    relative h-10 cursor-pointer flex items-center justify-center
    hover:border-[3px] hover:border-primary-900 hover:bg-primary-900/30
    {isActive ? 'bg-primary-900' : ''}
    {$$restProps.class ?? ''}
  "
	on:mouseenter={() => (showLinkText = true)}
	on:mouseleave={() => (showLinkText = false)}
	on:click={() => navigate(menuItem.path)}
	class:active={isActive}
>
	<div data-cy={`sideBar-navigation-items-${menuItem.linktext}`} class="h-8 w-8 p-1.5 flex justify-center items-center">
		{#if menuItem.img}
			<img src={menuItem.img} alt="{menuItem.linktext} of a user" class="w-5 h-5 rounded-full" />
		{:else}
			<i class="fa-solid {menuItem.icon} fa-lg" />
		{/if}
	</div>

	{#if showLinkText}
		<div
			data-cy={`sideBar-navigation-tooltipValue-${menuItem.linktext}`}
			class="text-xs absolute top-1 left-12 px-1.5 py-1 rounded-sm bg-primary-950"
		>
			{menuItem.linktext}
		</div>
	{/if}
</button>
