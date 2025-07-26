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
				
				console.log('🆔 getInputPQs called for articleId:', articleId);
				
				if (!articleId) {
					return [{ name: 'Enter Article ID first', value: '' }];
				}
				
				try {
					const credentials = await this.getCredentials('calcsLiveApi');
					const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
					
					console.log('🌐 Fetching validate API for articleId:', articleId);
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
					});
					
					console.log('✅ Validate API response received for:', articleId);
					
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
				console.log('\n🔍 === getUnitsForSymbol called ===');
				console.log('⏰ Timestamp:', new Date().toISOString());
				
				// Debug: Get all current parameters to understand the context
				const allParams = this.getCurrentNodeParameters();
				console.log('🔍 All current parameters:', JSON.stringify(allParams, null, 2));
				
				const articleId = this.getCurrentNodeParameter('articleId') as string;
				let symbolParam: string | undefined;
				
				// Try to get the symbol using n8n's parameter system first
				try {
					symbolParam = this.getCurrentNodeParameter('symbol') as string;
					console.log('✅ Got symbol via getCurrentNodeParameter:', symbolParam);
				} catch (e) {
					console.log('❌ getCurrentNodeParameter failed:', e);
				}
				
				// Also try alternative parameter paths that n8n might use
				if (!symbolParam || symbolParam === '') {
					try {
						// Try to get symbol from the current item context
						const currentItem = this.getCurrentNodeParameter('inputPQs.pq.symbol') as string;
						console.log('🔍 Trying inputPQs.pq.symbol path:', currentItem);
						symbolParam = currentItem;
					} catch (e) {
						console.log('❌ Alternative path failed:', e);
					}
				}
				
				// ENHANCED DEBUGGING: Try to understand which specific field is calling this
				console.log('🔍 ENHANCED DEBUG - Analyzing field context...');
				
				// If that doesn't work, try the current context approach
				if (!symbolParam) {
					console.log('🔍 Trying to extract symbol from context...');
					
					// The challenge: n8n calls this for each unit field, but we need to know WHICH row's unit field
					// Let's try to get the symbol from context, but be smarter about it
					if (allParams && typeof allParams === 'object') {
						// Look through all PQ items and see if we can determine which one is being edited
						const inputPQs = (allParams as any).inputPQs;
						const outputPQs = (allParams as any).outputPQs;
						
						console.log('📋 Input PQs raw:', inputPQs);
						console.log('📋 Output PQs raw:', outputPQs);
						
						// Collect all symbols that exist with their full context
						const allSymbolsWithContext: Array<{
							symbol: string;
							value?: any;
							unit?: string;
							type: 'input' | 'output';
							index: number;
						}> = [];
						if (inputPQs && inputPQs.pq && Array.isArray(inputPQs.pq)) {
							inputPQs.pq.forEach((item: any, index: number) => {
								console.log(`🔍 Input PQ [${index}]:`, item);
								if (item.symbol && item.symbol !== '') {
									allSymbolsWithContext.push({
										symbol: item.symbol,
										value: item.value,
										unit: item.unit,
										type: 'input',
										index: index
									});
								}
							});
						}
						if (outputPQs && outputPQs.pq && Array.isArray(outputPQs.pq)) {
							outputPQs.pq.forEach((item: any, index: number) => {
								if (item.symbol && item.symbol !== '') {
									allSymbolsWithContext.push({
										symbol: item.symbol,
										unit: item.unit,
										type: 'output', 
										index: index
									});
								}
							});
						}
						
						console.log('🔍 All symbols with context:', allSymbolsWithContext);
						
						// Enhanced logic: try to determine which row is being edited
						// Look for rows with symbols but missing or empty units (likely the one being edited)
						const incompleteRows = allSymbolsWithContext.filter(row => 
							row.symbol && row.symbol !== '' && (!row.unit || row.unit === '')
						);
						
						console.log('🎯 Incomplete rows (likely being edited):', incompleteRows);
						
						if (incompleteRows.length === 1) {
							// Perfect! Only one row is incomplete, this must be the one being edited
							symbolParam = incompleteRows[0].symbol;
							console.log('✅ SMART DETECTION: Using symbol from incomplete row:', symbolParam);
						} else if (incompleteRows.length > 1) {
							// Multiple incomplete rows - use the last one (most recently added)
							symbolParam = incompleteRows[incompleteRows.length - 1].symbol;
							console.log('⚠️ Multiple incomplete rows, using last one:', symbolParam);
						} else {
							// All rows have units or no incomplete rows found
							// Fall back to the most recently selected symbol (last in array)
							const allSymbols = allSymbolsWithContext.map(row => row.symbol);
							if (allSymbols.length > 0) {
								symbolParam = allSymbols[allSymbols.length - 1];
								console.log('⚠️ No incomplete rows, using last symbol:', symbolParam);
							}
						}
						
						console.log('🎯 DETECTION RESULT: symbolParam =', symbolParam);
					}
				}
				
				console.log('📊 Final parameters:', { articleId, symbolParam });
				
				if (!articleId) {
					console.log('❌ No articleId');
					return [{ name: 'Enter Article ID first', value: '' }];
				}
				
				if (!symbolParam || symbolParam === '' || symbolParam === 'undefined' || symbolParam === 'null') {
					console.log('❌ No symbolParam or empty/invalid string. Value:', symbolParam);
					console.log('❌ This means no symbol has been selected yet');
					
					// Return a clear message indicating that symbol must be selected first
					return [{ 
						name: '← Select a symbol first', 
						value: '',
						description: 'Choose a physical quantity symbol before selecting units'
					}];
				}
				
				console.log('✅ symbolParam found:', symbolParam, typeof symbolParam);
				
				// Extract actual symbol from JSON metadata if needed
				let actualSymbol = symbolParam;
				try {
					const parsed = JSON.parse(symbolParam);
					actualSymbol = parsed.symbol;
					console.log('✅ Extracted symbol from JSON:', actualSymbol);
				} catch (e) {
					console.log('ℹ️ Symbol is plain string:', actualSymbol);
				}
				
				try {
					const credentials = await this.getCredentials('calcsLiveApi');
					const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
					});
					
					console.log('🌐 API Response success:', response.success);
					
					if (!response.success || !response.metadata) {
						return [{ name: 'No metadata found', value: '' }];
					}
					
					// Find the PQ by symbol to get its categoryId
					const allPQs = [...(response.metadata.inputPQs || []), ...(response.metadata.outputPQs || [])];
					console.log('📋 All PQs available in current calc:', allPQs.map((pq: any) => pq.symbol));
					console.log('🔍 Looking for symbol:', actualSymbol);
					
					const pqData = allPQs.find((pq: any) => pq.symbol === actualSymbol);
					console.log('🎯 Found PQ data for symbol "' + actualSymbol + '":', pqData);
					
					if (!pqData) {
						console.log('❌ STALE DATA DETECTED: Symbol "' + actualSymbol + '" not found in current calc');
						console.log('💡 User needs to remove old PQ rows and add new ones after changing articleId');
						return [{ 
							name: `⚠️ Stale Data: "${actualSymbol}" not in current calc`, 
							value: '' 
						}, {
							name: `Available symbols: ${allPQs.map((pq: any) => pq.symbol).join(', ')}`,
							value: ''
						}, {
							name: '💡 Remove this row and add a new one',
							value: ''
						}];
					}
					
					if (!pqData || !pqData.categoryId) {
						return [{ name: `PQ "${actualSymbol}" not found`, value: '' }];
					}
					
					const categoryId = pqData.categoryId;
					const availableUnits = response.metadata.availableUnits?.[categoryId];
					
					console.log('🏷️ CategoryId:', categoryId);
					console.log('📏 Available units:', availableUnits);
					
					if (!availableUnits) {
						return [{ name: 'No units available', value: '' }];
					}
					
					// Prioritize the original unit from the calc by placing it first
					const originalUnit = pqData.unit;
					const options = [];
					
					// Add original unit first if it exists in available units
					if (originalUnit && availableUnits.includes(originalUnit)) {
						options.push({
							name: `${originalUnit} (default)`,
							value: originalUnit,
						});
					}
					
					// Add all other units (excluding the original to avoid duplicates)
					availableUnits.forEach((unit: string) => {
						if (unit !== originalUnit) {
							options.push({
								name: unit,
								value: unit,
							});
						}
					});
					
					console.log('✅ Returning unit options with default first:', options);
					console.log(`🎯 Original unit "${originalUnit}" placed first as default`);
					return options;
					
				} catch (error: any) {
					console.log('❌ Error in getUnitsForSymbol:', error);
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
			// Enhanced mode - Input PQ configuration
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
				default: {    },
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
								description: 'Select the input physical quantity symbol',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'number',
								default: undefined,
								description: 'Enter the numeric value (leave empty to use calc default). Will auto-populate during execution if empty.',
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
								description: 'Select the unit for this quantity (leave empty to use calc default). Will auto-populate during execution if empty.',
							},
						],
					},
				],
				description: '⚠️ IMPORTANT: When you change Article ID, you MUST remove all old PQ rows and add new ones. Old rows contain stale symbols that don\'t exist in the new calc.',
			},
			// Enhanced mode - Output PQ configuration
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
								description: 'Select the desired output unit',
							},
						],
					},
				],
				description: '⚠️ IMPORTANT: When you change Article ID, you MUST remove all old PQ rows and add new ones. Old rows contain stale symbols that don\'t exist in the new calc.',
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

						let inputs: any;
						let outputs: any;

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
							// Enhanced mode - hybrid behavior: legacy when no PQs configured, enhanced when PQs specified
							const inputPQsConfig = this.getNodeParameter('inputPQs', i) as any;
							const outputPQsConfig = this.getNodeParameter('outputPQs', i) as any;
							
							console.log('📊 Enhanced mode - Input PQs config:', inputPQsConfig);
							console.log('📊 Enhanced mode - Output PQs config:', outputPQsConfig);
							
							// Check if user has configured any specific PQs
							const hasInputPQs = inputPQsConfig && inputPQsConfig.pq && Array.isArray(inputPQsConfig.pq) && inputPQsConfig.pq.length > 0;
							const hasOutputPQs = outputPQsConfig && outputPQsConfig.pq && Array.isArray(outputPQsConfig.pq) && outputPQsConfig.pq.length > 0;
							
							console.log('🔍 Has configured PQs:', { hasInputPQs, hasOutputPQs });
							
							if (!hasInputPQs && !hasOutputPQs) {
								// No PQs configured - behave like legacy mode (use all calc defaults)
								console.log('🎯 No PQs configured - using legacy mode behavior (all calc defaults)');
								
								// Get calc defaults from validate API
								const credentials = await this.getCredentials('calcsLiveApi');
								const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
								
								console.log('🌐 Fetching calc defaults from validate API for articleId:', articleId);
								const validateResponse = await this.helpers.httpRequest({
									method: 'GET',
									url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
								});
								
								if (validateResponse.success && validateResponse.metadata) {
									// Build inputs from all input PQs with their default values
									inputs = {};
									if (validateResponse.metadata.inputPQs) {
										for (const pq of validateResponse.metadata.inputPQs) {
											inputs[pq.symbol] = {
												value: pq.faceValue || 1,
												unit: pq.unit || ''
											};
											console.log(`🔧 Using calc default for ${pq.symbol}:`, inputs[pq.symbol]);
										}
									}
									
									// Leave outputs undefined to get all outputs with default units
									outputs = undefined;
									console.log('📤 Using all calc default outputs');
								} else {
									throw new NodeOperationError(this.getNode(), 'Failed to fetch calc defaults from validate API', {
										itemIndex: i,
									});
								}
							} else {
								// User has configured specific PQs - use enhanced mode behavior
								console.log('🎯 PQs configured - using enhanced mode behavior');
								
								// First, get current calc metadata to validate PQ selections
								const credentials = await this.getCredentials('calcsLiveApi');
								const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
								
								console.log('🌐 Fetching current calc metadata to validate PQ selections');
								const validateResponse = await this.helpers.httpRequest({
									method: 'GET',
									url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
								});
								
								if (!validateResponse.success || !validateResponse.metadata) {
									throw new NodeOperationError(this.getNode(), 'Failed to fetch current calc metadata for validation', {
										itemIndex: i,
									});
								}
								
								// Build inputs object from fixedCollection with validation
								inputs = {};
								if (inputPQsConfig && inputPQsConfig.pq && Array.isArray(inputPQsConfig.pq)) {
								for (const pqConfig of inputPQsConfig.pq) {
									if (pqConfig.symbol && pqConfig.symbol.trim() !== '') {
										// Parse the embedded JSON metadata if symbol contains it
										let symbol = pqConfig.symbol;
										let value = pqConfig.value;
										let unit = pqConfig.unit || '';
										let isValidSymbol = false;
										
										try {
											// Check if symbol is embedded JSON (from loadOptions)  
											const pqInfo = JSON.parse(pqConfig.symbol);
											symbol = pqInfo.symbol;
											
											// Validate that this symbol exists in current calc
											const allCurrentPQs = [...(validateResponse.metadata.inputPQs || []), ...(validateResponse.metadata.outputPQs || [])];
											const currentPQData = allCurrentPQs.find((pq: any) => pq.symbol === symbol);
											
											if (currentPQData) {
												isValidSymbol = true;
												
												// Use current calc's faceValue as default if user hasn't entered a custom value
												if (value === '' || value === null || value === undefined) {
													value = currentPQData.faceValue || 1;
													console.log(`🔧 Auto-populated value for ${symbol}: ${value} (from current calc)`);
												}
												
												// Use current calc's unit as default if user hasn't selected a custom unit
												if (unit === '' || unit === null || unit === undefined) {
													unit = currentPQData.unit || '';
													console.log(`🔧 Auto-populated unit for ${symbol}: ${unit} (from current calc)`);
												}
											} else {
												console.log(`⚠️ Warning: Symbol ${symbol} not found in current calc - may be from old articleId`);
												// Use the embedded data as fallback but issue warning
												if (value === '' || value === null || value === undefined) {
													value = pqInfo.faceValue || 1;
													console.log(`⚠️ Using stale faceValue for ${symbol}: ${value}`);
												}
												if (unit === '' || unit === null || unit === undefined) {
													unit = pqInfo.unit || '';
													console.log(`⚠️ Using stale unit for ${symbol}: ${unit}`);
												}
											}
										} catch (error) {
											// symbol is just a plain string, validate it exists in current calc
											const allCurrentPQs = [...(validateResponse.metadata.inputPQs || []), ...(validateResponse.metadata.outputPQs || [])];
											const currentPQData = allCurrentPQs.find((pq: any) => pq.symbol === symbol);
											
											if (currentPQData) {
												isValidSymbol = true;
												if (value === '' || value === null || value === undefined) {
													value = currentPQData.faceValue || 1;
													console.log(`🔧 Auto-populated value for ${symbol}: ${value} (plain string)`);
												}
												if (unit === '' || unit === null || unit === undefined) {
													unit = currentPQData.unit || '';
													console.log(`🔧 Auto-populated unit for ${symbol}: ${unit} (plain string)`);
												}
											} else {
												console.log(`❌ Error: Symbol ${symbol} not found in current calc`);
												if (value === '' || value === null || value === undefined) {
													value = 1;
												}
											}
										}
										
										(inputs as any)[symbol] = {
											value: value,
											unit: unit,
										};
										console.log(`Built input for ${symbol}:`, (inputs as any)[symbol]);
									}
								}
							}
							
							// Build outputs object from fixedCollection
							outputs = undefined;
							if (outputPQsConfig && outputPQsConfig.pq && Array.isArray(outputPQsConfig.pq)) {
								outputs = {};
								for (const pqConfig of outputPQsConfig.pq) {
									if (pqConfig.symbol) {
										// Parse the embedded JSON metadata if symbol contains it
										let symbol = pqConfig.symbol;
										let defaultUnit = pqConfig.unit || '';
										
										try {
											// Check if symbol is embedded JSON (from loadOptions)
											const pqInfo = JSON.parse(pqConfig.symbol);
											symbol = pqInfo.symbol;
											defaultUnit = pqConfig.unit || pqInfo.unit || '';
										} catch (error) {
											// symbol is just a plain string, use as-is
										}
										
										(outputs as any)[symbol] = {
											unit: defaultUnit,
										};
										console.log(`Built output for ${symbol}:`, (outputs as any)[symbol]);
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