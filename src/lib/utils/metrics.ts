// Pure helpers for the /performance metric charts: value formatting, axis scale and
// breaking a line at gaps in the data. Kept free of Svelte so they can be unit-tested.

export type Point = [number, number]; // [epoch seconds, value]

export interface MetricSeries {
	label: string;
	points: Point[];
}

export interface MetricResponse {
	panel: string;
	unit: string;
	kind: 'stat' | 'series';
	range: string;
	step: number;
	/** Queried window, epoch seconds. */
	from: number;
	to: number;
	series: MetricSeries[];
}

/** Number with sensible precision for its size: 12.4K, 124, 12.4, 1.24, 0.0012. */
export function formatNumber(v: number): string {
	const abs = Math.abs(v);
	if (abs === 0) return '0';
	if (abs >= 1_000_000) return `${trim(v / 1_000_000, 1)}M`;
	if (abs >= 10_000) return `${trim(v / 1_000, 1)}K`;
	if (abs >= 100) return `${Math.round(v)}`;
	if (abs >= 10) return trim(v, 1);
	if (abs >= 1) return trim(v, 2);
	return trim(v, abs >= 0.01 ? 3 : 4);
}

function trim(v: number, decimals: number): string {
	const s = v.toFixed(decimals);
	// Only strip zeros after a decimal point -- "70" must stay "70".
	return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
}

export function formatBytes(v: number): string {
	const MIB = 1024 * 1024;
	if (Math.abs(v) >= 1024 * MIB) return `${trim(v / (1024 * MIB), 2)} GiB`;
	return `${trim(v / MIB, Math.abs(v) < 10 * MIB ? 1 : 0)} MiB`;
}

/** 1191197 -> "19 min", 273_600_000 -> "3 d 4 h". */
export function formatDuration(ms: number): string {
	const s = Math.floor(ms / 1000);
	if (s < 60) return `${s} s`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m} min`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h} h ${m % 60} min`;
	const d = Math.floor(h / 24);
	return `${d} d ${h % 24} h`;
}

/** Latency: whole ms below a second, seconds above. */
export function formatMs(ms: number): string {
	return ms >= 1000 ? `${trim(ms / 1000, 2)} s` : `${formatNumber(ms)} ms`;
}

export function formatValue(unit: string, v: number): string {
	switch (unit) {
		case 'bytes':
			return formatBytes(v);
		case 'ms':
			return formatMs(v);
		case '%':
			return `${trim(v, Math.abs(v) < 10 ? 1 : 0)}%`;
		case 'req/s':
			return `${formatNumber(v)} req/s`;
		case 'requests':
		case 'connections':
		case 'threads':
			return formatNumber(Math.round(v));
		default:
			return formatNumber(v);
	}
}

/** Shorter form for axis ticks (no unit suffix on rates, which the card title already carries). */
export function formatTick(unit: string, v: number): string {
	if (unit === 'req/s') return formatNumber(v);
	return formatValue(unit, v);
}

/** Round a step up to 1, 2, 2.5, 5 or 10 times a power of ten. */
function niceStep(raw: number): number {
	const exp = Math.floor(Math.log10(raw));
	const base = raw / 10 ** exp;
	const nice = base <= 1 ? 1 : base <= 2 ? 2 : base <= 2.5 ? 2.5 : base <= 5 ? 5 : 10;
	return nice * 10 ** exp;
}

/** Axis from 0 to a clean maximum, with `count` + 1 tick values. */
export function niceScale(maxValue: number, count = 4): { max: number; ticks: number[] } {
	if (!(maxValue > 0)) return { max: 1, ticks: [0, 1] };
	const step = niceStep(maxValue / count);
	const max = Math.ceil(maxValue / step - 1e-9) * step;
	const ticks: number[] = [];
	for (let t = 0; t <= max + step / 2; t += step) ticks.push(Number(t.toPrecision(12)));
	return { max, ticks };
}

/**
 * Split points into runs so the line is not drawn across a gap (e.g. while the backend was off).
 * A gap is any hole wider than `maxGap` seconds.
 */
export function splitSegments(points: Point[], maxGap: number): Point[][] {
	const runs: Point[][] = [];
	let current: Point[] = [];
	for (const p of points) {
		const last = current[current.length - 1];
		if (last && p[0] - last[0] > maxGap) {
			runs.push(current);
			current = [];
		}
		current.push(p);
	}
	if (current.length) runs.push(current);
	return runs;
}

export function seriesStats(points: Point[]) {
	const values = points.map((p) => p[1]);
	const sum = values.reduce((a, b) => a + b, 0);
	return {
		latest: values[values.length - 1],
		min: Math.min(...values),
		max: Math.max(...values),
		avg: sum / values.length
	};
}

const registries = new Map<string, Map<string, number>>();

/**
 * Colour slot per series label, shared by every chart in the same `group` so an entity keeps its
 * colour across charts (and across range changes). A new label takes the lowest free slot of its
 * group; if the group has used all of them, it avoids only the slots on screen in this chart.
 */
export function colorSlots(group: string, labels: string[], slots = 8): Map<string, number> {
	let registry = registries.get(group);
	if (!registry) {
		registry = new Map();
		registries.set(group, registry);
	}
	for (const label of labels) {
		if (registry.has(label)) continue;
		const taken = new Set(registry.values());
		let slot = 0;
		while (taken.has(slot) && slot < slots) slot++;
		if (slot >= slots) {
			const onScreen = new Set(labels.filter((l) => registry.has(l)).map((l) => registry.get(l)));
			slot = 0;
			while (onScreen.has(slot) && slot < slots - 1) slot++;
		}
		registry.set(label, slot);
	}
	return registry;
}

/** Keep the `limit` series with the highest peak; the rest stay reachable in the table view. */
export function topSeries(series: MetricSeries[], limit: number) {
	const sorted = [...series]
		.filter((s) => s.points.length > 0)
		.sort((a, b) => seriesStats(b.points).max - seriesStats(a.points).max);
	return { shown: sorted.slice(0, limit), hidden: Math.max(0, sorted.length - limit), all: sorted };
}

/** Axis label for a timestamp; ranges over a day show the date as well. */
export function formatTime(epochSeconds: number, range: string, long = false): string {
	const d = new Date(epochSeconds * 1000);
	const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
	if (range === '7d' || long) {
		return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${time}`;
	}
	return time;
}
