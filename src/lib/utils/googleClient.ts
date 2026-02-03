import type { ListFilesDTO } from '$lib/interfaces/google-client/ListFilesDTO';

export function findNonFolderItems(payload: ListFilesDTO): ListFilesDTO[] {
	const result: ListFilesDTO[] = [];

	function traverse(currentNode: ListFilesDTO, pathSegments: string[]): void {
		const isFolder = currentNode.mimeType === 'application/vnd.google-apps.folder';
		const nextPathSegments = isFolder ? [...pathSegments, currentNode.name].filter(Boolean) : pathSegments;

		if (!isFolder) {
			const cleanSegments = pathSegments.filter(Boolean);
			const path = `/${cleanSegments.join('/') || ''}`;
			result.push({ ...currentNode, path });
			return;
		}

		if (currentNode.children?.length) {
			currentNode.children.forEach((child) => {
				traverse(child, nextPathSegments);
			});
		}
	}

	traverse(payload, []);

	return result;
}

export function getFolderIdFromDriveUrl(driveUrl: string): string | null {
	if (!driveUrl || typeof driveUrl !== 'string') {
		return null;
	}

	// Match folder ID in various Google Drive URL formats with one regex
	const match = driveUrl.trim().match(/(?:drive\.google\.com\/(?:drive\/)?folders\/|folderview\?id=)([a-zA-Z0-9_-]+)/);
	return match?.[1] || null;
}
