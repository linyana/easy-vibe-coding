import { SignJWT, jwtVerify } from 'jose';
import { ENV } from '../../env';
import { Errors } from '../error';

// JWT primitives — the token carries the accountId claim (sub mirrors it), a
// workspaceId claim after a workspace switch (the int PK, immutable — renaming
// a slug never orphans in-flight sessions), and the tokenVersion claim (the
// session-revocation counter). The DB row is the source of truth: the auth guard
// re-reads tokenVersion per request and rejects any token signed before a bump.

const secret = new TextEncoder().encode(ENV.AUTH_SECRET);

export const TOKEN_TTL = '7d';

export function signAuthToken({
	accountId,
	workspaceId,
	tokenVersion,
}: {
	accountId: number;
	workspaceId?: number;
	tokenVersion: number;
}): Promise<string> {
	return new SignJWT({
		accountId,
		tokenVersion,
		...(workspaceId !== undefined ? { workspaceId } : {}),
	})
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(String(accountId))
		.setIssuedAt()
		.setExpirationTime(TOKEN_TTL)
		.sign(secret);
}

export async function verifyAuthToken(token: string): Promise<{
	accountId: number;
	workspaceId?: number;
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
		const workspaceId = Number(payload.workspaceId);
		// Pre-id-claim tokens carry no workspaceId — treated as unscoped (the
		// workspace guard 403s them; the user re-enters for a fresh claim).
		const workspace =
			Number.isInteger(workspaceId) && workspaceId > 0
				? workspaceId
				: undefined;
		// ?? 0: tokens signed before this feature carry no claim and stay valid
		// while the row version is still 0 — the bump is what revokes them.
		const tokenVersion = Number(payload.tokenVersion ?? 0);
		return { accountId, workspaceId: workspace, tokenVersion };
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
