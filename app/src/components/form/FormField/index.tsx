import { cloneElement, type ReactElement, type ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

// Field binding — the source is passed whole, not field-by-field:
// - `form={form}` — a useForm's FormApi (structural, components never import
//   hooks): binds `control` AND derives the field error from `errors[name]`
// - `control={...}` — useAPIList's filter side (or a standalone FormControl):
//   the same binding, no errors (lists have no validation)
// Passing both or neither is a compile error. `name` is type-checked against
// the schema type: a field that doesn't exist in it is a compile error.
//
// Control convention: a single element accepting `value` (may be undefined —
// normalize internally) and `onChange` (a change event OR a raw value).
// Radix Switch/Checkbox are the exception: they take `checked` +
// `onCheckedChange` — pass `valuePropName="checked"` /
// `changePropName="onCheckedChange"` to rebind (antd-style).
// `aria-invalid` is injected too while the field shows an error — shadcn
// controls style it as the destructive border/ring, so error styling needs
// no per-control code (and doubles as the a11y signal). Don't pass
// value/onChange (or checked/onCheckedChange) on the child itself — they are
// injected here.

export interface FormControl<T> {
	values: T;
	set: (patch: Partial<T>) => void;
}

// What a field source must provide — useForm's FormApi satisfies this
// structurally (it has `control` and `errors`). Structural on purpose:
// components never import hooks, so the contract is shape-based.
export type FormFieldSource<T> = {
	control: FormControl<T>;
	errors?: Partial<Record<keyof T, string>>;
	/** True when the shared schema marks this field required — renders the `*` marker. */
	isRequired?: (name: keyof T) => boolean;
};

// Extract the raw value from a control's change payload — antd-style: an
// event carries `target.value`, anything else passes through untouched.
const extractValue = (payload: unknown) =>
	payload && typeof payload === 'object' && 'target' in payload
		? (payload as { target: { value: string } }).target.value
		: payload;

export type BoundControlProps =
	| { value?: unknown; onChange?: unknown }
	| { checked?: unknown; onCheckedChange?: unknown };

interface FormFieldBaseProps<T, Name extends keyof T & string> {
	name: Name;
	/** Force/override the validation message — takes precedence over the form-derived error. */
	error?: string;
	label?: string;
	tooltip?: ReactNode;
	description?: string;
	/** The prop the control receives its value through — 'value' by default,
	 * 'checked' for Radix Switch/Checkbox. */
	valuePropName?: 'value' | 'checked';
	/** The prop the control reports changes through — 'onChange' by default. */
	changePropName?: 'onChange' | 'onCheckedChange';
	children: ReactElement<BoundControlProps & { 'aria-invalid'?: boolean }>;
}

type FormFieldProps<T, Name extends keyof T & string> =
	| (FormFieldBaseProps<T, Name> & {
			form: FormFieldSource<T>;
			control?: never;
	  })
	| (FormFieldBaseProps<T, Name> & {
			control: FormControl<T>;
			form?: never;
	  });

export function FormField<T, Name extends keyof T & string>(
	props: FormFieldProps<T, Name>,
) {
	const { name, error, label, tooltip, description, children } = props;
	const control = props.form ? props.form.control : props.control;
	const fieldError = error ?? (props.form && props.form.errors?.[name]);
	const value = control.values[name];
	const valuePropName = props.valuePropName ?? 'value';
	const changePropName = props.changePropName ?? 'onChange';
	const bound = cloneElement(children, {
		[valuePropName]: value,
		'aria-invalid': fieldError ? true : undefined,
		// Double cast: a computed key against generic Partial<T> is beyond TS's
		// verification — Name extends keyof T makes it sound.
		[changePropName]: (payload: unknown) =>
			control.set({
				[name]: extractValue(payload),
			} as unknown as Partial<T>),
	});
	return (
		<div className="grid gap-2">
			{(label || tooltip) && (
				<div className="flex items-center gap-1.5">
					{props.form?.isRequired?.(name) && (
						<span className="text-destructive">*</span>
					)}
					{label && <Label>{label}</Label>}
					{tooltip && (
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										aria-label="Field help"
										className="inline-flex items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
									>
										<CircleHelp className="size-3.5" />
									</button>
								</TooltipTrigger>
								<TooltipContent>{tooltip}</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
			)}
			{description && (
				<p className="text-sm text-muted-foreground">{description}</p>
			)}
			{bound}
			{fieldError && (
				<p className="text-sm text-destructive">{fieldError}</p>
			)}
		</div>
	);
}
