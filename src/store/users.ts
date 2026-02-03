import { writable, type Writable } from 'svelte/store';
import { UsersAPIService } from '$services/apiService';

export const users: Writable<any> = writable([]);

async function fetchUsers() {
	users.set(await UsersAPIService.getAllUsers());
}

export const usersStore = {
	fetchUsers
};
