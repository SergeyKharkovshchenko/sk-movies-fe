<script lang="ts">
	import { Tooltip } from 'bits-ui';

	let { children, icon, disabled = false, dataCy = '' } = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root delayDuration={0}>
		<Tooltip.Trigger>
			<button
				aria-label="Switch mode button"
				{disabled}
				class="flex items-center px-3 rounded-t-md hover:bg-primary-100 active:bg-primary-100 h-10 w-full disabled:opacity-20"
				data-cy={dataCy}
			>
				<i class="fa-solid {icon} {disabled ? 'text-gray-400!' : ''} mr-2"></i>
				<div class="">{@render children()}</div>
			</button>
		</Tooltip.Trigger>
		<Tooltip.Content side="bottom" sideOffset={3} alignOffset={35}>
			<div
				class="text-xs px-1.5 py-1 rounded-sm bg-primary-950 border border-primary-900 text-white w-auto whitespace-nowrap"
			>
				{@render children()}
			</div>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
