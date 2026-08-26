import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useGlobal } from '@/hooks/useGlobal';
import { RegisterPage } from '@/pages';

export const Route = createFileRoute('/register')({
	validateSearch: zodValidator(z.object({ redirect: z.string().optional() })),
	beforeLoad: () => {
		if (useGlobal.getState().auth.token) throw redirect({ to: '/' });
	},
	component: RegisterPage,
});
