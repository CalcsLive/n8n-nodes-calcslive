import { ILoadOptionsFunctions } from 'n8n-workflow';
import { ArticleMetadata, getCachedMetadata, setCachedMetadata } from './metadataCache';

/**
 * CalcsLive API client for n8n node
 * Handles article validation and metadata fetching
 */

export async function fetchArticleMetadata(
	context: ILoadOptionsFunctions,
	articleId: string
): Promise<ArticleMetadata> {
	// Check cache first
	const cached = getCachedMetadata(articleId);
	if (cached) {
		console.log('⚡ Cache hit - using cached metadata for:', articleId);
		return cached;
	}

	console.log('💾 Cache miss - fetching metadata for:', articleId);
	
	try {
		const credentials = await context.getCredentials('calcsLiveApi');
		const baseUrl = credentials.baseUrl || 'https://www.calcs.live';
		const requestUrl = `${baseUrl}/api/n8n/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`;
		
		console.log('📤 Making API request to:', requestUrl);
		console.log('📤 Request headers:', {
			'Authorization': `Bearer ${String(credentials.apiKey).substring(0, 10)}...`,
			'X-CalcsLive-Source': 'n8n-node',
			'User-Agent': 'n8n-calcslive-node/1.0.0',
		});
		
		const response = await context.helpers.httpRequest({
			method: 'GET',
			url: requestUrl,
			headers: {
				'Authorization': `Bearer ${credentials.apiKey}`,
				'X-CalcsLive-Source': 'n8n-node',
				'User-Agent': 'n8n-calcslive-node/1.0.0',
			},
		});
		
		console.log('🌐 Raw API Response received for:', articleId);
		console.log('📥 Full response structure:');
		console.log(JSON.stringify(response, null, 2));
		
		if (response.success && response.metadata) {
			const metadata: ArticleMetadata = response.metadata;
			setCachedMetadata(articleId, metadata);
			return metadata;
		} else {
			throw new Error('Invalid API response: ' + JSON.stringify(response));
		}
	} catch (error: any) {
		console.log('❌ API Error:', error.message);
		throw error;
	}
}

export function findPQBySymbol(metadata: ArticleMetadata, symbol: string) {
	const allPQs = [...(metadata.inputPQs || []), ...(metadata.outputPQs || [])];
	return allPQs.find(pq => pq.symbol === symbol);
}