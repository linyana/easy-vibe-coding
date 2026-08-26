import { SignJWT, jwtVerify } from 'jose';
import { ENV } from '../../env';
import { Errors } from '../error';

// JWT primitives — the token carries only the user id; the DB row is the source of truth.

const secret = new TextEncoder().encode(ENV.AUTH_SECRET);

export const TOKEN_TTL = '7d';

export function signAuthToken(user: { id: number }): Promise<string> {
	return new SignJWT({})
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(String(user.id))
		.setIssuedAt()
		.setExpirationTime(TOKEN_TTL)
		.sign(secret);
}

export async function verifyAuthToken(token: string): Promise<number> {
	try {
		const { payload } = await jwtVerify(token, secret, {
			algorithms: ['HS256'],
		});
		const id = Number(payload.sub);
		if (!Number.isInteger(id)) throw new Error('Malformed token subject');
		return id;
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
