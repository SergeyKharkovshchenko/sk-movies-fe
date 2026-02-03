<script lang="ts">
	let { submit } = $props();

	let commentText = $state('');
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	let isValid = $state(true);
	$effect(() => {
		isValid = commentText.trim().length >= 3 && commentText.trim().length <= 500;
	});

	async function handleSubmit() {
		if (!isValid) {
			error = 'Комментарий должен быть от 3 до 500 символов';
			return;
		}

		isSubmitting = true;
		error = null;
		submit(commentText.trim());
		isSubmitting = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && isValid && !isSubmitting) {
			e.preventDefault();
			handleSubmit();
		}
	}
</script>

<div class="max-w-2xl mx-auto p-4 space-y-4">
	<div class="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 p-6">
		<textarea
			bind:value={commentText}
			class="w-full p-4 border-2 rounded-xl resize-vertical min-h-[80px] focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 text-base leading-relaxed placeholder-gray-500 font-medium"
			class:border-red-400={error || !isValid}
			class:bg-red-50={error || !isValid}
			class:opacity-70={isSubmitting}
			placeholder="Share a comment..."
			maxlength="500"
			disabled={isSubmitting}
			onkeydown={handleKeydown}
		></textarea>

		<div class="flex items-center justify-between pt-3">
			<span class="text-sm font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
				{commentText.length}/500
			</span>

			<button
				class="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-4 focus:ring-blue-500/30"
				class:pointer-events-none={!isValid || isSubmitting}
				onclick={handleSubmit}
			>
				{#if isSubmitting}
					<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					<span>sending...</span>
				{:else}
					<span>Submit</span>
					<svg
						class="w-5 h-5 group-hover:translate-x-1 transition-transform"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				{/if}
			</button>
		</div>
	</div>

	{#if error}
		<div
			class="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm"
		>
			<span class="text-red-800 font-medium">{error}</span>
			<button
				class="text-red-500 hover:text-red-700 font-bold text-xl p-1 -m-1 rounded-full hover:bg-red-100 transition-colors"
				onclick={() => (error = null)}
			>
				Submit
			</button>
		</div>
	{/if}
</div>
