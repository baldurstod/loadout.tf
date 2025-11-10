import { JSONObject } from 'harmony-types';

export async function fetchShopAPI(action: string, version: number, params?: JSONObject) {
	const requestId = crypto.randomUUID();
	let fetchOptions = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Request-ID': requestId,
		},
		body: JSON.stringify(
			{
				action: action,
				version: version,
				params: params,
			}
		),
	};

	const response = await fetch('__shopEndpoint__' + '/api', fetchOptions);
	return { requestId: requestId, response: await response.json() };
}
