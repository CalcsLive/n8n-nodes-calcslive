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
			// Load available input PQs from validate endpoint - truly dynamic
			async getInputPQs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const articleId = this.getCurrentNodeParameter('articleId') as string;
				
				if (!articleId) {
					return [{ name: 'Enter Article ID first', value: '' }];
				}
				
				try {
					const credentials = await this.getCredentials('calcsLiveApi');
					const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
					});
					
					if (!response.success || !response.metadata?.inputPQs) {
						return [{ name: 'No input PQs found', value: '' }];
					}
					
					// Use real PQ data with faceValue and unit - this will trigger UI refresh
					const options = response.metadata.inputPQs.map((pq: any) => ({
						name: `${pq.symbol} (${pq.faceValue || 'default'} ${pq.unit})`,
						value: JSON.stringify({
							symbol: pq.symbol,
							faceValue: pq.faceValue,
							unit: pq.unit,
							categoryId: pq.categoryId
						}), // Embed metadata in value for later use
					}));
					
					return options;
					
				} catch (error: any) {
					return [{ name: `Error: ${error.message || 'Failed to load'}`, value: '' }];
				}
			},

			// Load available output PQs from validate endpoint - truly dynamic  
			async getOutputPQs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const articleId = this.getCurrentNodeParameter('articleId') as string;
				
				if (!articleId) {
					return [{ name: 'Enter Article ID first', value: '' }];
				}
				
				try {
					const credentials = await this.getCredentials('calcsLiveApi');
					const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
					});
					
					if (!response.success || !response.metadata?.outputPQs) {
						return [{ name: 'No output PQs found', value: '' }];
					}
					
					const options = response.metadata.outputPQs.map((pq: any) => ({
						name: `${pq.symbol} (default: ${pq.unit})`,
						value: JSON.stringify({
							symbol: pq.symbol,
							unit: pq.unit,
							categoryId: pq.categoryId
						}), // Embed metadata in value for later use
					}));
					
					return options;
					
				} catch (error: any) {
					return [{ name: `Error: ${error.message || 'Failed to load'}`, value: '' }];
				}
			},

			// Load unit options for a specific category - dynamic per PQ
			async getUnitsForCategory(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const categoryId = this.getCurrentNodeParameter('categoryId') as string;
				const articleId = this.getCurrentNodeParameter('articleId') as string;
				
				if (!articleId || !categoryId) {
					return [{ name: 'Loading...', value: '' }];
				}
				
				try {
					const credentials = await this.getCredentials('calcsLiveApi');
					const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
					});
					
					if (!response.success || !response.metadata?.availableUnits?.[categoryId]) {
						return [{ name: 'No units found', value: '' }];
					}
					
					const units = response.metadata.availableUnits[categoryId];
					const options = units.map((unit: string) => ({
						name: unit,
						value: unit,
					}));
					
					return options;
					
				} catch (error: any) {
					return [{ name: `Error: ${error.message}`, value: '' }];
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
			// Legacy mode - simple JSON input
			{
				displayName: 'Inputs',
				name: 'inputs',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['legacy'],
					},
				},
				default: '{\n  "symbol1": { "value": 100, "unit": "unit1" },\n  "symbol2": { "value": 10, "unit": "unit2" }\n}',
				description: 'Physical quantities with values and units. Replace symbols and values with those from your specific calc.',
			},
			{
				displayName: 'Outputs (Optional)',
				name: 'outputs',
				type: 'json',
				required: false,
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['legacy'],
					},
				},
				default: '',
				description: 'Specify output units (optional). Example: {"result": {"unit": "km/h"}}. Leave empty to get all outputs with default units.',
			},
			// Enhanced mode - Dynamic PQ selection
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
				description: 'Select input physical quantities to configure. Values and units shown from the calc.',
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
				description: 'Select output physical quantities. Leave empty to get all outputs with default units.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		console.log('\n🚀 === NEW TEST EXECUTION STARTED ===');
		console.log('Timestamp:', new Date().toISOString());
		console.log('=========================================\n');
		
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
							// Legacy mode - manual JSON input with optional outputs
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
							
							// Parse outputs if provided, otherwise return all outputs
							try {
								outputs = outputsRaw && outputsRaw.trim() ? JSON.parse(outputsRaw) : undefined;
							} catch (error) {
								throw new NodeOperationError(this.getNode(), 'Invalid JSON format in outputs field', {
									itemIndex: i,
									description: 'Please check the outputs JSON format',
								});
							}
						} else {
							// Enhanced mode - build inputs/outputs from dynamic multiOptions selections
							const selectedInputPQs = this.getNodeParameter('selectedInputPQs', i) as string[];
							const selectedOutputPQs = this.getNodeParameter('selectedOutputPQs', i) as string[];
							
							// Get PQ metadata to use real faceValues and units
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
								console.error('Failed to get metadata for enhanced mode:', error);
							}
							
							// Build inputs object from selected PQs using embedded metadata
							inputs = {};
							if (selectedInputPQs && selectedInputPQs.length > 0) {
								for (const pqData of selectedInputPQs) {
									try {
										// Parse the embedded JSON metadata from the multiOptions value
										const pqInfo = JSON.parse(pqData);
										const symbol = pqInfo.symbol;
										
										(inputs as any)[symbol] = {
											value: pqInfo.faceValue || 1,
											unit: pqInfo.unit || '',
										};
										console.log(`Built input for ${symbol}:`, (inputs as any)[symbol]);
									} catch (error) {
										console.error('Failed to parse PQ data:', pqData, error);
									}
								}
							}
							
							// Build outputs object from selected PQs using embedded metadata
							outputs = undefined;
							if (selectedOutputPQs && selectedOutputPQs.length > 0) {
								outputs = {};
								for (const pqData of selectedOutputPQs) {
									try {
										// Parse the embedded JSON metadata from the multiOptions value
										const pqInfo = JSON.parse(pqData);
										const symbol = pqInfo.symbol;
										
										(outputs as any)[symbol] = {
											unit: pqInfo.unit || '',
										};
										console.log(`Built output for ${symbol}:`, (outputs as any)[symbol]);
									} catch (error) {
										console.error('Failed to parse output PQ data:', pqData, error);
									}
								}
								
								// If no output units specified, let API return all
								if (Object.keys(outputs).length === 0) {
									outputs = undefined;
								}
							}
							
							console.log('Final built inputs object:', inputs);
							console.log('Final built outputs object:', outputs);
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