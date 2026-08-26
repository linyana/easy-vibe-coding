import { AlertCircleIcon, RotateCcwIcon } from 'lucide-react';
import type { UseAPIError } from '@/libs/error';
import { isRetryableError } from '@/libs/error';
import { Button } from '@/components/ui/button';
import { MediaIcon } from '../MediaIcon';
import { iconStyleClasses } from '@/libs/icons';

export function ErrorState({
	error,
	onRetry,
}: {
	error: UseAPIError;
	onRetry?: () => void;
}) {
	return (
		<div className="rounded-lg border border-destructive/40 p-8 text-center">
			<MediaIcon className={iconStyleClasses.destructive}>
				<AlertCircleIcon />
			</MediaIcon>
			<p className="mt-2 text-sm text-muted-foreground">
				{error.message}
			</p>
			{onRetry && isRetryableError(error) ? (
				<Button
					variant="outline"
					size="sm"
					className="mt-4"
					onClick={onRetry}
				>
					<RotateCcwIcon className="size-4" />
					Retry
				</Button>
			) : null}
		</div>
	);
}
