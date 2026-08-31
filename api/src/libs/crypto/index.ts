import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { ENV } from '../../env';

// AES-256-GCM secret encryption for the connections module's access tokens.
// The key comes from ENV.ENCRYPTION_KEY (64 hex chars = 32 bytes) — the same
// centralized ENV entry point as everything else; no other file touches
// Bun.env. Ciphertext layout: `iv:authTag:ciphertext` (hex, 12/16/n bytes).

const key = Buffer.from(ENV.ENCRYPTION_KEY, 'hex');
if (key.length !== 32) {
	throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
}

export function encryptSecret(plaintext: string): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key, iv);
	const encrypted = Buffer.concat([
		cipher.update(plaintext, 'utf8'),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();
	return [
		iv.toString('hex'),
		tag.toString('hex'),
		encrypted.toString('hex'),
	].join(':');
}

export function decryptSecret(stored: string): string {
	const [ivHex, tagHex, dataHex] = stored.split(':');
	const decipher = createDecipheriv(
		'aes-256-gcm',
		key,
		Buffer.from(ivHex!, 'hex'),
	);
	decipher.setAuthTag(Buffer.from(tagHex!, 'hex'));
	return Buffer.concat([
		decipher.update(Buffer.from(dataHex!, 'hex')),
		decipher.final(),
	]).toString('utf8');
}
