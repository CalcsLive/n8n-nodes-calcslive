import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { metadataCache } from './resourceMethods';

/**
 * FIXED: Enhanced mode execution logic with proper symbol handling
 * Processes enhanced mode PQ configurations and builds API request
 */
export async function processEnhancedMode(
	executeFunctions: IExecuteFunctions,
	itemIndex: number,
	articleId: string
): Promise<{ inputs: any; outputs: any }> {
	
	const inputPQsConfig = executeFunctions.getNodeParameter('inputPQs', itemIndex) as any;
	const outputPQsConfig = executeFunctions.getNodeParameter('outputPQs', itemIndex) as any;
	
	console.log('📊 Enhanced mode - Input PQs config:', inputPQsConfig);
	console.log('📊 Enhanced mode - Output PQs config:', outputPQsConfig);
	
	// Check if user has configured any specific PQs
	const hasInputPQs = inputPQsConfig && inputPQsConfig.pq && Array.isArray(inputPQsConfig.pq) && inputPQsConfig.pq.length > 0;
	const hasOutputPQs = outputPQsConfig && outputPQsConfig.pq && Array.isArray(outputPQsConfig.pq) && outputPQsConfig.pq.length > 0;
	
	console.log('🔍 Has configured PQs:', { hasInputPQs, hasOutputPQs });
	
	if (!hasInputPQs && !hasOutputPQs) {
		// No PQs configured - behave like legacy mode (use all calc defaults)
		return await processDefaultMode(executeFunctions, itemIndex, articleId);
	} else {
		// User has configured specific PQs - use enhanced mode behavior
		return await processConfiguredMode(executeFunctions, itemIndex, articleId, inputPQsConfig, outputPQsConfig);
	}
}

/**
 * Process default mode - use all calc defaults when no PQs are configured
 */
async function processDefaultMode(
	executeFunctions: IExecuteFunctions,
	itemIndex: number,
	articleId: string
): Promise<{ inputs: any; outputs: any }> {
	
	console.log('🎯 No PQs configured - using legacy mode behavior (all calc defaults)');
	
	// Get calc defaults from cache or API
	let metadata = metadataCache[articleId];
	
	if (!metadata) {
		console.log('💾 Cache miss in execute - fetching metadata for articleId:', articleId);
		const credentials = await executeFunctions.getCredentials('calcsLiveApi');
		const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
		
		const validateResponse = await executeFunctions.helpers.httpRequest({
			method: 'GET',
			url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
		});
		
		if (validateResponse.success && validateResponse.metadata) {
			metadata = validateResponse.metadata;
			metadataCache[articleId] = metadata;
			console.log('💾 Cached metadata in execute for:', articleId);
		} else {
			throw new NodeOperationError(executeFunctions.getNode(), 'Failed to fetch calc defaults from validate API', {
				itemIndex,
			});
		}
	} else {
		console.log('⚡ Cache hit in execute - using cached metadata for:', articleId);
	}
	
	// Build inputs from all input PQs with their default values
	const inputs: any = {};
	if (metadata.inputPQs) {
		for (const pq of metadata.inputPQs) {
			inputs[pq.symbol] = {
				value: pq.faceValue || 1,
				unit: pq.unit || ''
			};
			console.log(`🔧 Using calc default for ${pq.symbol}:`, inputs[pq.symbol]);
		}
	}
	
	// Leave outputs undefined to get all outputs with default units
	console.log('📤 Using all calc default outputs');
	
	return { inputs, outputs: undefined };
}

/**
 * FIXED: Process configured mode with clean symbol handling
 * Process specific PQ configurations from user input
 */
async function processConfiguredMode(
	executeFunctions: IExecuteFunctions,
	itemIndex: number,
	articleId: string,
	inputPQsConfig: any,
	outputPQsConfig: any
): Promise<{ inputs: any; outputs: any }> {
	
	console.log('🎯 PQs configured - using enhanced mode behavior');
	
	// Get current calc metadata from cache or API to validate PQ selections
	let metadata = metadataCache[articleId];
	
	if (!metadata) {
		console.log('💾 Cache miss in enhanced mode - fetching metadata for articleId:', articleId);
		const credentials = await executeFunctions.getCredentials('calcsLiveApi');
		const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
		
		const validateResponse = await executeFunctions.helpers.httpRequest({
			method: 'GET',
			url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
		});
		
		if (validateResponse.success && validateResponse.metadata) {
			metadata = validateResponse.metadata;
			metadataCache[articleId] = metadata;
			console.log('💾 Cached metadata in enhanced mode for:', articleId);
		} else {
			throw new NodeOperationError(executeFunctions.getNode(), 'Failed to fetch current calc metadata for validation', {
				itemIndex,
			});
		}
	} else {
		console.log('⚡ Cache hit in enhanced mode - using cached metadata for:', articleId);
	}
	
	// Build inputs object from fixedCollection with validation
	const inputs: any = {};
	if (inputPQsConfig && inputPQsConfig.pq && Array.isArray(inputPQsConfig.pq)) {
		for (const pqConfig of inputPQsConfig.pq) {
			if (pqConfig.symbol && pqConfig.symbol.trim() !== '') {
				// FIXED: Use clean symbol directly - no more JSON parsing needed
				const symbol = pqConfig.symbol;
				let value = pqConfig.value;
				let unit = pqConfig.unit || '';
				
				// Validate that this symbol exists in current calc
				const allCurrentPQs = [...(metadata.inputPQs || []), ...(metadata.outputPQs || [])];
				const currentPQData = allCurrentPQs.find((pq: any) => pq.symbol === symbol);
				
				if (currentPQData) {
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
					console.log(`❌ Error: Symbol ${symbol} not found in current calc`);
					if (value === '' || value === null || value === undefined) {
						value = 1;
					}
				}
				
				inputs[symbol] = {
					value: value,
					unit: unit,
				};
				console.log(`Built input for ${symbol}:`, inputs[symbol]);
			}
		}
	}
	
	// Build outputs object from fixedCollection
	let outputs: any = undefined;
	if (outputPQsConfig && outputPQsConfig.pq && Array.isArray(outputPQsConfig.pq)) {
		outputs = {};
		for (const pqConfig of outputPQsConfig.pq) {
			if (pqConfig.symbol) {
				// FIXED: Use clean symbol directly - no more JSON parsing needed
				const symbol = pqConfig.symbol;
				const defaultUnit = pqConfig.unit || '';
				
				outputs[symbol] = {
					unit: defaultUnit,
				};
				console.log(`Built output for ${symbol}:`, outputs[symbol]);
			}
		}
		
		// If no output units specified, let API return all
		if (Object.keys(outputs).length === 0) {
			outputs = undefined;
		}
	}
	
	console.log('Final built inputs object:', inputs);
	console.log('Final built outputs object:', outputs);
	
	return { inputs, outputs };
}