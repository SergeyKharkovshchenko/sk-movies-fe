import { payload } from '$store/mocked/templates';

export async function GET() {
	return new Response(JSON.stringify(payload));
}
