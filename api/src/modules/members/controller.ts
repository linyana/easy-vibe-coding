import { Elysia } from 'elysia';
import { memberListResponseSchema } from '@easy-vibe-coding/shared';
import { memberService } from './service';
import { authGuard } from '../../libs/guards';

export const membersController = new Elysia({
	prefix: '/members',
	detail: {
		tags: ['Members'],
	},
})
	.use(authGuard)
	.get('/', ({ auth }) => memberService.list(auth.workspaceId!), {
		role: ['owner', 'member'],
		response: memberListResponseSchema,
	});
