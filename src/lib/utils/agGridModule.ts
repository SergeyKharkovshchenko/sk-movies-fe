import { browser } from '$app/environment';
import {
	ClientSideRowModelModule,
	ColumnAutoSizeModule,
	CustomFilterModule,
	DateFilterModule,
	LargeTextEditorModule,
	ModuleRegistry,
	NumberEditorModule,
	RowSelectionModule,
	TextEditorModule,
	ValidationModule
} from 'ag-grid-community';
import { get, writable } from 'svelte/store';

class AgGrid {
	#initialized = writable(false);
	isInitialized = this.#initialized.subscribe;

	init() {
		if (browser) this.#register();
	}

	#register() {
		if (get(this.#initialized)) return;

		ModuleRegistry.registerModules([
			ClientSideRowModelModule,
			ValidationModule,
			LargeTextEditorModule,
			CustomFilterModule,
			NumberEditorModule,
			TextEditorModule,
			DateFilterModule,
			RowSelectionModule,
			ColumnAutoSizeModule
		]);

		this.#initialized.set(true);
	}
}

export const AgGridModule = new AgGrid();
