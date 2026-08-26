import { useEffect, useMemo } from 'react';
import { useGlobal, type ThemeMode } from '@/hooks/useGlobal';

export type { ThemeMode };

export function useTheme() {
	const themeMode = useGlobal((s) => s.themeMode);
	const setThemeMode = useGlobal((s) => s.actions.setThemeMode);

	const resolvedTheme = useMemo(() => {
		if (themeMode !== 'system') return themeMode;
		return window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light';
	}, [themeMode]);

	useEffect(() => {
		document.documentElement.classList.toggle(
			'dark',
			resolvedTheme === 'dark',
		);
	}, [resolvedTheme]);

	return { theme: themeMode, resolvedTheme, setTheme: setThemeMode };
}
