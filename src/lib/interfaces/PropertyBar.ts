interface PropertyKey {
	id: number;
	name: string;
	value: string;
}

export interface Label {
	key: string;
	entityId: string;
	entityType: string;
	lang: string;
	text: string;
}

export interface PropertyBar {
	id: string;
	name: string;
	nodeKey?: string;
	category: PropertyBarCategory;
}

export interface PropertyBarCategory {
	id: string;
	type: string;
	nodeKey: string;
	label?: Label;
	name?: string;
	parentId?: number | null;
	order?: number;
	children?: Array<PropertyBarCategory | PropertyBar>;
	language?: any;
	expanded?: boolean;
}

export interface PropertyBarRow {
	id: number;
	propertyBarId: number;
	label: string;
	property: PropertyKey;
	format1: string;
	format2: string;
	format3: string;
	qualifierPrefix: string;
	qualifierSufix: string;
	enabled: boolean;
	comments: PropertyBarRowComment[];
	critical?: boolean;
}

export interface PropertyBarRowComment {
	id: number;
	propertyBarRowId: number;
	text: string;
	userId: number;
}

type NodeReference = { id: string };

export interface PropertyBarCategoryForTreeviewData {
	id: string;
	name: string;
	expanded: boolean;
	nodeKey: string;
	items?: NodeReference[]; // only present for nodes with children
}

export interface PropertyBarCategoryForTreeview {
	[key: string]: PropertyBarCategoryForTreeviewData;
}
