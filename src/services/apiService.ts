const apiUrl = import.meta.env.VITE_API_URL;

import { FetchMethods, handleFetch } from '$lib/utils/fetch';
// import { mockCategories } from 'store/mocked/mockCategories';
import type { UploadDTO } from '$lib/interfaces/google-client/ListFilesDTO';

async function getAllMovies() {
	return await handleFetch(`${apiUrl}/getAllMovies`, FetchMethods.GET);
}

async function getProductHierarchy() {
	return {
		id: 'GPH:3042193b-f710-4187-94ff-3f4a0e65faf6',
		type: 'ROOT_NODE',
		nodeKey: 'producthierarchytree',
		label: {
			key: '123',
			entityId: 'GPH:0e929655-b0a9-4e76-aa00-f1273043c818',
			entityType: 'product-hierarchy',
			lang: 'en-US',
			text: 'ACT 52'
		},
		children: [
			{
				id: 'GPH:4c002d48-5f6d-44ca-bb2e-eaaf861e3d35',
				type: 'PRODUCT_GROUP',
				nodeKey: 'carbonadsorber',
				label: {
					key: '123',
					entityId: 'GPH:0e929655-b0a9-4e76-aa00-f1273043c818',
					entityType: 'product-hierarchy',
					lang: 'en-US',
					text: 'ACT 52'
				},
				children: [
					{
						id: 'GPH:1b2436d8-1560-4e93-a5fa-de35dcb1b3ef',
						type: 'SERIES',
						nodeKey: 'ACT',
						label: {
							key: '123',
							entityId: 'GPH:0e929655-b0a9-4e76-aa00-f1273043c818',
							entityType: 'product-hierarchy',
							lang: 'en-US',
							text: 'ACT 52'
						},
						children: [
							{
								id: 'GPH:ceb20474-5b88-4356-a6a2-3ec1242a80d8',
								type: 'SERIES_VERSION',
								nodeKey: 'ACT.MDM.1',
								label: {
									key: '123',
									entityId: 'GPH:0e929655-b0a9-4e76-aa00-f1273043c818',
									entityType: 'product-hierarchy',
									lang: 'en-US',
									text: 'ACT 52'
								},
								children: [
									{
										id: 'GPH:52653c9c-8c48-4ff6-b1f3-8b528e523ed2',
										type: 'DESIGN',
										nodeKey: 'ACTbase',
										label: {
											key: '123',
											entityId: 'GPH:0e929655-b0a9-4e76-aa00-f1273043c818',
											entityType: 'product-hierarchy',
											lang: 'en-US',
											text: 'ACT 52'
										},
										children: [
											{
												id: 'GPH:2fb73d9e-7a55-4b04-a0cf-f1ac529ca866',
												type: 'Product',
												nodeKey: 'ACT16',
												label: {
													key: '123',
													entityId: 'GPH:2fb73d9e-7a55-4b04-a0cf-f1ac529ca866',
													entityType: 'product-hierarchy',
													lang: 'en-US',
													text: 'Product 2'
												},
												position: 1
											},
											{
												id: 'GPH:ffd004bc-5fa2-49a0-9f59-c9b6a07e2b26',
												type: 'Product',
												nodeKey: 'ACT23',
												label: {
													key: '123',
													entityId: 'GPH:ffd004bc-5fa2-49a0-9f59-c9b6a07e2b26',
													entityType: 'product-hierarchy',
													lang: 'en-US',
													text: 'Product 1'
												},
												position: 2
											},
											{
												id: 'GPH:928aa4f6-5525-4d78-8641-7519f9e68053',
												type: 'Product',
												nodeKey: 'ACT34',
												label: {
													key: '123',
													entityId: 'GPH:928aa4f6-5525-4d78-8641-7519f9e68053',
													entityType: 'product-hierarchy',
													lang: 'en-US',
													text: 'Product 3'
												},
												position: 3
											},
											{
												id: 'GPH:0e929655-b0a9-4e76-aa00-f1273043c818',
												type: 'Product',
												nodeKey: 'ACT52',
												label: {
													key: '123',
													entityId: 'GPH:0e929655-b0a9-4e76-aa00-f1273043c818',
													entityType: 'product-hierarchy',
													lang: 'en-US',
													text: 'Product 4'
												},
												position: 4
											}
										]
									}
								]
							}
						]
					}
				]
			}
		]
	};

	// const url = new URL(`${apiUrl}/pim/api/v1/product-hierarchy`);
	// url.searchParams.append('language', get(currentLanguage));

	// return await handleFetch(url, FetchMethods.GET);
}

// async function getCategoriesHierarchy() {
// 	return mockCategories;
// }

async function listDriveFiles(folderId: string) {
	return await handleFetch(
		`${apiUrl}/pim/api/v1/google-drive/list?folderId=${folderId}`,
		FetchMethods.GET
	);
}

async function uploadPrices(payload: UploadDTO) {
	return await handleFetch(
		`${apiUrl}/pim/api/v1/movies/files/uploads`,
		FetchMethods.POST,
		{},
		payload
	);
}

async function getHistoryUploads(query: any) {
	return {
		content: [
			{
				id: 1,
				filename: 'test_sk.txt',
				externalFileId: '13qsuecO6Hvvbx9wMq2SvfaEhDhWhZIxQ',
				externalBucketPath: 'DEV/priceData/in/test_sk.txt',
				mimeType: 'text/plain',
				size: '4 B',
				status: 'STARTED',
				processingType: 'priceData',
				processingId: '5240f5ac-9029-48f3-b5dd-88d60b22c46c',
				uploadedUrl: 's3://hcp-f0d3380c-057b-44f3-b351-406806116fcd/DEV/priceData/in/test_sk.txt',
				attemptCount: 0,
				lastErrorMessage: null,
				lastModifiedDate: 1764680994110,
				lastModifiedBy: 'system:priceData-processor',
				createdDate: 1764680983552,
				createdBy: 'pan_kharkov',
				version: 6,
				googleDriveUrl:
					'https://drive.google.com/drive/folders/1sjB6UHIB-GQTuNrpfgWSvlm-VEOet0gX?usp=drive_link',
				folderName: ''
			},
			{
				id: 3,
				filename: 'Deutschland_0002_2026_K.xlsx',
				externalFileId: '1bpRf8bKaoWNE9XC2nBOF22GRvkkkb_wn',
				externalBucketPath: 'DEV/priceData/in/Deutschland_0002_2026_K.xlsx',
				mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				size: '224.4 kB',
				status: 'STARTED',
				processingType: 'priceData',
				processingId: 'a889f343-86b2-4765-b279-96b1f3d735ae',
				uploadedUrl:
					's3://hcp-f0d3380c-057b-44f3-b351-406806116fcd/DEV/priceData/in/Deutschland_0002_2026_K.xlsx',
				attemptCount: 0,
				lastErrorMessage: null,
				lastModifiedDate: 1764867396440,
				lastModifiedBy: 'system:priceData-processor',
				createdDate: 1764842380213,
				createdBy: 'pan_tomozei',
				version: 2448,
				googleDriveUrl: null,
				folderName: null
			},
			{
				id: 4,
				filename: 'Deutschland_0002_2026_K.xlsx',
				externalFileId: '1bpRf8bKaoWNE9XC2nBOF22GRvkkkb_wn',
				externalBucketPath: 'DEV/priceData/in/Deutschland_0002_2026_K.xlsx',
				mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				size: '224.4 kB',
				status: 'STARTED',
				processingType: 'priceData',
				processingId: '35d6cc90-5bac-49d5-b88a-0f9ab9389d63',
				uploadedUrl:
					's3://hcp-f0d3380c-057b-44f3-b351-406806116fcd/DEV/priceData/in/Deutschland_0002_2026_K.xlsx',
				attemptCount: 0,
				lastErrorMessage: null,
				lastModifiedDate: 1764867313093,
				lastModifiedBy: 'system:priceData-processor',
				createdDate: 1764844235860,
				createdBy: 'pan_tomozei',
				version: 2112,
				googleDriveUrl: null,
				folderName: null
			},
			{
				id: 9,
				filename: 'Deutschland_0002_2026_K.xlsx',
				externalFileId: '1bpRf8bKaoWNE9XC2nBOF22GRvkkkb_wn',
				externalBucketPath: 'DEV/priceData/in/Deutschland_0002_2026_K.xlsx',
				mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				size: '224.6 kB',
				status: 'STARTED',
				processingType: 'priceData',
				processingId: '55ab8c31-022b-4608-88ba-6d138133344f',
				uploadedUrl:
					's3://hcp-f0d3380c-057b-44f3-b351-406806116fcd/DEV/priceData/in/Deutschland_0002_2026_K.xlsx',
				attemptCount: 0,
				lastErrorMessage: null,
				lastModifiedDate: 1765358339728,
				lastModifiedBy: 'system:priceData-processor',
				createdDate: 1765358331215,
				createdBy: 'pan_tomozei',
				version: 6,
				googleDriveUrl: 'https://drive.google.com/drive/folders/1zZ-Q6oT3uP91vaxeweqFehDhvCAYyIEy',
				folderName: 'Pricing_worldwide'
			}
		],
		pageable: {
			pageNumber: 0,
			pageSize: 100,
			sort: {
				empty: false,
				sorted: true,
				unsorted: false
			},
			offset: 0,
			paged: true,
			unpaged: false
		},
		last: true,
		totalElements: 4,
		totalPages: 1,
		first: true,
		size: 100,
		number: 0,
		sort: {
			empty: false,
			sorted: true,
			unsorted: false
		},
		numberOfElements: 4,
		empty: false
	};
	return await handleFetch(`${apiUrl}/pim/api/v1/movies/files/uploads?${query}`, FetchMethods.GET);
}

async function getAllTemplates() {
	return await handleFetch(`/api/mock/getAllTemplates`, FetchMethods.GET);
}

async function getTemplate(id: string) {
	return await handleFetch(`/api/mock/templates/${id}`, FetchMethods.GET);
}

async function getAllStructures() {
	return await handleFetch(`/api/mock/getAllStructures`, FetchMethods.GET);
}

async function getLatestImportHistory() {
	return await handleFetch(`${apiUrl}/pim/api/v1/movies/files/uploads/latest`, FetchMethods.GET);
}

async function downloadUploadedFile(query: any) {
	return await handleFetch(
		`${apiUrl}/pim/api/v1/movies/files/download/${query}`,
		FetchMethods.GET,
		{},
		undefined,
		'blob'
	);
}

async function deleteUploadedFile(query: any) {
	return await handleFetch(
		`${apiUrl}/pim/api/v1/movies/files/download/${query}`,
		FetchMethods.DELETE
	);
}

async function getUploadProcessingLog(query: any) {
	return await handleFetch(
		`${apiUrl}/pim/api/v1/movies/files/uploads/logs?${query}`,
		FetchMethods.GET
	);
}

/**
 * Mock calls
 */

async function getTakenNames(name: any) {
	if (name == 'name1') return { name: true };
}

async function getPropertyBarCategories() {
	return await handleFetch(`/api/mock/property-bar/category`, FetchMethods.GET);
}

async function updateCategory(category: any) {
	const id: string | undefined = category.id;
	return await handleFetch(
		`/api/mock/property-bar/category/${id}`,
		FetchMethods.PUT,
		{},
		{ body: category }
	);
}

async function deleteCategory(category: any) {
	const id: string | undefined = category.id;
	return await handleFetch(`/api/mock/property-bar/category/${id}`, FetchMethods.DELETE);
}

async function getPropertiesOfPropertyBar(propertyBar: any) {
	const id: string | undefined = propertyBar.id;
	return await handleFetch(`/api/mock/property-bar/comments/${id}`, FetchMethods.GET);
}

// async function getPropertyBars(id: string) {
// 	return await handleFetch(`/api/mock/property-bar/`, FetchMethods.GET);
// }

async function getPropertyKeyOptions() {
	return await handleFetch(`/api/mock/property-bar/property-key-options/`, FetchMethods.GET);
}

async function assignPropertBarsToSelectedArticle(payload: unknown) {
	return await handleFetch(`/api/mock/property-bar/comments/assign`, FetchMethods.PUT, {}, payload);
}

async function removePropertBarsFromSelectedArticle(payload: unknown) {
	return await handleFetch(
		`/api/mock/property-bar/comments/remove`,
		FetchMethods.DELETE,
		{},
		payload
	);
}

async function getAllUsers() {
	return await handleFetch(`${apiUrl}/getAllUsers`, FetchMethods.GET);
}

async function getAllCommentsByUser(userId: any) {
	return await handleFetch(`${apiUrl}/comments/user/${userId}`, FetchMethods.GET);
}

async function getmoviesByActor(actor: any) {
	return await handleFetch(`${apiUrl}/getmoviesByActor?actor=${actor}`, FetchMethods.GET);
}

async function getCommentsByMovieId(id: any) {
	return await handleFetch(`${apiUrl}/comments/movie/${id}`, FetchMethods.GET);
}

async function addCommentsByMovieId(id: any, comment: any, userId: any) {
	return await handleFetch(
		`${apiUrl}/comments/?id=${id}`,
		FetchMethods.POST,
		{},
		{
			content: comment,
			userId: userId
		}
	);
}

/**
 * Export APIs
 */

export { getProductHierarchy };

export const ArticleAPIService = {
	assignPropertBarsToSelectedArticle,
	removePropertBarsFromSelectedArticle
};

export const PropertyBarAPIService = {
	getPropertyBarCategories,
	// getPropertyBars,
	getPropertyKeyOptions,
	updateCategory,
	deleteCategory,
	getPropertiesOfPropertyBar
};

export const ImportFilesAPIService = {
	listDriveFiles,
	uploadPrices,
	getHistoryUploads,
	downloadUploadedFile,
	getLatestImportHistory,
	deleteUploadedFile,
	getUploadProcessingLog
};

export const UsersAPIService = {
	getAllUsers
};

export const CommentsAPIService = {
	getAllCommentsByUser
};

export const moviesAPIService = {
	getAllMovies,
	getmoviesByActor,
	getCommentsByMovieId,
	addCommentsByMovieId
};

export const UsedNamesAPIService = {
	getTakenNames
};

export const PublicationAPIService = {
	getAllTemplates,
	getTemplate
};

export const StructuresAPIService = {
	getAllStructures
};

// async function sampleRequest(body: unknown) {
// 	const headers = { 'X-Repository-Id': 'Example' };
// 	const url = new URL(`${rdfManagerUrl}/rdf-manager/api/v1/comments`);
// 	url.searchParams.append('agentId', 'john doe');
// 	url.searchParams.append('agentRole', 'manager');
// 	url.searchParams.append('graphName', 'MOVIES');

// 	return await handleFetch(url, FetchMethods.PUT, headers, body);
// }
