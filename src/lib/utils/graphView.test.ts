import { describe, expect, it } from 'vitest';
import {
	buildLegend,
	formatValue,
	nodeClass,
	nodeSize,
	STRUCTURAL_COLOR,
	visibleGraph,
	type GraphEdge,
	type GraphNode
} from './graphView';

const nodes: GraphNode[] = [
	{ id: 'Napoleon', labels: ['Person'], degree: 4 },
	{ id: 'Wellington', labels: ['Person'], degree: 2 },
	{ id: 'Waterloo', labels: ['Battle'], degree: 3 },
	{ id: 'Early Life', labels: ['Section'], degree: 1 },
	{ id: 'Nameless' }
];
const edges: GraphEdge[] = [
	{ source: 'Napoleon', target: 'Waterloo', type: 'FOUGHT_AT' },
	{ source: 'Wellington', target: 'Waterloo', type: 'FOUGHT_AT' },
	{ source: 'Napoleon', target: 'Early Life', type: 'HAS_INFO' }
];

describe('nodeClass', () => {
	it('uses the first label and falls back to Entity', () => {
		expect(nodeClass(nodes[0])).toBe('Person');
		expect(nodeClass(nodes[4])).toBe('Entity');
	});
});

describe('buildLegend', () => {
	it('lists classes by frequency and greys out structural ones', () => {
		const legend = buildLegend(nodes);
		expect(legend[0]).toMatchObject({ name: 'Person', count: 2 });
		expect(legend.find((l) => l.name === 'Section')).toMatchObject({
			color: STRUCTURAL_COLOR,
			structural: true
		});
	});

	it('gives a class the same colour whatever the node order or counts are', () => {
		const colours = (list: GraphNode[]) =>
			Object.fromEntries(buildLegend(list).map((l) => [l.name, l.color]));
		const base = colours(nodes);
		// more Battle nodes would re-rank the classes by frequency; colours must not move with rank
		const heavier = [...nodes, { id: 'B2', labels: ['Battle'] }, { id: 'B3', labels: ['Battle'] }];
		expect(colours(heavier)).toEqual(base);
		expect(colours([...nodes].reverse())).toEqual(base);
	});
});

describe('nodeSize', () => {
	it('grows with degree within bounds', () => {
		expect(nodeSize(0)).toBe(22);
		expect(nodeSize(9)).toBeGreaterThan(nodeSize(1));
		expect(nodeSize(100000)).toBe(54);
		expect(nodeSize(undefined)).toBe(22);
	});
	it('keeps structural nodes small', () => {
		expect(nodeSize(50, true)).toBe(16);
	});
});

describe('visibleGraph', () => {
	it('drops hidden classes together with their edges', () => {
		const out = visibleGraph(nodes, edges, new Set(['Section']), '');
		expect(out.nodes.map((n) => n.id)).not.toContain('Early Life');
		expect(out.edges).toHaveLength(2);
	});

	it('filters by a case-insensitive search and keeps only edges between survivors', () => {
		const out = visibleGraph(nodes, edges, new Set(), 'WATER');
		expect(out.nodes.map((n) => n.id)).toEqual(['Waterloo']);
		expect(out.edges).toHaveLength(0);
	});
});

describe('formatValue', () => {
	it('groups thousands and stringifies the rest', () => {
		expect(formatValue(1234567)).toBe('1,234,567');
		expect(formatValue('x')).toBe('x');
		expect(formatValue(null)).toBe('');
	});
});
