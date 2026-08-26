import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { Theme } from '$lib/constants/themes';
import type { ProductHierarchyNode } from '$lib/interfaces/ProductHierarchyNode';

export const selectedLanguage = writable('en');

export function updateSelectedLanguage(value: any) {
	selectedLanguage.set(value);
}

export const currentThemeStore: Writable<Theme> = writable('content');
export const treeviewSidebarVisible = writable(true);
export const currentRoute = writable('/');

// Holds the last-fetched product hierarchy tree, tagged with the language it was fetched in
// (see ProductHierarchy.svelte's fetchProductHierarchy, which re-fetches on language change by
// comparing against this field) -- undefined until the first fetch resolves.
export const hierarchyStore: Writable<ProductHierarchyNode | undefined> = writable(undefined);
