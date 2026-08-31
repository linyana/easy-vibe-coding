import { Elysia } from 'elysia';
import {
	settingsGetQuerySchema,
	settingsPayloadSchema,
	settingsUpdateSchema,
} from '@easy-vibe-coding/shared';
import { adminSettingsService } from './service';
import { guards } from '../../../libs/guards';

// The platform-level settings surface — one get/set endpoint pair
// parameterised by `module`, guarded by the admin flag. There is no
// user-facing counterpart (a workspace-level settings module, if it ever
// arrives, is a separate module in a separate controller).
export const adminSettingsController = new Elysia({
	prefix: '/settings',
	detail: {
		tags: ['Settings'],
	},
})
	.use(guards)
	.guard({ admin: true })
	.get('/', ({ query }) => adminSettingsService.get(query.module), {
		query: settingsGetQuerySchema,
		response: settingsPayloadSchema,
	})
	.put('/', ({ body }) => adminSettingsService.update(body), {
		body: settingsUpdateSchema,
		response: settingsPayloadSchema,
	});
