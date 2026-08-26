<!--
	The real tree-rendering implementation is dormant/unfinished (was previously commented out
	wholesale, which meant this component exported zero props and silently collapsed every prop
	ProductHierarchy.svelte passes it to `never` in the type checker). This stub declares the real
	prop shape so that usage type-checks honestly, without reviving unverified logic. Renders
	nothing, same as before -- no visible behavior change. The previous implementation is in git
	history if this gets picked back up.
-->
<script lang="ts">
	import type { ProductHierarchyNode } from '$lib/interfaces/ProductHierarchyNode';

	export let tree: ProductHierarchyNode;
	export let expandAll: boolean;
	export let expanded: boolean;
	export let showCheckboxes: boolean;
	export let searchString: string;
	export let searchActive: boolean = false;
	export let showNoResultsFoundMessage: boolean;
	export let productGroup: string | undefined = '';
	export let hierarchyPath: string = '';
</script>
