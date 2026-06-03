import { goto as svelteGoto } from '$app/navigation';
import { base } from '$app/paths';

export const goto = (path: string) => svelteGoto(`${base}${path}`);
