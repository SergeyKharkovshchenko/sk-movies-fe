import { getTemplateById } from '$store/mocked/templates';

export function GET({ params }) {
	const res = getTemplateById(params.id);
	return new Response(JSON.stringify(res));
}
