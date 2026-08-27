import { Building2Icon, CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { API } from '@/libs/api';
import { useAPIQuery } from '@/hooks/useAPIQuery';
import { useGlobal } from '@/hooks/useGlobal';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// The current-tenant selector — lives in the app bar so switching is always
// one click away. The query is a lightweight "my tenants" fetch (pageSize
// covers the whole list); tenant-scoped pages key off the chosen id in their
// own query keys.
export function TenantSwitcher() {
	const currentTenantId = useGlobal((s) => s.currentTenantId);
	const setCurrentTenantId = useGlobal((s) => s.actions.setCurrentTenantId);
	const { data } = useAPIQuery({
		queryKey: ['tenants', 'switcher'],
		queryFn: () => API.tenants.get({ query: { page: 1, pageSize: 100 } }),
		toastError: false,
	});

	const tenants = data?.items ?? [];
	const current = tenants.find((t) => t.id === currentTenantId);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="gap-1.5">
					<Building2Icon className="size-4 shrink-0" />
					<span className="max-w-32 truncate">
						{current?.name ?? 'Select tenant'}
					</span>
					<ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-60">
				<DropdownMenuLabel>Tenants</DropdownMenuLabel>
				{tenants.length === 0 ? (
					<DropdownMenuItem disabled>
						No tenants yet — create one
					</DropdownMenuItem>
				) : (
					tenants.map((tenant) => (
						<DropdownMenuItem
							key={tenant.id}
							onSelect={() => setCurrentTenantId(tenant.id)}
						>
							<span className="flex-1 truncate">
								{tenant.name}
							</span>
							{tenant.id === currentTenantId && (
								<CheckIcon className="size-4" />
							)}
						</DropdownMenuItem>
					))
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link to="/tenants" className="gap-2">
						<Building2Icon className="size-4" />
						All tenants
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
