export function envToBool(value: string) {
	if (typeof value !== 'string') return false;

	return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}
