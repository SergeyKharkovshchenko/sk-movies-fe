<script lang="ts">
	import { fade, scale } from 'svelte/transition'

	type Width = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

	let {
		open = $bindable(false),
		title = '',
		width = 'md' as Width,
		onclose
	}: {
		open?: boolean
		title?: string
		width?: Width
		onclose?: () => void
	} = $props()

	const widthMap: Record<Width, string> = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		'2xl': 'max-w-2xl'
	}

	const reducedMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

	let previousFocus: HTMLElement | null = null

	function close() {
		open = false
		onclose?.()
		previousFocus?.focus()
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) close()
	}

	function trapFocus(node: HTMLElement) {
		previousFocus = document.activeElement as HTMLElement

		const getFocusable = () =>
			Array.from(
				node.querySelectorAll<HTMLElement>(
					'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
				)
			)

		// Focus first focusable element
		const focusable = getFocusable()
		focusable[0]?.focus()

		function onKeydown(e: KeyboardEvent) {
			if (e.key !== 'Tab') return
			const items = getFocusable()
			const first = items[0]
			const last = items[items.length - 1]
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault()
				last?.focus()
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault()
				first?.focus()
			}
		}

		node.addEventListener('keydown', onKeydown)
		return {
			destroy() {
				node.removeEventListener('keydown', onKeydown)
			}
		}
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && close()} />

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex cursor-default select-none items-center justify-center p-4"
		onclick={handleBackdropClick}
		transition:fade={{ duration: reducedMotion ? 0 : 150 }}
	>
		<!-- Semi-transparent backdrop -->
		<div class="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true"></div>

		<!-- Modal panel -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? 'modal-title' : undefined}
			class="relative z-10 flex max-h-[90vh] w-full flex-col {widthMap[width]} rounded-xl bg-white shadow-2xl ring-1 ring-black/5"
			use:trapFocus
			transition:scale={{ duration: reducedMotion ? 0 : 200, start: 0.95 }}
		>
			<!-- Header -->
			{#if title}
				<div class="flex shrink-0 items-start justify-between border-b border-zinc-100 px-6 py-4">
					<h2 id="modal-title" class="mr-4 text-lg font-semibold text-zinc-900">{title}</h2>
					<button
						class="mt-0.5 ml-0 flex h-11 w-11 shrink-0 -mr-2 items-center justify-center rounded-lg text-zinc-500
						       transition-colors hover:bg-zinc-100 hover:text-zinc-700
						       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
						aria-label="Close modal"
						onclick={close}
					>
						<i class="fa-solid fa-xmark text-sm"></i>
					</button>
				</div>
			{/if}

			<!-- Body -->
			<div class="grow overflow-y-auto px-6 py-5 text-sm text-zinc-700">
				<slot />
			</div>

			<!-- Footer -->
			{#if true}
				<div class="flex shrink-0 items-center justify-end gap-3 border-t border-zinc-100 px-6 py-4">
					<slot name="footer" />
				</div>
			{/if}
		</div>
	</div>
{/if}
