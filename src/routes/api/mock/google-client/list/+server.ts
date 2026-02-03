// import type { ListFilesDTO } from '$lib/interfaces/google-client/ListFilesDTO';
// import { fakeWait } from '$lib/utils/fakeWait';

// export async function GET({ request }) {
// 	const payload = {
// 		name: 'Root',
// 		id: 'root',
// 		mimeType: 'application/vnd.google-apps.folder',
// 		children: [
// 			{
// 				id: '1fdgepsLvdCckYR-JWwhGrKXyObGmZ_Hg',
// 				name: 'POC_test_1',
// 				mimeType: 'application/vnd.google-apps.folder',
// 				lastModifiedDate: '2024-11-25T10:12:33.674Z',
// 				children: [
// 					{
// 						id: '1MuEYGftKPoswPjct_gzjDK646LNNRMgQ',
// 						name: 'requirements.txt',
// 						mimeType: 'text/plain',
// 						fileSize: '1.9 kB',
// 						lastModifiedDate: '2024-08-22T14:33:05.992Z'
// 					},
// 					{
// 						id: '1MuEYGftKPoswPjct_gzjDK646LNNRMgQ_1',
// 						name: 'prices.xlsx',
// 						mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
// 						fileSize: '48.79 kB',
// 						lastModifiedDate: '2024-08-23T16:36:04.992Z'
// 					}
// 				]
// 			}
// 		]
// 	};
// 	// mock response loading
// 	await fakeWait(2);
// 	return new Response(JSON.stringify(payload as ListFilesDTO));
// }
