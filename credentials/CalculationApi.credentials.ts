import { ICredentialType, INodeProperties } from 'n8n-workflow';

/**
 * Credentials for the CalcsLive API.
 *
 * This credential stores the base URL of the CalcsLive calculation service and
 * the API key used to authenticate requests. The API key is securely masked
 * in the UI to prevent accidental exposure.
 *
 * To obtain your API key:
 * 1. Sign up for CalcsLive Premium or Enterprise
 * 2. Navigate to Account → API & Integration Settings
 * 3. Create a new API key with 'n8n' service type
 */
export class CalculationApi implements ICredentialType {
  name = 'calcsLiveApi';
  displayName = 'CalcsLive API';
  documentationUrl = 'https://www.calcs.live/content/docs/api/n8n-integration';
  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      required: true,
      default: 'https://www.calcs.live',
      placeholder: 'https://www.calcs.live',
      description:
        'The root URL of the CalcsLive API. Use https://www.calcs.live for production. Do not include a trailing slash.',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      required: true,
      default: '',
      placeholder: 'n8n_fd624b8181e08798ddefc230d6ebdba2...',
      typeOptions: {
        password: true,
      },
      description: 'Your CalcsLive n8n integration API key (format: n8n_[64-char-hex]). Requires Premium or Enterprise subscription. Get yours at Account → API & Integration Settings.',
    },
  ];
}