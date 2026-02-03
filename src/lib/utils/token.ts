import { browser } from '$app/environment';

export async function fetchAuthToken() {
	if (!browser) return;
	const token = localStorage.getItem('token');

	if (token) {
		return token;
	}

	return 123
	const response = await fetch('/api/getToken', { method: 'GET' });
	// handle faulty response from getToken
	try {
		const data = await response.json();
		localStorage.setItem('token', data.token);
		return data.token;
	} catch (error) {
		window.location.reload();
	}
}
