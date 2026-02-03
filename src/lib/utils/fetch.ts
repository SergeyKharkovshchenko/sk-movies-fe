import { get, writable } from 'svelte/store';
import { fetchAuthToken } from './token';

export enum FetchMethods {
	HEAD = 'HEAD',
	OPTIONS = 'OPTIONS',
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	PATCH = 'PATCH',
	DELETE = 'DELETE'
}

const fetchRetry = writable(0);
type FetchResponseType = 'json' | 'blob';

export async function handleFetch(
	url: string | URL,
	method: string,
	headers = {},
	body?: unknown,
	responseType: FetchResponseType = 'json'
) {
	const token = await fetchAuthToken();

	try {
		const response = await fetch(url.toString(), {
			method,
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json',
				Authorization: token,
				...headers
			}
		});

		if (response.status === 401) {
			fetchRetry.update((r) => r + 1);
			localStorage.removeItem('token');

			if (get(fetchRetry) > 3) {
				// full page refresh when token is not valid after 3 tries
				window.location.reload();
			}

			return handleFetch(url, method, headers, body);
		}

		fetchRetry.set(0);

		try {
			if (response.status === 204) {
				return { status: response.status, ok: response.ok };
			}

			if (responseType == 'blob') {
				return await response?.blob();
			}
			return await response?.json();
		} catch (error) {
			console.error(`Empty body encountered on [${response.status}] ${response.url} (${error})`);
			return {};
		}
	} catch (error) {
		console.error('[handleFetch] Error: ', error);
	}
}
