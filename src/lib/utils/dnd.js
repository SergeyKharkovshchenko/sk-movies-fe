/* eslint-env browser */
// solution is based on
// https://www.youtube.com/watch?v=lTDKhj83tec&t=93s
// https://www.sveltelab.dev/xzz3zkyjzwe6kfk

/**
 * @param {any} node
 * @param {any} data
 */
export function draggable (node, data) {
  let state = data

  node.draggable = true
  node.style.cursor = 'grab'

  /**
   * @param {any} e
   */
  function handleDragstart (e) {
    if (!e.dataTransfer) return
    e.dataTransfer.setData('text/plain', state)
  }

  node.addEventListener('dragstart', handleDragstart)

  return {
    /**
     * @param {any} data
     */
    update (data) {
      state = data
    },

    destroy () {
      node.removeEventListener('dragstart', handleDragstart)
    }
  }
}

/**
 * @param {any} node
 * @param {any} options
 */
export function dropzone (node, options) {
  let state = {
    dropEffect: 'move',
    dragover_class: 'droppable',
    ...options
  }

  /**
   * @param {any} e
   */
  function handleDragenter (e) {
    if (!(e.target instanceof HTMLElement)) return
    e.target.classList.add(state.dragover_class)
  }

  /**
   * @param {any} e
   */
  function handleDragleave (e) {
    if (!(e.target instanceof HTMLElement)) return
    e.target.classList.remove(state.dragover_class)
  }

  /**
   * @param {any} e
   */
  function handleDragover (e) {
    e.preventDefault()
    if (!e.dataTransfer) return
    e.dataTransfer.dropEffect = state.dropEffect
  }

  /**
   * @param {any} e
   */
  function handleDrop (e) {
    e.preventDefault()
    if (!e.dataTransfer) return
    const data = e.dataTransfer.getData('text/plain')
    if (!(e.target instanceof HTMLElement)) return
    e.target.classList.remove(state.dragover_class)
    state.on_dropzone(data, e)
  }

  node.addEventListener('dragenter', handleDragenter)
  node.addEventListener('dragleave', handleDragleave)
  node.addEventListener('dragover', handleDragover)
  node.addEventListener('drop', handleDrop)

  return {
    /**
     * @param {any} options
     */
    update (options) {
      state = {
        dropEffect: 'move',
        dragover_class: 'droppable',
        ...options
      }
    },

    destroy () {
      node.removeEventListener('dragenter', handleDragenter)
      node.removeEventListener('dragleave', handleDragleave)
      node.removeEventListener('dragover', handleDragover)
      node.removeEventListener('drop', handleDrop)
    }
  }
}
