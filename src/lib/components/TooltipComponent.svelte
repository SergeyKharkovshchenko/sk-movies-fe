<script lang="ts">
	import { Tooltip } from 'bits-ui';

	interface TooltipProps {
		type: 'error' | 'info' | 'copy' | 'changed';
		tooltipInfo: string | { [key: string]: string } | string[];
		error?: string | string[] | null;
		onCopy?: () => void;
	}

	let { type, tooltipInfo, onCopy }: TooltipProps = $props();

	const tooltipContent = $derived.by(() => {
		if (typeof tooltipInfo === 'object') {
			if (tooltipInfo instanceof Array) {
				return tooltipInfo[0];
			}
			return Object.entries(tooltipInfo!);
		} else if (typeof tooltipInfo === 'string') {
			return tooltipInfo;
		}
	});
</script>

{#if tooltipContent}
	<Tooltip.Provider>
		<Tooltip.Root delayDuration={0}>
			<Tooltip.Trigger class="hover:bg-muted z-0">
				{#if type === 'error'}
					<i class="fa-solid fa-circle-info text-red-500"></i>
				{:else if type === 'copy'}
					<button aria-label="copy" type="button" onclick={onCopy}>
						<i class="fa-solid fa-copy text-primary-400"></i>
					</button>
				{:else if type === 'changed'}
					<i class="fa-solid fa-pen text-primary-400"></i>
				{:else if type === 'info'}
					<i class="fa-solid fa-circle-info text-primary-400"></i>
				{/if}
			</Tooltip.Trigger>
			<Tooltip.Content
				class="{type === 'error' ? 'pointer-events-none' : ''} z-10"
				align="end"
				side="bottom"
				sideOffset={8}
			>
				<div
					class="border border-zinc-200 rounded-sm bg-white text-xs px-2 py-1 shadow-xl leading-[10px] text-gray-700 w-full"
					class:text-red-500={type === 'error'}
				>
					{#if typeof tooltipContent === 'string'}
						{tooltipInfo}
					{:else}
						<div class="grid grid-cols-[40px_1fr] gap-y-1">
							{#each tooltipContent as [key, value]}
								<div class="font-bold">{key}</div>
								<div>{value}</div>
							{/each}
						</div>
					{/if}
				</div>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}
