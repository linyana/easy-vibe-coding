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
	 * The workspace of the slug page currently rendered — memory-only. Set by
	 * the slug shell's WorkspaceProvider after its detail fetch (the URL slug
	 * is the address; the server re-validated membership on that fetch).
	 * Never persisted: storage can't seed a workspace the session may not
	 * reach, and it drops to null when the shell unmounts.
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
			// persisted: the URL slug is its address, and the slug shell's
			// WorkspaceProvider refetches it on every slug page mount.
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
