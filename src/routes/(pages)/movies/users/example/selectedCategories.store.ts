import { writable, type Writable } from 'svelte/store';

const _selectedCategories: Writable<any[]> = writable([]);

export const selectedCategories = {
	subscribe: _selectedCategories.subscribe,
	set: _selectedCategories.set,
	update: _selectedCategories.update,
	add: (article: any) => _selectedCategories.update((articles) => [article, ...articles]),
	remove: (article: any) => _selectedCategories.update((articles) => articles.filter((a) => a.id !== article.id)),
	clear: () => _selectedCategories.set([])
};
