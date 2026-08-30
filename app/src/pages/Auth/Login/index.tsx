import { authLoginSchema } from '@easy-vibe-coding/shared';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { API } from '@/libs/api';
import { FormField } from '@/components';
import { Form } from '@/components/form/Form';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';
import { useGlobal } from '@/hooks/useGlobal';
import { safeRedirect } from '@/libs/utils';
import { AuthCard } from '../AuthCard';

export function LoginPage() {
	const navigate = useNavigate();
	const { redirect } = useSearch({ from: '/login' });
	const { update } = useGlobal();

	const form = useForm({
		schema: authLoginSchema,
		initialValues: { email: '', password: '' },
		submit: {
			call: (values) => API.auth.login.post(values),
			queryKey: ['auth'],
			successMessage: 'Signed in',
			onSuccess: ({ token, account }) => {
				update({ token, account });
				void navigate({ href: safeRedirect(redirect) });
			},
		},
	});

	return (
		<AuthCard
			title="Sign in"
			description="Welcome back — sign in to continue."
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
			<Form
				form={form}
				submitLabel="Sign in"
				className="mt-6 space-y-4 [&_input]:h-10 [&_input]:bg-background [&_input]:shadow-sm"
				submitClassName="mt-2 h-10 text-sm"
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
			</Form>
		</AuthCard>
	);
}
