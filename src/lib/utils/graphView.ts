// Pure helpers for the knowledge graph view: legend, filtering and node sizing.

export interface GraphNode {
	id: string;
	labels?: string[];
	nodeType?: string;
	description?: string;
	degree?: number;
}

export interface GraphEdge {
	source: string;
	target: string;
	type: string;
	inferred?: boolean;
}

export interface NodeDetails {
	name: string;
	labels: string[];
	nodeType: string;
	description: string;
	definition: string;
	aliases: string[];
	properties: Record<string, unknown>;
	tables: string[];
	outgoing: { type: string; node: string; inferred: boolean; via?: string[] }[];
	incoming: { type: string; node: string; inferred: boolean; via?: string[] }[];
	ancestors: string[];
	children: string[];
	degree: number;
}

/** Categorical colours, assigned in a fixed order so a class keeps its colour across filters. */
export const CLASS_COLORS = [
	'#0ea5e9',
	'#f97316',
	'#10b981',
	'#a855f7',
	'#ef4444',
	'#eab308',
	'#14b8a6',
	'#ec4899'
];
export const STRUCTURAL_COLOR = '#d4d4d8';
export const OTHER_COLOR = '#71717a';

export const STRUCTURAL_CLASSES = new Set(['Section', 'Chunk']);

/** A node's class: its first label, or "Entity" when it has none. */
export function nodeClass(node: GraphNode): string {
	return node.labels?.[0] ?? 'Entity';
}

export interface LegendEntry {
	name: string;
	count: number;
	color: string;
	structural: boolean;
}

/** One legend row per class, most frequent first. Colours follow the class, never its rank. */
export function buildLegend(nodes: GraphNode[]): LegendEntry[] {
	const counts = new Map<string, number>();
	for (const n of nodes) counts.set(nodeClass(n), (counts.get(nodeClass(n)) ?? 0) + 1);
	const names = [...counts.keys()].sort();
	const colorOf = new Map<string, string>();
	let next = 0;
	for (const name of names) {
		if (STRUCTURAL_CLASSES.has(name)) colorOf.set(name, STRUCTURAL_COLOR);
		else colorOf.set(name, next < CLASS_COLORS.length ? CLASS_COLORS[next++] : OTHER_COLOR);
	}
	return names
		.map((name) => ({
			name,
			count: counts.get(name) ?? 0,
			color: colorOf.get(name) ?? OTHER_COLOR,
			structural: STRUCTURAL_CLASSES.has(name)
		}))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Diameter in px: grows with the square root of the degree, within sane bounds. */
export function nodeSize(degree: number | undefined, structural = false): number {
	if (structural) return 16;
	return Math.round(Math.min(54, 22 + Math.sqrt(Math.max(0, degree ?? 0)) * 6));
}

/**
 * Nodes and edges to show: classes in `hidden` are removed, a non-empty `query` keeps only nodes
 * whose id contains it (case-insensitive), and edges survive only when both ends do.
 */
export function visibleGraph(
	nodes: GraphNode[],
	edges: GraphEdge[],
	hidden: Set<string>,
	query: string
): { nodes: GraphNode[]; edges: GraphEdge[] } {
	const q = query.trim().toLowerCase();
	const keptNodes = nodes.filter(
		(n) => !hidden.has(nodeClass(n)) && (q === '' || n.id.toLowerCase().includes(q))
	);
	const ids = new Set(keptNodes.map((n) => n.id));
	return {
		nodes: keptNodes,
		edges: edges.filter((e) => ids.has(e.source) && ids.has(e.target))
	};
}

/** "1,000" style for numbers, plain text otherwise. */
export function formatValue(value: unknown): string {
	if (typeof value === 'number') return value.toLocaleString('en-US');
	return String(value ?? '');
}
