import { icons } from 'lucide-react';

// Names ARE lucide's own exports (`keyof typeof icons` — a typo is a compile
// error), no curated registry. Trade-off: the full icon set is imported, no
// per-icon tree-shaking.
export type IconName = keyof typeof icons;

export type IconStyle = 'neutral' | 'destructive';

export interface IconObject {
	name: IconName;
	style?: IconStyle;
}

export const iconStyleClasses: Record<IconStyle, string> = {
	neutral: '',
	destructive: 'bg-destructive/10 text-destructive',
};

export function getIcon(name: IconName) {
	return icons[name];
}
