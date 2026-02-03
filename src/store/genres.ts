import { writable, type Writable } from 'svelte/store';

export const selectedGenres: Writable<any> = writable('all');

function reset() {
	selectedGenres.set({ key: '' });
}

export const genresStore = {
	reset
};
