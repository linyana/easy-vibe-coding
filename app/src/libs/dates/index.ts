// The app-side timezone boundary: the wire speaks RFC 3339 UTC instants, humans
// pick local calendar days — every conversion lives here, so the server never
// guesses a timezone. Range filters are HALF-OPEN [from, to): the upper bound
// is the start of the day AFTER the picked day (exclusive).

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date of an RFC 3339 instant — '' on invalid input. */
export const instantToLocalDate = (iso: string): string => {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Calendar-day arithmetic — DST-safe (calendar math, not 24h math). */
export const addDays = (date: string, days: number): string => {
	const [y, m, d] = date.split('-').map(Number) as [number, number, number];
	const t = new Date(Date.UTC(y, m - 1, d + days));
	return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
};

/** Local midnight as an RFC 3339 instant (the inclusive lower bound) — '' on invalid input. */
export const startOfLocalDay = (date: string): string => {
	const d = new Date(`${date}T00:00:00`);
	return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};

/** Local midnight of the day AFTER the given day — the exclusive upper bound of a "to" pick. */
export const startOfNextLocalDay = (date: string): string =>
	startOfLocalDay(addDays(date, 1));

export const formatDateTime = (iso: string): string =>
	new Date(iso).toLocaleString();

/** Local calendar date of a `Date` (the calendar picker's day) — '' on invalid input. */
export const dateToLocalDay = (date: Date): string => {
	if (Number.isNaN(date.getTime())) return '';
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Locale-aware short display of a local calendar day ("Jan 5, 2025") — '' on invalid input. */
export const formatLocalDay = (date: string): string => {
	const [y, m, d] = date.split('-').map(Number) as [number, number, number];
	if (!y || !m || !d) return '';
	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(new Date(y, m - 1, d));
};

export interface WireDateRange {
	/** The inclusive lower bound (start of the picked local day). */
	from?: string | undefined;
	/** The exclusive upper bound (start of the day AFTER the picked local day). */
	to?: string | undefined;
}

/** Wire instants → picked local days for display (the "to" bound backs up one day — it is exclusive). */
export const wireRangeToLocal = (
	range: WireDateRange | undefined,
): { from?: string; to?: string } => {
	const from = range?.from ? instantToLocalDate(range.from) : undefined;
	const to = range?.to
		? addDays(instantToLocalDate(range.to), -1)
		: undefined;
	return { ...(from ? { from } : {}), ...(to ? { to } : {}) };
};

export const localRangeToWire = (range: {
	from?: string;
	to?: string;
}): WireDateRange | undefined => {
	const from = range.from ? startOfLocalDay(range.from) : undefined;
	const to = range.to ? startOfNextLocalDay(range.to) : undefined;
	if (!from && !to) return undefined;
	return { ...(from ? { from } : {}), ...(to ? { to } : {}) };
};
