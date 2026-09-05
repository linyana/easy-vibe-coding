import { Elysia } from 'elysia';
import {
	connectionCreateSchema,
	connectionIdParamsSchema,
	connectionListQuerySchema,
	connectionListResponseSchema,
	connectionResponseSchema,
	connectionUpdateSchema,
	productListResponseSchema,
	successResponseSchema,
} from '@easy-vibe-coding/shared';
import { connectionService } from './service';
import { guards } from '../../libs/guards';

// Workspace-scoped surface (like members): the `workspace` guard resolves the
// workspace from the request's X-Workspace-Slug header (the URL slug is the
// address), `role` gates on membership per request.
export const connectionsController = new Elysia({
	prefix: '/connections',
	detail: {
		tags: ['Connections'],
	},
})
	.use(guards)
	.guard({ workspace: true, role: ['owner', 'member'] }, (app) =>
		app
			.get(
				'/',
				({ query, workspace }) =>
					connectionService.list({
						workspaceId: workspace.id,
						query,
					}),
				{
					query: connectionListQuerySchema,
					response: connectionListResponseSchema,
				},
			)
			.post(
				'/',
				({ body, workspace }) =>
					connectionService.create({
						workspaceId: workspace.id,
						data: body,
					}),
				{
					body: connectionCreateSchema,
					response: connectionResponseSchema,
				},
			)
			.patch(
				'/:id',
				({ params, body, workspace }) =>
					connectionService.update({
						workspaceId: workspace.id,
						id: params.id,
						data: body,
					}),
				{
					params: connectionIdParamsSchema,
					body: connectionUpdateSchema,
					response: connectionResponseSchema,
				},
			)
			.delete(
				'/:id',
				({ params, workspace }) =>
					connectionService.remove({
						workspaceId: workspace.id,
						id: params.id,
					}),
				{
					params: connectionIdParamsSchema,
					response: successResponseSchema,
				},
			)
			.post(
				'/:id/test',
				({ params, workspace }) =>
					connectionService.test({
						workspaceId: workspace.id,
						id: params.id,
					}),
				{
					params: connectionIdParamsSchema,
					response: successResponseSchema,
				},
			)
			.get(
				'/:id/products',
				({ params, workspace }) =>
					connectionService.getProducts({
						workspaceId: workspace.id,
						id: params.id,
					}),
				{
					params: connectionIdParamsSchema,
					response: productListResponseSchema,
				},
			),
	);
