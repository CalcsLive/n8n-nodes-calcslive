import { INodeProperties } from 'n8n-workflow';

/**
 * Enhanced mode configuration for dynamic PQ input/output fields
 * This replaces the hardcoded Enhanced mode configuration in the main node file
 */

/**
 * Enhanced mode - Input PQ configuration
 * FIXED: Simplified dependencies and proper symbol handling
 */
export const inputPQsProperty: INodeProperties = {
	displayName: 'Input Physical Quantities',
	name: 'inputPQs',
	type: 'fixedCollection',
	typeOptions: {
		multipleValues: true,
	},
	displayOptions: {
		show: {
			operation: ['execute'],
			resource: ['calculation'],
			configMode: ['enhanced'],
		},
	},
	default: {},
	placeholder: 'Add Input PQ',
	options: [
		{
			name: 'pq',
			displayName: 'Physical Quantity',
			values: [
				{
					displayName: 'Symbol',
					name: 'symbol',
					type: 'options',
					typeOptions: {
						loadOptionsMethod: 'getInputPQs',
						loadOptionsDependsOn: ['articleId'],
					},
					default: '',
					description: 'Select the input physical quantity symbol',
				},
				{
					displayName: 'Value',
					name: 'value',
					type: 'number',
					default: undefined,
					description: 'Enter the numeric value (leave empty to use calc default). Will auto-populate during execution if empty.',
				},
				{
					displayName: 'Unit',
					name: 'unit',
					type: 'options',
					typeOptions: {
						loadOptionsMethod: 'getUnitsForSymbol',
						// FIXED: Simplified dependencies - only depend on articleId and the symbol in THIS row
						loadOptionsDependsOn: ['articleId', 'symbol'],
					},
					default: '',
					description: 'Select the unit for this quantity (leave empty to use calc default). Will auto-populate during execution if empty.',
				},
			],
		},
	],
	description: '⚠️ IMPORTANT: When you change Article ID, you MUST remove all old PQ rows and add new ones. Old rows contain stale symbols that don\'t exist in the new calc.',
};

/**
 * Enhanced mode - Output PQ configuration  
 * FIXED: Simplified dependencies and proper symbol handling
 */
export const outputPQsProperty: INodeProperties = {
	displayName: 'Output Physical Quantities',
	name: 'outputPQs',
	type: 'fixedCollection',
	typeOptions: {
		multipleValues: true,
	},
	displayOptions: {
		show: {
			operation: ['execute'],
			resource: ['calculation'],
			configMode: ['enhanced'],
		},
	},
	default: {},
	placeholder: 'Add Output PQ',
	options: [
		{
			name: 'pq',
			displayName: 'Physical Quantity',
			values: [
				{
					displayName: 'Symbol',
					name: 'symbol',
					type: 'options',
					typeOptions: {
						loadOptionsMethod: 'getOutputPQs',
						loadOptionsDependsOn: ['articleId'],
					},
					default: '',
					description: 'Select the output physical quantity symbol',
				},
				{
					displayName: 'Unit',
					name: 'unit',
					type: 'options',
					typeOptions: {
						loadOptionsMethod: 'getUnitsForSymbol',
						// FIXED: Simplified dependencies - only depend on articleId and the symbol in THIS row
						loadOptionsDependsOn: ['articleId', 'symbol'],
					},
					default: '',
					description: 'Select the desired output unit',
				},
			],
		},
	],
	description: '⚠️ IMPORTANT: When you change Article ID, you MUST remove all old PQ rows and add new ones. Old rows contain stale symbols that don\'t exist in the new calc.',
};