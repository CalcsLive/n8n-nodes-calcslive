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
			// Load all available PQs for multiOptions selection - combined input/output
			async getAllPQs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
					
					if (!response.success || !response.metadata) {
						return [{ name: 'No PQs found', value: '' }];
					}
					
					// Combine input and output PQs with type indicators
					const options: INodePropertyOptions[] = [];
					
					if (response.metadata.inputPQs) {
						response.metadata.inputPQs.forEach((pq: any) => {
							options.push({
								name: `${pq.symbol} (Input)`, // Show type for clarity
								value: JSON.stringify({
									symbol: pq.symbol,
									type: 'input',
									faceValue: pq.faceValue,
									unit: pq.unit,
									categoryId: pq.categoryId
								})
							});
						});
					}
					
					if (response.metadata.outputPQs) {
						response.metadata.outputPQs.forEach((pq: any) => {
							options.push({
								name: `${pq.symbol} (Output)`, // Show type for clarity
								value: JSON.stringify({
									symbol: pq.symbol,
									type: 'output',
									unit: pq.unit,
									categoryId: pq.categoryId
								})
							});
						});
					}
					
					return options;
					
				} catch (error: any) {
					return [{ name: `Error: ${error.message || 'Failed to load'}`, value: '' }];
				}
			},
			
			// Load input PQs for multiOptions with embedded metadata
			async getInputPQsForMultiOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
					
					// Return symbols with embedded metadata for later use
					const options = response.metadata.inputPQs.map((pq: any) => ({
						name: pq.symbol, // Just the symbol (D, t, x, y, etc.)
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
					
					// Show just the symbol names, embed metadata for later use
					const options = response.metadata.inputPQs.map((pq: any) => ({
						name: pq.symbol, // Just the symbol (D, t, x, y, etc.)
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

			// Load output PQs for multiOptions with embedded metadata
			async getOutputPQsForMultiOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
						name: pq.symbol, // Just the symbol (v, s, result, etc.)
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
						name: pq.symbol, // Just the symbol (v, s, result, etc.)
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

			// Load unit options for a specific symbol - dynamic per PQ
			async getUnitsForSymbol(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const articleId = this.getCurrentNodeParameter('articleId') as string;
				const symbol = this.getCurrentNodeParameter('symbol') as string;
				
				if (!articleId) {
					return [{ name: 'Enter Article ID first', value: '' }];
				}
				
				if (!symbol) {
					return [{ name: 'Select symbol first', value: '' }];
				}
				
				try {
					const credentials = await this.getCredentials('calcsLiveApi');
					const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
					});
					
					if (!response.success || !response.metadata) {
						return [{ name: 'No metadata found', value: '' }];
					}
					
					// Find the PQ by symbol to get its categoryId
					const allPQs = [...(response.metadata.inputPQs || []), ...(response.metadata.outputPQs || [])];
					const pqData = allPQs.find((pq: any) => pq.symbol === symbol);
					
					if (!pqData || !pqData.categoryId) {
						return [{ name: 'PQ not found', value: '' }];
					}
					
					const categoryId = pqData.categoryId;
					const availableUnits = response.metadata.availableUnits?.[categoryId];
					
					if (!availableUnits) {
						return [{ name: 'No units available', value: '' }];
					}
					
					const options = availableUnits.map((unit: string) => ({
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
			// Enhanced mode - Input symbol selector
			{
				displayName: 'Select Input Physical Quantities',
				name: 'selectedInputPQs',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getInputPQsForMultiOptions',
					loadOptionsDependsOn: ['articleId'],
				},
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: [],
				description: 'Select input physical quantities to provide values for. Selected symbols will show value/unit fields below.',
			},
			// Enhanced mode - Output symbol selector
			{
				displayName: 'Select Output Physical Quantities',
				name: 'selectedOutputPQs',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getOutputPQsForMultiOptions',
					loadOptionsDependsOn: ['articleId'],
				},
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: [],
				description: 'Select output physical quantities to specify units for. Selected symbols will show unit fields below.',
			},
			// Input PQ value/unit override fields (optional - only use if you want to override defaults)
			{
				displayName: 'Input PQ Overrides (Optional)',
				name: 'inputPQOverrides',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: {},
				placeholder: 'Override input PQ values/units',
				options: [
					{
						name: 'override',
						displayName: 'PQ Override',
						values: [
							{
								displayName: 'Symbol',
								name: 'symbol',
								type: 'string',
								default: '',
								placeholder: 'e.g., D, t, v',
								description: 'Symbol to override (must match selected input PQ above)',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'number',
								default: 1,
								description: 'Custom value (overrides calc default)',
							},
							{
								displayName: 'Unit',
								name: 'unit',
								type: 'string',
								default: '',
								placeholder: 'e.g., km, m, h, s',
								description: 'Custom unit (overrides calc default)',
							},
						],
					},
				],
				description: 'Optional: Override default values/units for specific input PQs. Only add rows if you want to change defaults.',
			},
			// Dynamic output PQ configuration - shows only when output PQs are selected
			{
				displayName: 'Configure Output Units',
				name: 'outputPQs',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: {},
				placeholder: 'Configure selected output PQs',
				options: [
					{
						name: 'pq',
						displayName: 'Physical Quantity',
						values: [
							{
								displayName: 'Symbol',
								name: 'symbol',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getOutputPQs',
									loadOptionsDependsOn: ['articleId'],
								},
								default: '',
								description: 'Output symbol (auto-populated from selection above)',
							},
							{
								displayName: 'Unit',
								name: 'unit',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getUnitsForSymbol',
									loadOptionsDependsOn: ['articleId', 'symbol'],
								},
								default: '',
								description: 'Output unit (defaults to calc default unit)',
							},
						],
					},
				],
				description: 'Configure units for selected output PQs. Units auto-populate with calc defaults but can be modified.',
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
							// Enhanced mode - combine multiOptions selection with override values
							const selectedInputPQs = this.getNodeParameter('selectedInputPQs', i) as string[];
							const selectedOutputPQs = this.getNodeParameter('selectedOutputPQs', i) as string[];
							const inputPQOverrides = this.getNodeParameter('inputPQOverrides', i) as any;
							const outputPQsConfig = this.getNodeParameter('outputPQs', i) as any;
							
							console.log('Selected Input PQs:', selectedInputPQs);
							console.log('Selected Output PQs:', selectedOutputPQs);
							console.log('Input PQ overrides:', inputPQOverrides);
							console.log('Output PQs config:', outputPQsConfig);
							
							// Build inputs object - start with multiOptions defaults, then apply overrides
							inputs = {};
							if (selectedInputPQs && Array.isArray(selectedInputPQs)) {
								for (const pqJson of selectedInputPQs) {
									try {
										const pqInfo = JSON.parse(pqJson);
										const symbol = pqInfo.symbol;
										let value = pqInfo.faceValue || 1;
										let unit = pqInfo.unit || '';
										
										// Check if user provided override values
										if (inputPQOverrides && inputPQOverrides.override && Array.isArray(inputPQOverrides.override)) {
											const userOverride = inputPQOverrides.override.find((override: any) => {
												return override.symbol === symbol;
											});
											
											if (userOverride) {
												if (userOverride.value !== undefined) value = userOverride.value;
												if (userOverride.unit !== undefined && userOverride.unit !== '') unit = userOverride.unit;
											}
										}
										
										(inputs as any)[symbol] = { value, unit };
										console.log(`Built input for ${symbol}:`, (inputs as any)[symbol]);
									} catch (error) {
										console.log('Error parsing input PQ:', pqJson, error);
									}
								}
							}
							
							// Build outputs object - start with multiOptions defaults, then apply fixedCollection overrides
							outputs = undefined;
							if (selectedOutputPQs && Array.isArray(selectedOutputPQs) && selectedOutputPQs.length > 0) {
								outputs = {};
								for (const pqJson of selectedOutputPQs) {
									try {
										const pqInfo = JSON.parse(pqJson);
										const symbol = pqInfo.symbol;
										let unit = pqInfo.unit || '';
										
										// Check if user provided custom units in fixedCollection
										if (outputPQsConfig && outputPQsConfig.pq && Array.isArray(outputPQsConfig.pq)) {
											const userOverride = outputPQsConfig.pq.find((pq: any) => {
												// Handle both plain symbol and JSON-embedded symbol
												let pqSymbol = pq.symbol;
												try {
													const parsed = JSON.parse(pq.symbol);
													pqSymbol = parsed.symbol;
												} catch (e) {
													// symbol is plain string
												}
												return pqSymbol === symbol;
											});
											
											if (userOverride && userOverride.unit !== undefined && userOverride.unit !== '') {
												unit = userOverride.unit;
											}
										}
										
										(outputs as any)[symbol] = { unit };
										console.log(`Built output for ${symbol}:`, (outputs as any)[symbol]);
									} catch (error) {
										console.log('Error parsing output PQ:', pqJson, error);
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