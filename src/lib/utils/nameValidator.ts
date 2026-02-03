import { UsedNamesAPIService } from '$services/apiService';
import { debounce } from '$lib/utils/debounce';

export type NameFetcher = (name: string) => Promise<{ name?: string } | null>;

function createNameValidator(fetcher: NameFetcher, delay = 300) {
	return debounce(
		async (name: string, isEdit: boolean, originalName?: string): Promise<string | null> => {
			if (!name) return 'Name should not be empty';

			const nameRegex = /^[^ ,]+$/;
			if (!nameRegex.test(name)) {
				return "Use '-' or '_' between words, not spaces or commas.";
			}

			if (isEdit && name === originalName) return null;

			try {
				const response = await fetcher(name);
				if (response?.name) return 'This name is already taken!';
			} catch {
				return null;
			}

			return null;
		},
		delay
	);
}

export const validateName = createNameValidator(async (name: string) => {
	const response = await UsedNamesAPIService.getTakenNames(name);
	return response ? { name: response.name ? 'taken' : undefined } : null;
});
