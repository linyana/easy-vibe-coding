import * as React from 'react';
import { Building2Icon, BotIcon, UserIcon } from 'lucide-react';
import { Sidebar } from '@/components/ui/sidebar';
import { Banner } from './Banner';
import { ShellSidebar } from './ShellSidebar';

// The personal surface — context-free (workspace-independent), mirrors the
// admin platform surface's chrome: the shell holds the account's own pages
// (Account, LLM providers) plus the workspace picker to enter a workspace.
// Reached from the account footer menu on every surface; the no-workspace
// gate hands off here instead of rendering a bare full-screen picker.
export function ProfileSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<ShellSidebar
			{...props}
			header={<Banner />}
			groups={[
				{
					items: [
						{
							title: 'Account',
							to: '/profile',
							icon: UserIcon,
						},
						{
							title: 'LLM providers',
							to: '/profile/llm',
							icon: BotIcon,
						},
						{
							title: 'Workspaces',
							to: '/profile/workspaces',
							icon: Building2Icon,
						},
					],
				},
			]}
		/>
	);
}
