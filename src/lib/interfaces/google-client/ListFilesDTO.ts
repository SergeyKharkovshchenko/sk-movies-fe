export interface ListFilesDTO {
	id: string;
	filename: any;
	name: string;
	mimeType?: string;
	fileSize?: string;
	lastModifiedDate?: string;
	path?: string;
	children?: ListFilesDTO[];
}

export interface UploadDTO {
	googleDriveUrl: string;
	folderName?: string;
	files: ListFilesDTO[];
}
