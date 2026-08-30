import { Elysia } from 'elysia';
import {
	authLoginSchema,
	authRegisterSchema,
	authResponseSchema,
	meResponseSchema,
	switchWorkspaceResponseSchema,
	switchWorkspaceSchema,
} from '@easy-vibe-coding/shared';
import { authService } from './service';
import { authGuard } from '../../libs/guards';
import { createRateLimiter } from '../../libs/rateLimit';

const ipRateLimiter = createRateLimiter({
	max: 100,
	windowMs: 15 * 60 * 1000,
});
const credentialRateLimiter = createRateLimiter({
	max: 10,
	windowMs: 15 * 60 * 1000,
});

export const authController = new Elysia({
	prefix: '/auth',
	detail: {
		tags: ['Auth'],
	},
})
	.use(authGuard)
	.post(
		'/register',
		({ body, request, server }) => {
			// Consume BEFORE hashing — register costs an argon2id hash, so the
			// gate protects CPU as much as it limits garbage accounts.
			const ip = server?.requestIP(request)?.address ?? 'unknown';
			ipRateLimiter.consume(ip);
			credentialRateLimiter.consume(
				`${ip}:${body.email.trim().toLowerCase()}`,
			);
			return authService.register(body);
		},
		{
			body: authRegisterSchema,
			response: authResponseSchema,
		},
	)
	.post(
		'/login',
		({ body, request, server }) => {
			// Consume BEFORE verifying — a failed attempt is the point of the gate.
			const ip = server?.requestIP(request)?.address ?? 'unknown';
			ipRateLimiter.consume(ip);
			credentialRateLimiter.consume(
				`${ip}:${body.email.trim().toLowerCase()}`,
			);
			return authService.login(body);
		},
		{
			body: authLoginSchema,
			response: authResponseSchema,
		},
	)
	.get(
		'/me',
		({ auth }) => authService.me(auth.accountId, auth.workspaceSlug),
		{
			auth: true,
			response: meResponseSchema,
		},
	)
	.post(
		'/switch-workspace',
		({ auth, body }) =>
			authService.switchWorkspace({
				accountId: auth.accountId,
				slug: body.slug,
			}),
		{
			auth: true,
			body: switchWorkspaceSchema,
			response: switchWorkspaceResponseSchema,
		},
	);
