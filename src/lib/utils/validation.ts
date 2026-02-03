export async function validateInputToHaveOnlyNumbers(event: Event) {
	const target = event.target as HTMLInputElement;
	const styleClasses = ['border-2', 'border-red-500'];

	const start = target.selectionStart;
	const end = target.selectionEnd;
	if (!/^[0-9.,]+$/.test(target.value) && target.value) {
		target.classList.add(...styleClasses);
		setTimeout(function () {
			target.classList.remove(...styleClasses);
		}, 300);
		target.value = target.value.replace(/[^0-9.,]+/g, '');
		target.selectionStart = start !== null ? start - 1 : null;
		target.selectionEnd = end !== null ? end - 1 : null;
	}
	return event;
}
