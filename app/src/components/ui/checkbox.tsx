import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { CheckIcon, MinusIcon } from 'lucide-react';

import { cn } from '@/libs/utils';

// The indicator icon is rendered conditionally off the `checked` prop (Radix
// owns the accessibility state — aria-checked / data-state — the component
// owns the icon), so Table row/select-all checkboxes pass
// `checked`/`'indeterminate'` straight through.
function Checkbox({
	className,
	checked = false,
	...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	const isIndeterminate = checked === 'indeterminate';
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			checked={checked}
			className={cn(
				'peer flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-input shadow-xs outline-none transition-[box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
				className,
			)}
			{...props}
		>
			{isIndeterminate ? (
				<MinusIcon className="size-3.5" />
			) : checked ? (
				<CheckIcon className="size-3.5" />
			) : null}
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
