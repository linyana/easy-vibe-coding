import { Fragment } from 'react';
import { MoreHorizontalIcon } from 'lucide-react';
import { getIcon, type IconObject } from '@/libs/icons';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface RowAction {
	label: string;
	icon: IconObject;
	onClick: () => void;
}

// Row action chrome: destructive items are tinted AND separated from the
// safe ones (the danger zone reads as a block); the feature renders the
// actions column itself and passes `{ label, icon, onClick }` here.
export function Actions({ items }: { items: RowAction[] }) {
	const accessibleLabel = `Row actions: ${items
		.map((item) => item.label)
		.join(', ')}`;
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label={accessibleLabel}
					title={accessibleLabel}
				>
					<MoreHorizontalIcon className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-40">
				{items.map((item, index) => {
					const isDestructive = item.icon.style === 'destructive';
					const prev = index > 0 ? items[index - 1] : undefined;
					const dangerZoneBreak =
						isDestructive &&
						prev !== undefined &&
						prev.icon.style !== 'destructive';
					const Icon = getIcon(item.icon.name);
					return (
						<Fragment key={item.label}>
							{dangerZoneBreak && <DropdownMenuSeparator />}
							<DropdownMenuItem
								variant={
									isDestructive ? 'destructive' : 'default'
								}
								onClick={item.onClick}
							>
								{Icon && <Icon className="size-4" />}
								{item.label}
							</DropdownMenuItem>
						</Fragment>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
