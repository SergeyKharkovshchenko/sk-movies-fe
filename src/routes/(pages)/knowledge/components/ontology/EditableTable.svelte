<script lang="ts" generics="Row extends object">
	import { parseTags, type Column } from '$lib/utils/ontology';

	let {
		rows = $bindable(),
		columns,
		blank,
		addLabel = 'Add row',
		caption = '',
		onchange
	}: {
		rows: Row[];
		columns: Column<Row>[];
		blank: () => Row;
		addLabel?: string;
		caption?: string;
		onchange?: () => void;
	} = $props();

	const listId = `list-${Math.random().toString(36).slice(2)}`;

	function cell(row: Row, key: string): unknown {
		return (row as Record<string, unknown>)[key];
	}

	function setCell(row: Row, key: string, value: unknown) {
		(row as Record<string, unknown>)[key] = value;
		onchange?.();
	}

	function text(row: Row, key: string): string {
		const v = cell(row, key);
		return Array.isArray(v) ? v.join(', ') : String(v ?? '');
	}

	function remove(index: number) {
		rows = rows.filter((_, i) => i !== index);
		onchange?.();
	}

	function add() {
		rows = [...rows, blank()];
		onchange?.();
	}

	const inputCls =
		'w-full rounded border border-zinc-300 bg-white px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-500';
</script>

<div class="space-y-2">
	{#if caption}
		<p class="text-[11px] font-medium text-zinc-500">{caption}</p>
	{/if}
	<div class="max-h-96 overflow-auto rounded-md border border-zinc-200">
		<table class="w-full min-w-[40rem] border-collapse text-xs">
			<thead class="sticky top-0 bg-zinc-50 text-left text-zinc-500">
				<tr>
					{#each columns as col (col.key)}
						<th class="px-2 py-1.5 font-medium" style={col.width ? `width: ${col.width}` : ''}
							>{col.label}</th
						>
					{/each}
					<th class="w-8 px-1"><span class="sr-only">Remove</span></th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row, i (i)}
					<tr class="border-t border-zinc-100 align-top">
						{#each columns as col (col.key)}
							{@const locked = col.locked?.(row) ?? false}
							<td class="px-1.5 py-1">
								{#if col.kind === 'tags'}
									<input
										class={inputCls}
										value={text(row, col.key)}
										placeholder={col.placeholder ?? 'comma separated'}
										aria-label={col.label}
										disabled={locked}
										onchange={(e) => setCell(row, col.key, parseTags(e.currentTarget.value))}
									/>
								{:else if col.kind === 'select'}
									<select
										class={inputCls}
										value={text(row, col.key)}
										aria-label={col.label}
										disabled={locked}
										onchange={(e) => setCell(row, col.key, e.currentTarget.value)}
									>
										{#if !col.options?.includes(text(row, col.key))}
											<option value={text(row, col.key)}>{text(row, col.key) || '—'}</option>
										{/if}
										{#each col.options ?? [] as opt (opt)}
											<option value={opt}>{opt}</option>
										{/each}
									</select>
								{:else if col.kind === 'checkbox'}
									<input
										type="checkbox"
										checked={Boolean(cell(row, col.key))}
										aria-label={col.label}
										disabled={locked}
										onchange={(e) => setCell(row, col.key, e.currentTarget.checked)}
									/>
								{:else if col.kind === 'textarea'}
									<textarea
										class="{inputCls} min-h-[2rem]"
										rows="1"
										value={text(row, col.key)}
										aria-label={col.label}
										disabled={locked}
										placeholder={col.placeholder ?? ''}
										oninput={(e) => setCell(row, col.key, e.currentTarget.value)}
									></textarea>
								{:else}
									<input
										class={inputCls}
										value={text(row, col.key)}
										aria-label={col.label}
										disabled={locked}
										placeholder={col.placeholder ?? ''}
										list={col.options ? `${listId}-${col.key}` : undefined}
										oninput={(e) => setCell(row, col.key, e.currentTarget.value)}
									/>
									{#if col.options}
										<datalist id="{listId}-{col.key}">
											{#each col.options as opt (opt)}
												<option value={opt}></option>
											{/each}
										</datalist>
									{/if}
								{/if}
							</td>
						{/each}
						<td class="px-1 py-1 text-center">
							<button
								type="button"
								class="text-zinc-400 hover:text-red-600"
								aria-label="Remove row"
								title="Remove row"
								onclick={() => remove(i)}>✕</button
							>
						</td>
					</tr>
				{/each}
				{#if rows.length === 0}
					<tr>
						<td colspan={columns.length + 1} class="px-2 py-3 text-center text-zinc-400"
							>Nothing here yet.</td
						>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
	<button
		type="button"
		onclick={add}
		class="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-[11px] text-zinc-700 hover:bg-zinc-50"
		>+ {addLabel}</button
	>
</div>
