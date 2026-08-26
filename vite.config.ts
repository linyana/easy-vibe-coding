import { defineConfig } from 'vite-plus';

export default defineConfig({
	fmt: {
		useTabs: true,
		tabWidth: 4,
		singleQuote: true,
		semi: true,
		trailingComma: 'all',
		printWidth: 80,
		sortPackageJson: false,
		ignorePatterns: [
			'node_modules',
			'dist',
			'build',
			'app/src/routeTree.gen.ts',
			'api/drizzle/**',
		],
	},
	lint: {
		options: {
			// `vp check` runs format + lint (incl. type-aware rules) + type-check in one pass.
			typeAware: true,
			typeCheck: true,
		},
		ignorePatterns: [
			'**/node_modules/**',
			'**/dist/**',
			'**/build/**',
			'app/src/routeTree.gen.ts',
			'api/drizzle/**',
		],
		overrides: [
			{
				files: ['api/src/**/*.ts', 'api/src/**/*.tsx'],
				rules: {
					'no-restricted-properties': [
						'error',
						{
							object: 'process',
							property: 'env',
							message:
								'Direct process.env access is forbidden. Use the centralized ENV module instead.',
						},
						{
							object: 'Bun',
							property: 'env',
							message:
								'Direct Bun.env access is forbidden. Use the centralized ENV module instead.',
						},
					],
				},
			},
			{
				files: ['app/src/**/*.ts', 'app/src/**/*.tsx'],
				rules: {
					'no-restricted-imports': [
						'error',
						{
							patterns: [
								{
									group: ['@api/*'],
									allowTypeImports: true,
									message:
										"The app may only type-import from the API (import type { App } from '@api/main'). Runtime API code (Bun-only) must never be bundled into the browser.",
								},
							],
						},
					],
				},
			},
		],
	},
});
