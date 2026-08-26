import { Elysia } from 'elysia';
import {
	authLoginSchema,
	authRegisterSchema,
	authResponseSchema,
	userResponseSchema,
} from '@easy-vibe-coding/shared';
import { authService } from './service';
import { authGuard } from '../../libs/guards';
import { createRateLimiter } from '../../libs/rateLimit';

// Per (IP, email) pair, not per email: a per-email key would let one attacker
// lock out a victim's sign-in from everywhere. (Behind a reverse proxy, key
// on X-Forwarded-For — see libs/rateLimit.)
const loginRateLimiter = createRateLimiter({
	max: 50,
	windowMs: 60 * 1000,
});

export const authController = new Elysia({
	prefix: '/auth',
	detail: {
		tags: ['Auth'],
	},
})
	.use(authGuard)
	.post('/register', ({ body }) => authService.register(body), {
		body: authRegisterSchema,
		response: authResponseSchema,
	})
	.post(
		'/login',
		({ body, request, server }) => {
			// Consume BEFORE verifying — a failed attempt is the point of the gate.
			const ip = server?.requestIP(request)?.address ?? 'unknown';
			loginRateLimiter.consume(
				`${ip}:${body.email.trim().toLowerCase()}`,
			);
			return authService.login(body);
		},
		{
			body: authLoginSchema,
			response: authResponseSchema,
		},
	)
	.get('/me', ({ auth }) => authService.me(auth.userId), {
		auth: true,
		response: userResponseSchema,
	});
