import { authRegisterSchema } from '@easy-vibe-coding/shared';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { API } from '@/libs/api';
import { FormField } from '@/components';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';
import { useGlobal } from '@/hooks/useGlobal';
import { safeRedirect } from '@/libs/utils';
import { AuthCard } from '../AuthCard';

export function RegisterPage() {
	const navigate = useNavigate();
	const { redirect } = useSearch({ from: '/register' });
	const setSession = useGlobal((s) => s.actions.setSession);

	const form = useForm({
		schema: authRegisterSchema,
		initialValues: { name: '', email: '', password: '' },
		submit: {
			call: (values) => API.auth.register.post(values),
			queryKey: ['auth'],
			successMessage: 'Account created — you are signed in',
			onSuccess: ({ token, user }) => {
				setSession(token, user);
				void navigate({ href: safeRedirect(redirect) });
			},
		},
	});

	return (
		<AuthCard
			icon={{ name: 'UserPlus' }}
			title="Create account"
			description="Sign up to start using the workspace."
			submitLabel="Create account"
			form={form}
			footer={
				<>
					Already have an account?{' '}
					<Link
						to="/login"
						className="font-medium underline-offset-4 hover:underline"
					>
						Sign in
					</Link>
				</>
			}
		>
			<FormField form={form} name="name" label="Name">
				<Input placeholder="Your name" autoComplete="name" autoFocus />
			</FormField>
			<FormField form={form} name="email" label="Email">
				<Input placeholder="you@example.com" autoComplete="email" />
			</FormField>
			<FormField form={form} name="password" label="Password">
				<Input
					type="password"
					placeholder="Your password"
					autoComplete="new-password"
				/>
			</FormField>
		</AuthCard>
	);
}
