<script lang="ts">
	import { currentThemeStore, treeviewSidebarVisible } from '$store/store';
	import SidebarMenuItem from './SidebarMenuItem.svelte';

	let navigationItems = {
		content: {
			menuItemsTop: [
				// { linktext: 'Profile', img: '/img/profile.jpeg', path: '' },
				{ linktext: 'Home', icon: 'fa-house', path: '' },
				{ linktext: 'Product', icon: 'fa-box-archive', path: '/maintenance/products' },
				{ linktext: 'Texts', icon: 'fa-envelope-open-text', path: '' },
				{ linktext: 'Images', icon: 'fa-image', path: '' },
				{ linktext: 'Relations', icon: 'fa-object-ungroup', path: '' }
			],
			menuItemsBottom: []
		},
		movies: {
			menuItemsTop: [
				{ linktext: 'Users', icon: 'fa-user-tie', path: '/movies/users' },
				{ linktext: 'Movies', icon: 'fa-film', path: '/movies/movies' },
			],
			menuItemsBottom: []
		},
		publications: {
			menuItemsTop: [
				{ linktext: 'movies', icon: 'fa-user-tie', path: '' },
				{ linktext: 'Dashboard', icon: 'fa-chart-pie', path: '/dashboard' },
				{ linktext: 'Publications', icon: 'fa-clipboard', path: '/publications' },
				{ linktext: 'Channels', icon: 'fa-network-wired', path: '/channels' }
			],
			menuItemsBottom: []
		},
		import: {
			menuItemsTop: [{ linktext: 'Import', icon: 'fa-cloud-arrow-down', path: '' }],
			menuItemsBottom: []
		}
	};
</script>

<!-- main menu -->
<nav class="w-16 bg-primary-950 h-full">
	<div class="sticky h-[calc(100vh_-_50px)] top-0 z-10">
		<div class="flex flex-col gap-y-2 text-white text-xs justify-center">
			{#if !$treeviewSidebarVisible}
				<button
					data-cy="products-treeview-show-sidebar"
					on:click={() => {
						treeviewSidebarVisible.set(true);
					}}
					class="fa-solid fa-angle-right fa-lg mt-2.5"
				/>
			{:else}
				<div class="h-[11px]" />
			{/if}
			{#each navigationItems[$currentThemeStore].menuItemsTop as menuItem}
				<SidebarMenuItem {menuItem} />
			{/each}
		</div>
	</div>
</nav>
