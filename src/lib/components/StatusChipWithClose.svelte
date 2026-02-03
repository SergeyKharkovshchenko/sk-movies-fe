<script lang="ts">
	let { title, class: className, handleCloseStatusChip } = $props();
</script>

<div class="flex items-center rounded-full px-3 py-1.5 text-sm font-medium {className}">
	<p class="capitalize mr-2 w-max">{title}</p>
	<button aria-label="Close button" onclick={handleCloseStatusChip}>
		<i class="fa-solid fa-close"></i>
	</button>
</div>
