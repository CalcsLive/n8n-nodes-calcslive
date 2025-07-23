import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';

export class CalcsLive implements INodeType {
	methods = {
		loadOptions: {
			// Load available input PQs from validate endpoint
			async getInputPQs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const articleId = this.getCurrentNodeParameter('articleId') as string;
				
				console.log('getInputPQs called with articleId:', articleId);
				
				if (!articleId) {
					console.log('No articleId provided, returning empty array');
					return [{ name: 'Enter Article ID first', value: '' }];
				}
				
				try {
					const credentials = await this.getCredentials('calcsLiveApi');
					const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
					const url = `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`;
					
					console.log('Making request to:', url);
					
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url,
					});
					
					console.log('API response:', response);
					
					if (!response.success) {
						console.error('API returned error:', response.message);
						return [{ name: `Error: ${response.message || 'Failed to load PQs'}`, value: '' }];
					}
					
					if (!response.metadata || !response.metadata.inputPQs) {
						console.error('No inputPQs in response metadata');
						return [{ name: 'No input PQs found', value: '' }];
					}
					
					const options = response.metadata.inputPQs.map((pq: any) => ({
						name: `${pq.symbol} (${pq.defaultValue} ${pq.defaultUnit})`,
						value: pq.symbol,
					}));
					
					console.log('Returning input PQ options:', options);
					return options;
					
				} catch (error: any) {
					console.error('Failed to load input PQs:', error);
					return [{ name: `Error: ${error.message || 'Unknown error'}`, value: '' }];
				}
			},

			// Load available output PQs from validate endpoint
			async getOutputPQs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const articleId = this.getCurrentNodeParameter('articleId') as string;
				
				console.log('getOutputPQs called with articleId:', articleId);
				
				if (!articleId) {
					console.log('No articleId provided for outputs');
					return [{ name: 'Enter Article ID first', value: '' }];
				}
				
				try {
					const credentials = await this.getCredentials('calcsLiveApi');
					const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
					const url = `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`;
					
					console.log('Making request to:', url);
					
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url,
					});
					
					console.log('API response for outputs:', response);
					
					if (!response.success) {
						console.error('API returned error for outputs:', response.message);
						return [{ name: `Error: ${response.message || 'Failed to load PQs'}`, value: '' }];
					}
					
					if (!response.metadata || !response.metadata.outputPQs) {
						console.error('No outputPQs in response metadata');
						return [{ name: 'No output PQs found', value: '' }];
					}
					
					const options = response.metadata.outputPQs.map((pq: any) => ({
						name: `${pq.symbol} (default: ${pq.defaultUnit})`,
						value: pq.symbol,
					}));
					
					console.log('Returning output PQ options:', options);
					return options;
					
				} catch (error: any) {
					console.error('Failed to load output PQs:', error);
					return [{ name: `Error: ${error.message || 'Unknown error'}`, value: '' }];
				}
			},

			// Load PQ metadata for defaults (used internally)
			async getPQMetadata(this: ILoadOptionsFunctions): Promise<any> {
				const articleId = this.getCurrentNodeParameter('articleId') as string;
				const credentials = await this.getCredentials('calcsLiveApi');
				
				if (!articleId) {
					return null;
				}
				
				try {
					const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
					});
					
					if (!response.success) {
						return null;
					}
					
					return response.metadata;
					
				} catch (error) {
					console.error('Failed to load PQ metadata:', error);
					return null;
				}
			},

		},
	};

	description: INodeTypeDescription = {
		displayName: 'CalcsLive Calculator',
		name: 'calcsLive',
		// icon: 'file:calcslive.svg',
		icon: 'file:e3d-logo2.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["articleId"]}}',
		description: 'Perform calculations using CalcsLive API',
		defaults: {
			name: 'CalcsLive Calculator',
		},
		inputs: [{ displayName: '', type: NodeConnectionType.Main }],
		outputs: [{ displayName: '', type: NodeConnectionType.Main }],
		credentials: [
			{
				name: 'calcsLiveApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Calculation',
						value: 'calculation',
					},
				],
				default: 'calculation',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['calculation'],
					},
				},
				options: [
					{
						name: 'Execute',
						value: 'execute',
						description: 'Execute a calculation with given inputs',
						action: 'Execute a calculation',
					},
				],
				default: 'execute',
			},
			{
				displayName: 'Article ID',
				name: 'articleId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
					},
				},
				default: '',
				placeholder: '3LYPD4C96-34U',
				description: 'The calculation article identifier from CalcsLive. Enter this first, then configure inputs and outputs below.',
			},
			{
				displayName: 'Configuration Mode',
				name: 'configMode',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
					},
				},
				options: [
					{
						name: 'Enhanced (Dynamic Fields)',
						value: 'enhanced',
						description: 'Use dynamic fields with PQ selection and unit dropdowns',
					},
					{
						name: 'Legacy (JSON Input)',
						value: 'legacy',
						description: 'Use raw JSON input (backward compatibility)',
					},
				],
				default: 'enhanced',
				description: 'Choose configuration mode',
			},
			// Legacy mode - auto-uses all input PQs with defaults, returns all outputs
			{
				displayName: 'Legacy Mode Info',
				name: 'legacyInfo',
				type: 'notice',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['legacy'],
					},
				},
				default: '',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['legacy'],
					},
				},
				typeOptions: {
					theme: 'info',
				},
				description: 'Legacy mode automatically uses all available input PQs with their default values and returns all outputs. No manual configuration needed.',
			},
			// Enhanced mode fields - use multiOptions for PQ selection with dynamic fields
			{
				displayName: 'Select Input PQs',
				name: 'selectedInputPQs',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getInputPQs',
				},
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: [],
				description: 'Select which input physical quantities to provide values for. Default values and units are shown in options.',
			},
			{
				displayName: 'Select Output PQs',
				name: 'selectedOutputPQs',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getOutputPQs',
				},
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: [],
				description: 'Select which output physical quantities to calculate. Leave empty to get all outputs. Default units are shown in options.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		if (resource === 'calculation') {
			if (operation === 'execute') {
				for (let i = 0; i < items.length; i++) {
					try {
						const articleId = this.getNodeParameter('articleId', i) as string;
						const configMode = this.getNodeParameter('configMode', i) as string;

						if (!articleId) {
							throw new NodeOperationError(this.getNode(), 'Article ID is required', {
								itemIndex: i,
							});
						}

						let inputs: object;
						let outputs: object | undefined;

						if (configMode === 'legacy') {
							// Legacy JSON mode
							const inputsRaw = this.getNodeParameter('inputs', i) as string;
							const outputsRaw = this.getNodeParameter('outputs', i) as string;
							
							try {
								inputs = JSON.parse(inputsRaw);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), 'Invalid JSON format in inputs field', {
									itemIndex: i,
									description: 'Please check the inputs JSON format',
								});
							}
							
							try {
								outputs = outputsRaw && outputsRaw.trim() ? JSON.parse(outputsRaw) : undefined;
							} catch (error) {
								throw new NodeOperationError(this.getNode(), 'Invalid JSON format in outputs field', {
									itemIndex: i,
									description: 'Please check the outputs JSON format',
								});
							}
						} else {
							// Enhanced mode - build inputs/outputs from multiOptions selections
							const selectedInputPQs = this.getNodeParameter('selectedInputPQs', i) as string[];
							const selectedOutputPQs = this.getNodeParameter('selectedOutputPQs', i) as string[];
							
							// Get PQ metadata to use defaults
							const creds = await this.getCredentials('calcsLiveApi');
							const baseUrl = creds.baseUrl || 'https://www.calcs.live';
							let metadata: any = null;
							
							try {
								const response = await this.helpers.httpRequest({
									method: 'GET',
									url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${creds.apiKey}`,
								});
								
								if (response.success) {
									metadata = response.metadata;
								}
							} catch (error) {
								console.error('Failed to get metadata for defaults:', error);
							}
							
							// Build inputs object from selected PQs using defaults
							inputs = {};
							if (selectedInputPQs && selectedInputPQs.length > 0 && metadata) {
								for (const pqSymbol of selectedInputPQs) {
									const pqData = metadata.inputPQs.find((pq: any) => pq.symbol === pqSymbol);
									if (pqData) {
										(inputs as any)[pqSymbol] = {
											value: pqData.defaultValue || 0,
											unit: pqData.defaultUnit || '',
										};
									}
								}
							}
							
							// Build outputs object from selected PQs using defaults
							outputs = undefined;
							if (selectedOutputPQs && selectedOutputPQs.length > 0 && metadata) {
								outputs = {};
								
								for (const pqSymbol of selectedOutputPQs) {
									const pqData = metadata.outputPQs.find((pq: any) => pq.symbol === pqSymbol);
									if (pqData) {
										(outputs as any)[pqSymbol] = {
											unit: pqData.defaultUnit || '',
										};
									}
								}
								
								// If no output units specified, don't send outputs parameter (let API return all)
								if (Object.keys(outputs).length === 0) {
									outputs = undefined;
								}
							}
						}

						const credentials = await this.getCredentials('calcsLiveApi');
						
						const requestBody = {
							articleId,
							apiKey: credentials.apiKey,
							inputs,
							...(outputs && Object.keys(outputs).length > 0 && { outputs }),
						};

						const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
						const fullUrl = `${baseUrl}/api/n8n/calculate`;
						
						console.log('Making request to:', fullUrl);
						console.log('Request body:', JSON.stringify(requestBody, null, 2));
						
						const response = await this.helpers.httpRequest({
							method: 'POST',
							url: fullUrl,
							body: requestBody,
							headers: {
								'Content-Type': 'application/json',
							},
						});

						console.log('Full API response:', JSON.stringify(response, null, 2));
						console.log('Response inputs:', response.inputs);
						console.log('Response outputs:', response.outputs);

						if (response.success === true) {
							returnData.push({
								json: {
									articleId: response.articleId,
									success: response.success,
									inputs: response.inputs,
									outputs: response.outputs,
									timestamp: response.timestamp,
									metadata: response.metadata,
								},
								pairedItem: {
									item: i,
								},
							});
						} else {
							throw new NodeOperationError(
								this.getNode(),
								`API returned error: ${response.message || 'Unknown error'}`,
								{
									itemIndex: i,
									description: response.details || 'Check your article ID and inputs',
								},
							);
						}
					} catch (error: any) {
						console.log('Error details:', error);
						console.log('Error response:', error.response);
						
						if (error.response?.status === 401) {
							throw new NodeOperationError(
								this.getNode(),
								'Invalid API key. Please check your CalcsLive API credentials.',
								{
									itemIndex: i,
								},
							);
						} else if (error.response?.status === 404) {
							throw new NodeOperationError(
								this.getNode(),
								`Article not found. Please verify the article ID exists and is accessible.`,
								{
									itemIndex: i,
								},
							);
						} else if (error.response?.status === 400) {
							const errorMessage = error.response?.data?.message || 'Invalid request';
							throw new NodeOperationError(
								this.getNode(),
								`Bad request: ${errorMessage}. Please check your inputs and units.`,
								{
									itemIndex: i,
								},
							);
						} else if (error.response?.status === 429) {
							throw new NodeOperationError(
								this.getNode(),
								'Rate limit exceeded. Please wait before making more requests.',
								{
									itemIndex: i,
								},
							);
						} else if (error instanceof NodeOperationError) {
							throw error;
						} else {
							throw new NodeOperationError(
								this.getNode(),
								`Unexpected error: ${error.message}`,
								{
									itemIndex: i,
								},
							);
						}
					}
				}
			}
		}

		return [returnData];
	}
}