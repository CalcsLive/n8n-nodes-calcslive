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
				default: '{\n  "D": { "value": 360, "unit": "km" },\n  "t": { "value": 10, "unit": "h" }\n}',
				description: 'Physical quantities with values and units for the calculation.',
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
				description: 'Specify output units (optional). Leave empty to get all outputs with default units.',
			},
			// Enhanced mode - INPUT PQs configuration
			{
				displayName: 'Input PQs Configuration',
				name: 'inputPQsHeader',
				type: 'notice',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: '',
				typeOptions: {
					theme: 'info',
				},
				description: 'Configure input physical quantities below. Enable/disable and set values as needed.',
			},
			// D (Distance) configuration
			{
				displayName: 'Include D (Distance)',
				name: 'D_enabled',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: true,
				description: 'Include distance (D) in the calculation',
			},
			{
				displayName: 'D Value',
				name: 'D_value',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
						D_enabled: [true],
					},
				},
				default: 12,
				description: 'Distance value',
			},
			{
				displayName: 'D Unit',
				name: 'D_unit',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
						D_enabled: [true],
					},
				},
				options: [
					{ name: 'km', value: 'km' },
					{ name: 'm', value: 'm' },
					{ name: 'cm', value: 'cm' },
					{ name: 'mm', value: 'mm' },
					{ name: 'in', value: 'in' },
					{ name: 'ft', value: 'ft' },
					{ name: 'yd', value: 'yd' },
					{ name: 'mile', value: 'mile' },
				],
				default: 'km',
				description: 'Distance unit',
			},
			// t (Time) configuration
			{
				displayName: 'Include t (Time)',
				name: 't_enabled',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: true,
				description: 'Include time (t) in the calculation',
			},
			{
				displayName: 't Value',
				name: 't_value',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
						t_enabled: [true],
					},
				},
				default: 12,
				description: 'Time value',
			},
			{
				displayName: 't Unit',
				name: 't_unit',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
						t_enabled: [true],
					},
				},
				options: [
					{ name: 's', value: 's' },
					{ name: 'minute', value: 'minute' },
					{ name: 'h', value: 'h' },
					{ name: 'day', value: 'day' },
					{ name: 'week', value: 'week' },
				],
				default: 'h',
				description: 'Time unit',
			},
			// Enhanced mode - OUTPUT PQs configuration
			{
				displayName: 'Output PQs Configuration',
				name: 'outputPQsHeader',
				type: 'notice',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: '',
				typeOptions: {
					theme: 'success',
				},
				description: 'Configure output physical quantities. Leave all disabled to get all outputs.',
			},
			// v (Velocity) configuration
			{
				displayName: 'Include v (Velocity)',
				name: 'v_enabled',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
					},
				},
				default: true,
				description: 'Include velocity (v) in the output',
			},
			{
				displayName: 'v Unit',
				name: 'v_unit',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['execute'],
						resource: ['calculation'],
						configMode: ['enhanced'],
						v_enabled: [true],
					},
				},
				options: [
					{ name: 'm/s', value: 'm/s' },
					{ name: 'km/h', value: 'km/h' },
					{ name: 'mph', value: 'mph[mile/h]' },
					{ name: 'ft/s', value: 'fps' },
					{ name: 'knot', value: 'knot[kn or kt or nautical mile/h]' },
				],
				default: 'm/s',
				description: 'Velocity output unit',
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
							// Enhanced mode - build inputs/outputs from individual PQ configuration fields
							inputs = {};
							outputs = {};
							
							// Check each possible input PQ
							const inputPQs = ['D', 't']; // Known PQs for this calc
							
							for (const pqSymbol of inputPQs) {
								const enabled = this.getNodeParameter(`${pqSymbol}_enabled`, i) as boolean;
								
								if (enabled) {
									const value = this.getNodeParameter(`${pqSymbol}_value`, i) as number;
									const unit = this.getNodeParameter(`${pqSymbol}_unit`, i) as string;
									
									(inputs as any)[pqSymbol] = {
										value: value,
										unit: unit,
									};
									
									console.log(`Built input for ${pqSymbol}:`, (inputs as any)[pqSymbol]);
								}
							}
							
							// Check each possible output PQ
							const outputPQs = ['v']; // Known PQs for this calc
							
							for (const pqSymbol of outputPQs) {
								const enabled = this.getNodeParameter(`${pqSymbol}_enabled`, i) as boolean;
								
								if (enabled) {
									const unit = this.getNodeParameter(`${pqSymbol}_unit`, i) as string;
									
									(outputs as any)[pqSymbol] = {
										unit: unit,
									};
									
									console.log(`Built output for ${pqSymbol}:`, (outputs as any)[pqSymbol]);
								}
							}
							
							// If no outputs specified, let API return all outputs
							if (Object.keys(outputs).length === 0) {
								outputs = undefined;
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