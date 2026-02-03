import { browser } from '$app/environment';
import type { Language } from '$lib/interfaces';
import { derived, get, writable } from 'svelte/store';

/**
 * Current language local storage
 */

export const DEFAULT_LANGUAGE = 'EN';
export const LANGUAGE_STORAGE_KEY = 'language';

const initLanguage = browser
	? (localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? DEFAULT_LANGUAGE)
	: DEFAULT_LANGUAGE;

const createLanguageStore = () => {
	const storedCurrentLanguage = writable(initLanguage);

	// update localStorage
	storedCurrentLanguage.subscribe((value) => {
		if (browser) {
			localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
		}
	});

	return storedCurrentLanguage;
};

export const currentLanguage = createLanguageStore();

/**
 * Languages list
 */

export const languages = writable([]);

async function fetchLanguages(force = false) {
	const languagesSet: any = [
		{
			id: '1',
			name: 'EN',
			key: 'EN'
		},
		{
			id: '2',
			name: 'DE',
			key: 'DE'
		}
	];

	if (force || !get(languages).length) {
		languages.set(languagesSet);
	}
}

export const languagesOptions = derived(languages, (languages) =>
	languages.map((lang: Language) => ({ text: lang.name, value: lang.key }))
);
export const languagesStore = {
	subscribe: languages.subscribe,
	set: languages.set,
	update: languages.update,
	fetchLanguages
};
