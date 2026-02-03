export function buildQuery(params: Record<string, any>): string {
	const search = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value === '' || value === null || value === undefined) continue;

		// Handle arrays properly (e.g., ?tags=one&tags=two)
		if (Array.isArray(value)) {
			value.forEach((v) => {
				if (v !== '' && v != null) search.append(key, String(v));
			});
		} else {
			search.append(key, String(value));
		}
	}

	return search.toString();
}
