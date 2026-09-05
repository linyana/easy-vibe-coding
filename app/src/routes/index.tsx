// The logged-in home: no workspace is session-scoped anymore, so "/" routes by
// the last-entered workspace (a boot shortcut — the URL slug page itself
// re-validates; a stale slug renders its own 403/404 state) or falls back to
// the picker.
import { createFileRoute, redirect } from '@tanstack/react-router';
import { setCurrentWorkspaceSlug } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';
import { getLastWorkspaceSlug } from '@/libs/lastWorkspace';

export const Route = createFileRoute('/')({
	beforeLoad: () => {
		// No workspace page matched here — drop any leftover request-scope slug
		// so non-workspace requests (picker list, me) never carry a stale one.
		setCurrentWorkspaceSlug(null);
		if (!useGlobal.getState().token) {
			throw redirect({
				to: '/login',
				search: { redirect: '/' },
			});
		}
		const last = getLastWorkspaceSlug();
		if (last) {
			throw redirect({ to: '/workspaces/$slug', params: { slug: last } });
		}
		throw redirect({ to: '/profile/workspaces' });
	},
});
