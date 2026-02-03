export async function GET({ request }) {
	const headers = request.headers;
	const authorizationHeader = headers.get('authorization');
	if (!authorizationHeader) {
		return new Response('Authorization header not found', { status: 401 });
	}

	return new Response(JSON.stringify({ token: authorizationHeader }));
}
