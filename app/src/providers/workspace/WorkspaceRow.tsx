import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import type { WorkspaceResponse } from '@easy-vibe-coding/shared';
import { Header } from '@/components/data/Header';
import { Button } from '@/components/ui/button';

// The one workspace row — shared by the picker gate and the switch dialog, so
// both surfaces render the same identity (Header profile) and affordance.
export function WorkspaceRow({
	workspace,
	current = false,
	disabled = false,
	onSelect,
}: {
	workspace: WorkspaceResponse;
	/** True for the session's current workspace — marked and non-interactive. */
	current?: boolean;
	disabled?: boolean;
	onSelect: (slug: string) => void;
}) {
	return (
		<Button
			variant="outline"
			className="h-auto w-full justify-between px-4 py-3"
			disabled={disabled}
			onClick={() => onSelect(workspace.slug)}
		>
			<Header
				variant="profile"
				title={workspace.name}
				description={workspace.slug}
			/>
			{current ? (
				<span className="flex shrink-0 items-center gap-1 text-xs font-medium">
					<CheckIcon className="size-4" />
					Current
				</span>
			) : (
				<ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
			)}
		</Button>
	);
}
