import { Elysia } from 'elysia';
import { extractBearerToken, verifyAuthToken } from '../auth';
import { Errors } from '../error';

export const authGuard = new Elysia({ name: 'libs/guards/auth' }).macro(
	'auth',
	{
		resolve: async ({ headers }) => {
			const token = extractBearerToken(headers.authorization);
			if (!token) throw Errors.unauthorized('Missing access token');
			const { accountId } = await verifyAuthToken(token);
			return { auth: { accountId } };
		},
	},
);
