import { useCallback, useId, useMemo, useRef, useState } from 'react';
import type { z, ZodType } from 'zod';
import type { EdenCall } from '@/libs/api';
import { deepEqual } from '@/libs/utils';
import type { FormControl } from '@/components';
import { useAPIMutation } from '@/hooks/useAPIMutation';
import { toast } from 'sonner';

interface UseFormSubmitConfig<TValues, TData> {
	call: (values: TValues) => EdenCall<TData>;
	queryKey: readonly unknown[];
	successMessage: string;
	onSuccess?: (data: TData) => void;
	/** Edit forms require a change before submit — a no-op save is a false success. */
	requireDirty?: boolean;
}

export interface FormApi<TValues extends object> {
	/** Stable DOM identity for this form's <form> element — submit buttons
	 * outside the element (dialog footers) reference it via the HTML `form`
	 * attribute instead of threading an id through every layer. */
	id: string;
	values: TValues;
	set: (patch: Partial<TValues>) => void;
	reset: (next?: TValues) => void;
	/** True when values differ from the dirty baseline (the seeded snapshot
	 * or the last server re-read) — the settings save bar shows on this. */
	isDirty: boolean;
	control: FormControl<TValues>;
	/** Displayed only for touched fields — untouched ones stay quiet (the `*` markers + submit tooltip carry the pristine state). */
	errors: Partial<Record<keyof TValues, string>>;
	/** Whole-form message: a pathless zod issue (`.refine()` without `path`) or a server failure that can't land on a field. */
	formError: string | undefined;
	isRequired: (name: keyof TValues) => boolean;
	validate: () => boolean;
	submit: () => void;
	isPending: boolean;
	canSubmit: boolean;
	submitDisabledReason: string | undefined;
}

interface UseFormOptions<
	TSchema extends ZodType,
	TValues extends object = z.infer<TSchema> & object,
	TData = unknown,
> {
	schema: TSchema;
	initialValues: TValues;
	submit: UseFormSubmitConfig<TValues, TData>;
}

export function useForm<
	TSchema extends ZodType,
	TValues extends object = z.infer<TSchema> & object,
	TData = unknown,
>({
	schema,
	initialValues,
	submit: submitConfig,
}: UseFormOptions<TSchema, TValues, TData>): FormApi<TValues> {
	type TField = keyof TValues;

	// One FormApi renders one <form> — the id is born with the form itself
	// (Edit dialogs re-create the whole hook via key remount, so reuse is
	// already excluded at the page-orchestration level).
	const id = useId();

	// Stable snapshot: reset() restores the hook's original values even if the
	// caller re-passes a fresh literal each render; reset(next) adopts `next`
	// as BOTH the new values and the new dirty baseline (the settings page
	// seeds the form from a fetched config this way, and adopts the server's
	// re-read config as the baseline after each save).
	const initialRef = useRef(initialValues);
	const [values, setValues] = useState<TValues>(initialValues);
	const [errors, setErrors] = useState<Partial<Record<TField, string>>>({});
	const [touched, setTouched] = useState<Set<TField>>(new Set());
	const [formError, setFormError] = useState<string | undefined>(undefined);

	// Field issues go to `errors`; pathless issues to `formError`. Cross-field
	// rules should anchor with `path: ['field']` to display on the field.
	const runValidation = useCallback(
		(target: TValues): boolean => {
			const parsed = schema.safeParse(target);
			if (parsed.success) {
				setErrors({});
				setFormError(undefined);
				return true;
			}
			const byField: Partial<Record<TField, string>> = {};
			let wholeForm: string | undefined;
			for (const issue of parsed.error.issues) {
				const field = issue.path[0];
				if (typeof field === 'string') {
					if (!byField[field as TField])
						byField[field as TField] = issue.message;
				} else if (!wholeForm) {
					wholeForm = issue.message;
				}
			}
			setErrors(byField);
			setFormError(wholeForm);
			return false;
		},
		[schema],
	);

	// Every edit re-validates (live); a field's error shows only once touched. A
	// disabled submit also kills Enter — browsers skip implicit submission
	// when the default submit button is disabled.
	const set = useCallback(
		(patch: Partial<TValues>) => {
			const next = { ...values, ...patch };
			setValues(next);
			setTouched((prev) => {
				const nextSet = new Set(prev);
				for (const key of Object.keys(patch))
					nextSet.add(key as TField);
				return nextSet;
			});
			runValidation(next);
		},
		[values, runValidation],
	);

	const reset = useCallback((next?: TValues) => {
		// With an argument this is "seed a new baseline" (server snapshot),
		// not "restore birth values" — the next edit compares against it.
		if (next !== undefined) initialRef.current = next;
		setValues(next ?? initialRef.current);
		setErrors({});
		setFormError(undefined);
		setTouched(new Set());
	}, []);

	const validate = useCallback(
		(): boolean => runValidation(values),
		[values, runValidation],
	);

	const visibleErrors = useMemo(() => {
		const out: Partial<Record<TField, string>> = {};
		for (const key of Object.keys(errors) as TField[]) {
			if (touched.has(key)) out[key] = errors[key];
		}
		return out;
	}, [errors, touched]);

	// Required info derived once from the schema's `.shape` — a non-object
	// schema has no shape, so no required info, no marker.
	const requiredFields = useMemo(() => {
		const shape = (
			schema as {
				shape?: Record<string, { isOptional(): boolean }>;
			}
		).shape;
		if (!shape) return undefined;
		const set = new Set<TField>();
		for (const key of Object.keys(shape)) {
			if (!shape[key]?.isOptional()) set.add(key as TField);
		}
		return set;
	}, [schema]);

	const isRequired = useCallback(
		(name: TField) => requiredFields?.has(name) ?? false,
		[requiredFields],
	);

	// Silent validity gate (no error state) — a pristine form never flashes
	// errors before the user submits.
	const validation = useMemo(
		() => schema.safeParse(values),
		[schema, values],
	);

	const isDirty = useMemo(
		() => !deepEqual(values, initialRef.current),
		[values],
	);

	// FormSubmitButton renders this in a tooltip on the disabled button.
	const submitDisabledReason = useMemo(() => {
		if (submitConfig.requireDirty && !isDirty) return 'No changes to save';
		if (!validation.success) {
			return (
				validation.error.issues[0]?.message ??
				'Please fix the validation errors'
			);
		}
		return undefined;
	}, [submitConfig.requireDirty, isDirty, validation]);

	const canSubmit = submitDisabledReason === undefined;

	// Server failures land in the form (never a toast — the form is the
	// feedback channel): field errors map onto the same surface local
	// validation uses, field-less failures into the whole-form slot.
	const mutation = useAPIMutation({
		call: (submitted: TValues) => submitConfig.call(submitted),
		queryKey: submitConfig.queryKey,
		successMessage: submitConfig.successMessage,
		onError: (error) => {
			const shape = (schema as { shape?: Record<string, unknown> }).shape;
			const shapeKeys = shape ? new Set(Object.keys(shape)) : null;
			const byField: Partial<Record<TField, string>> = {};
			let wholeForm: string | undefined;
			for (const { field, message } of error.fields ?? []) {
				if (shapeKeys?.has(field)) {
					if (!byField[field as TField])
						byField[field as TField] = message;
				} else if (!wholeForm) {
					wholeForm = message;
				}
			}
			const mappedFields = Object.keys(byField).length > 0;
			setErrors(byField);
			setFormError(
				wholeForm ?? (mappedFields ? undefined : error.message),
			);
			setTouched((prev) => {
				const nextSet = new Set(prev);
				for (const key of Object.keys(byField))
					nextSet.add(key as TField);
				return nextSet;
			});
			toast.error(error.message);
		},
		onSuccess: (data: TData) => {
			reset();
			submitConfig.onSuccess?.(data);
		},
	});

	// The canSubmit guard mirrors the disabled button — Enter in an input
	// bypasses the click, not the guard.
	const submit = () => {
		if (!validate()) return;
		if (!canSubmit) return;
		mutation.mutate(values);
	};

	const control = useMemo(
		(): FormControl<TValues> => ({ values, set }),
		[values, set],
	);

	return {
		id,
		values,
		set,
		reset,
		isDirty,
		control,
		errors: visibleErrors,
		isRequired,
		formError,
		validate,
		submit,
		isPending: mutation.isPending,
		canSubmit,
		submitDisabledReason,
	};
}
