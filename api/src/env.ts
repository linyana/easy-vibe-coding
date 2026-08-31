// The only file allowed to touch Bun.env (enforced by a lint rule — see vite.config.ts).
/* eslint-disable no-restricted-properties -- this file IS the centralized ENV module */

const databaseUrl = Bun.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error('Missing required environment variable: DATABASE_URL');
}

const authSecret = Bun.env.AUTH_SECRET;
if (!authSecret) {
	throw new Error('Missing required environment variable: AUTH_SECRET');
}

// Symmetric key for AES-256-GCM secret encryption (libs/crypto) — 64 hex
// chars = 32 bytes. Required: the connections module stores access tokens
// encrypted at rest and fails fast at boot without a key.
const encryptionKey = Bun.env.ENCRYPTION_KEY;
if (!encryptionKey) {
	throw new Error('Missing required environment variable: ENCRYPTION_KEY');
}

export const ENV = {
	DATABASE_URL: databaseUrl,
	AUTH_SECRET: authSecret,
	ENCRYPTION_KEY: encryptionKey,
	PORT: Bun.env.PORT ?? '3000',
	HOST: Bun.env.HOST ?? '0.0.0.0',
};
