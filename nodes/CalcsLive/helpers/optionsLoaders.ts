import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { fetchArticleMetadata } from './apiClient';
import { getCachedMetadata } from './metadataCache';

/**
 * Option loaders for CalcsLive n8n node
 * Clean, simple implementations for dropdowns
 */

export async function getInputPQs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const articleId = this.getCurrentNodeParameter('articleId') as string;
	
	console.log('🆔 getInputPQs called for articleId:', articleId);
	
	if (!articleId) {
		return [{ name: 'Enter Article ID First', value: '' }];
	}
	
	try {
		const metadata = await fetchArticleMetadata(this, articleId);
		
		if (!metadata?.inputPQs) {
			return [{ name: 'No Input PQs Found', value: '' }];
		}
		
		// Return clean symbol names only
		const options = metadata.inputPQs.map(pq => ({
			name: pq.symbol, // Display: just "D", "t", "s"
			value: pq.symbol, // Clean symbol value: "D", "t", "s"
		}));
		
		console.log('✅ Built input options:', options.length, 'symbols');
		return options;
		
	} catch (error: any) {
		console.log('❌ Error in getInputPQs:', error.message);
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
		
		const options = metadata.outputPQs.map(pq => ({
			name: pq.symbol, // Display: just "s1", "v", "result"
			value: pq.symbol, // Clean symbol value: "s1", "v", "result"
		}));
		
		console.log('✅ Built output options:', options.length, 'symbols');
		return options;
		
	} catch (error: any) {
		console.log('❌ Error in getOutputPQs:', error.message);
		return [{ name: `Error: ${error.message}`, value: '' }];
	}
}

export async function getUnitsForSymbol(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	console.log('\n🔍 === getUnitsForSymbol called (MVP Version) ===');
	
	const articleId = this.getCurrentNodeParameter('articleId') as string;
	console.log('📋 Article ID:', articleId);
	
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
			// Add more as needed
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
		
		console.log('✅ MVP: Returning all available units:', options.length, 'total options');
		return options;
		
	} catch (error: any) {
		console.log('❌ Error in getUnitsForSymbol:', error.message);
		return [{ name: `Error: ${error.message}`, value: '' }];
	}
}

// Clean helper function removed - using MVP approach in getUnitsForSymbol
