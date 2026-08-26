import { useState } from 'react';
import { CalendarIcon, XIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import {
	dateToLocalDay,
	formatLocalDay,
	localRangeToWire,
	wireRangeToLocal,
	type WireDateRange,
} from '@/libs/dates';
import { cn } from '@/libs/utils';

// The combined date-range control: a Calendar (`mode="range"`) in a Popover.
// RFC 3339 UTC instants on the wire, local calendar days in the calendar. The
// range is HALF-OPEN [from, to): the lower bound commits the start of the
// picked local day; the upper bound the start of the day AFTER the picked day
// (exclusive — the server compares `lt`). All conversion lives in libs/dates;
// FormField injects value/onChange — this control stays dumb: display local,
// commit UTC.
//
// The value is a single object ({ from, to }) — bind it to ONE field (e.g.
// the shared contract's `createdRange`), unlike the DateFromInput/DateToInput
// pair which bind two separate fields.

interface DateRangePickerProps {
	/** HALF-OPEN [from, to) of RFC 3339 UTC instants. */
	value?: WireDateRange | undefined;
	/** Commits the converted wire range (undefined when cleared). */
	onChange?: (value: WireDateRange | undefined) => void;
	className?: string;
	'aria-label'?: string;
	'aria-invalid'?: boolean;
}

export function DateRangePicker({
	value,
	onChange,
	className,
	'aria-label': ariaLabel,
	'aria-invalid': ariaInvalid,
}: DateRangePickerProps) {
	const [open, setOpen] = useState(false);

	// Wire instants → the picked local calendar days. The wire "to" is the
	// start of the day AFTER the picked day, so its displayed day backs up one.
	const local = wireRangeToLocal(value);
	const range: DateRange | undefined =
		local.from || local.to
			? {
					from: local.from
						? new Date(`${local.from}T00:00:00`)
						: undefined,
					to: local.to ? new Date(`${local.to}T00:00:00`) : undefined,
				}
			: undefined;

	const fromText = local.from ? formatLocalDay(local.from) : undefined;
	const toText = local.to ? formatLocalDay(local.to) : undefined;
	const display =
		fromText && toText
			? `${fromText} – ${toText}`
			: (fromText ?? toText ?? '');

	// Picked local days → wire instants (HALF-OPEN). A complete pick closes
	// the popover; a start-only pick leaves it open for the end.
	const commit = (range: DateRange | undefined) => {
		const from = range?.from ? dateToLocalDay(range.from) : undefined;
		const to = range?.to ? dateToLocalDay(range.to) : undefined;
		onChange?.(localRangeToWire({ from, to }));
		if (range?.from && range?.to) setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					aria-label={ariaLabel}
					aria-invalid={ariaInvalid}
					className={cn(
						'w-full justify-start gap-2 font-normal',
						!display && 'text-muted-foreground',
						className,
					)}
				>
					<CalendarIcon className="size-4" />
					{display || 'Pick a date range'}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="range"
					selected={range}
					onSelect={commit}
					numberOfMonths={2}
					// v10 range-mode: clicking the same day clears a single-day range.
					resetOnSelect
				/>
				{display && (
					<div className="flex items-center justify-between gap-2 border-t px-3 py-2">
						<span className="text-sm text-muted-foreground">
							{display}
						</span>
						<Button
							variant="ghost"
							size="sm"
							className="h-6 gap-1 px-2 text-xs"
							onClick={() => {
								onChange?.(undefined);
								setOpen(false);
							}}
						>
							<XIcon className="size-3" />
							Clear
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
