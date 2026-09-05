import { ArrowRightIcon, CheckIcon, ExternalLinkIcon } from 'lucide-react';
import type { WorkspaceResponse } from '@easy-vibe-coding/shared';
import { TitleBlock } from '@/components/data/TitleBlock';
import { Button } from '@/components/ui/button';

export function WorkspaceRow({
	workspace,
	current = false,
	disabled = false,
	openInNewTab = false,
	onSelect,
}: {
	workspace: WorkspaceResponse;
	/** True for the current workspace of the open shell — marked and non-interactive. */
	current?: boolean;
	disabled?: boolean;
	/** The row's select action opens the workspace in a NEW TAB — the affordance
	 *  icon switches from "enter" (→) to "open externally" (external-link). */
	openInNewTab?: boolean;
	onSelect: (slug: string) => void;
}) {
	return (
		<Button
			variant="outline"
			className="h-auto w-full justify-between px-4 py-3"
			disabled={disabled}
			onClick={() => onSelect(workspace.slug)}
		>
			<TitleBlock
				variant="profile"
				title={workspace.name}
				description={workspace.slug}
			/>
			{current ? (
				<span className="flex shrink-0 items-center gap-1 text-xs font-medium">
					<CheckIcon className="size-4" />
					Current
				</span>
			) : openInNewTab ? (
				<ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground" />
			) : (
				<ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
			)}
		</Button>
	);
}
