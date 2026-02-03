import { get, writable, type Writable } from 'svelte/store';
import { CommentsAPIService } from '$services/apiService';

export const comments: Writable<any> = writable({});

async function getAllCommentsByUser(userId: any) {
	const commentsUpdate = await CommentsAPIService.getAllCommentsByUser(userId);
	let currentComments: any = get(comments);
	currentComments = {...currentComments, [userId]:commentsUpdate}  ;
	console.log(currentComments)
	comments.set(currentComments);
}

export const commentsStore = {
	getAllCommentsByUser
};
