import {
	llmProviderUpdateSchema,
	type LlmProviderUpdate,
} from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useForm } from '@/hooks/useForm';
import { ProviderLogo } from '../providerLogo';
import type { LlmProvider } from '../types';

// Edit: preset rows only rotate the key (endpoint is registry-fixed); custom
// rows can also change name / api / baseUrl. Blank key = keep the current
// one — it is stripped before the wire, so the contract never sees it.
export function EditLlmProviderDialog({
	provider,
	open,
	onOpenChange,
}: {
	provider: LlmProvider;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const isPreset = provider.preset !== null;
	const form = useForm<typeof llmProviderUpdateSchema, LlmProviderUpdate>({
		schema: llmProviderUpdateSchema,
		initialValues: {
			apiKey: '',
			name: isPreset ? '' : provider.name,
			api: isPreset ? undefined : provider.api,
			baseUrl: isPreset ? '' : provider.baseUrl,
		},
		submit: {
			call: (values) => {
				const payload: Record<string, string> = {};
				if (values.apiKey) payload.apiKey = values.apiKey;
				if (!isPreset) {
					payload.name = values.name ?? '';
					payload.api = values.api ?? 'openai-completions';
					payload.baseUrl = values.baseUrl ?? '';
				}
				return API.llm({ id: provider.id }).patch(payload);
			},
			queryKey: ['llm'],
			successMessage: 'Provider updated',
			onSuccess: () => onOpenChange(false),
			requireDirty: true,
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title={
				isPreset
					? `Replace ${provider.name} key`
					: `Edit ${provider.name}`
			}
			description={
				isPreset
					? `The stored key ends in …${provider.keySuffix} — enter the new key to rotate it.`
					: 'Update this custom provider — its endpoint and key are stored encrypted.'
			}
			footer={
				<>
					<Button
						variant="outline"
						disabled={form.isPending}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<FormSubmitButton form={form}>Save</FormSubmitButton>
				</>
			}
		>
			<div className="flex items-center gap-2 text-sm">
				<ProviderLogo
					preset={provider.preset}
					name={provider.name}
					className="size-5"
				/>
				<span className="font-medium">{provider.name}</span>
				<span className="font-mono text-xs text-muted-foreground">
					{provider.baseUrl}
				</span>
			</div>

			<Form form={form}>
				{!isPreset && (
					<div className="space-y-3">
						<FormField form={form} name="name" label="Name">
							<Input />
						</FormField>
						<FormField
							form={form}
							name="api"
							label="API compatibility"
							changePropName="onValueChange"
						>
							<Select>
								<SelectTrigger
									className="w-full"
									aria-label="API compatibility"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="openai-completions">
										OpenAI-compatible
									</SelectItem>
									<SelectItem value="anthropic-messages">
										Anthropic-compatible
									</SelectItem>
								</SelectContent>
							</Select>
						</FormField>
						<FormField
							form={form}
							name="baseUrl"
							label="Base URL"
							tooltip="The endpoint root your provider speaks. Model-list fetches refuse private/local addresses."
						>
							<Input autoComplete="off" />
						</FormField>
					</div>
				)}

				<FormField
					form={form}
					name="apiKey"
					label="New API key"
					tooltip="Leave blank to keep the current key."
				>
					<Input
						type="password"
						placeholder="Leave blank to keep current"
						autoComplete="off"
					/>
				</FormField>
			</Form>
		</Dialog>
	);
}
