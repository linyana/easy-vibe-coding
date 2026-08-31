import { Elysia } from 'elysia';
import {
	accountAdminSchema,
	accountBatchDeleteSchema,
	accountBatchDeleteResponseSchema,
	accountCreateSchema,
	accountIdParamsSchema,
	accountListQuerySchema,
	accountListResponseSchema,
	accountResetPasswordSchema,
	accountResponseSchema,
	accountStatsResponseSchema,
	accountUpdateSchema,
	successResponseSchema,
} from '@easy-vibe-coding/shared';
import { adminAccountsService } from './service';
import { guards } from '../../../libs/guards';

export const adminAccountsController = new Elysia({
	prefix: '/accounts',
	detail: {
		tags: ['Accounts'],
	},
})
	.use(guards)
	// The whole module is the platform-level account management surface —
	// admins only. (Register/login live in the auth module; the accounts
	// module is the admin CRUD.)
	.guard({ admin: true })
	.get('/', ({ query }) => adminAccountsService.list(query), {
		query: accountListQuerySchema,
		response: accountListResponseSchema,
	})
	.get('/stats', () => adminAccountsService.stats(), {
		response: accountStatsResponseSchema,
	})
	.get('/:id', ({ params }) => adminAccountsService.detail(params.id), {
		params: accountIdParamsSchema,
		response: accountResponseSchema,
	})
	.post('/', ({ body }) => adminAccountsService.create(body), {
		body: accountCreateSchema,
		response: accountResponseSchema,
	})
	.patch(
		'/:id',
		({ params, body }) =>
			adminAccountsService.update({ id: params.id, data: body }),
		{
			params: accountIdParamsSchema,
			body: accountUpdateSchema,
			response: accountResponseSchema,
		},
	)
	.delete(
		'/:id',
		({ params, auth }) =>
			adminAccountsService.remove({
				id: params.id,
				actorId: auth.accountId,
			}),
		{
			params: accountIdParamsSchema,
			response: successResponseSchema,
		},
	)
	.post(
		'/batch-delete',
		({ body, auth }) =>
			adminAccountsService.removeMany({
				ids: body.ids,
				actorId: auth.accountId,
			}),
		{
			body: accountBatchDeleteSchema,
			response: accountBatchDeleteResponseSchema,
		},
	)
	// Reset password — a targeted admin write, deliberately NOT part of the
	// generic PATCH (password never flows through the account field rules).
	.patch(
		'/:id/password',
		({ params, body }) =>
			adminAccountsService.resetPassword({ id: params.id, data: body }),
		{
			params: accountIdParamsSchema,
			body: accountResetPasswordSchema,
			response: successResponseSchema,
		},
	)
	// Grant/revoke admin — a targeted write (like password): the flag never
	// flows through the generic PATCH, so an edit can't flip it by accident.
	.patch(
		'/:id/admin',
		({ params, body, auth }) =>
			adminAccountsService.setAdmin({
				id: params.id,
				isAdmin: body.isAdmin,
				actorId: auth.accountId,
			}),
		{
			params: accountIdParamsSchema,
			body: accountAdminSchema,
			response: accountResponseSchema,
		},
	);
