<script lang="ts">
	import { Dialog } from 'bits-ui';
	import Button from './Button.svelte';

	let {
		open = $bindable(false),
		title = '',
		cancelButton = 'Cancel',
		submitButton = 'Submit',
		maxWidthPercentage = '50',
		minHeightPercentage = '50',
		isSubmitDisabled = false,
		children,
		submit,
	} = $props();

	function close() {
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
		/>
		<Dialog.Content
			class="flex flex-col bg-white fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%] rounded-lg"
			style="max-width: {maxWidthPercentage}%; min-height: {minHeightPercentage}%;"
		>
			<Dialog.Title
				class="flex w-full justify-between items-center pl-8 pr-4 py-4 bg-primary-900 text-white rounded-t-md"
			>
				<span>{title}</span>
				<Dialog.Close class="text-gray-400 w-6 h-6" onclick={close}>
					<i class="fa-regular fa-circle-xmark text-2xl"></i>
				</Dialog.Close>
			</Dialog.Title>
			<div class="main-content grow">
				{@render children()}
			</div>
			<div class="flex w-full justify-end p-8 gap-4">
				<Dialog.Close class="" onclick={close}>
					<Button variant="secondary">{cancelButton}</Button>
				</Dialog.Close>
				<Dialog.Close class="" onclick={submit}>
					<div
						style={isSubmitDisabled
							? 'border: 1px solid var(--secondary-400, #9CA3AF); background: var(--Zinc-200, #E4E4E7); border-radius: 6px; display: inline-block; color:var(--secondary-400, #9CA3AF); '
							: 'border-radius: 6px; background: var(--primary-500, #00868E); display: inline-block;'}
					>
						<Button variant="primary" disabled={isSubmitDisabled}>
							{submitButton}
						</Button>
					</div>
				</Dialog.Close>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>