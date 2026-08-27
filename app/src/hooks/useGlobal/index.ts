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
	/** The tenant the user is currently working in — null until they create or
	 * pick one. Persisted on purpose: the last-used tenant survives reloads
	 * and logins (bootstrapCurrentTenant keeps or resets it). */
	currentTenantId: number | null;
	auth: AuthState;
	actions: {
		setThemeMode: (mode: ThemeMode) => void;
		setCurrentTenantId: (tenantId: number) => void;
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
			currentTenantId: null,
			auth: { token: null, user: null, status: 'unauthenticated' },
			actions: {
				setThemeMode: (themeMode) => set({ themeMode }),
				setCurrentTenantId: (currentTenantId) =>
					set({ currentTenantId }),
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
			// Persist theme + token + current tenant only — a persisted stale user
			// would lie about the session (the user refetches from /auth/me on boot).
			partialize: (state) => ({
				themeMode: state.themeMode,
				currentTenantId: state.currentTenantId,
				auth: { token: state.auth.token },
			}),
		},
	),
);
