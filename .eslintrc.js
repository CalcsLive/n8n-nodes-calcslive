module.exports = {
	root: true,
	env: {
		es6: true,
		node: true,
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: './tsconfig.json',
		sourceType: 'module',
		ecmaVersion: 2019,
		extraFileExtensions: ['.json'],
	},
	plugins: [
		'@typescript-eslint',
		'n8n-nodes-base',
	],
	extends: [
		'eslint:recommended',
		'plugin:n8n-nodes-base/nodes',
	],
	rules: {
		// Relaxed rules for MVP publishing - maintain development flexibility
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
		'no-console': 'off', // Explicitly allow console.log for debugging
		'@typescript-eslint/ban-ts-comment': 'warn',
		'@typescript-eslint/prefer-nullish-coalescing': 'off',
		'@typescript-eslint/prefer-optional-chain': 'off',
		
		// n8n specific rules
		'n8n-nodes-base/node-dirname-against-convention': 'error',
		'n8n-nodes-base/node-class-description-inputs-wrong-regular-node': 'error',
		'n8n-nodes-base/node-class-description-outputs-wrong': 'error',
		'n8n-nodes-base/node-filename-against-convention': 'error',
		'n8n-nodes-base/cred-filename-against-convention': 'error',
		
		// Code quality rules for marketplace
		'prefer-const': 'error',
		'no-var': 'error',
		'no-duplicate-imports': 'error',
		'no-unreachable': 'error',
		'eqeqeq': ['error', 'always'],
	},
	ignorePatterns: [
		'dist/**/*',
		'node_modules/**/*',
		'gulpfile.js',
		'test-*.js',
		'*.backup',
		'.e3d/**/*',
		'temp/**/*',
		'workflows/**/*',
	],
};