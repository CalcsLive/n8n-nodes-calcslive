import { INodeProperties } from 'n8n-workflow';
import { inputPQsProperty, outputPQsProperty } from './enhancedModeConfig';

/**
 * Complete node properties configuration
 * Modularized from the main node file for better organization
 */
export const nodeProperties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Calculation',
				value: 'calculation',
			},
		],
		default: 'calculation',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['calculation'],
			},
		},
		options: [
			{
				name: 'Execute',
				value: 'execute',
				description: 'Execute a calculation with given inputs',
				action: 'Execute a calculation',
			},
		],
		default: 'execute',
	},
	{
		displayName: 'Article ID',
		name: 'articleId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['execute'],
				resource: ['calculation'],
			},
		},
		default: '',
		placeholder: '3LYPD4C96-34U',
		description: 'The calculation article identifier from CalcsLive. Enter this first, then configure inputs and outputs below.',
	},
	{
		displayName: 'Configuration Mode',
		name: 'configMode',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['execute'],
				resource: ['calculation'],
			},
		},
		options: [
			{
				name: 'Enhanced (Dynamic Fields)',
				value: 'enhanced',
				description: 'Use dynamic fields with PQ selection and unit dropdowns',
			},
			{
				name: 'Legacy (JSON Input)',
				value: 'legacy',
				description: 'Use raw JSON input (backward compatibility)',
			},
		],
		default: 'enhanced',
		description: 'Choose configuration mode',
	},
	// Legacy mode - simple JSON input
	{
		displayName: 'Inputs',
		name: 'inputs',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				operation: ['execute'],
				resource: ['calculation'],
				configMode: ['legacy'],
			},
		},
		default: '{\n  "D": { "value": 360, "unit": "km" },\n  "t": { "value": 2, "unit": "h" }\n}',
		description: 'Physical quantities with values and units. Replace symbols and values with those from your specific calc.',
	},
	{
		displayName: 'Outputs (Optional)',
		name: 'outputs',
		type: 'json',
		required: false,
		displayOptions: {
			show: {
				operation: ['execute'],
				resource: ['calculation'],
				configMode: ['legacy'],
			},
		},
		default: '{\n  "s": { "unit": "km/h" } \n}',
		description: 'Specify output units (optional). Example: {"result": {"unit": "km/h"}}. Leave empty to get all outputs with default units.',
	},
	// Enhanced mode properties (imported from enhancedModeConfig)
	inputPQsProperty,
	outputPQsProperty,
];