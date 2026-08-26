import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const options: { value: ThemeMode; label: string; icon: typeof SunIcon }[] = [
	{ value: 'light', label: 'Light', icon: SunIcon },
	{ value: 'dark', label: 'Dark', icon: MoonIcon },
	{ value: 'system', label: 'System', icon: MonitorIcon },
];

function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const CurrentIcon =
		options.find((o) => o.value === theme)?.icon ?? MonitorIcon;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" aria-label="Toggle theme">
					<CurrentIcon className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{options.map((option) => (
					<DropdownMenuItem
						key={option.value}
						onClick={() => setTheme(option.value)}
					>
						<option.icon className="size-4" />
						{option.label}
						{theme === option.value && (
							<CheckIcon className="size-4 ml-auto" />
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { ThemeToggle };
