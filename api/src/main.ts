import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { openapi } from '@elysia/openapi';
import { adminAccountsController } from './modules/admin/accounts/controller';
import { connectionsController } from './modules/connections/controller';
import { llmController } from './modules/llm/controller';
import { adminMembersController } from './modules/admin/members/controller';
import { adminSettingsController } from './modules/admin/settings/controller';
import { adminWorkspacesController } from './modules/admin/workspaces/controller';
import { workspacesController } from './modules/workspaces/controller';
import { membersController } from './modules/members/controller';
import { authController } from './modules/auth/controller';
import { ENV } from './env';
import { normalizeError } from './libs/error';
import { ensurePort } from './libs/startup';

export const app = new Elysia({ prefix: '/api' })
	.use(cors())
	.use(
		openapi({
			path: '/docs',
			documentation: {
				info: {
					title: 'Easy Vibe Coding API',
					description:
						'Full-stack starter API (Elysia + Drizzle + Postgres). Request and response schemas live in packages/shared — the single source of truth for the wire contract.',
					version: '0.0.0',
				},
				tags: [
					{
						name: 'Accounts',
						description:
							'Account management — the canonical CRUD module (admin-only).',
					},
					{
						name: 'Workspaces',
						description:
							'Workspace containers — membership-scoped list/creation (users) + platform CRUD under /workspaces/admin (admins).',
					},
					{
						name: 'Members',
						description:
							"Workspace roster — the current workspace's accounts (users) and the entered workspace's member management under /admin/workspaces/members (admins).",
					},
					{
						name: 'Auth',
						description:
							'Authentication — register, sign in, current session (JWT bearer).',
					},
					{
						name: 'Settings',
						description:
							'Platform-level settings — one get/set pair per settings module (admin-only).',
					},
					{
						name: 'Connections',
						description:
							'Platform connections (Shopify / BigCommerce) — workspace-scoped credentials plus a live product lookup.',
					},
					{
						name: 'LLM',
						description:
							'Personal LLM providers (Anthropic / OpenAI) — stored keys, a default model choice, and the pickable model catalog per account.',
					},
				],
			},
		}),
	)
	.onError(({ code, error, set }) => {
		const { status, body } = normalizeError(code, error);
		set.status = status;
		return body;
	})
	.use(adminAccountsController)
	.use(connectionsController)
	.use(llmController)
	.use(adminSettingsController)
	.use(workspacesController)
	.use(adminWorkspacesController)
	.use(adminMembersController)
	.use(membersController)
	.use(authController);

export type App = typeof app;

await ensurePort({ port: Number(ENV.PORT), hostname: ENV.HOST });

app.listen({
	port: Number(ENV.PORT),
	hostname: ENV.HOST,
});
console.log(`API ready at http://${ENV.HOST}:${ENV.PORT}/api`);
