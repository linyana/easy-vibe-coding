import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { useGlobal } from '@/hooks/useGlobal';
import './main.css';

// Apply the persisted theme before first paint (no flash).
const { themeMode } = useGlobal.getState();
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.toggle(
	'dark',
	themeMode === 'dark' || (themeMode === 'system' && prefersDark),
);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
