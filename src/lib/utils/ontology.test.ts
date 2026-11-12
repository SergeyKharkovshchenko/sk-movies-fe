import { describe, expect, it } from 'vitest';
import {
	classNames,
	createSseParser,
	currentStage,
	deepClone,
	isUnlocked,
	parseTags,
	termNames,
	withoutBlankRows,
	type StageEntry,
	type StageKey,
	type StageStatus
} from './ontology';

function entries(statuses: Partial<Record<StageKey, StageStatus>>): StageEntry[] {
	const keys: StageKey[] = [
		'source',
		'vocabulary',
		'metadata',
		'taxonomy',
		'ontology',
		'population'
	];
	return keys.map((k) => ({
		stage: k,
		status: statuses[k] ?? 'EMPTY',
		version: 0,
		updatedAt: null,
		payload: {}
	}));
}

describe('stage order', () => {
	it('starts at the first stage that is not approved', () => {
		expect(currentStage(entries({}))).toBe('source');
		expect(currentStage(entries({ source: 'APPROVED', vocabulary: 'DRAFT' }))).toBe('vocabulary');
		expect(currentStage(entries({ source: 'APPROVED', vocabulary: 'STALE' }))).toBe('vocabulary');
	});

	it('ends at the build stage when everything is approved', () => {
		const all = entries({
			source: 'APPROVED',
			vocabulary: 'APPROVED',
			metadata: 'APPROVED',
			taxonomy: 'APPROVED',
			ontology: 'APPROVED',
			population: 'APPROVED'
		});
		expect(currentStage(all)).toBe('population');
	});

	it('unlocks a stage only after every earlier one is approved', () => {
		const e = entries({ source: 'APPROVED', vocabulary: 'APPROVED', metadata: 'DRAFT' });
		expect(isUnlocked(e, 'vocabulary')).toBe(true);
		expect(isUnlocked(e, 'metadata')).toBe(true);
		expect(isUnlocked(e, 'taxonomy')).toBe(false);
		expect(isUnlocked(e, 'source')).toBe(true);
	});
});

describe('editing helpers', () => {
	it('parses tag lists', () => {
		expect(parseTags('Bonaparte, Boney ;  ,Nap')).toEqual(['Bonaparte', 'Boney', 'Nap']);
		expect(parseTags('')).toEqual([]);
	});

	it('lists term and class names without blanks', () => {
		expect(termNames({ terms: [{ term: 'A' }, { term: '' }, { term: 'B' }] })).toEqual(['A', 'B']);
		expect(classNames({ classes: [{ name: 'Person' }, { name: '' }] })).toEqual(['Person']);
		expect(termNames({})).toEqual([]);
	});

	it('drops rows with nothing filled in', () => {
		const rows = [
			{ a: '', b: ' ' },
			{ a: 'x', b: '' }
		];
		expect(withoutBlankRows(rows, ['a', 'b'])).toEqual([{ a: 'x', b: '' }]);
	});

	it('deep clones so edits never touch the saved copy', () => {
		const saved = { terms: [{ term: 'A' }] };
		const copy = deepClone(saved);
		copy.terms[0].term = 'B';
		expect(saved.terms[0].term).toBe('A');
	});
});

describe('createSseParser', () => {
	it('returns complete messages and keeps the unfinished tail', () => {
		const parse = createSseParser();
		expect(parse('event: section_start\ndata: {"section":"A"}\n\nevent: sec')).toEqual([
			{ event: 'section_start', data: { section: 'A' } }
		]);
		expect(parse('tion_done\ndata: {"triples":2}\n')).toEqual([
			{ event: 'section_done', data: { triples: 2 } }
		]);
	});

	it('keeps non-JSON data as a message and survives CRLF', () => {
		const parse = createSseParser();
		expect(parse('event: error\r\ndata: boom\r\n\r\n')).toEqual([
			{ event: 'error', data: { message: 'boom' } }
		]);
	});
});
