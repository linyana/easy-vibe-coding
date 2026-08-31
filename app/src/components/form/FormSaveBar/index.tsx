import type { FormApi } from '@/hooks/useForm';
import { Button } from '@/components/ui/button';
import { FormSubmitButton } from '../FormSubmitButton';
import { FloatingActionBar } from '@/components/overlay/FloatingActionBar';

interface FormSaveBarProps<TValues extends object> {
	/** The form whose dirtiness drives the bar and whose submit wiring Save uses. */
	form: FormApi<TValues>;
	/** What Cancel restores — the server snapshot for settings pages. */
	onCancel: () => void;
}

/**
 * The floating save surface for page-level forms (settings pages, editors) —
 * appears only while the form is dirty, and pairs Cancel (restore the
 * snapshot) with Save (the shared FormSubmitButton wiring: pending spinner,
 * validity gate, disabled-reason tooltip). One combination, written once.
 */
export function FormSaveBar<TValues extends object>({
	form,
	onCancel,
}: FormSaveBarProps<TValues>) {
	return (
		<FloatingActionBar visible={form.isDirty}>
			<p className="text-sm text-muted-foreground">
				<span
					className="mr-2 inline-block size-2 rounded-full bg-amber-500"
					aria-hidden
				/>
				Unsaved changes
			</p>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					disabled={form.isPending}
					onClick={onCancel}
				>
					Cancel
				</Button>
				<FormSubmitButton form={form}>Save</FormSubmitButton>
			</div>
		</FloatingActionBar>
	);
}
