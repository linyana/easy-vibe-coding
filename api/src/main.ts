import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { openapi } from '@elysia/openapi';
import { accountsController } from './modules/accounts/controller';
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
							'Account management — the canonical CRUD module.',
					},
					{
						name: 'Workspaces',
						description:
							'Workspace containers — membership-scoped list and creation.',
					},
					{
						name: 'Members',
						description:
							"Workspace roster — the current workspace's accounts.",
					},
					{
						name: 'Auth',
						description:
							'Authentication — register, sign in, current session (JWT bearer).',
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
	.use(accountsController)
	.use(workspacesController)
	.use(membersController)
	.use(authController);

export type App = typeof app;

await ensurePort({ port: Number(ENV.PORT), hostname: ENV.HOST });

app.listen({
	port: Number(ENV.PORT),
	hostname: ENV.HOST,
});
console.log(`API ready at http://${ENV.HOST}:${ENV.PORT}/api`);
