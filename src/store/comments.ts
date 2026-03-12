import { get, writable, type Writable } from 'svelte/store';
import { CommentsAPIService } from '$services/apiService';

export const comments: Writable<any> = writable({});

async function getAllCommentsByUser(userId: any) {
	const commentsUpdate = await CommentsAPIService.getAllCommentsByUser(userId);
	let currentComments: any = get(comments);
	currentComments = { ...currentComments, [userId]: commentsUpdate };
	console.log(currentComments);
	comments.set(currentComments);
}

async function handleCreateEmbeddings(userId: any) {
	const res = await CommentsAPIService.handleCreateEmbeddings(userId);
	console.log(res);
	return res;
}

async function findMostSimilarUsers(userId: any) {
	const res = await CommentsAPIService.findMostSimilarUsers(userId);
	console.log(res);
	similarityTable.set(res);
	return res;
}

export const similarityTable: Writable<any> = writable([]);

export const commentsStore = {
	getAllCommentsByUser,
	handleCreateEmbeddings,
	findMostSimilarUsers
};
