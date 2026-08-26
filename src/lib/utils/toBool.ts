/**
 * Parses a Vite env var into a boolean. Vite env vars are always strings (or undefined when
 * unset) -- "true"/"1" (case-insensitive) is true, everything else is false, and undefined stays
 * undefined so callers can apply their own default (see src/lib/flags/index.ts's `?? false`).
 */
export function envToBool(value: string | undefined): boolean | undefined {
	if (value === undefined) return undefined;
	return value.toLowerCase() === 'true' || value === '1';
}
