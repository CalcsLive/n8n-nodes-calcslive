import { ICredentialType, INodeProperties } from 'n8n-workflow';

/**
 * Credentials for the Calculation API.
 *
 * This credential stores the base URL of your calculation service and
 * the API key used to authenticate requests. When configuring the node in n8n
 * you should add a new credential of this type and provide both values.
 */
export class CalculationApi implements ICredentialType {
  name = 'calculationApi';
  displayName = 'Calculation API';
  // Generic description shown in the credentials UI
  documentationUrl = 'https://docs.example.com';
  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://www.calcs.live',
      placeholder: 'https://www.calcs.live',
      description:
        'The root URL of the calculation API (e.g. https://www.calcs.live). Do not include a trailing slash.',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      default: '',
      description: 'Your n8n integration API key. See Account → API & Integration Settings.',
    },
  ];
}