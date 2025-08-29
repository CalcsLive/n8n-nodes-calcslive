/**
 * Simple in-memory cache for article metadata
 * Avoids repeated API calls during n8n node configuration
 */

export interface ArticleMetadata {
	inputPQs?: Array<{
		symbol: string;
		description?: string;
		unit: string;
		categoryId: string;
		faceValue?: number;
	}>;
	outputPQs?: Array<{
		symbol: string;
		description?: string;
		unit: string;
		categoryId: string;
		expression?: string;
	}>;
	availableUnits?: Record<string, string[]>; // categoryId -> units array
}

export const metadataCache: Record<string, ArticleMetadata> = {};

// Enhanced caching: symbol -> categoryId -> units mapping
export const symbolUnitsCache: Record<string, Record<string, string[]>> = {};

export function clearCache() {
	Object.keys(metadataCache).forEach(key => delete metadataCache[key]);
	Object.keys(symbolUnitsCache).forEach(key => delete symbolUnitsCache[key]);
	console.log('🗑️ Metadata and symbol units cache cleared');
}

export function getCachedMetadata(articleId: string): ArticleMetadata | null {
	return metadataCache[articleId] || null;
}

export function setCachedMetadata(articleId: string, metadata: ArticleMetadata): void {
	metadataCache[articleId] = metadata;
	console.log('💾 Cached metadata for:', articleId);
	
	console.log('🔍 === METADATA CACHE ANALYSIS ===');
	if (metadata.inputPQs) {
		console.log('✅ Cached Input PQs:', metadata.inputPQs.length);
		metadata.inputPQs.forEach((pq, index) => {
			console.log(`  Input ${index + 1}: ${pq.symbol} (${pq.description}) - Category: ${pq.categoryId}, Unit: ${pq.unit}`);
		});
	}
	
	if (metadata.outputPQs) {
		console.log('✅ Cached Output PQs:', metadata.outputPQs.length);
		metadata.outputPQs.forEach((pq, index) => {
			console.log(`  Output ${index + 1}: ${pq.symbol} (${pq.description}) - Category: ${pq.categoryId}, Unit: ${pq.unit}`);
		});
	}
	
	if (metadata.availableUnits) {
		const categoryCount = Object.keys(metadata.availableUnits).length;
		console.log('✅ Cached Available Units:', categoryCount, 'categories');
		Object.entries(metadata.availableUnits).forEach(([categoryId, units]) => {
			console.log(`  Category ${categoryId}: ${units.length} units`);
		});
	}
	
	// Build symbol-specific unit cache
	buildSymbolUnitsCache(articleId, metadata);
}

function buildSymbolUnitsCache(articleId: string, metadata: ArticleMetadata): void {
	if (!symbolUnitsCache[articleId]) {
		symbolUnitsCache[articleId] = {};
	}
	
	const cache = symbolUnitsCache[articleId];
	
	// Cache units for each input PQ symbol
	metadata.inputPQs?.forEach(pq => {
		const units = metadata.availableUnits?.[pq.categoryId];
		if (units && Array.isArray(units)) {
			cache[pq.symbol] = [...units]; // Clone array
		}
	});
	
	// Cache units for each output PQ symbol  
	metadata.outputPQs?.forEach(pq => {
		const units = metadata.availableUnits?.[pq.categoryId];
		if (units && Array.isArray(units)) {
			cache[pq.symbol] = [...units]; // Clone array
		}
	});
	
	const symbolCount = Object.keys(cache).length;
	console.log('🔗 Built symbol-units cache for', articleId, ':', symbolCount, 'symbols');
	
	// Log each symbol's units for debugging
	Object.entries(cache).forEach(([symbol, units]) => {
		console.log(`  Symbol "${symbol}": ${units.length} units -`, units.slice(0, 5).join(', '), units.length > 5 ? '...' : '');
	});
}

export function getUnitsForSymbol(articleId: string, symbol: string): string[] | null {
	const cache = symbolUnitsCache[articleId];
	if (!cache || !cache[symbol]) {
		return null;
	}
	return cache[symbol];
}