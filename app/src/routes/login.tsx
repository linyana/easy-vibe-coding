// Public (outside the _app shell). Reads one URL param — where to return after
// signing in — the documented exception where routes carry validateSearch
// (AGENTS.md red line 2); sanitized (safeRedirect) before navigation.
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useGlobal } from '@/hooks/useGlobal';
import { LoginPage } from '@/pages';

export const Route = createFileRoute('/login')({
	// `redirect` — the path the guard was heading to when it sent the user here.
	validateSearch: zodValidator(z.object({ redirect: z.string().optional() })),
	beforeLoad: () => {
		if (useGlobal.getState().token) throw redirect({ to: '/' });
	},
	component: LoginPage,
});
