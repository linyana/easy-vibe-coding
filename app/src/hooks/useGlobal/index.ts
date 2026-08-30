import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccountResponse, WorkspaceRef } from '@easy-vibe-coding/shared';

export type ThemeMode = 'light' | 'dark' | 'system';

// The shared contract's account wire shape — imported here to keep the session
// store free of a type-level cycle with libs/api.
type SessionAccount = AccountResponse;

/** The store's data fields (what persist may write; update/reset are verbs, not data). */
interface GlobalStateData {
	themeMode: ThemeMode;
	/** JWT bearer token — persisted across reloads (the user refetches from /auth/me on boot). */
	token: string | null;
	/** Memory-only: set from login/register/me. */
	account: SessionAccount | null;
	/**
	 * The workspace the session is scoped to — memory-only. Seeded from /auth/me
	 * on boot and from the switch-workspace exchange; never persisted, so the
	 * server (via the token claim) stays the single source of truth.
	 */
	workspace: WorkspaceRef | null;
}

export interface GlobalState extends GlobalStateData {
	/** Merge a partial state — the store's one write vocabulary (login, logout, theme, any future field). */
	update: (patch: Partial<GlobalStateData>) => void;
	/** Back to initial values (theme included), then apply an optional patch. */
	reset: (patch?: Partial<GlobalStateData>) => void;
}

const initData: GlobalStateData = {
	themeMode: 'system',
	token: null,
	account: null,
	workspace: null,
};

// Global client state (theme + auth). Accessible outside React via
// getState() — how libs/api reads the token per request and guards check it.
// Consumers use bare `const { ... } = useGlobal()` — that re-renders on ANY
// write, so this store must only ever hold low-frequency fields (login/logout/
// theme). Volatile values (counters, collapsed, polling) go in component state
// or a dedicated mini-store (see usePageHeader).
export const useGlobal = create<GlobalState>()(
	persist(
		(set) => ({
			...initData,
			update: (patch) => set(patch),
			reset: (patch) => set({ ...initData, ...patch }),
		}),
		{
			name: 'easy-vibe-global',
			// Persist theme + token only — a persisted stale account would lie
			// about the session (me refetches it on boot). workspace is never
			// persisted: the server is its source of truth (me echoes it from the
			// token claim), so a reload can't carry a stale workspace context.
			partialize: (state) => ({
				themeMode: state.themeMode,
				token: state.token,
			}),
			// Older store versions persisted workspace state under other keys;
			// force it to null on rehydrate so storage can never seed it.
			merge: (persisted, current) => ({
				...current,
				...(persisted as object),
				workspace: null,
			}),
		},
	),
);
