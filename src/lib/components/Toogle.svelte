<script lang="ts">
	import { Switch } from 'bits-ui';
	let { checked = $bindable(false), disabled = false } = $props();
</script>

<Switch.Root
	name="toggle"
	bind:checked
	class="data-[state=checked]:bg-primary-500 data-[state=unchecked]:bg-primary-400 focus-visible:outline-hidden inline-flex h-[24px] w-[42px] cursor-pointer items-center rounded-full px-[3px] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 {disabled
		? 'opacity-50 cursor-not-allowed'
		: ''}"
	{disabled}
>
	<Switch.Thumb
		class="bg-white pointer-events-none block size-[20px] rounded-full transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
	/>
</Switch.Root>
