import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { Theme } from '$lib/constants/themes';

export const selectedLanguage = writable('en');

export function updateSelectedLanguage(value: any) {
	selectedLanguage.set(value);
}

export const currentThemeStore: Writable<Theme> = writable('content');
export const treeviewSidebarVisible = writable(true);
 export const currentRoute = writable('/');