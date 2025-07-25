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
			// Enhanced mode - Symbol selector using multiOptions
			{
				displayName: 'Select Physical Quantities',
				name: 'selectedPQs',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getAllPQs',
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
				description: 'Select which physical quantities to configure. Choose inputs (to provide values) and outputs (to specify units). Note: Changing the Article ID will clear your selections.',
				hint: 'Select PQs first, then configure values in the tables below if needed',
			},
			// Enhanced mode - Table-like PQ configuration using fixedCollection
			{
				displayName: 'Input Physical Quantities',
				name: 'inputPQs',
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
				placeholder: 'Add Input PQ',
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
									loadOptionsMethod: 'getInputPQs',
									loadOptionsDependsOn: ['articleId'],
								},
								default: '',
								description: 'Select the physical quantity symbol',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'number',
								default: 100,
								description: 'Enter the numeric value',
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
								description: 'Select the unit for this quantity',
							},
						],
					},
				],
				description: 'Configure input physical quantities with their values and units. Values default to calc defaults but can be overridden.',
			},
			{
				displayName: 'Output Physical Quantities',
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
				placeholder: 'Add Output PQ',
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
								description: 'Select the output physical quantity symbol',
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
								description: 'Select the output unit for this quantity',
							},
						],
					},
				],
				description: 'Configure output physical quantities and their desired units. Units default to calc defaults but can be overridden.',
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
							// Enhanced mode - use multiOptions selection with auto-populated values
							const selectedPQs = this.getNodeParameter('selectedPQs', i) as string[];
							const inputPQsConfig = this.getNodeParameter('inputPQs', i) as any;
							const outputPQsConfig = this.getNodeParameter('outputPQs', i) as any;
							
							console.log('Selected PQs:', selectedPQs);
							console.log('Input PQs config:', inputPQsConfig);
							console.log('Output PQs config:', outputPQsConfig);
							
							// Parse selected PQs to understand their metadata
							const selectedInputs: any[] = [];
							const selectedOutputs: any[] = [];
							
							if (selectedPQs && Array.isArray(selectedPQs)) {
								for (const pqJson of selectedPQs) {
									try {
										const pqInfo = JSON.parse(pqJson);
										if (pqInfo.type === 'input') {
											selectedInputs.push(pqInfo);
										} else if (pqInfo.type === 'output') {
											selectedOutputs.push(pqInfo);
										}
									} catch (error) {
										console.log('Error parsing selected PQ:', pqJson, error);
									}
								}
							}
							
							// Build inputs object - combine multiOptions defaults with user overrides
							inputs = {};
							for (const inputPQ of selectedInputs) {
								const symbol = inputPQ.symbol;
								let value = inputPQ.faceValue || 1;
								let unit = inputPQ.unit || '';
								
								// Check if user provided custom values in fixedCollection
								if (inputPQsConfig && inputPQsConfig.pq && Array.isArray(inputPQsConfig.pq)) {
									const userOverride = inputPQsConfig.pq.find((pq: any) => {
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
									
									if (userOverride) {
										value = userOverride.value || value;
										unit = userOverride.unit || unit;
									}
								}
								
								(inputs as any)[symbol] = { value, unit };
								console.log(`Built input for ${symbol}:`, (inputs as any)[symbol]);
							}
							
							// Build outputs object - combine multiOptions defaults with user overrides
							outputs = undefined;
							if (selectedOutputs.length > 0) {
								outputs = {};
								for (const outputPQ of selectedOutputs) {
									const symbol = outputPQ.symbol;
									let unit = outputPQ.unit || '';
									
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
										
										if (userOverride && userOverride.unit) {
											unit = userOverride.unit;
										}
									}
									
									(outputs as any)[symbol] = { unit };
									console.log(`Built output for ${symbol}:`, (outputs as any)[symbol]);
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