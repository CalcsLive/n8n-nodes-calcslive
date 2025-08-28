import { ILoadOptionsFunctions, INodePropertyOptions, NodeOperationError } from 'n8n-workflow';

// Metadata cache for article data - reduces API calls and improves performance
export const metadataCache: Record<string, any> = {};

/**
 * Load available input PQs from validate endpoint with caching
 */
export async function getInputPQs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const articleId = this.getCurrentNodeParameter('articleId') as string;
	
	console.log('🆔 getInputPQs called for articleId:', articleId);
	
	if (!articleId) {
		return [{ name: 'Enter Article ID first', value: '' }];
	}
	
	// Check cache first
	let metadata = metadataCache[articleId];
	
	if (!metadata) {
		console.log('💾 Cache miss - fetching metadata for:', articleId);
		try {
			const credentials = await this.getCredentials('calcsLiveApi');
			const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
			
			const response = await this.helpers.httpRequest({
				method: 'GET',
				url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
			});
			
			console.log('✅ Validate API response received for:', articleId);
			
			if (response.success && response.metadata) {
				metadata = response.metadata;
				metadataCache[articleId] = metadata;
				console.log('💾 Cached metadata for:', articleId);
			} else {
				return [{ name: 'No input PQs found', value: '' }];
			}
		} catch (error: any) {
			console.log('❌ API error:', error.message);
			return [{ name: `Error: ${error.message || 'Failed to load'}`, value: '' }];
		}
	} else {
		console.log('⚡ Cache hit - using cached metadata for:', articleId);
	}
	
	if (!metadata?.inputPQs) {
		return [{ name: 'No input PQs found', value: '' }];
	}
	
	// FIXED: Store clean symbol names, not JSON objects
	const options = metadata.inputPQs.map((pq: any) => ({
		name: `${pq.symbol} (${pq.description || pq.unit})`, // Show symbol with description/unit for clarity
		value: pq.symbol, // Store clean symbol name only
	}));
	
	return options;
}

/**
 * Load available output PQs from validate endpoint with caching
 */
export async function getOutputPQs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const articleId = this.getCurrentNodeParameter('articleId') as string;
	
	if (!articleId) {
		return [{ name: 'Enter Article ID first', value: '' }];
	}
	
	// Check cache first
	let metadata = metadataCache[articleId];
	
	if (!metadata) {
		console.log('💾 Cache miss in getOutputPQs - fetching metadata for:', articleId);
		try {
			const credentials = await this.getCredentials('calcsLiveApi');
			const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
			const response = await this.helpers.httpRequest({
				method: 'GET',
				url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
			});
			
			if (response.success && response.metadata) {
				metadata = response.metadata;
				metadataCache[articleId] = metadata;
				console.log('💾 Cached metadata for:', articleId);
			} else {
				return [{ name: 'No output PQs found', value: '' }];
			}
		} catch (error: any) {
			return [{ name: `Error: ${error.message || 'Failed to load'}`, value: '' }];
		}
	} else {
		console.log('⚡ Cache hit in getOutputPQs - using cached metadata for:', articleId);
	}
	
	if (!metadata?.outputPQs) {
		return [{ name: 'No output PQs found', value: '' }];
	}
	
	// FIXED: Store clean symbol names, not JSON objects
	const options = metadata.outputPQs.map((pq: any) => ({
		name: `${pq.symbol} (${pq.description || pq.unit})`, // Show symbol with description/unit for clarity
		value: pq.symbol, // Store clean symbol name only
	}));
	
	return options;
}

/**
 * FIXED: Simplified unit dropdown logic that properly handles clean symbol names
 * Load unit options for a specific symbol - dynamic per PQ
 */
export async function getUnitsForSymbol(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	console.log('\n🔍 === getUnitsForSymbol called ===');
	console.log('⏰ Timestamp:', new Date().toISOString());
	
	const articleId = this.getCurrentNodeParameter('articleId') as string;
	
	if (!articleId) {
		console.log('❌ No articleId - returning guidance message');
		return [{ name: 'Enter Article ID first', value: '' }];
	}
	
	// FIXED: Simplified symbol detection - no more complex parsing
	let symbol: string | undefined;
	
	try {
		// Direct parameter access for the current symbol being configured
		symbol = this.getCurrentNodeParameter('symbol') as string;
		console.log('📍 Current symbol parameter:', symbol);
	} catch (e) {
		console.log('📍 Could not get symbol parameter:', e);
	}
	
	// If no symbol found, return helpful message
	if (!symbol || symbol === '' || symbol === 'undefined' || symbol === 'null') {
		console.log('❌ No symbol detected - returning guidance message');
		return [{ 
			name: '← Select a symbol first', 
			value: '',
			description: 'Choose a physical quantity symbol before selecting units'
		}];
	}
	
	console.log('✅ Using symbol:', symbol);
	
	// Get or fetch metadata
	let metadata = metadataCache[articleId];
	
	if (!metadata) {
		console.log('💾 Cache miss - fetching metadata for:', articleId);
		try {
			const credentials = await this.getCredentials('calcsLiveApi');
			const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
			const response = await this.helpers.httpRequest({
				method: 'GET',
				url: `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`,
			});
			
			console.log('🌐 API Response received:', {
				success: response.success,
				hasMetadata: !!response.metadata,
				metadataKeys: response.metadata ? Object.keys(response.metadata) : []
			});
			
			if (response.success && response.metadata) {
				metadata = response.metadata;
				metadataCache[articleId] = metadata;
				console.log('💾 Cached metadata successfully');
			} else {
				console.log('❌ Invalid API response:', response);
				return [{ name: 'Failed to load article metadata', value: '' }];
			}
		} catch (error: any) {
			console.log('❌ API Error:', error);
			return [{ name: `API Error: ${error.message}`, value: '' }];
		}
	} else {
		console.log('⚡ Cache hit - using cached metadata');
	}
	
	// Find PQ data for the symbol
	const allPQs = [...(metadata.inputPQs || []), ...(metadata.outputPQs || [])];
	console.log('📋 Available PQ symbols:', allPQs.map((pq: any) => pq.symbol));
	console.log('🔍 Looking for symbol:', symbol);
	
	const pqData = allPQs.find((pq: any) => pq.symbol === symbol);
	
	if (!pqData) {
		console.log('❌ Symbol not found in current calc');
		const availableSymbols = allPQs.map((pq: any) => pq.symbol).join(', ');
		return [
			{ name: `⚠️ Symbol "${symbol}" not found`, value: '' },
			{ name: `Available: ${availableSymbols}`, value: '' },
			{ name: '💡 Remove this row and add a new one', value: '' }
		];
	}
	
	console.log('✅ Found PQ data:', {
		symbol: pqData.symbol,
		unit: pqData.unit,
		categoryId: pqData.categoryId
	});
	
	// Get available units for this category
	const categoryId = pqData.categoryId;
	const availableUnits = metadata.availableUnits?.[categoryId];
	
	console.log('🏷️ Category ID:', categoryId);
	console.log('📏 Available units for category:', availableUnits);
	
	if (!availableUnits || !Array.isArray(availableUnits) || availableUnits.length === 0) {
		console.log('❌ No units available for category:', categoryId);
		return [{ 
			name: `No units available for category ${categoryId}`, 
			value: pqData.unit || '' 
		}];
	}
	
	// Build options with original unit first
	const originalUnit = pqData.unit;
	const options = [];
	
	// Add original unit first if it exists in available units
	if (originalUnit && availableUnits.includes(originalUnit)) {
		options.push({
			name: `${originalUnit} (default)`,
			value: originalUnit,
		});
	}
	
	// Add all other units (excluding original to avoid duplicates)
	availableUnits.forEach((unit: string) => {
		if (unit !== originalUnit) {
			options.push({
				name: unit,
				value: unit,
			});
		}
	});
	
	console.log('✅ Built unit options:', options.length, 'units');
	console.log('📤 Returning options:', options.map(o => o.name));
	
	return options;
}