export function getTooltipText(label: string, error: string | string[] | null | undefined): string {
	let baseTooltip = '';
	switch (label) {
		case 'Release date':
			baseTooltip = 'Select the release date';
			break;
		default:
			baseTooltip = '';
	}
	return error ? `${baseTooltip}\n${Array.isArray(error) ? error[0] || '' : error || ''}` : baseTooltip;
}
