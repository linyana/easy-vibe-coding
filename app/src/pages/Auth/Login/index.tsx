import { authLoginSchema } from '@easy-vibe-coding/shared';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { API } from '@/libs/api';
import { FormField } from '@/components';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';
import { useGlobal } from '@/hooks/useGlobal';
import { safeRedirect } from '@/libs/utils';
import { AuthCard } from '../AuthCard';

export function LoginPage() {
	const navigate = useNavigate();
	const { redirect } = useSearch({ from: '/login' });
	const setSession = useGlobal((s) => s.actions.setSession);

	const form = useForm({
		schema: authLoginSchema,
		initialValues: { email: '', password: '' },
		submit: {
			call: (values) => API.auth.login.post(values),
			queryKey: ['auth'],
			successMessage: 'Signed in',
			onSuccess: ({ token, user }) => {
				setSession(token, user);
				void navigate({ href: safeRedirect(redirect) });
			},
		},
	});

	return (
		<AuthCard
			icon={{ name: 'LogIn' }}
			title="Sign in"
			description="Welcome back — sign in to continue."
			submitLabel="Sign in"
			form={form}
			footer={
				<>
					No account?{' '}
					<Link
						to="/register"
						className="font-medium underline-offset-4 hover:underline"
					>
						Create one
					</Link>
				</>
			}
		>
			<FormField form={form} name="email" label="Email">
				<Input
					placeholder="you@example.com"
					autoComplete="email"
					autoFocus
				/>
			</FormField>
			<FormField form={form} name="password" label="Password">
				<Input
					type="password"
					placeholder="Your password"
					autoComplete="current-password"
				/>
			</FormField>
		</AuthCard>
	);
}
