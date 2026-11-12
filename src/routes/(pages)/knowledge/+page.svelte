<script lang="ts">
	import KnowledgeWizard from './components/KnowledgeWizard.svelte';
	import KnowledgeAdmin from './components/KnowledgeAdmin.svelte';
	import KnowledgeGraphView from './components/KnowledgeGraphView.svelte';
	import OntologyStudio from './components/ontology/OntologyStudio.svelte';

	let mode = $state<'ontology' | 'quick'>('ontology');
</script>

<div class="flex flex-col gap-6 m-6">
	<div class="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
		<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
			<h1 class="text-base font-semibold text-zinc-800">Knowledge Graph Builder</h1>
			<div
				class="flex overflow-hidden rounded-md border border-zinc-300 text-[11px]"
				role="tablist"
			>
				{#each [{ value: 'ontology', label: 'Ontology pipeline', title: 'Vocabulary, metadata, taxonomy and ontology you review and edit before the graph is built' }, { value: 'quick', label: 'Quick import', title: 'The original one-shot wizard' }] as const as tab (tab.value)}
					<button
						role="tab"
						aria-selected={mode === tab.value}
						title={tab.title}
						onclick={() => (mode = tab.value)}
						class="border-r border-zinc-300 px-3 py-1.5 transition-colors last:border-r-0"
						class:bg-zinc-800={mode === tab.value}
						class:text-white={mode === tab.value}
						class:text-zinc-500={mode !== tab.value}
					>
						{tab.label}
					</button>
				{/each}
			</div>
		</div>
		{#if mode === 'ontology'}
			<OntologyStudio />
		{:else}
			<KnowledgeWizard />
		{/if}
	</div>
	<KnowledgeGraphView />
	<KnowledgeAdmin />
</div>
