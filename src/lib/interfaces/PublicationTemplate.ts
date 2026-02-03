export interface PublicationTemplate {
	templateId?: string;
	name: string;
	creationDate?: string;
	createdBy?: string;
	modificationDate?: string;
	language: string[];
	productHierarchy: {
		id: string;
		type?: string;
		nodeKey?: string;
		children: any;
		label?: object;
	};
}
