/**
 * Simple in-memory cache for article metadata
 * Avoids repeated API calls during n8n node configuration
 */

export interface ArticleMetadata {
	articleId?: string;
	articleTitle?: string;
	totalPQs?: number;
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
}

export function getCachedMetadata(articleId: string): ArticleMetadata | null {
	return metadataCache[articleId] || null;
}

export function setCachedMetadata(articleId: string, metadata: ArticleMetadata): void {
	metadataCache[articleId] = metadata;
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
}

export function getUnitsForSymbol(articleId: string, symbol: string): string[] | null {
	const cache = symbolUnitsCache[articleId];
	if (!cache || !cache[symbol]) {
		return null;
	}
	return cache[symbol];
}