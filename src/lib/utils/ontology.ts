// Types and pure helpers for the ontology pipeline (Ontology Studio).

export type StageKey =
	| 'source'
	| 'vocabulary'
	| 'metadata'
	| 'taxonomy'
	| 'ontology'
	| 'population';
export type StageStatus = 'EMPTY' | 'DRAFT' | 'APPROVED' | 'STALE';

export interface StageEntry {
	stage: StageKey;
	status: StageStatus;
	version: number;
	updatedAt: string | null;
	payload: Record<string, unknown>;
	errors?: string[];
}

export interface Term {
	term: string;
	type: string;
	aliases: string[];
	definition: string;
	origin?: string;
}
export interface Pair {
	parent: string;
	child: string;
	evidence?: string;
}
export interface ClassDef {
	name: string;
	parent: string;
	description: string;
}
export interface RelationDef {
	name: string;
	domain: string;
	range: string;
	description: string;
}
export interface Attribute {
	name: string;
	datatype: 'string' | 'number' | 'date' | 'boolean';
	required: boolean;
	/** Term types that carry it; empty means every type. */
	appliesTo?: string[];
	description?: string;
	/** A sentence from the source that states a value (set by the AI suggestion). */
	example?: string;
}

export const DATATYPES: Attribute['datatype'][] = ['string', 'number', 'date', 'boolean'];

export interface StageInfo {
	key: StageKey;
	label: string;
	title: string;
	help: string;
	example: string;
}

/** The stages in the order they must be approved, with the explanation shown above each editor. */
export const STAGES: StageInfo[] = [
	{
		key: 'source',
		label: 'Source',
		title: 'Source material',
		help: 'The raw input the knowledge base is built from: free text, or one or more CSV tables. Everything later is derived from this and can never add facts that are not in it.',
		example: 'Example: a paragraph about the Battle of Waterloo, or dishes.csv + taxonomy.csv.'
	},
	{
		key: 'vocabulary',
		label: 'Vocabulary',
		title: 'Controlled vocabulary',
		help: 'The agreed list of things the knowledge base talks about. Each term has one preferred name, a type, optional aliases (other names the source uses for it) and a definition. Two names for one thing become one term.',
		example: 'Example: term "Napoleon", type Person, aliases "Bonaparte" and "Napoleon Bonaparte".'
	},
	{
		key: 'metadata',
		label: 'Metadata',
		title: 'Metadata',
		help: 'What is recorded about terms and about links. Provenance (where a fact came from) is always kept. Declare any extra attributes you want to keep, with a type; undeclared properties are removed from the graph.',
		example:
			'Example: price_eur (number) on a dish; source section and quoted sentence on every link.'
	},
	{
		key: 'taxonomy',
		label: 'Taxonomy',
		title: 'Taxonomy',
		help: 'The "is a kind of" tree between terms. Each term has at most one parent and there are no cycles. The graph uses it to answer questions about whole categories.',
		example: 'Example: mascarpone is a kind of dairy; dairy is a kind of animal product.'
	},
	{
		key: 'ontology',
		label: 'Ontology',
		title: 'Ontology',
		help: 'The schema: the classes of things and the relations allowed between them. It is strict: a link that does not fit a declared relation, with the right classes on each end, is rejected.',
		example: 'Example: FOUGHT_AT may link a Person to an Event, nothing else.'
	},
	{
		key: 'population',
		label: 'Build',
		title: 'Build the graph',
		help: 'Fills the graph from the approved model. Links that break the ontology are listed for review instead of being stored. The vector index (chunking, embedding, indexing) is built alongside.',
		example: ''
	}
];

export const STATUS_STYLE: Record<StageStatus, { label: string; cls: string }> = {
	EMPTY: { label: 'not started', cls: 'bg-zinc-100 text-zinc-500' },
	DRAFT: { label: 'draft', cls: 'bg-amber-100 text-amber-700' },
	APPROVED: { label: 'approved', cls: 'bg-emerald-100 text-emerald-700' },
	STALE: { label: 'out of date', cls: 'bg-red-100 text-red-700' }
};

export function stageInfo(key: StageKey): StageInfo {
	return STAGES.find((s) => s.key === key) ?? STAGES[0];
}

/** The first stage that is not approved yet, i.e. where the user should work next. */
export function currentStage(entries: StageEntry[]): StageKey {
	for (const s of STAGES) {
		if (entries.find((e) => e.stage === s.key)?.status !== 'APPROVED') return s.key;
	}
	return 'population';
}

/** A stage can be opened once every earlier stage is approved. */
export function isUnlocked(entries: StageEntry[], key: StageKey): boolean {
	const index = STAGES.findIndex((s) => s.key === key);
	return STAGES.slice(0, index).every(
		(s) => entries.find((e) => e.stage === s.key)?.status === 'APPROVED'
	);
}

export function deepClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

/** "a, b ;c" -> ["a","b","c"]; empty pieces dropped. */
export function parseTags(text: string): string[] {
	return text
		.split(/[,;]/)
		.map((s) => s.trim())
		.filter(Boolean);
}

export function termNames(vocabulary: Record<string, unknown>): string[] {
	const terms = (vocabulary.terms as Term[] | undefined) ?? [];
	return terms.map((t) => t.term).filter(Boolean);
}

export function classNames(ontology: Record<string, unknown>): string[] {
	const classes = (ontology.classes as ClassDef[] | undefined) ?? [];
	return classes.map((c) => c.name).filter(Boolean);
}

export function blankTerm(): Term {
	return { term: '', type: '', aliases: [], definition: '', origin: 'manual' };
}
export function blankPair(): Pair {
	return { parent: '', child: '', evidence: '' };
}
export function blankClass(): ClassDef {
	return { name: '', parent: '', description: '' };
}
export function blankRelation(): RelationDef {
	return { name: '', domain: '', range: '', description: '' };
}
export function blankAttribute(): Attribute {
	return {
		name: '',
		datatype: 'string',
		required: false,
		appliesTo: [],
		description: '',
		example: ''
	};
}

/** Rows with nothing filled in are dropped before saving so a stray "add row" is harmless. */
export function withoutBlankRows<T extends object>(rows: T[], keys: (keyof T)[]): T[] {
	return rows.filter((r) => keys.some((k) => String(r[k] ?? '').trim() !== ''));
}

export interface SseMessage {
	event: string;
	data: Record<string, unknown>;
}

/**
 * Incremental parser for a server-sent-event stream: feed it chunks as they arrive and it returns
 * the complete messages so far, keeping the unfinished tail for the next chunk.
 */
export function createSseParser(): (chunk: string) => SseMessage[] {
	let buffer = '';
	let event = '';
	return (chunk) => {
		buffer += chunk;
		const lines = buffer.split('\n');
		buffer = lines.pop() ?? '';
		const out: SseMessage[] = [];
		for (const raw of lines) {
			const line = raw.replace(/\r$/, '');
			if (line.startsWith('event:')) {
				event = line.slice(6).trim();
			} else if (line.startsWith('data:')) {
				const text = line.slice(5).trim();
				if (!text) continue;
				try {
					out.push({ event: event || 'message', data: JSON.parse(text) });
				} catch {
					out.push({ event: event || 'message', data: { message: text } });
				}
			} else if (line === '') {
				event = '';
			}
		}
		return out;
	};
}

export interface RejectedTriple {
	subject: string;
	predicate: string;
	object: string;
	reason: string;
	evidence?: string;
	section?: string;
}

/** One column of an editable table. */
export interface Column<Row> {
	key: string;
	label: string;
	kind?: 'text' | 'tags' | 'chips' | 'select' | 'checkbox' | 'textarea';
	/** Suggested values (select options, or datalist for text). */
	options?: string[];
	width?: string;
	/** Locks the cell for rows where this returns true. */
	locked?: (row: Row) => boolean;
	placeholder?: string;
}

export interface TreeNode {
	name: string;
	children: TreeNode[];
}

/** The is-a pairs as a tree, plus what would stop the stage being approved (several parents, cycles). */
export function taxonomyTree(pairs: Pair[]): { roots: TreeNode[]; issues: string[] } {
	const key = (s: string) => s.trim().toLowerCase();
	const valid = pairs.filter((p) => p.parent.trim() && p.child.trim());
	const children = new Map<string, string[]>();
	const display = new Map<string, string>();
	const parents = new Map<string, Set<string>>();
	for (const p of valid) {
		display.set(key(p.parent), p.parent.trim());
		display.set(key(p.child), p.child.trim());
		const kids = children.get(key(p.parent)) ?? [];
		if (!kids.includes(key(p.child))) kids.push(key(p.child));
		children.set(key(p.parent), kids);
		const set = parents.get(key(p.child)) ?? new Set<string>();
		set.add(key(p.parent));
		parents.set(key(p.child), set);
	}
	const issues: string[] = [];
	for (const [child, set] of parents) {
		if (child && set.has(child)) issues.push(`"${display.get(child)}" is its own parent.`);
		if (set.size > 1) {
			issues.push(
				`"${display.get(child)}" has ${set.size} parents (${[...set].map((k) => display.get(k)).join(', ')}); keep one.`
			);
		}
	}
	const seen = new Set<string>();
	const build = (name: string, path: string[]): TreeNode => {
		seen.add(name);
		const kids = (children.get(name) ?? []).filter((k) => !path.includes(k) && k !== name);
		return {
			name: display.get(name) ?? name,
			children: kids.map((k) => build(k, [...path, name]))
		};
	};
	const rootKeys = [...children.keys()].filter((k) => !parents.has(k)).sort();
	const roots = rootKeys.map((k) => build(k, []));
	for (const k of [...children.keys(), ...parents.keys()]) {
		if (!seen.has(k)) {
			issues.push(`"${display.get(k)}" is part of a cycle.`);
			break;
		}
	}
	return { roots, issues };
}

/**
 * "Group by type": when the vocabulary has a term named like one of its types (a term "Hotel" of
 * type Category, next to Hotel Atlas of type Hotel), the other terms of that type can sit under it.
 * Only terms without a parent yet are suggested.
 */
export function typeSuggestions(terms: Term[], pairs: Pair[]): Pair[] {
	const key = (s: string) => s.trim().toLowerCase();
	const hasParent = new Set(pairs.map((p) => key(p.child)));
	const byName = new Map(terms.map((t) => [key(t.term), t]));
	const out: Pair[] = [];
	for (const t of terms) {
		const type = key(t.type);
		const parent = byName.get(type);
		if (!parent || key(parent.term) === key(t.term) || hasParent.has(key(t.term))) continue;
		out.push({ parent: parent.term, child: t.term, evidence: `Type of "${t.term}" is ${t.type}.` });
	}
	return out;
}

/** Types that have several terms but no term of that name to group them under. */
export function typesWithoutGroupTerm(terms: Term[]): string[] {
	const key = (s: string) => s.trim().toLowerCase();
	const names = new Set(terms.map((t) => key(t.term)));
	const count = new Map<string, number>();
	for (const t of terms) count.set(t.type, (count.get(t.type) ?? 0) + 1);
	return [...count]
		.filter(([type, n]) => type && n >= 2 && !names.has(key(type)))
		.map(([type]) => type);
}
