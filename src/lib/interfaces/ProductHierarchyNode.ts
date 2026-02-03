export interface ProductHierarchyNode {
	label: { key: string; entityType: string; lang: string; text: string | null };
	children?: ProductHierarchyNode[];
	nodeKey: string;
	type?: string;
	language?: string;
	id?: string | number;
	checked?: boolean;
	position?: number;
	assignedPropertyBars?: any[];
}
