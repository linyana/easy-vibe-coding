import { Elysia } from 'elysia';
import { memberListResponseSchema } from '@easy-vibe-coding/shared';
import { memberService } from './service';
import { authGuard } from '../../libs/guards';

// The member roster of the current workspace — the shared `workspace` guard
// resolves the session's workspace and injects it; `role` gates on membership.
export const membersController = new Elysia({
	prefix: '/members',
	detail: {
		tags: ['Members'],
	},
})
	.use(authGuard)
	.get('/', ({ workspace }) => memberService.list(workspace.id), {
		// Explicit workspace scope (role also declares it as a dependency, so
		// the resolution runs once regardless of declaration order).
		workspace: true,
		role: ['owner', 'member'],
		response: memberListResponseSchema,
	});
