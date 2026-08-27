import { API, callEden } from '@/libs/api';
import { useGlobal } from '@/hooks/useGlobal';

// One page covers the whole list for the switcher and the bootstrap — the
// list endpoint's max pageSize.
const TENANT_LIST_PAGE_SIZE = 100;

// After login/register: pick the current tenant and decide where to land.
// - 0 tenants → 'pick' (the Tenants page shows its empty state + create)
// - 1 tenant → auto-select, 'continue' to the redirect target
// - N tenants → keep a valid persisted choice; otherwise 'pick' (the Tenants
//   page doubles as the picker)
// A failed fetch degrades to 'continue' with no current tenant — the login
// must never block on tenant bootstrapping (the header switcher retries via
// its own query).
export async function bootstrapCurrentTenant(): Promise<'continue' | 'pick'> {
	try {
		const { items } = await callEden(
			API.tenants.get({
				query: { page: 1, pageSize: TENANT_LIST_PAGE_SIZE },
			}),
		);
		const state = useGlobal.getState();
		// noUncheckedIndexedAccess: `items[0]` is `T | undefined` — check the
		// element, not just the length.
		const first = items[0];
		if (items.length === 1 && first) {
			state.actions.setCurrentTenantId(first.id);
			return 'continue';
		}
		if (items.length === 0) return 'pick';
		const persisted = state.currentTenantId;
		if (persisted && items.some((tenant) => tenant.id === persisted)) {
			return 'continue';
		}
		return 'pick';
	} catch {
		return 'continue';
	}
}
