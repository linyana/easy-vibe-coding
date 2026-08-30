import { Elysia } from 'elysia';
import {
	workspaceCreateSchema,
	workspaceListResponseSchema,
	workspaceResponseSchema,
} from '@easy-vibe-coding/shared';
import { workspaceService } from './service';
import { authGuard } from '../../libs/guards';

// User-facing workspace surface: the picker's membership list + creation.
// The platform-level surface (/workspaces/admin*) lives in modules/admin/workspaces.
export const workspacesController = new Elysia({
	prefix: '/workspaces',
	detail: {
		tags: ['Workspaces'],
	},
})
	.use(authGuard)
	.guard({ auth: true })
	.get('/', ({ auth }) => workspaceService.list(auth.accountId), {
		response: workspaceListResponseSchema,
	})
	.post(
		'/',
		({ auth, body }) =>
			workspaceService.create({ accountId: auth.accountId, data: body }),
		{
			body: workspaceCreateSchema,
			response: workspaceResponseSchema,
		},
	);
