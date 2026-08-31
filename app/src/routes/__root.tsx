// The one exception to "routes are thin wiring": the root shell — only the
// toaster, which must outlive the app shell (auth pages toast too).
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<>
			<Outlet />
			<Toaster richColors />
		</>
	);
}
