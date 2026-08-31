import { Toaster as Sonner, type ToasterProps } from 'sonner';
import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

function Toaster({ ...props }: ToasterProps) {
	const { resolvedTheme } = useTheme();

	return (
		<Sonner
			theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
			className="toaster group"
			style={
				{
					'--normal-bg': 'var(--popover)',
					'--normal-text': 'var(--popover-foreground)',
					'--normal-border': 'var(--border)',
					'--border-radius': 'var(--radius)',
				} as React.CSSProperties
			}
			toastOptions={{
				classNames: {
					toast: 'cn-toast',
				},
			}}
			{...props}
		/>
	);
}

export { Toaster };
