import { authRegisterSchema } from '@easy-vibe-coding/shared';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { API } from '@/libs/api';
import { FormField } from '@/components';
import { Form } from '@/components/form/Form';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';
import { useGlobal } from '@/hooks/useGlobal';
import { safeRedirect } from '@/libs/utils';
import { AuthCard } from '../AuthCard';

export function RegisterPage() {
	const navigate = useNavigate();
	const { redirect } = useSearch({ from: '/register' });
	const { update } = useGlobal();

	const form = useForm({
		schema: authRegisterSchema,
		initialValues: { name: '', email: '', password: '' },
		submit: {
			call: (values) => API.auth.register.post(values),
			queryKey: ['auth'],
			successMessage: 'Account created — you are signed in',
			onSuccess: ({ token, account }) => {
				update({ token, account, workspaceId: null });
				void navigate({ href: safeRedirect(redirect) });
			},
		},
	});

	return (
		<AuthCard
			title="Create account"
			description="Sign up to start using the workspace."
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
			<Form
				form={form}
				submitLabel="Create account"
				className="mt-6 space-y-4 [&_input]:h-10 [&_input]:bg-background [&_input]:shadow-sm"
				submitClassName="mt-2 h-10 text-sm"
			>
				<FormField form={form} name="name" label="Name">
					<Input
						placeholder="Your name"
						autoComplete="name"
						autoFocus
					/>
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
			</Form>
		</AuthCard>
	);
}
