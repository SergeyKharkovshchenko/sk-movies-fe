<script lang="ts">
	export let searchString: string;
	export let searchActive: boolean = false;
	export let theme: string;
	let isInputFocused: boolean = false;

	function handleInputFocus() {
		searchActive = false;
		isInputFocused = true;
	}

	function handleInputBlur() {
		isInputFocused = false;
	}
</script>

<!-- Searchbar -->
<div
	class="relative my-4 {theme == 'content' ? 'border-2' : 'border'} rounded-md {isInputFocused
		? 'border-amber-400'
		: 'border-zinc-200'}"
>
	<input
		type="text"
		data-cy="products-search-sidebar"
		class="h-6 w-52 outline-hidden {theme == 'content'
			? 'bg-sky-950'
			: 'bg-purple-950'} opacity-40 focus:text-gray-400 focus:opacity-100 pl-2 text-xs {isInputFocused
			? 'border-none'
			: ''}"
		placeholder="search"
		bind:value={searchString}
		on:input={() => {
			searchActive = false;
		}}
		on:focus={handleInputFocus}
		on:blur={handleInputBlur}
		on:keydown={(e) => {
			if (e.key == 'Enter') {
				searchActive = true;
			}
		}}
	/>

	<button
		on:click={() => {
			searchActive = true;
		}}
		class="absolute inset-y-0 right-0 px-2 border-l-2 {isInputFocused
			? 'bg-amber-400 border-amber-400'
			: '{theme=="content"?}"bg-sky-950":""} opacity-40 border-zinc-200'}"
		data-cy="products-search-sidebar-icon"
	>
		<i class="fa-solid fa-magnifying-glass {isInputFocused ? 'text-black' : 'text-gray-400'}" />
	</button>
</div>

<style>
</style>
