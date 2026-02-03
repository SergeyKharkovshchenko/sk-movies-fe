export function debounce<T extends (...args: any[]) => Promise<any>>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
	let timeout: NodeJS.Timeout | null = null;

	return (...args: Parameters<T>): Promise<ReturnType<T>> => {
		return new Promise((resolve) => {
			if (timeout) {
				clearTimeout(timeout);
			}
			timeout = setTimeout(async () => {
				const result = await fn(...args);
				resolve(result);
			}, delay);
		});
	};
}
