import { Input } from '@/components/ui/input';
import {
	addDays,
	instantToLocalDate,
	startOfLocalDay,
	startOfNextLocalDay,
} from '@/libs/dates';

// Date-range bound inputs for the Form vocabulary — RFC 3339 UTC instants on
// the wire, local calendar days in the input. HALF-OPEN [from, to):
// DateFromInput commits the start of the picked local day; DateToInput
// commits the start of the day AFTER the picked day (the exclusive bound —
// the server compares `lt`). All conversion lives in libs/dates; FormField
// injects value/onChange — these controls stay dumb: display local, commit UTC.

interface DateControlProps {
	/** RFC 3339 UTC instant (e.g. '2024-01-14T16:00:00.000Z'). */
	value?: string | undefined;
	/** Commits the converted UTC instant ('' commits as undefined). */
	onChange?: (value: string | undefined) => void;
	className?: string;
	'aria-label'?: string;
	placeholder?: string;
}

function DateBoundaryInput({
	value,
	onChange,
	boundary,
	...rest
}: DateControlProps & { boundary: 'start' | 'end' }) {
	// The "end" bound is exclusive (start of the next day), so its displayed
	// day is one calendar day earlier than the instant's local date.
	const localDate = instantToLocalDate(value ?? '');
	const display =
		boundary === 'end' && localDate ? addDays(localDate, -1) : localDate;

	const commit = (date: string) => {
		const iso =
			boundary === 'end'
				? startOfNextLocalDay(date)
				: startOfLocalDay(date);
		onChange?.(iso || undefined);
	};

	return (
		<Input
			type="date"
			value={display}
			onChange={(e) => commit(e.target.value)}
			{...rest}
		/>
	);
}

/** "From" bound — commits the start of the picked local day (inclusive lower bound). */
export function DateFromInput(props: DateControlProps) {
	return <DateBoundaryInput {...props} boundary="start" />;
}

/** "To" bound — commits the start of the day after the picked day (exclusive upper bound). */
export function DateToInput(props: DateControlProps) {
	return <DateBoundaryInput {...props} boundary="end" />;
}
