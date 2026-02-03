import { get, writable } from 'svelte/store';
import { dndzone, SOURCES, TRIGGERS } from 'svelte-dnd-action';

//TODO - make work if the zone is defined and handle isn't or show clear error (?)
const drag = writable(true);

export function dragHandleZone(node: HTMLElement, options: any) {
	let currentOptions = options;
	const zone = dndzone(node, {
		...currentOptions,
		dragDisabled: true
	});

	drag.subscribe((disabled) => {
		if (zone && typeof zone.update === 'function') {
			zone.update({
				...currentOptions,
				dragDisabled: disabled
			});
		}
	});
	function handleConsider(e: Event) {
		const detail = (e as CustomEvent<{ info: { source: string; trigger: string } }>).detail;
		const {
			info: { source, trigger }
		} = detail;
		// Ensure dragging is stopped on drag finish via keyboard
		if (source === SOURCES.KEYBOARD && trigger === TRIGGERS.DRAG_STOPPED) {
			drag.set(true);
		}
	}

	function handleFinalize(e: Event) {
		const detail = (e as CustomEvent<{ info: { source: string } }>).detail;
		const {
			info: { source }
		} = detail;
		// Ensure dragging is stopped on drag finish via pointer (mouse, touch)
		if (source === SOURCES.POINTER) {
			drag.set(true);
		}
	}

	node.addEventListener('considerEvList', handleConsider as EventListener);
	node.addEventListener('finalizeEvList', handleFinalize as EventListener);

	return {
		update: (newOptions: unknown) => {
			currentOptions = newOptions;
			if (zone && typeof zone.update === 'function') {
				zone.update({
					...currentOptions,
					dragDisabled: get(drag)
				});
			}
		},
		destroy: () => {
			node.removeEventListener('considerEvList', handleConsider as EventListener);
			node.removeEventListener('finalizeEvList', handleFinalize as EventListener);
		}
	};
}

export function dragHandle(node: HTMLElement) {
	function startDrag(e: MouseEvent | TouchEvent) {
		// preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
		e.preventDefault();
		drag.set(false);
	}
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') drag.set(false);
	}

	drag.subscribe((disabled) => {
		node.tabIndex = disabled ? 0 : -1;
		node.style.cursor = disabled ? 'grab' : 'grabbing';
	});

	node.addEventListener('mousedown', startDrag);
	node.addEventListener('touchstart', startDrag);
	node.addEventListener('keydown', handleKeyDown);
	return {
		update: () => {},
		destroy: () => {
			node.removeEventListener('mousedown', startDrag);
			node.removeEventListener('touchstart', startDrag);
			node.removeEventListener('keydown', handleKeyDown);
		}
	};
}
