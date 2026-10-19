// Bundled at build time via Vite's import.meta.glob, same as insuranceCsvSamples -- the dishes +
// ingredient-taxonomy pair from the KG-vs-vector benchmark. Neither file has "*_Identifier"
// columns, so the backend infers column roles (key, list, category, hierarchy) and links the
// files through their shared ingredient nodes.
const modules = import.meta.glob('./food/*.csv', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

export const foodCsvSamples: Record<string, string> = Object.fromEntries(
	Object.entries(modules).map(([path, content]) => [path.split('/').pop() ?? path, content])
);
