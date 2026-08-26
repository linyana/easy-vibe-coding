import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Only same-site absolute paths are honored — `//evil.com` or anything non-path
 * falls back to '/'. The value is a URL search param, never trusted verbatim. */
export function safeRedirect(redirect: string | undefined): string {
	return redirect && redirect.startsWith('/') && !redirect.startsWith('//')
		? redirect
		: '/';
}

/** Structural equality over plain data (primitives, dates, arrays, nested objects). */
export function deepEqual(a: unknown, b: unknown): boolean {
	if (Object.is(a, b)) return true;
	if (a instanceof Date || b instanceof Date) {
		return (
			a instanceof Date &&
			b instanceof Date &&
			a.getTime() === b.getTime()
		);
	}
	if (
		typeof a !== 'object' ||
		typeof b !== 'object' ||
		a === null ||
		b === null
	) {
		return false;
	}
	const aIsArray = Array.isArray(a);
	if (aIsArray !== Array.isArray(b)) return false;
	if (aIsArray) {
		const aArr = a as unknown[];
		const bArr = b as unknown[];
		return (
			aArr.length === bArr.length &&
			aArr.every((value, index) => deepEqual(value, bArr[index]))
		);
	}
	const aKeys = Object.keys(a as object);
	if (aKeys.length !== Object.keys(b as object).length) return false;
	return aKeys.every((key) =>
		deepEqual(
			(a as Record<string, unknown>)[key],
			(b as Record<string, unknown>)[key],
		),
	);
}
