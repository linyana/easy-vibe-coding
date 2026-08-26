import { useEffect, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
	/** Applied value — injected by FormField inside one; the input syncs back when it changes externally. */
	value?: string | undefined;
	/** Debounced commit — fired ~300ms after typing stops; '' commits as undefined. */
	onChange?: (value: string | undefined) => void;
	placeholder?: string;
	className?: string;
	debounceMs?: number;
	'aria-invalid'?: boolean;
}

// Pure UI — the binding to form/search state lives one level up in FormField.
export function SearchInput({
	value,
	onChange,
	placeholder,
	className,
	debounceMs = 300,
	'aria-invalid': ariaInvalid,
}: SearchInputProps) {
	const [draft, setDraft] = useState(value ?? '');

	// Sync back when the applied value changes externally (back/forward,
	// programmatic set) so the draft never drifts from the source.
	useEffect(() => setDraft(value ?? ''), [value]);

	// Debounce the commit; skip when the draft equals the applied value (e.g.
	// a sync-back render must not trigger a redundant commit).
	useEffect(() => {
		const q = draft.trim() || undefined;
		if (q === (value || undefined)) return;
		const timer = setTimeout(() => onChange?.(q), debounceMs);
		return () => clearTimeout(timer);
	}, [draft, value, onChange, debounceMs]);

	return (
		<div className={`relative ${className ?? ''}`}>
			<SearchIcon className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
			<Input
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				placeholder={placeholder}
				aria-invalid={ariaInvalid}
				className="pl-8"
			/>
		</div>
	);
}
