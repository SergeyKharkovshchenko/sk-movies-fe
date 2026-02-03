export function convertToISODate(dateString: string | undefined): string {
	if (!dateString) return '';
	try {
		const [datePart, timePart] = dateString.split(' ');
		if (!datePart || !timePart) {
			throw new Error('Invalid date format: Expected DD/MM/YYYY HH:mm');
		}

		const [day, month, year] = datePart.split('/').map(Number);
		if (!day || !month || !year) {
			throw new Error('Invalid date components');
		}

		const [hours, minutes] = timePart.split(':').map(Number);
		if (isNaN(hours) || isNaN(minutes)) {
			throw new Error('Invalid time components');
		}

		const fullYear = year < 100 ? 2000 + year : year;

		const utcDate = new Date(Date.UTC(fullYear, month - 1, day, hours, minutes));
		if (isNaN(utcDate.getTime())) {
			throw new Error('Invalid date');
		}

		return utcDate.toISOString();
	} catch (error) {
		console.error('Error converting date:', error);
		return '';
	}
}
