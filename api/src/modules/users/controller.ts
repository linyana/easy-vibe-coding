import { Elysia } from 'elysia';
import {
	userBatchDeleteSchema,
	userBatchDeleteResponseSchema,
	userCreateSchema,
	userIdParamsSchema,
	userListQuerySchema,
	userListResponseSchema,
	userResponseSchema,
	userStatsResponseSchema,
	userUpdateSchema,
	successResponseSchema,
} from '@easy-vibe-coding/shared';
import { userService } from './service';
import { adminScope } from '../../libs/guards';

export const usersController = new Elysia({
	prefix: '/users',
	detail: {
		tags: ['Users'],
	},
})
	// Platform admin surface — every route below requires is_admin (the
	// derive verifies the token inline and checks the users row).
	.derive(adminScope)
	.get('/', ({ query }) => userService.list(query), {
		query: userListQuerySchema,
		response: userListResponseSchema,
	})
	.get('/stats', () => userService.stats(), {
		response: userStatsResponseSchema,
	})
	.get('/:id', ({ params }) => userService.detail(params.id), {
		params: userIdParamsSchema,
		response: userResponseSchema,
	})
	.post('/', ({ body }) => userService.create(body), {
		body: userCreateSchema,
		response: userResponseSchema,
	})
	.patch(
		'/:id',
		({ params, body }) => userService.update({ id: params.id, data: body }),
		{
			params: userIdParamsSchema,
			body: userUpdateSchema,
			response: userResponseSchema,
		},
	)
	.delete('/:id', ({ params }) => userService.remove(params.id), {
		params: userIdParamsSchema,
		response: successResponseSchema,
	})
	.post('/batch-delete', ({ body }) => userService.removeMany(body.ids), {
		body: userBatchDeleteSchema,
		response: userBatchDeleteResponseSchema,
	});
