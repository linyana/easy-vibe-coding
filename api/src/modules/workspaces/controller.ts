import { Elysia } from 'elysia';
import {
	workspaceCreateSchema,
	workspaceSlugParamsSchema,
	workspaceListQuerySchema,
	workspaceListResponseSchema,
	workspaceMemberCreateSchema,
	workspaceMemberParamsSchema,
	workspaceMemberResponseSchema,
	workspaceMembersListQuerySchema,
	workspaceMembersListResponseSchema,
	workspaceResponseSchema,
	workspaceUpdateSchema,
	workspaceWithRoleSchema,
} from '@easy-vibe-coding/shared';
import { memberService, workspaceService } from './service';
import { authGuard, workspaceScope } from '../../libs/guards';
export const workspacesController = new Elysia({
	prefix: '/workspaces',
	detail: {
		tags: ['Workspaces'],
	},
})
	// workspaceScope is the whole gate for the scoped routes below: auth
	// (inline, same libs/auth primitives) + membership. Root routes above keep
	// the authGuard macro.
	.use(authGuard)
	.guard({ auth: true }, (app) =>
		app
			.post(
				'/',
				({ body, auth }) =>
					workspaceService.create({
						name: body.name,
						userId: auth.userId,
					}),
				{
					body: workspaceCreateSchema,
					response: workspaceResponseSchema,
				},
			)
			.get(
				'/',
				({ query, auth }) =>
					workspaceService.list({ userId: auth.userId, query }),
				{
					query: workspaceListQuerySchema,
					response: workspaceListResponseSchema,
				},
			),
	)
	.derive(workspaceScope)
	.get(
		'/:workspaceSlug',
		({ workspace }) =>
			workspaceService.detail({ id: workspace.id, role: workspace.role }),
		{
			response: workspaceWithRoleSchema,
		},
	)
	.patch(
		'/:workspaceSlug',
		({ workspace, auth, body }) =>
			workspaceService.rename({
				id: workspace.id,
				role: workspace.role,
				isAdmin: auth.isAdmin,
				// The update schema guarantees at least one field and name is
				// its only field — present on every valid patch.
				name: body.name!,
			}),
		{
			params: workspaceSlugParamsSchema,
			body: workspaceUpdateSchema,
			response: workspaceResponseSchema,
		},
	)
	.get(
		'/:workspaceSlug/members',
		({ workspace, query }) =>
			memberService.list({
				workspaceId: workspace.id,
				query,
			}),
		{
			params: workspaceSlugParamsSchema,
			query: workspaceMembersListQuerySchema,
			response: workspaceMembersListResponseSchema,
		},
	)
	.post(
		'/:workspaceSlug/members',
		({ workspace, body }) =>
			memberService.add({
				workspaceId: workspace.id,
				role: workspace.role,
				email: body.email,
			}),
		{
			params: workspaceSlugParamsSchema,
			body: workspaceMemberCreateSchema,
			response: workspaceMemberResponseSchema,
		},
	)
	.delete(
		'/:workspaceSlug/members/:userId',
		({ workspace, params, auth }) =>
			memberService.remove({
				workspaceId: workspace.id,
				role: workspace.role,
				userId: params.userId,
				actingUserId: auth.userId,
			}),
		{
			params: workspaceMemberParamsSchema,
			response: workspaceMemberResponseSchema,
		},
	);
