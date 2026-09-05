// The last-entered workspace slug — a boot shortcut, never a source of truth.
// The URL is the address; this only decides where "/" and post-login land.
// Entry points (the pickers / admin enter) write it; "/" reads it and falls
// back to the picker when stale (no longer a member / deleted) — the slug
// page's own 403/404 state handles that, not this storage.
const STORAGE_KEY = 'easy-vibe-last-workspace';

export function getLastWorkspaceSlug(): string | null {
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}

export function setLastWorkspaceSlug(slug: string): void {
	try {
		localStorage.setItem(STORAGE_KEY, slug);
	} catch {
		// Storage unavailable (private mode / disabled) — the shortcut just
		// never fires; navigation is unaffected.
	}
}
