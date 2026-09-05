import { Elysia } from 'elysia';
import {
	successResponseSchema,
	workspaceAdminListQuerySchema,
	workspaceDetailResponseSchema,
	workspaceIdParamsSchema,
	workspaceListResponseSchema,
	workspaceResponseSchema,
	workspaceStatsResponseSchema,
	workspaceUpdateSchema,
} from '@easy-vibe-coding/shared';
import { adminWorkspaceService } from './service';
import { guards } from '../../../libs/guards';

// The platform-level workspace surface — every route under /workspaces/admin*
// is role-guarded (['admin']). The user-facing list/create + member-facing
// get-by-slug live in modules/workspaces. All routes address a workspace by
// id in the URL — they are not session-scoped. (The admin's
// entered-workspace member management lives in its own module,
// modules/admin/members — its workspace comes from the request's slug too.)
export const adminWorkspacesController = new Elysia({
	prefix: '/workspaces/admin',
	detail: {
		tags: ['Workspaces'],
	},
})
	.use(guards)
	.guard({ admin: true })
	.get('/', ({ query }) => adminWorkspaceService.list(query), {
		query: workspaceAdminListQuerySchema,
		response: workspaceListResponseSchema,
	})
	.get('/stats', () => adminWorkspaceService.stats(), {
		response: workspaceStatsResponseSchema,
	})
	// The entered workspace's shell row — the workspace guard resolves it from
	// the request's slug header (the URL is the address), so this static route
	// needs no path parameter: admins can enter any workspace, incl. disabled
	// ones (admin: true is the gate; workspace: true only resolves). Kept as a
	// static sibling of the :id CRUD routes so Eden's dynamic params stay
	// unambiguous.
	.guard({ admin: true, workspace: true }, (app) =>
		app.get(
			'/current',
			({ workspace }) => ({
				id: workspace.id,
				slug: workspace.slug,
				name: workspace.name,
			}),
			{ response: workspaceDetailResponseSchema },
		),
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
	);
