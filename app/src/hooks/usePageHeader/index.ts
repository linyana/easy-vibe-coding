import { useLayoutEffect, type ReactNode } from 'react';
import { create } from 'zustand';

/** Back button in the layout header — `label` is the accessible name (aria/tooltip), no visible text. */
export interface PageHeaderBack {
	to: string;
	label?: string;
}

export interface PageHeaderContent {
	title?: ReactNode;
	description?: ReactNode;
	back?: PageHeaderBack;
}

interface PageHeaderState {
	content: PageHeaderContent;
	setContent: (content: PageHeaderContent) => void;
}

// Tiny global store (zustand, like useGlobal) — a store, not context (no
// provider). setContent skips when nothing changed, so a page re-render
// (e.g. typing in a filter) doesn't re-render the header.
const usePageHeaderStore = create<PageHeaderState>((set) => ({
	content: {},
	setContent: (content) =>
		set((state) => {
			if (
				state.content.title === content.title &&
				state.content.description === content.description &&
				state.content.back?.to === content.back?.to &&
				state.content.back?.label === content.back?.label
			) {
				return state;
			}
			return { content };
		}),
}));

/** Declare the page's header content for the layout header; re-pushes on every render (before paint), so dynamic titles update with no stale-title flash. */
export function usePageHeader(content: PageHeaderContent): void {
	const setContent = usePageHeaderStore((s) => s.setContent);
	useLayoutEffect(() => {
		setContent(content);
	});
}

export { usePageHeaderStore };
