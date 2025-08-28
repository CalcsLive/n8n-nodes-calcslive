import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { fetchArticleMetadata, findPQBySymbol } from './apiClient';

/**
 * Option loaders for CalcsLive n8n node
 * Clean, simple implementations for dropdowns
 */

export async function getInputPQs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const articleId = this.getCurrentNodeParameter('articleId') as string;
	
	console.log('🆔 getInputPQs called for articleId:', articleId);
	
	if (!articleId) {
		return [{ name: 'Enter Article ID first', value: '' }];
	}
	
	try {
		const metadata = await fetchArticleMetadata(this, articleId);
		
		if (!metadata?.inputPQs) {
			return [{ name: 'No input PQs found', value: '' }];
		}
		
		// Return clean symbol names as values, store metadata in cache for unit lookup
		const options = metadata.inputPQs.map(pq => ({
			name: `${pq.symbol} - ${pq.description || pq.symbol}`, // Display: "D - Distance" 
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
		return [{ name: 'Enter Article ID first', value: '' }];
	}
	
	try {
		const metadata = await fetchArticleMetadata(this, articleId);
		
		if (!metadata?.outputPQs) {
			return [{ name: 'No output PQs found', value: '' }];
		}
		
		const options = metadata.outputPQs.map(pq => ({
			name: `${pq.symbol} - ${pq.description || pq.symbol}`,
			value: pq.symbol,
		}));
		
		console.log('✅ Built output options:', options.length, 'symbols');
		return options;
		
	} catch (error: any) {
		console.log('❌ Error in getOutputPQs:', error.message);
		return [{ name: `Error: ${error.message}`, value: '' }];
	}
}

export async function getUnitsForSymbol(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	console.log('\n🔍 === getUnitsForSymbol called ===');
	
	const articleId = this.getCurrentNodeParameter('articleId') as string;
	
	console.log('📋 Article ID:', articleId);
	
	// Validation
	if (!articleId) {
		return [{ name: 'Enter Article ID first', value: '' }];
	}
	
	// In fixedCollection context, symbol parameter access is complex
	// For now, return all available units from all categories
	// This is a fallback until we can properly resolve the symbol
	
	try {
		const metadata = await fetchArticleMetadata(this, articleId);
		
		if (!metadata?.availableUnits) {
			return [{ name: 'No units data available', value: '' }];
		}
		
		// Combine all units from all categories as a fallback
		const allUnits = new Set<string>();
		Object.values(metadata.availableUnits).forEach(units => {
			if (Array.isArray(units)) {
				units.forEach(unit => allUnits.add(unit));
			}
		});
		
		if (allUnits.size === 0) {
			return [{ name: 'No units available', value: '' }];
		}
		
		// Return all units sorted
		const sortedUnits = Array.from(allUnits).sort();
		const options = sortedUnits.map(unit => ({ name: unit, value: unit }));
		
		console.log('✅ Built fallback unit options:', options.length, 'units from all categories');
		return options;
		
	} catch (error: any) {
		console.log('❌ Error in getUnitsForSymbol:', error.message);
		return [{ name: `Error: ${error.message}`, value: '' }];
	}
}
