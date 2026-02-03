import toast, { type ToastPosition, type ToastOptions } from 'svelte-hot-french-toast';
import ToastWithCloseButton from '$lib/components/ToastWithCloseButton.svelte';

interface PimToastOptions extends ToastOptions {
	position?: ToastPosition;
	style?: string;
	customMessage?: string;
	locationLink?: string;
}

const defaultOptions: PimToastOptions = {
	duration: 5000,
	position: 'bottom-start',
	style: 'max-width: fit-content;'
};

export function PimToast(opts: PimToastOptions) {
	const options = { ...defaultOptions, ...opts };
	return toast(ToastWithCloseButton, options);
}

export function PimToastSuccess(opts: PimToastOptions) {
	const options = { ...defaultOptions, ...opts };
	return toast.success(ToastWithCloseButton, options);
}
export function PimToastError(opts: PimToastOptions) {
	const options = { ...defaultOptions, ...opts };
	return toast.error(ToastWithCloseButton, options);
}
