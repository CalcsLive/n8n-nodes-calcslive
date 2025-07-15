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
				const credentials = await this.getCredentials('calcsLiveApi');
				
				if (!articleId) {
					return [];
				}
				
				try {
					const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
					});
					
					if (!response.success) {
						throw new Error(response.message || 'Failed to load PQs');
					}
					
					return response.metadata.inputPQs.map((pq: any) => ({
						name: pq.symbol,
						value: pq.symbol,
					}));
					
				} catch (error) {
					console.error('Failed to load input PQs:', error);
					return [];
				}
			},

			// Load available output PQs from validate endpoint
			async getOutputPQs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const articleId = this.getCurrentNodeParameter('articleId') as string;
				const credentials = await this.getCredentials('calcsLiveApi');
				
				if (!articleId) {
					return [];
				}
				
				try {
					const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
					});
					
					if (!response.success) {
						throw new Error(response.message || 'Failed to load PQs');
					}
					
					return response.metadata.outputPQs.map((pq: any) => ({
						name: pq.symbol,
						value: pq.symbol,
					}));
					
				} catch (error) {
					console.error('Failed to load output PQs:', error);
					return [];
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
			// Legacy JSON mode fields
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
				default: '{\n  "x": { "value": 360, "unit": "km" },\n  "y": { "value": 10, "unit": "h" }\n}',
				description: 'Physical quantities with values and units for the calculation',
			},
			{
				displayName: 'Outputs',
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
				default: '{\n  "s": { "unit": "km/h" }\n}',
				description: 'Desired output units (optional). If not specified, default units will be used.',
			},
			// Enhanced mode fields - simplified approach with better defaults
			{
				displayName: 'Input PQs',
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
				description: 'Select which input physical quantities to provide values for. Enter Article ID first.',
			},
			{
				displayName: 'Output PQs',
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
				description: 'Select which output physical quantities to calculate. Leave empty to get all outputs.',
			},
			// Simple individual fields for each PQ (no unit dropdowns for now)
			{
				displayName: 'Input (x) Value',
				name: 'inputValue_x',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
						selectedInputPQs: ['x'],
					},
				},
				default: '360',
				placeholder: '360 or {{ $json.value }}',
				description: 'Value for input PQ x (supports expressions)',
			},
			{
				displayName: 'Input (x) Unit',
				name: 'inputUnit_x',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
						selectedInputPQs: ['x'],
					},
				},
				default: 'km',
				placeholder: 'km',
				description: 'Unit for input PQ x (e.g., m, km, ft)',
			},
			{
				displayName: 'Input (y) Value',
				name: 'inputValue_y',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
						selectedInputPQs: ['y'],
					},
				},
				default: '3',
				placeholder: '3 or {{ $json.time }}',
				description: 'Value for input PQ y (supports expressions)',
			},
			{
				displayName: 'Input (y) Unit',
				name: 'inputUnit_y',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
						selectedInputPQs: ['y'],
					},
				},
				default: 'h',
				placeholder: 'h',
				description: 'Unit for input PQ y (e.g., s, h, day)',
			},
			{
				displayName: 'Output (s) Unit',
				name: 'outputUnit_s',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
						selectedOutputPQs: ['s'],
					},
				},
				default: 'mph[mile/h]',
				placeholder: 'mph[mile/h]',
				description: 'Desired unit for output PQ s (e.g., km/h, mph[mile/h], m/s)',
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
							// Enhanced mode - build inputs/outputs from individual fields
							const selectedInputPQs = this.getNodeParameter('selectedInputPQs', i) as string[];
							const selectedOutputPQs = this.getNodeParameter('selectedOutputPQs', i) as string[];
							
							// Build inputs object from individual PQ fields
							inputs = {};
							
							// Handle input PQ x
							if (selectedInputPQs.includes('x')) {
								try {
									const inputValue_x = this.getNodeParameter('inputValue_x', i) as string;
									const inputUnit_x = this.getNodeParameter('inputUnit_x', i) as string;
									
									if (inputValue_x) {
										(inputs as any)['x'] = {
											value: parseFloat(inputValue_x) || inputValue_x,
											unit: inputUnit_x || 'km',
										};
									}
								} catch (error) {
									console.log('Could not get parameters for input x:', error);
								}
							}
							
							// Handle input PQ y
							if (selectedInputPQs.includes('y')) {
								try {
									const inputValue_y = this.getNodeParameter('inputValue_y', i) as string;
									const inputUnit_y = this.getNodeParameter('inputUnit_y', i) as string;
									
									if (inputValue_y) {
										(inputs as any)['y'] = {
											value: parseFloat(inputValue_y) || inputValue_y,
											unit: inputUnit_y || 'h',
										};
									}
								} catch (error) {
									console.log('Could not get parameters for input y:', error);
								}
							}
							
							// Build outputs object from individual PQ fields
							outputs = undefined;
							if (selectedOutputPQs.length > 0) {
								outputs = {};
								
								// Handle output PQ s
								if (selectedOutputPQs.includes('s')) {
									try {
										const outputUnit_s = this.getNodeParameter('outputUnit_s', i) as string;
										
										if (outputUnit_s) {
											(outputs as any)['s'] = {
												unit: outputUnit_s,
											};
										}
									} catch (error) {
										console.log('Could not get parameters for output s:', error);
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