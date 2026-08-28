import { API, callEden } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';

// One page covers the whole list for the switcher and the bootstrap — the
// list endpoint's max pageSize.
const WORKSPACE_LIST_PAGE_SIZE = 100;

// After login/register: pick the current workspace and decide where to land.
// - 0 workspaces → 'pick' (the Workspaces page shows its empty state + create)
// - 1 workspace → auto-select, 'continue' to the redirect target
// - N workspaces → keep a valid persisted choice; otherwise 'pick' (the
//   Workspaces page doubles as the picker)
// A failed fetch degrades to 'continue' with no current workspace — the login
// must never block on workspace bootstrapping (the header switcher retries via
// its own query).
export async function bootstrapCurrentWorkspace(): Promise<
	'continue' | 'pick'
> {
	try {
		const { items } = await callEden(
			API.workspaces.get({
				query: { page: 1, pageSize: WORKSPACE_LIST_PAGE_SIZE },
			}),
		);
		const state = useGlobal.getState();
		// noUncheckedIndexedAccess: `items[0]` is `T | undefined` — check the
		// element, not just the length.
		const first = items[0];
		if (items.length === 1 && first) {
			state.actions.setCurrentWorkspaceId(first.slug);
			return 'continue';
		}
		if (items.length === 0) return 'pick';
		const persisted = state.currentWorkspaceId;
		if (persisted && items.some((w) => w.slug === persisted)) {
			return 'continue';
		}
		return 'pick';
	} catch {
		return 'continue';
	}
}
