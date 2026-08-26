import path from 'path';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [TanStackRouterVite({ target: 'react' }), react(), tailwindcss()],
	resolve: {
		// Keep in sync with tsconfig.json "paths".
		alias: {
			'@': path.resolve(import.meta.dirname, './src'),
			// Shared workspace package — resolved to source so Vite transforms
			// it like first-party code (never pre-bundled from node_modules).
			'@easy-vibe-coding/shared': path.resolve(
				import.meta.dirname,
				'../packages/shared/src/index.ts',
			),
		},
	},
	server: {
		port: 5173,
	},
});
