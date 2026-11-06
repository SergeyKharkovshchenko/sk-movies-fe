import { describe, expect, it } from 'vitest';
import {
	formatBytes,
	formatDuration,
	formatMs,
	colorSlots,
	formatNumber,
	formatValue,
	niceScale,
	seriesStats,
	splitSegments,
	topSeries,
	type MetricSeries
} from './metrics';

describe('formatNumber', () => {
	it('scales precision with size', () => {
		expect(formatNumber(0)).toBe('0');
		expect(formatNumber(12400)).toBe('12.4K');
		expect(formatNumber(124.4)).toBe('124');
		expect(formatNumber(12.34)).toBe('12.3');
		expect(formatNumber(1.234)).toBe('1.23');
		expect(formatNumber(0.0011)).toBe('0.0011');
	});
});

describe('units', () => {
	it('formats bytes, durations and latency', () => {
		expect(formatBytes(73224824)).toBe('70 MiB');
		expect(formatBytes(3 * 1024 * 1024)).toBe('3 MiB');
		expect(formatBytes(2 * 1024 ** 3)).toBe('2 GiB');
		expect(formatDuration(45_000)).toBe('45 s');
		expect(formatDuration(1_191_197)).toBe('19 min');
		expect(formatDuration(4 * 3_600_000 + 5 * 60_000)).toBe('4 h 5 min');
		expect(formatDuration(3 * 86_400_000 + 4 * 3_600_000)).toBe('3 d 4 h');
		expect(formatMs(222.7)).toBe('223 ms');
		expect(formatMs(1064.8)).toBe('1.06 s');
	});

	it('formats by unit', () => {
		expect(formatValue('%', 70.157)).toBe('70%');
		expect(formatValue('%', 0.25)).toBe('0.3%');
		expect(formatValue('requests', 8.1262)).toBe('8');
		expect(formatValue('threads', 46)).toBe('46');
		expect(formatValue('req/s', 0.0011)).toBe('0.0011 req/s');
	});
});

describe('niceScale', () => {
	it('starts at zero and ends on a clean number', () => {
		const s = niceScale(222.7);
		expect(s.ticks[0]).toBe(0);
		expect(s.max).toBeGreaterThanOrEqual(222.7);
		expect(s.ticks[s.ticks.length - 1]).toBe(s.max);
	});

	it('handles tiny and empty ranges', () => {
		const tiny = niceScale(0.0011);
		expect(tiny.max).toBeGreaterThanOrEqual(0.0011);
		expect(tiny.ticks.length).toBeGreaterThan(2);
		expect(niceScale(0)).toEqual({ max: 1, ticks: [0, 1] });
	});
});

describe('splitSegments', () => {
	it('breaks the line at gaps wider than maxGap', () => {
		const runs = splitSegments(
			[
				[0, 1],
				[30, 1],
				[60, 1],
				[600, 2],
				[630, 2]
			],
			90
		);
		expect(runs).toHaveLength(2);
		expect(runs[0]).toHaveLength(3);
		expect(runs[1]).toHaveLength(2);
	});

	it('returns nothing for no points', () => {
		expect(splitSegments([], 60)).toEqual([]);
	});
});

describe('series helpers', () => {
	const series: MetricSeries[] = [
		{
			label: 'a',
			points: [
				[0, 1],
				[1, 3]
			]
		},
		{ label: 'b', points: [[0, 10]] },
		{ label: 'empty', points: [] },
		{ label: 'c', points: [[0, 5]] }
	];

	it('computes latest, min, max and average', () => {
		expect(seriesStats(series[0].points)).toEqual({ latest: 3, min: 1, max: 3, avg: 2 });
	});

	it('keeps the highest peaks and counts the rest', () => {
		const { shown, hidden, all } = topSeries(series, 2);
		expect(shown.map((s) => s.label)).toEqual(['b', 'c']);
		expect(hidden).toBe(1);
		expect(all).toHaveLength(3);
	});
});

describe('colorSlots', () => {
	it('keeps a label on the same slot across charts in a group', () => {
		const a = colorSlots('t-endpoint', ['/a', '/b', '/c']);
		const b = colorSlots('t-endpoint', ['/c', '/a']);
		expect(b.get('/a')).toBe(a.get('/a'));
		expect(b.get('/c')).toBe(a.get('/c'));
		expect(new Set([a.get('/a'), a.get('/b'), a.get('/c')]).size).toBe(3);
	});

	it('keeps groups independent', () => {
		colorSlots('t-one', ['x', 'y']);
		const other = colorSlots('t-two', ['y']);
		expect(other.get('y')).toBe(0);
	});

	it('never repaints an existing label when a new one appears', () => {
		const before = colorSlots('t-stable', ['p', 'q']).get('p');
		const after = colorSlots('t-stable', ['r', 'p', 'q']).get('p');
		expect(after).toBe(before);
	});

	it('avoids on-screen slots once the group is full', () => {
		const labels = Array.from({ length: 8 }, (_, i) => `l${i}`);
		colorSlots('t-full', labels);
		const reg = colorSlots('t-full', ['l0', 'l1', 'extra']);
		expect([reg.get('l0'), reg.get('l1')]).not.toContain(reg.get('extra'));
	});
});
