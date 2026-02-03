/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="svelte" />
// this is needed to make consider and finalize events available in Svelte component
//src\routes\(pages)\movies\comments\manage\components\SelectedPropertBarCategoryTreeview.svelte
declare global {
	namespace svelteHTML {
		interface HTMLAttributes<T> {
			/** Fired when a potential drop target is hovered */
			onconsider?: (event: CustomEvent<any>) => void;
			/** Fired when a drag is dropped and finalized */
			onfinalize?: (event: CustomEvent<any>) => void;
		}
	}
}

export {};
