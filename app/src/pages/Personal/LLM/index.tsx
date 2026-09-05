import { LlmProvidersSettings } from '@/pages/LLM';
import { useGlobal } from '@/hooks/useGlobal';
import { usePageHeader } from '@/hooks';

// The LLM providers page of the personal shell — the account-level provider
// surface (sections + dialogs live in pages/LLM) with the page chrome around
// it. Account-scoped: works regardless of the workspace context.
export function PersonalLlmPage() {
	const { workspace } = useGlobal();

	usePageHeader({
		title: 'LLM providers',
		description: 'Your saved providers and the default model.',
		// With an entered workspace, the header arrow returns to the workspace
		// app — the personal sidebar holds no workspace-surface links.
		back: workspace ? { to: '/', label: 'Back to workspace' } : undefined,
	});

	return <LlmProvidersSettings />;
}
