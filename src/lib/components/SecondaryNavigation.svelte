<script>
	import { treeviewSidebarVisible } from '$store/store';
</script>

<div class="bg-primary-900">
	<div class="h-[calc(100vh_-_48px)] sticky top-0 pt-8 pb-7 px-4 text-white flex flex-col gap-2">
		<button
			data-cy="products-treeview-hide-sidebar"
			on:click={() => {
				$treeviewSidebarVisible = false;
			}}
			class="absolute top-2 right-2 fa-solid fa-angle-left pl-60"
		/>
		<slot />
	</div>
</div>
