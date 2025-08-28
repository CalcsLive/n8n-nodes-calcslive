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

export function clearCache() {
	Object.keys(metadataCache).forEach(key => delete metadataCache[key]);
	console.log('🗑️ Metadata cache cleared');
}

export function getCachedMetadata(articleId: string): ArticleMetadata | null {
	return metadataCache[articleId] || null;
}

export function setCachedMetadata(articleId: string, metadata: ArticleMetadata): void {
	metadataCache[articleId] = metadata;
	console.log('💾 Cached metadata for:', articleId);
}