interface Sort {
	empty: boolean;
	sorted: boolean;
	unsorted: boolean;
}

interface Pageable {
	pageNumber: number;
	pageSize: number;
	sort: Sort;
	offset: number;
	paged: boolean;
	unpaged: boolean;
}

interface Content {
	id: number;
	filename: string;
	externalFileId: string;
	externalBucketPath: string;
	mimeType: string;
	size: string;
	status: string;
	processingType: string;
	processingId: string | null;
	uploadedUrl: string;
	attemptCount: number;
	lastErrorMessage: string | null;
	lastModifiedDate: number;
	lastModifiedBy: string;
	createdDate: number;
	createdBy: string;
	version: number;
}

export interface UploadsHistory {
	content: Content[];
	pageable: Pageable;
	totalElements: number;
	totalPages: number;
	last: boolean;
	first: boolean;
	size: number;
	number: number;
	sort: Sort;
	numberOfElements: number;
	empty: boolean;
}

export interface LatestUpload {
	googleDriveUrl: string;
	folderName: string;
}
