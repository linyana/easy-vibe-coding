import { SignJWT, jwtVerify } from 'jose';
import { ENV } from '../../env';
import { Errors } from '../error';

// JWT primitives — the token carries the accountId claim (sub mirrors it), a
// workspaceSlug claim after a workspace switch, and the tokenVersion claim (the
// session-revocation counter). The DB row is the source of truth: the auth guard
// re-reads tokenVersion per request and rejects any token signed before a bump.

const secret = new TextEncoder().encode(ENV.AUTH_SECRET);

export const TOKEN_TTL = '7d';

export function signAuthToken({
	accountId,
	workspaceSlug,
	tokenVersion,
}: {
	accountId: number;
	workspaceSlug?: string;
	tokenVersion: number;
}): Promise<string> {
	return new SignJWT({
		accountId,
		tokenVersion,
		...(workspaceSlug !== undefined ? { workspaceSlug } : {}),
	})
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(String(accountId))
		.setIssuedAt()
		.setExpirationTime(TOKEN_TTL)
		.sign(secret);
}

export async function verifyAuthToken(token: string): Promise<{
	accountId: number;
	workspaceSlug?: string;
	tokenVersion: number;
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
		const workspaceSlug =
			typeof payload.workspaceSlug === 'string'
				? payload.workspaceSlug
				: undefined;
		// ?? 0: tokens signed before this feature carry no claim and stay valid
		// while the row version is still 0 — the bump is what revokes them.
		const tokenVersion = Number(payload.tokenVersion ?? 0);
		return { accountId, workspaceSlug, tokenVersion };
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
