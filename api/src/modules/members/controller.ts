import { Elysia } from 'elysia';
import { memberListResponseSchema } from '@easy-vibe-coding/shared';
import { memberService } from './service';
import { guards } from '../../libs/guards';

// The member roster of the workspace the request names — the shared
// `workspace` guard resolves the X-Workspace-Slug header and injects it;
// `role` gates on membership per request.
export const membersController = new Elysia({
	prefix: '/members',
	detail: {
		tags: ['Members'],
	},
})
	.use(guards)
	.get('/', ({ workspace }) => memberService.list(workspace.id), {
		// Explicit workspace scope (role also declares it as a dependency, so
		// the resolution runs once regardless of declaration order).
		workspace: true,
		role: ['owner', 'member'],
		response: memberListResponseSchema,
	});
