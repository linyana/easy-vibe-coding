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

export const ENV = {
	DATABASE_URL: databaseUrl,
	AUTH_SECRET: authSecret,
	PORT: Bun.env.PORT ?? '3000',
	HOST: Bun.env.HOST ?? '0.0.0.0',
};
