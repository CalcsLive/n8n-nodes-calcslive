import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CalcsLiveApi implements ICredentialType {
	name = 'calcsLiveApi';
	displayName = 'CalcsLive API';
	documentationUrl = 'https://www.calcs.live/docs/api';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your CalcsLive API key. You can obtain this from your CalcsLive account settings.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://www.calcs.live',
			description: 'The base URL for the CalcsLive API (e.g., https://www.calcs.live). Do NOT include the endpoint path.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Authorization': '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.baseUrl || "https://www.calcs.live"}}',
			url: '/api/n8n/calculate',
			method: 'POST',
			body: {
				articleId: 'test',
				apiKey: '={{$credentials.apiKey}}',
				inputs: { x: { value: 1, unit: 'm' } },
			},
		},
		rules: [
			{
				type: 'responseCode',
				properties: {
					message: 'API key is valid (test calculation attempted)',
					value: 400,
				},
			},
		],
	};
}