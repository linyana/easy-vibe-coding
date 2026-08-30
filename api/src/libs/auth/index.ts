import { SignJWT, jwtVerify } from 'jose';
import { ENV } from '../../env';
import { Errors } from '../error';

// JWT primitives — the token carries the accountId claim (sub mirrors it); the
// DB row is the source of truth. Step 2+ adds a workspaceId claim on exchange.

const secret = new TextEncoder().encode(ENV.AUTH_SECRET);

export const TOKEN_TTL = '7d';

export function signAuthToken(account: { id: number }): Promise<string> {
	return new SignJWT({ accountId: account.id })
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(String(account.id))
		.setIssuedAt()
		.setExpirationTime(TOKEN_TTL)
		.sign(secret);
}

export async function verifyAuthToken(token: string): Promise<{
	accountId: number;
}> {
	try {
		const { payload } = await jwtVerify(token, secret, {
			algorithms: ['HS256'],
		});
		// accountId claim on tokens issued after the rename; sub fallback keeps
		// pre-rename sessions valid until their 7-day TTL expires.
		const accountId = Number(payload.accountId ?? payload.sub);
		if (!Number.isInteger(accountId)) {
			throw new Error('Malformed token subject');
		}
		return { accountId };
	} catch {
		throw Errors.unauthorized(
			'Invalid or expired session. Please sign in again.',
		);
	}
}

export function extractBearerToken(
	authorization: string | undefined,
): string | null {
	if (!authorization) return null;
	const [scheme, token, ...rest] = authorization.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
		return null;
	}
	return token;
}
