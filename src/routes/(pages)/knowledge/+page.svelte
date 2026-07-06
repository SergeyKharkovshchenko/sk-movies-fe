<script lang="ts">
	import KnowledgeWizard from './components/KnowledgeWizard.svelte'
	import KnowledgeAdmin from './components/KnowledgeAdmin.svelte'
</script>

<div class="flex flex-col gap-6 m-6">
	<div class="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
		<h1 class="text-base font-semibold text-zinc-800 mb-5">Knowledge Graph Builder</h1>
		<KnowledgeWizard />
	</div>
	<KnowledgeAdmin />
</div>
