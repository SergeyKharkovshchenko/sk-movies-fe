<script lang="ts">
	import KnowledgeChat from './KnowledgeChat.svelte';

	let { label = '' }: { label?: string } = $props();
	let open = $state(false);
</script>

<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white text-xs">
	<button
		onclick={() => (open = !open)}
		aria-expanded={open}
		class="flex w-full items-center justify-between bg-zinc-50 px-4 py-3 text-left transition-colors hover:bg-zinc-100"
	>
		<span class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Chat</span>
		<svg
			class="h-3.5 w-3.5 text-zinc-400 transition-transform"
			class:rotate-180={open}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if open}
		<!-- mounted only while open, so it starts on the label currently set in the builder -->
		<div class="h-[75vh] p-3">
			<KnowledgeChat initialLabel={label.trim() || undefined} />
		</div>
	{/if}
</div>
