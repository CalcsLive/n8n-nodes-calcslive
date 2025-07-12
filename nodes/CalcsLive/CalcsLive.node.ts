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

			// Load available units for the first input PQ
			async getUnitsForInput1(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const articleId = this.getCurrentNodeParameter('articleId') as string;
				const selectedInputPQs = this.getCurrentNodeParameter('selectedInputPQs') as string[];
				const credentials = await this.getCredentials('calcsLiveApi');
				
				console.log('getUnitsForInput1 called with:', { articleId, selectedInputPQs });
				
				if (!articleId || !selectedInputPQs || selectedInputPQs.length === 0) {
					console.log('Missing parameters, returning empty array');
					return [];
				}
				
				try {
					const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
					});
					
					if (!response.success) {
						console.log('Validation failed');
						return [];
					}
					
					const pq = response.metadata.inputPQs.find((p: any) => p.symbol === selectedInputPQs[0]);
					if (!pq) {
						console.log('PQ not found:', selectedInputPQs[0]);
						return [];
					}
					
					const availableUnits = response.metadata.availableUnits[pq.categoryId] || [];
					console.log('Available units for', pq.symbol, ':', availableUnits);
					
					return availableUnits.map((unit: string) => ({
						name: unit,
						value: unit,
					}));
					
				} catch (error) {
					console.error('Failed to load units:', error);
					return [];
				}
			},

			// Load available units for the second input PQ
			async getUnitsForInput2(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const articleId = this.getCurrentNodeParameter('articleId') as string;
				const selectedInputPQs = this.getCurrentNodeParameter('selectedInputPQs') as string[];
				const credentials = await this.getCredentials('calcsLiveApi');
				
				console.log('getUnitsForInput2 called with:', { articleId, selectedInputPQs });
				
				if (!articleId || !selectedInputPQs || selectedInputPQs.length < 2) {
					console.log('Missing parameters for input2, returning empty array');
					return [];
				}
				
				try {
					const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
					});
					
					if (!response.success) {
						console.log('Validation failed for input2');
						return [];
					}
					
					const pq = response.metadata.inputPQs.find((p: any) => p.symbol === selectedInputPQs[1]);
					if (!pq) {
						console.log('PQ not found for input2:', selectedInputPQs[1]);
						return [];
					}
					
					const availableUnits = response.metadata.availableUnits[pq.categoryId] || [];
					console.log('Available units for input2', pq.symbol, ':', availableUnits);
					
					return availableUnits.map((unit: string) => ({
						name: unit,
						value: unit,
					}));
					
				} catch (error) {
					console.error('Failed to load units for input2:', error);
					return [];
				}
			},

			// Load available units for the first output PQ
			async getUnitsForOutput1(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const articleId = this.getCurrentNodeParameter('articleId') as string;
				const selectedOutputPQs = this.getCurrentNodeParameter('selectedOutputPQs') as string[];
				const credentials = await this.getCredentials('calcsLiveApi');
				
				if (!articleId || !selectedOutputPQs || selectedOutputPQs.length === 0) {
					return [];
				}
				
				try {
					const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
					});
					
					if (!response.success) {
						return [];
					}
					
					const pq = response.metadata.outputPQs.find((p: any) => p.symbol === selectedOutputPQs[0]);
					if (!pq) {
						return [];
					}
					
					const availableUnits = response.metadata.availableUnits[pq.categoryId] || [];
					return availableUnits.map((unit: string) => ({
						name: unit,
						value: unit,
					}));
					
				} catch (error) {
					console.error('Failed to load units:', error);
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
				default: '{\n  "x": { "value": 150, "unit": "km" },\n  "y": { "value": 2, "unit": "h" }\n}',
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
			// Enhanced mode fields
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
				description: 'Select which output physical quantities to calculate. Enter Article ID first.',
			},
			// Dynamic input field generation - Input 1
			{
				displayName: 'Input (x) Value',
				name: 'inputValue1',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: '',
				placeholder: '150 or {{ $json.value }}',
				description: 'Value for the first selected input PQ (supports expressions)',
			},
			{
				displayName: 'Input (x) Unit',
				name: 'inputUnit1',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getUnitsForInput1',
				},
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: '',
				description: 'Unit for the first selected input PQ',
			},
			// Dynamic input field generation - Input 2
			{
				displayName: 'Input (y) Value',
				name: 'inputValue2',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: '',
				placeholder: '2 or {{ $json.time }}',
				description: 'Value for the second selected input PQ (supports expressions)',
			},
			{
				displayName: 'Input (y) Unit',
				name: 'inputUnit2',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getUnitsForInput2',
				},
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: '',
				description: 'Unit for the second selected input PQ',
			},
			// Dynamic output field generation - Output 1
			{
				displayName: 'Output (s) Unit',
				name: 'outputUnit1',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getUnitsForOutput1',
				},
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: '',
				description: 'Desired unit for the first selected output PQ',
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
							
							// Build inputs object from enhanced fields
							inputs = {};
							if (selectedInputPQs.length > 0) {
								// For now, use hardcoded field names (simplified for MVP)
								const inputValue1 = this.getNodeParameter('inputValue1', i) as string;
								const inputUnit1 = this.getNodeParameter('inputUnit1', i) as string;
								const inputValue2 = this.getNodeParameter('inputValue2', i) as string;
								const inputUnit2 = this.getNodeParameter('inputUnit2', i) as string;
								
								if (selectedInputPQs[0] && inputValue1) {
									(inputs as any)[selectedInputPQs[0]] = {
										value: parseFloat(inputValue1) || inputValue1,
										unit: inputUnit1,
									};
								}
								if (selectedInputPQs[1] && inputValue2) {
									(inputs as any)[selectedInputPQs[1]] = {
										value: parseFloat(inputValue2) || inputValue2,
										unit: inputUnit2,
									};
								}
							}
							
							// Build outputs object from enhanced fields
							if (selectedOutputPQs.length > 0) {
								const outputUnit1 = this.getNodeParameter('outputUnit1', i) as string;
								
								outputs = {};
								if (selectedOutputPQs[0] && outputUnit1) {
									(outputs as any)[selectedOutputPQs[0]] = {
										unit: outputUnit1,
									};
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