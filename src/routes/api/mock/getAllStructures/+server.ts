import { payload } from '$store/mocked/structures';

export async function GET() {
	return new Response(JSON.stringify(payload));
}
