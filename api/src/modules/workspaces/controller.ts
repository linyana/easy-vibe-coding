import { Elysia } from 'elysia';
import {
	workspaceCreateSchema,
	workspaceDetailResponseSchema,
	workspaceListResponseSchema,
	workspaceResponseSchema,
} from '@easy-vibe-coding/shared';
import { workspaceService } from './service';
import { guards } from '../../libs/guards';

// User-facing workspace surface: the picker's membership list + creation, and
// a get-by-slug for a slug-addressed page shell (membership-gated — the URL
// slug is the address, the role guard re-validates per request). The
// platform-level surface (/workspaces/admin*) lives in modules/admin/workspaces.
export const workspacesController = new Elysia({
	prefix: '/workspaces',
	detail: {
		tags: ['Workspaces'],
	},
})
	.use(guards)
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
	)
	// The member-facing detail for slug pages — the role guard (which already
	// resolved the workspace from the request's slug) is the whole
	// authorization: reachable only by an owner/member of the named workspace.
	.guard({ workspace: true, role: ['owner', 'member'] }, (app) =>
		app.get(
			'/:slug',
			({ workspace }) => ({
				id: workspace.id,
				slug: workspace.slug,
				name: workspace.name,
			}),
			{ response: workspaceDetailResponseSchema },
		),
	);
