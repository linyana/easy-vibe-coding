import { treaty } from '@elysiajs/eden';
import type { App } from '@api/main';
import { parseEdenError } from '@/libs/error';
import { useGlobal } from '@/hooks/useGlobal';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

// The app's single door to the API — response types flow from here (inferred
// off the client; app may only type-import api, lint-enforced).
export const API = treaty<App>(baseUrl, {
	// Eden's default parseDate: true would silently turn ISO strings into Dates.
	parseDate: false,
	// Runs per request, reads the live store — the token stays current without
	// recreating the client after login/logout.
	headers: () => {
		const token = useGlobal.getState().token;
		return token ? { Authorization: `Bearer ${token}` } : undefined;
	},
	// 401 → drop the session (the _app gate then redirects to /login). Idempotent:
	// bad-credential 401s find no session to clear.
	onResponse: (response) => {
		if (response.status === 401) {
			useGlobal
				.getState()
				.update({ token: null, account: null, workspaceId: null });
		}
	},
}).api;

// The only glue between Eden and TanStack Query: `callEden` unwraps Eden's
// `{ data, error }` envelope and normalizes failures into UseAPIError. Data
// types as `T | null` (a failed call carries `data: null`); after the throw
// the resolved payload is never null.
export type EdenCall<TData> = Promise<{ data: TData | null; error: unknown }>;

export async function callEden<T>(
	call: Promise<{ data: T; error: unknown }>,
): Promise<NonNullable<T>> {
	try {
		const { data, error } = await call;
		if (error) throw error;
		return data as NonNullable<T>;
	} catch (err) {
		throw parseEdenError(err as { status?: unknown; value?: unknown });
	}
}

type AnyEdenListFn = (
	...args: any[]
) => Promise<{ data: { items: unknown[]; total: number } | null; error: any }>;

export type UseAPIItem<TFn extends AnyEdenListFn> = NonNullable<
	Awaited<ReturnType<TFn>>['data']
>['items'][number];
