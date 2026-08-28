import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserResponse } from '@easy-vibe-coding/shared';

export type ThemeMode = 'light' | 'dark' | 'system';

// The shared contract's user wire shape — imported here to keep the session
// store free of a type-level cycle with libs/api.
export type SessionUser = UserResponse;

export type AuthStatus =
	| 'loading' // token present, current user not fetched yet (boot)
	| 'authenticated'
	| 'unauthenticated'
	| 'error'; // me fetch failed non-401 (network/5xx) — retry is user-initiated

export interface AuthState {
	/** JWT bearer token — persisted across reloads (the user refetches from /auth/me on boot). */
	token: string | null;
	/** Memory-only: set from login/register/me. */
	user: SessionUser | null;
	status: AuthStatus;
}

interface GlobalState {
	themeMode: ThemeMode;
	/** The workspace the user is currently working in (its slug) — null until
	 * they create or pick one. Persisted on purpose: the last-used workspace
	 * survives reloads and logins (bootstrapCurrentWorkspace keeps or resets
	 * it). */
	currentWorkspaceId: string | null;
	auth: AuthState;
	actions: {
		setThemeMode: (mode: ThemeMode) => void;
		setCurrentWorkspaceId: (workspaceId: string) => void;
		setSession: (token: string, user: SessionUser) => void;
		setAuthStatus: (status: AuthStatus) => void;
		clearSession: () => void;
	};
}

// Global client state (theme + auth). Accessible outside React via
// getState() — how libs/api reads the token per request and guards check it.
export const useGlobal = create<GlobalState>()(
	persist(
		(set) => ({
			themeMode: 'system',
			currentWorkspaceId: null,
			auth: { token: null, user: null, status: 'unauthenticated' },
			actions: {
				setThemeMode: (themeMode) => set({ themeMode }),
				setCurrentWorkspaceId: (currentWorkspaceId) =>
					set({ currentWorkspaceId }),
				setSession: (token, user) =>
					set({ auth: { token, user, status: 'authenticated' } }),
				setAuthStatus: (status) =>
					set((state) => ({ auth: { ...state.auth, status } })),
				clearSession: () =>
					set({
						auth: {
							token: null,
							user: null,
							status: 'unauthenticated',
						},
					}),
			},
		}),
		{
			name: 'easy-vibe-global',
			// Persist theme + token + current workspace only — a persisted stale
			// user would lie about the session (the user refetches from
			// /auth/me on boot).
			partialize: (state) => ({
				themeMode: state.themeMode,
				currentWorkspaceId: state.currentWorkspaceId,
				auth: { token: state.auth.token },
			}),
		},
	),
);
