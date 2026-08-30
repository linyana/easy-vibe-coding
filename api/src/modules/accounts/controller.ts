import { Elysia } from 'elysia';
import {
	accountBatchDeleteSchema,
	accountBatchDeleteResponseSchema,
	accountCreateSchema,
	accountIdParamsSchema,
	accountListQuerySchema,
	accountListResponseSchema,
	accountResponseSchema,
	accountStatsResponseSchema,
	accountUpdateSchema,
	successResponseSchema,
} from '@easy-vibe-coding/shared';
import { accountService } from './service';
import { authGuard } from '../../libs/guards';

export const accountsController = new Elysia({
	prefix: '/accounts',
	detail: {
		tags: ['Accounts'],
	},
})
	.use(authGuard)
	.guard({ auth: true })
	.get('/', ({ query }) => accountService.list(query), {
		query: accountListQuerySchema,
		response: accountListResponseSchema,
	})
	.get('/stats', () => accountService.stats(), {
		response: accountStatsResponseSchema,
	})
	.get('/:id', ({ params }) => accountService.detail(params.id), {
		params: accountIdParamsSchema,
		response: accountResponseSchema,
	})
	.post('/', ({ body }) => accountService.create(body), {
		body: accountCreateSchema,
		response: accountResponseSchema,
	})
	.patch(
		'/:id',
		({ params, body }) =>
			accountService.update({ id: params.id, data: body }),
		{
			params: accountIdParamsSchema,
			body: accountUpdateSchema,
			response: accountResponseSchema,
		},
	)
	.delete('/:id', ({ params }) => accountService.remove(params.id), {
		params: accountIdParamsSchema,
		response: successResponseSchema,
	})
	.post('/batch-delete', ({ body }) => accountService.removeMany(body.ids), {
		body: accountBatchDeleteSchema,
		response: accountBatchDeleteResponseSchema,
	});
