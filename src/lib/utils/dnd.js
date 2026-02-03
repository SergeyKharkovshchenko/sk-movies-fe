// solution is based on
// https://www.youtube.com/watch?v=lTDKhj83tec&t=93s
// https://www.sveltelab.dev/xzz3zkyjzwe6kfk

/**
 * @param {any} node
 * @param {any} data
 */
export function draggable(node, data) {
	let state = data;

	node.draggable = true;
	node.style.cursor = 'grab';

	/**
	 * @param {any} e
	 */
	function handle_dragstart(e) {
		if (!e.dataTransfer) return;
		e.dataTransfer.setData('text/plain', state);
	}

	node.addEventListener('dragstart', handle_dragstart);

	return {
		/**
		 * @param {any} data
		 */
		update(data) {
			state = data;
		},

		destroy() {
			node.removeEventListener('dragstart', handle_dragstart);
		}
	};
}

/**
 * @param {any} node
 * @param {any} options
 */
export function dropzone(node, options) {
	let state = {
		dropEffect: 'move',
		dragover_class: 'droppable',
		...options
	};

	/**
	 * @param {any} e
	 */
	function handle_dragenter(e) {
		if (!(e.target instanceof HTMLElement)) return;
		e.target.classList.add(state.dragover_class);
	}

	/**
	 * @param {any} e
	 */
	function handle_dragleave(e) {
		if (!(e.target instanceof HTMLElement)) return;
		e.target.classList.remove(state.dragover_class);
	}

	/**
	 * @param {any} e
	 */
	function handle_dragover(e) {
		e.preventDefault();
		if (!e.dataTransfer) return;
		e.dataTransfer.dropEffect = state.dropEffect;
	}

	/**
	 * @param {any} e
	 */
	function handle_drop(e) {
		e.preventDefault();
		if (!e.dataTransfer) return;
		const data = e.dataTransfer.getData('text/plain');
		if (!(e.target instanceof HTMLElement)) return;
		e.target.classList.remove(state.dragover_class);
		state.on_dropzone(data, e);
	}

	node.addEventListener('dragenter', handle_dragenter);
	node.addEventListener('dragleave', handle_dragleave);
	node.addEventListener('dragover', handle_dragover);
	node.addEventListener('drop', handle_drop);

	return {
		/**
		 * @param {any} options
		 */
		update(options) {
			state = {
				dropEffect: 'move',
				dragover_class: 'droppable',
				...options
			};
		},

		destroy() {
			node.removeEventListener('dragenter', handle_dragenter);
			node.removeEventListener('dragleave', handle_dragleave);
			node.removeEventListener('dragover', handle_dragover);
			node.removeEventListener('drop', handle_drop);
		}
	};
}
