import { Elysia } from 'elysia';
import {
	successResponseSchema,
	switchAdminWorkspaceSchema,
	switchAdminWorkspaceResponseSchema,
	workspaceAdminListQuerySchema,
	workspaceIdParamsSchema,
	workspaceListResponseSchema,
	workspaceMemberAccountParamsSchema,
	workspaceMemberAddSchema,
	workspaceMemberListQuerySchema,
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
//
// Two tiers:
// - Platform routes (list/stats/switch/edit/delete/disable/enable) address a
//   workspace by id/slug in the URL — they are not session-scoped.
// - The member surface (management of the entered workspace) is gated by
//   `adminWorkspace`: the workspace comes from the session's token slug claim
//   (auth.workspaceId), never from a URL id — an admin can only manage the
//   workspace they entered.
export const adminWorkspacesController = new Elysia({
	prefix: '/workspaces/admin',
	detail: {
		tags: ['Workspaces'],
	},
})
	.use(authGuard)
	.guard({ admin: true })
	.get('/', ({ query }) => adminWorkspaceService.list(query), {
		query: workspaceAdminListQuerySchema,
		response: workspaceListResponseSchema,
	})
	.get('/stats', () => adminWorkspaceService.stats(), {
		response: workspaceStatsResponseSchema,
	})
	.post(
		'/switch',
		({ auth, body }) =>
			adminWorkspaceService.switchWorkspace({
				accountId: auth.accountId,
				slug: body.slug,
			}),
		{
			body: switchAdminWorkspaceSchema,
			response: switchAdminWorkspaceResponseSchema,
		},
	)
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
	.post(
		'/:id/disable',
		({ params }) =>
			adminWorkspaceService.setDisabled({
				id: params.id,
				disabled: true,
			}),
		{
			params: workspaceIdParamsSchema,
			response: workspaceResponseSchema,
		},
	)
	.post(
		'/:id/enable',
		({ params }) =>
			adminWorkspaceService.setDisabled({
				id: params.id,
				disabled: false,
			}),
		{
			params: workspaceIdParamsSchema,
			response: workspaceResponseSchema,
		},
	)
	// Workspace-scoped member surface — the shared `workspace` guard resolves
	// the session's workspace and injects it; the module-wide `admin: true`
	// guard above still gates admin access. Handlers read `({ workspace })`,
	// never a URL id.
	.guard({ workspace: true })
	.get(
		'/members',
		({ workspace, query }) =>
			adminWorkspaceService.listMembers(workspace.id, query),
		{
			query: workspaceMemberListQuerySchema,
			response: memberListResponseSchema,
		},
	)
	.post(
		'/members',
		({ workspace, body }) =>
			adminWorkspaceService.addMember({
				workspaceId: workspace.id,
				data: body,
			}),
		{
			body: workspaceMemberAddSchema,
			response: successResponseSchema,
		},
	)
	.patch(
		'/members/:accountId',
		({ workspace, params, body }) =>
			adminWorkspaceService.updateMemberRole({
				workspaceId: workspace.id,
				accountId: params.accountId,
				data: body,
			}),
		{
			params: workspaceMemberAccountParamsSchema,
			body: workspaceMemberRoleUpdateSchema,
			response: successResponseSchema,
		},
	)
	.delete(
		'/members/:accountId',
		({ workspace, params }) =>
			adminWorkspaceService.removeMember({
				workspaceId: workspace.id,
				accountId: params.accountId,
			}),
		{
			params: workspaceMemberAccountParamsSchema,
			response: successResponseSchema,
		},
	);
