// Bundled at build time via Vite's import.meta.glob so these ship as plain strings (no runtime
// fetch needed) -- each file in src/lib/data/insurance/ becomes one entry, keyed by filename, in
// the "Load sample CSVs" picker in the Knowledge Wizard's CSV import panel.
const modules = import.meta.glob('./insurance/*.csv', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

export const insuranceCsvSamples: Record<string, string> = Object.fromEntries(
	Object.entries(modules).map(([path, content]) => [path.split('/').pop() ?? path, content])
);
