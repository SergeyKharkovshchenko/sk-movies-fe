import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export function persistentStore<T>(key: string, initialValue: T): Writable<T> {
	const stored =
		typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;

	const value: T = stored !== null ? (JSON.parse(stored) as T) : initialValue;

	const store = writable<T>(value);

	store.subscribe((current) => {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(key, JSON.stringify(current));
		}
	});

	return store;
}
