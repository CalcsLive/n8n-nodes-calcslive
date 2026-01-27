import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { fetchArticleMetadata } from './apiClient';
import { getCachedMetadata } from './metadataCache';

/**
 * Option loaders for CalcsLive n8n node
 * Clean, simple implementations for dropdowns
 */

export async function getInputPQs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const articleId = this.getCurrentNodeParameter('articleId') as string;

	if (!articleId) {
		return [{ name: 'Enter Article ID First', value: '' }];
	}

	try {
		const metadata = await fetchArticleMetadata(this, articleId);

		if (!metadata?.inputPQs) {
			return [{ name: 'No Input PQs Found', value: '' }];
		}

		// Return clean symbol names only
		return metadata.inputPQs.map(pq => ({
			name: pq.symbol,
			value: pq.symbol,
		}));
	} catch (error: any) {
		return [{ name: `Error: ${error.message}`, value: '' }];
	}
}

export async function getOutputPQs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const articleId = this.getCurrentNodeParameter('articleId') as string;

	if (!articleId) {
		return [{ name: 'Enter Article ID First', value: '' }];
	}

	try {
		const metadata = await fetchArticleMetadata(this, articleId);

		if (!metadata?.outputPQs) {
			return [{ name: 'No Output PQs Found', value: '' }];
		}

		return metadata.outputPQs.map(pq => ({
			name: pq.symbol,
			value: pq.symbol,
		}));
	} catch (error: any) {
		return [{ name: `Error: ${error.message}`, value: '' }];
	}
}

export async function getUnitsForSymbol(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const articleId = this.getCurrentNodeParameter('articleId') as string;

	if (!articleId) {
		return [{ name: 'Enter Article ID First', value: '' }];
	}

	try {
		// Ensure metadata is cached
		await fetchArticleMetadata(this, articleId);

		// MVP APPROACH: Return ALL available units from the article
		// This eliminates complex symbol detection while still being functional
		const metadata = getCachedMetadata(articleId);

		if (!metadata?.availableUnits) {
			return [{ name: 'No Units Available', value: '' }];
		}

		const options: INodePropertyOptions[] = [];
		const categoryMap: Record<string, string> = {
			'220': 'Velocity/Speed',
			'901': 'Length/Distance',
			'903': 'Time',
		};

		// Group all units by category with clear headers
		Object.entries(metadata.availableUnits).forEach(([categoryId, units]) => {
			const categoryName = categoryMap[categoryId] || `Category ${categoryId}`;

			// Add category header
			options.push({
				name: `── ${categoryName} ──`,
				value: '',
				description: `Units for ${categoryName.toLowerCase()}`
			});

			// Add units for this category
			(units as string[]).forEach(unit => {
				options.push({
					name: `  ${unit}`,
					value: unit
				});
			});
		});

		return options;
	} catch (error: any) {
		return [{ name: `Error: ${error.message}`, value: '' }];
	}
}

// Clean helper function removed - using MVP approach in getUnitsForSymbol
