import { Elysia } from 'elysia';
import {
	memberAdminAccountParamsSchema,
	memberAdminAddSchema,
	memberAdminListQuerySchema,
	memberAdminRoleUpdateSchema,
	memberListResponseSchema,
	successResponseSchema,
} from '@easy-vibe-coding/shared';
import { adminMemberService } from './service';
import { guards } from '../../../libs/guards';

// The admin's entered-workspace member surface — split out of
// modules/admin/workspaces (which keeps the platform workspace CRUD). The
// workspace comes from the request's X-Workspace-Slug header (the `workspace`
// guard resolves it — the URL slug is the address), never a URL id. There is
// no role gate: an admin manages the workspace they entered whether or not
// they are a member of it.
export const adminMembersController = new Elysia({
	prefix: '/admin/workspaces/members',
	detail: {
		tags: ['Members'],
	},
})
	.use(guards)
	.guard({ admin: true, workspace: true })
	.get(
		'/',
		({ workspace, query }) =>
			adminMemberService.listMembers(workspace.id, query),
		{
			query: memberAdminListQuerySchema,
			response: memberListResponseSchema,
		},
	)
	.post(
		'/',
		({ workspace, body }) =>
			adminMemberService.addMember({
				workspaceId: workspace.id,
				data: body,
			}),
		{
			body: memberAdminAddSchema,
			response: successResponseSchema,
		},
	)
	.patch(
		'/:accountId',
		({ workspace, params, body }) =>
			adminMemberService.updateMemberRole({
				workspaceId: workspace.id,
				accountId: params.accountId,
				data: body,
			}),
		{
			params: memberAdminAccountParamsSchema,
			body: memberAdminRoleUpdateSchema,
			response: successResponseSchema,
		},
	)
	.delete(
		'/:accountId',
		({ workspace, params }) =>
			adminMemberService.removeMember({
				workspaceId: workspace.id,
				accountId: params.accountId,
			}),
		{
			params: memberAdminAccountParamsSchema,
			response: successResponseSchema,
		},
	);
