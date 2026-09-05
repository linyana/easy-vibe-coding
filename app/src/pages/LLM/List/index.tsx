import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { API } from '@/libs/api';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import { Actions, ErrorState } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DotsRingLoading } from '@/components/loading/DotsRing';
import { cn } from '@/libs/utils';
import { ProviderLogo } from '../providerLogo';
import type { LlmProvider, LlmProvidersAction } from '../types';

const API_LABELS: Record<string, string> = {
	'anthropic-messages': 'Anthropic-compatible',
	'openai-responses': 'OpenAI',
	'openai-completions': 'OpenAI-compatible',
};

const isOpenAIFamily = (api: string) =>
	api === 'openai-completions' || api === 'openai-responses';

// The LLM providers surface (the /personal/llm page): the
// account's own provider rows + the one-per-account default model choice.
// Model lists are NOT a stored catalog — the user fetches them live per
// provider (or types the id by hand). Data lives here under the ['llm']
// namespace; row edits/removes bubble up through onAction.
export function LlmProviderList({
	onAction,
}: {
	onAction: (action: LlmProvidersAction) => void;
}) {
	const providersQuery = useAPIQuery({
		queryKey: ['llm', 'providers'],
		queryFn: () => API.llm.get(),
		toastError: false, // inline ErrorState below is the recovery surface
	});
	const selectionQuery = useAPIQuery({
		queryKey: ['llm', 'selection'],
		queryFn: () => API.llm.selection.get(),
		toastError: false,
	});

	const providers = providersQuery.data?.items ?? [];
	const selection = selectionQuery.data?.selection ?? null;

	// Default-choice draft — synced from the stored selection until the user
	// touches a control; explicit mutations adopt the server echo.
	const [providerId, setProviderId] = useState<number | undefined>();
	const [model, setModel] = useState('');
	const [edited, setEdited] = useState(false);
	const [fetchedModels, setFetchedModels] = useState<string[]>([]);

	useEffect(() => {
		if (edited) return;
		setProviderId(selection?.providerId ?? undefined);
		setModel(selection?.model ?? '');
		setFetchedModels([]);
	}, [selection?.providerId, selection?.model, edited]);

	const draftProvider = useMemo(
		() => providers.find((row) => row.id === providerId),
		[providers, providerId],
	);

	const modelsMutation = useAPIMutation({
		call: (id: number) => API.llm({ id }).models.post(),
		onSuccess: (data) => setFetchedModels(data.items.map((m) => m.id)),
	});
	const saveMutation = useAPIMutation({
		call: (variables: { providerId: number; model: string }) =>
			API.llm.selection.put(variables),
		queryKey: ['llm'],
		successMessage: 'Default model updated',
		onSuccess: (data) => {
			if (data.selection) {
				setProviderId(data.selection.providerId);
				setModel(data.selection.model);
				setEdited(false);
			}
		},
	});
	const clearMutation = useAPIMutation({
		call: () => API.llm.selection.delete(),
		queryKey: ['llm'],
		successMessage: 'Default model cleared',
		onSuccess: () => {
			setProviderId(undefined);
			setModel('');
			setEdited(false);
		},
	});

	const pending = saveMutation.isPending || clearMutation.isPending;
	const trimmedModel = model.trim();
	const sameAsStored =
		providerId === selection?.providerId &&
		trimmedModel === selection?.model;
	const saveDisabled =
		pending ||
		!providerId ||
		!trimmedModel ||
		(sameAsStored && !edited) ||
		!!providersQuery.error ||
		!!selectionQuery.error;

	return (
		<div className="space-y-6">
			{/* Default model — the choice a future agent runtime reads. */}
			<section className="space-y-3">
				<div>
					<h3 className="text-sm font-semibold">Default model</h3>
					<p className="mt-0.5 text-xs text-muted-foreground">
						The provider and model used when no other is specified.
					</p>
				</div>

				{providersQuery.error ? (
					<ErrorState
						error={providersQuery.error}
						onRetry={providersQuery.refetch}
					/>
				) : providers.length === 0 ? (
					<p className="rounded-lg border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
						No providers yet — add an API key below, then pick your
						default provider and model.
					</p>
				) : (
					<div className="space-y-3 rounded-xl border bg-card p-4">
						<Select
							value={
								providerId === undefined
									? undefined
									: String(providerId)
							}
							onValueChange={(value) => {
								setProviderId(Number(value));
								setModel('');
								setFetchedModels([]);
								setEdited(true);
							}}
						>
							<SelectTrigger
								className="w-full"
								aria-label="Default provider"
							>
								<SelectValue placeholder="Choose a provider" />
							</SelectTrigger>
							<SelectContent>
								{providers.map((row) => (
									<ProviderOption
										key={row.id}
										row={row}
										duplicateName={
											providers.filter(
												(r) => r.name === row.name,
											).length > 1
										}
									/>
								))}
							</SelectContent>
						</Select>

						{providerId !== undefined && draftProvider && (
							<div className="space-y-2">
								<div className="flex gap-2">
									<Input
										value={model}
										onChange={(e) => {
											setModel(e.target.value);
											setEdited(true);
										}}
										placeholder={
											isOpenAIFamily(draftProvider.api)
												? 'Type a model id, or fetch the list'
												: 'Enter the model id (no list endpoint)'
										}
										autoComplete="off"
										spellCheck={false}
									/>
									{isOpenAIFamily(draftProvider.api) && (
										<Button
											variant="outline"
											disabled={
												modelsMutation.isPending ||
												pending
											}
											onClick={() =>
												modelsMutation.mutate(
													draftProvider.id,
												)
											}
										>
											<RefreshCw
												className={cn(
													'size-4',
													modelsMutation.isPending &&
														'animate-spin',
												)}
											/>
											Fetch models
										</Button>
									)}
								</div>
								{!isOpenAIFamily(draftProvider.api) && (
									<p className="text-xs text-muted-foreground">
										{`${draftProvider.name} speaks ${
											API_LABELS[draftProvider.api]
										} and exposes no /models endpoint — enter the model id by hand.`}
									</p>
								)}
								{fetchedModels.length > 0 && (
									<div className="grid max-h-44 grid-cols-1 gap-1 overflow-y-auto rounded-lg border p-1.5 sm:grid-cols-2">
										{fetchedModels.map((id) => (
											<button
												key={id}
												type="button"
												onClick={() => {
													setModel(id);
													setEdited(true);
												}}
												className={cn(
													'cursor-pointer truncate rounded px-2 py-1 text-left font-mono text-xs transition-colors',
													model === id
														? 'bg-accent text-accent-foreground'
														: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
												)}
											>
												{id}
											</button>
										))}
									</div>
								)}
							</div>
						)}

						<div className="flex items-center gap-2">
							<Button
								onClick={() =>
									saveMutation.mutate({
										providerId: providerId!,
										model: trimmedModel,
									})
								}
								disabled={saveDisabled}
							>
								Save default
							</Button>
							{selection && (
								<Button
									variant="ghost"
									disabled={pending}
									onClick={() => clearMutation.mutate()}
								>
									Clear default
								</Button>
							)}
						</div>
					</div>
				)}
			</section>

			{/* Provider rows. */}
			<section className="space-y-3">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h3 className="text-sm font-semibold">Providers</h3>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Stored keys are encrypted and never shown again.
						</p>
					</div>
					<Button
						variant="outline"
						disabled={pending}
						onClick={() => onAction({ kind: 'create' })}
					>
						<Plus className="size-4" />
						Add provider
					</Button>
				</div>

				{providersQuery.error ? (
					<ErrorState
						error={providersQuery.error}
						onRetry={providersQuery.refetch}
					/>
				) : providersQuery.isLoading ? (
					<div className="flex justify-center py-8">
						<DotsRingLoading size={28} />
					</div>
				) : providers.length === 0 ? (
					<p className="rounded-lg border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
						No providers yet.
					</p>
				) : (
					<div className="divide-y overflow-hidden rounded-xl border bg-card">
						{providers.map((row) => (
							<ProviderRow
								key={row.id}
								provider={row}
								isDefault={selection?.providerId === row.id}
								onAction={onAction}
							/>
						))}
					</div>
				)}
			</section>
		</div>
	);
}

function ProviderOption({
	row,
	duplicateName,
}: {
	row: LlmProvider;
	duplicateName: boolean;
}) {
	return (
		<SelectItem value={String(row.id)}>
			<span className="flex items-center gap-2">
				<ProviderLogo
					preset={row.preset}
					name={row.name}
					className="size-4"
				/>
				{row.name}
				{duplicateName && (
					<span className="font-mono text-xs text-muted-foreground">
						…{row.keySuffix}
					</span>
				)}
			</span>
		</SelectItem>
	);
}

function ProviderRow({
	provider,
	isDefault,
	onAction,
}: {
	provider: LlmProvider;
	isDefault: boolean;
	onAction: (action: LlmProvidersAction) => void;
}) {
	return (
		<div className="flex items-center justify-between gap-3 px-4 py-3">
			<div className="flex min-w-0 items-center gap-3">
				<ProviderLogo
					preset={provider.preset}
					name={provider.name}
					className="size-6"
				/>
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium">
							{provider.name}
						</span>
						{isDefault && (
							<span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
								Default
							</span>
						)}
					</div>
					<p className="mt-0.5 truncate text-xs text-muted-foreground">
						{API_LABELS[provider.api] ?? provider.api}
						<span className="mx-1.5 text-border">·</span>
						<span className="font-mono">{provider.baseUrl}</span>
					</p>
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<span className="font-mono text-xs text-muted-foreground">
					…{provider.keySuffix}
				</span>
				<Actions
					items={[
						{
							label: 'Edit',
							icon: { name: 'Pencil' },
							onClick: () => onAction({ kind: 'edit', provider }),
						},
						{
							label: 'Remove',
							icon: { name: 'Trash2', style: 'destructive' },
							onClick: () =>
								onAction({ kind: 'delete', provider }),
						},
					]}
				/>
			</div>
		</div>
	);
}
