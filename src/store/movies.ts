import { derived, writable, type Writable } from 'svelte/store';
import { moviesAPIService } from '$services/apiService';

export const movies: Writable<any> = writable([]);
export const comments: Writable<any> = writable({});

async function getAllMovies() {
	movies.set(await moviesAPIService.getAllMovies());
}

async function getmoviesByActor(actor: any) {
	movies.set(await moviesAPIService.getmoviesByActor(actor));
}

async function getCommentsByMovieId(id: any) {
	const commentsById = await moviesAPIService.getCommentsByMovieId(id);

	comments.update((comments) => ({
		...comments,
		[id]: commentsById
	}));
}

async function addCommentsByMovieId(comment: any, id: any, user: any) {
	const commentsById = await moviesAPIService.addCommentsByMovieId(id, comment, user.userId);
	comments.update((commments) => ({
		...commments,
		id: commentsById
	}));
}

export const filters: Writable<{ search: string }> = writable({
	search: ''
});

export const filteredMovies = derived([movies, filters], ([$data, $filters]) => {
	return $data.filter(
		(movie: any) =>
			!$filters.search || movie.movieTitle.toLowerCase().includes($filters.search.toLowerCase())
	);
});

export const moviesStore = {
	getAllMovies,
	getmoviesByActor,
	getCommentsByMovieId,
	addCommentsByMovieId
};

const initialSelectedMovies: any = {
	name: '',
	key: '',
	genre: '',
	active: '',
	required: '',
	readonly: ''
};
const _selectedMovie: Writable<any> = writable(initialSelectedMovies);

export const selectedMovie = {
	subscribe: _selectedMovie.subscribe,
	set: _selectedMovie.set,
	update: _selectedMovie.update,
	reset: () => _selectedMovie.set(initialSelectedMovies)
};
