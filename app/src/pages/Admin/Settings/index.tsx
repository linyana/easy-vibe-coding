import { useEffect } from 'react';
import {
	DEFAULT_SETTINGS,
	platformSettingsSchema,
} from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { useAPIQuery, usePageHeader } from '@/hooks';
import { useForm } from '@/hooks/useForm';
import { Card, ErrorState, Form, FormField, FormSaveBar } from '@/components';
import { TitleBlock } from '@/components/data/TitleBlock';
import { Switch } from '@/components/ui/switch';
import { DotsRingLoading } from '@/components/loading/DotsRing';

export function AdminSettings() {
	usePageHeader({
		title: 'Settings',
		description: 'Platform-level settings.',
	});

	const query = useAPIQuery({
		queryKey: ['settings', 'admin'],
		queryFn: () => API.settings.get({ query: { module: 'platform' } }),
		toastError: false,
	});

	const form = useForm({
		schema: platformSettingsSchema,
		initialValues: DEFAULT_SETTINGS.platform,
		submit: {
			call: (values) =>
				API.settings.put({ module: 'platform', config: values }),
			queryKey: ['settings'],
			successMessage: 'Settings saved',
			requireDirty: true,
			onSuccess: (data) => form.reset(data.config),
		},
	});

	useEffect(() => {
		if (query.data) form.reset(query.data.config);
	}, [query.data, form.reset]);

	return (
		<div className="space-y-4">
			<Card
				title="Workspace creation"
				description="Whether users can create new workspaces on their own."
			>
				{query.error ? (
					<ErrorState
						error={query.error}
						onRetry={() => void query.refetch()}
					/>
				) : !query.data ? (
					<div className="flex justify-center py-8">
						<DotsRingLoading size={32} />
					</div>
				) : (
					<Form form={form} className="divide-y">
						<TitleBlock
							variant="settings"
							title="Allow workspace creation"
							description="When off, creating a workspace is rejected by the API — the same value this page shows is the one enforced."
							action={
								<FormField
									form={form}
									name="allowWorkspaceCreation"
									valuePropName="checked"
									changePropName="onCheckedChange"
								>
									<Switch />
								</FormField>
							}
						/>
					</Form>
				)}
			</Card>
			<FormSaveBar
				form={form}
				onCancel={() => form.reset(query.data!.config)}
			/>
		</div>
	);
}
