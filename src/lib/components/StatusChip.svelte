<script lang="ts">
	let { title, icon, bg, class: className }: { title: string; icon?: string; bg: string; class?: string } = $props();
</script>

<div class="{bg} flex items-center text-white rounded-full px-3 py-1.5 w-fit {className ?? ''} text-sm font-medium">
	{#if icon}
		<i class="fa-solid mr-2 {icon}"></i>
	{/if}
	<p class="capitalize">{title}</p>
</div>
