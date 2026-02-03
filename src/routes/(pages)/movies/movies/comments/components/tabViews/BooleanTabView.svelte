<!-- <script lang="ts">
	import DropdownSelector from '$lib/components/DropdownSelector.svelte';
	import { getLanguages } from 'services/apiService';
	import { currentLanguage } from 'store/language';
	import { onMount } from 'svelte';

	let { onTooltipLanguageSelection } = $props();

	let availableLanguages = $state([]);
	let labelOptions: any = $state([]);
	let descriptionTextValue: string = $state('');
	let tooltipTextValue: string = $state('');

	onMount(async () => {
		availableLanguages = await getLanguages();
		labelOptions = availableLanguages.map((lang: any) => ({ text: lang.name, value: lang.name }));
	});

</script>

<label class="mb-1" for="genre">Description :</label>
<textarea
	id="genre"
	name="description"
	value={descriptionTextValue}
	class="w-full h-[172px] bg-white border border-gray-300 rounded-md p-2 peer focus:outline-primary-300"
	placeholder=" "
></textarea>

<div class="my-4 flex justify-end">
	<DropdownSelector
		class="text-center w-[100px]"
		selected={{ text: $currentLanguage, value: $currentLanguage }}
		name='tooltipLanguage'
		options={labelOptions}
		onChange={onTooltipLanguageSelection}
	/>
</div>

<label class="mb-1" for="tooltip">Tooltip :</label>
<textarea
	id="tooltip"
	name="tooltipText"
	value={tooltipTextValue}
	class="w-full h-[172px] bg-white border border-gray-300 rounded-md p-2 peer focus:outline-primary-300"
	placeholder=" "
></textarea> -->
