/* eslint-disable @typescript-eslint/no-unused-vars */
type PropertyWithLabel = { label: string };

function createTextMeasurer(font: string = '14px Inter') {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');

	if (!context) {
		// If we can't get a context, gracefully degrade.
		return (_text: string) => 0;
	}

	context.font = font;
	return (text: string) => context.measureText(text).width;
}

/**
 * Returns the index of the last element that fits into the given width,
 * leaving room for the "+ 99 more" text.
 */
export function checkLastElementTillOverflow(
	texts: string[],
	maxWidth: number,
	font: string = '14px Inter',
	overflowLabel: string = '+ 99 more'
): number {
	const measureText = createTextMeasurer(font);

	const commaWidth = measureText(',');
	const elementPadding = 20;
	const overflowWidth = measureText(overflowLabel) + elementPadding;

	const availableWidth = maxWidth - overflowWidth;

	let cumulativeWidth = 0;
	let lastFittingIndex = -1; // start from -1, consider nothing fits

	for (let index = 0; index < texts.length; index++) {
		cumulativeWidth += measureText(texts[index]) + commaWidth + elementPadding;

		if (cumulativeWidth < availableWidth) {
			lastFittingIndex = index;
		} else {
			break;
		}
	}

	return lastFittingIndex;
}
