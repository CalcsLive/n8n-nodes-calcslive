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
		return cached;
	}

	const credentials = await context.getCredentials('calcsLiveApi');
	const baseUrl = credentials.baseUrl || 'https://www.calcslive.com';
	const requestUrl = `${baseUrl}/api/n8n/v1/validate?articleId=${articleId}&apiKey=${credentials.apiKey}`;

	const response = await context.helpers.httpRequest({
		method: 'GET',
		url: requestUrl,
		headers: {
			'Authorization': `Bearer ${credentials.apiKey}`,
			'X-CalcsLive-Source': 'n8n-node',
			'User-Agent': 'n8n-calcslive-node/1.0.0',
		},
	});

	if (response.success && response.data?.article) {
		// Convert v1 API response to metadata format
		const apiData = response.data.article;
		const metadata: ArticleMetadata = {
			articleId: apiData.articleId,
			articleTitle: apiData.articleTitle,
			totalPQs: apiData.totalPQs,
			inputPQs: apiData.inputPQs,
			outputPQs: apiData.outputPQs,
			availableUnits: apiData.availableUnits,
		};
		setCachedMetadata(articleId, metadata);
		return metadata;
	} else {
		throw new Error('Invalid API response: ' + JSON.stringify(response));
	}
}

export function findPQBySymbol(metadata: ArticleMetadata, symbol: string) {
	const allPQs = [...(metadata.inputPQs || []), ...(metadata.outputPQs || [])];
	return allPQs.find(pq => pq.symbol === symbol);
}