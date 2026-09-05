import { useState } from 'react';
import { Wrench } from 'lucide-react';
import {
	LLM_PRESETS,
	llmProviderCreateSchema,
	type LlmProviderCreate,
} from '@easy-vibe-coding/shared';
import { API } from '@/libs/api';
import { Dialog, Form, FormField, FormSubmitButton } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { cn } from '@/libs/utils';
import { useForm } from '@/hooks/useForm';
import { ProviderLogo } from '../providerLogo';

type Mode = 'preset' | 'custom';

// Add a provider: pick a built-in supplier (registry in shared) or define a
// custom one (name + api compatibility + base url). The shared create schema
// carries both shapes; the preset branch ignores the custom fields.
export function CreateLlmProviderDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [mode, setMode] = useState<Mode>('preset');

	const form = useForm<typeof llmProviderCreateSchema, LlmProviderCreate>({
		schema: llmProviderCreateSchema,
		initialValues: {
			preset: undefined,
			name: '',
			api: undefined,
			baseUrl: '',
			apiKey: '',
		},
		submit: {
			call: (values) => API.llm.post(values),
			queryKey: ['llm'],
			successMessage: 'Provider added',
			onSuccess: () => onOpenChange(false),
		},
	});

	const switchMode = (next: Mode) => {
		setMode(next);
		if (next === 'preset') {
			// Preset rows never carry the custom fields.
			form.set({ name: '', api: undefined, baseUrl: '' });
		} else {
			form.set({ preset: undefined, api: 'openai-completions' });
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Add LLM provider"
			description="Store an API key for a provider. Keys are encrypted at rest and never shown again; no network request is made on save."
			footer={
				<>
					<Button
						variant="outline"
						disabled={form.isPending}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<FormSubmitButton form={form}>
						Add provider
					</FormSubmitButton>
				</>
			}
		>
			<Form form={form}>
				{/* Mode toggle */}
				<div className="flex w-fit items-center gap-1 rounded-lg bg-muted p-1">
					<ModeTab
						active={mode === 'preset'}
						onClick={() => switchMode('preset')}
					>
						Presets
					</ModeTab>
					<ModeTab
						active={mode === 'custom'}
						onClick={() => switchMode('custom')}
					>
						Custom
					</ModeTab>
				</div>

				{mode === 'preset' ? (
					<div
						className="grid gap-2"
						role="radiogroup"
						aria-label="Provider preset"
					>
						{LLM_PRESETS.map((preset) => {
							const selected = form.values.preset === preset.id;
							return (
								<button
									key={preset.id}
									type="button"
									role="radio"
									aria-checked={selected}
									onClick={() =>
										form.set({ preset: preset.id })
									}
									className={cn(
										'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
										selected
											? 'border-ring bg-accent/40'
											: 'border-border hover:bg-accent/30',
									)}
								>
									<ProviderLogo
										preset={preset.id}
										name={preset.name}
										className="size-5"
									/>
									<span className="text-sm font-medium">
										{preset.name}
									</span>
									<span className="ml-auto font-mono text-xs text-muted-foreground">
										{preset.baseUrl.replace(
											/^https?:\/\//,
											'',
										)}
									</span>
								</button>
							);
						})}
					</div>
				) : (
					<div className="space-y-3">
						<FormField form={form} name="name" label="Name">
							<Input placeholder="e.g. My local gateway" />
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
							tooltip="The endpoint root your provider speaks — e.g. https://api.deepseek.com or http://your-proxy:11434/v1. Model lists are fetched from it; private/local addresses are refused."
						>
							<Input placeholder="https://…" autoComplete="off" />
						</FormField>
					</div>
				)}

				<FormField form={form} name="apiKey" label="API key">
					<Input
						type="password"
						placeholder="sk-…"
						autoComplete="off"
					/>
				</FormField>

				{mode === 'custom' && (
					<Label className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
						<Wrench className="size-3.5" />
						Custom providers are stored with your api/baseUrl — keys
						are still encrypted server-side.
					</Label>
				)}
			</Form>
		</Dialog>
	);
}

function ModeTab({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
				active
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground',
			)}
		>
			{children}
		</button>
	);
}
