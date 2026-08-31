import { Elysia } from 'elysia';
import {
	successResponseSchema,
	workspaceAdminListQuerySchema,
	workspaceIdParamsSchema,
	workspaceListResponseSchema,
	workspaceMemberAddSchema,
	workspaceMemberParamsSchema,
	workspaceMemberRoleUpdateSchema,
	workspaceResponseSchema,
	workspaceStatsResponseSchema,
	workspaceUpdateSchema,
} from '@easy-vibe-coding/shared';
import { memberListResponseSchema } from '@easy-vibe-coding/shared';
import { adminWorkspaceService } from './service';
import { authGuard } from '../../../libs/guards';

// The platform-level workspace surface — every route under /workspaces/admin*
// is role-guarded (['admin']). The user-facing list/create lives in
// modules/workspaces.
export const adminWorkspacesController = new Elysia({
	prefix: '/workspaces/admin',
	detail: {
		tags: ['Workspaces'],
	},
})
	.use(authGuard)
	.guard({ role: ['admin'] })
	.get('/', ({ query }) => adminWorkspaceService.list(query), {
		query: workspaceAdminListQuerySchema,
		response: workspaceListResponseSchema,
	})
	.get('/stats', () => adminWorkspaceService.stats(), {
		response: workspaceStatsResponseSchema,
	})
	.patch(
		'/:id',
		({ params, body }) =>
			adminWorkspaceService.update({ id: params.id, data: body }),
		{
			params: workspaceIdParamsSchema,
			body: workspaceUpdateSchema,
			response: workspaceResponseSchema,
		},
	)
	.delete('/:id', ({ params }) => adminWorkspaceService.remove(params.id), {
		params: workspaceIdParamsSchema,
		response: successResponseSchema,
	})
	.get(
		'/:id/members',
		({ params }) => adminWorkspaceService.listMembers(params.id),
		{
			params: workspaceIdParamsSchema,
			response: memberListResponseSchema,
		},
	)
	.post(
		'/:id/members',
		({ params, body }) =>
			adminWorkspaceService.addMember({
				workspaceId: params.id,
				data: body,
			}),
		{
			params: workspaceIdParamsSchema,
			body: workspaceMemberAddSchema,
			response: successResponseSchema,
		},
	)
	.patch(
		'/:id/members/:accountId',
		({ params, body }) =>
			adminWorkspaceService.updateMemberRole({
				workspaceId: params.id,
				accountId: params.accountId,
				data: body,
			}),
		{
			params: workspaceMemberParamsSchema,
			body: workspaceMemberRoleUpdateSchema,
			response: successResponseSchema,
		},
	)
	.delete(
		'/:id/members/:accountId',
		({ params }) =>
			adminWorkspaceService.removeMember({
				workspaceId: params.id,
				accountId: params.accountId,
			}),
		{
			params: workspaceMemberParamsSchema,
			response: successResponseSchema,
		},
	);
