import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

// Import our modular helpers
import { getInputPQs, getOutputPQs, getUnitsForSymbol } from './helpers/optionsLoaders';
import { clearCache } from './helpers/metadataCache';

export class CalcsLive implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CalcsLive Calculator',
		name: 'calcsLive',
		icon: 'file:e3d-logo2.png',
		group: ['transform'],
		version: 1,
		subtitle: 'Article: {{$parameter["articleId"]}}',
		description: 'Execute unit-aware calculations using CalcsLive articles',
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
		requestDefaults: {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			// Resource selection
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
						description: 'Run a calculation using the specified inputs',
						action: 'Execute a calculation',
					},
				],
				default: 'execute',
			},

			// Article ID input
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
				default: '3M5NVUCGW-3TA',
				placeholder: '3M5NVUCGW-3TA',
				description: 'CalcsLive article ID or short ID. Example: 3M5NVUCGW-3TA (Speed Distance Time Calculator)',
			},

			// Configuration mode selection
			{
				displayName: 'Configuration Mode',
				name: 'configMode',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
					},
				},
				options: [
					{
						name: 'Enhanced',
						value: 'enhanced',
						description: 'User-friendly interface with dropdowns and auto-discovery',
					},
					{
						name: 'Legacy',
						value: 'legacy',
						description: 'Direct JSON input for advanced users',
					},
				],
				default: 'enhanced',
				description: 'Choose configuration method',
			},

			// Legacy mode fields
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
				default: '{\n  "D": { "value": 150, "unit": "km" },\n  "t": { "value": 2, "unit": "h" }\n}',
				description: 'Physical quantities with values and units. Use symbols from your calculation.',
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
				default: '{\n  "s": { "unit": "mph[mile/h]" } \n}',
				description: 'Specify output units (optional). Leave empty to get all outputs with default units.',
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
								description: 'Select the input physical quantity symbol',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'number',
								default: undefined,
								description: 'Enter the numeric value (leave empty to use calc default)',
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
								description: 'Select the unit for this quantity (leave empty to use calc default)',
							},
						],
					},
				],
				description: '⚠️ IMPORTANT: When you change Article ID, remove all old PQ rows and add new ones.',
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
				description: '⚠️ IMPORTANT: When you change Article ID, remove all old PQ rows and add new ones.',
			},
		],
	};

	methods = {
		loadOptions: {
			getInputPQs,
			getOutputPQs, 
			getUnitsForSymbol,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		console.log('\n🚀 === CalcsLive Node Execution Started ===');
		console.log('Timestamp:', new Date().toISOString());
		
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		
		for (let i = 0; i < items.length; i++) {
			try {
				const articleId = this.getNodeParameter('articleId', i) as string;
				const configMode = this.getNodeParameter('configMode', i) as string;
				
				console.log('📋 Processing item', i + 1, '- Article:', articleId, '- Mode:', configMode);
				
				// Get credentials
				const credentials = await this.getCredentials('calcsLiveApi');
				const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
				
				// Build request based on configuration mode
				let requestBody: any = {
					articleId,
					apiKey: credentials.apiKey,
				};
				
				if (configMode === 'legacy') {
					// Legacy mode - direct JSON input
					const inputs = this.getNodeParameter('inputs', i) as string;
					const outputs = this.getNodeParameter('outputs', i) as string;
					
					requestBody.inputs = typeof inputs === 'string' ? JSON.parse(inputs) : inputs;
					requestBody.outputs = outputs && outputs.trim() !== '' 
						? (typeof outputs === 'string' ? JSON.parse(outputs) : outputs)
						: undefined;
						
				} else {
					// Enhanced mode - structured input
					const inputPQs = this.getNodeParameter('inputPQs', i, {}) as any;
					const outputPQs = this.getNodeParameter('outputPQs', i, {}) as any;
					
					// Convert enhanced format to API format
					requestBody.inputs = {};
					requestBody.outputs = {};
					
					// Process input PQs
					if (inputPQs.pq && Array.isArray(inputPQs.pq)) {
						inputPQs.pq.forEach((pq: any) => {
							if (pq.symbol && pq.symbol.trim() !== '') {
								requestBody.inputs[pq.symbol] = {
									value: pq.value,
									unit: pq.unit || undefined,
								};
							}
						});
					}
					
					// Process output PQs
					if (outputPQs.pq && Array.isArray(outputPQs.pq)) {
						outputPQs.pq.forEach((pq: any) => {
							if (pq.symbol && pq.symbol.trim() !== '') {
								requestBody.outputs[pq.symbol] = {
									unit: pq.unit || undefined,
								};
							}
						});
					}
					
					// If no outputs specified, let API return all
					if (Object.keys(requestBody.outputs).length === 0) {
						delete requestBody.outputs;
					}
				}
				
				console.log('📤 API Request:', JSON.stringify(requestBody, null, 2));
				
				// Make API call
				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: `${baseUrl}/api/n8n/v1/calculate`,
					body: requestBody,
					json: true,
				});
				
				console.log('📥 API Response received:', response.success);
				
				if (response.success) {
					returnData.push({
						json: {
							...response,
							_metadata: {
								articleId,
								configMode,
								executionTime: new Date().toISOString(),
							}
						},
					});
				} else {
					throw new Error(`Calculation failed: ${response.error || 'Unknown error'}`);
				}
				
			} catch (error: any) {
				console.log('❌ Execution error:', error.message);
				throw error;
			}
		}
		
		console.log('✅ Execution completed:', returnData.length, 'items processed');
		return [returnData];
	}
}