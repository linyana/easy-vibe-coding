import type { API, UseAPIItem } from '@/libs/api';

export type Tenant = UseAPIItem<typeof API.tenants.get>;

// The members list lives under /tenants/:tenantId — derive its item type
// through the path-scoped router (same single source: the Eden client).
export type TenantMember = UseAPIItem<
	ReturnType<typeof API.tenants>['members']['get']
>;

export type TenantsAction =
	| { kind: 'create' }
	| { kind: 'detail'; tenant: Tenant }
	| { kind: 'rename'; tenant: Tenant };

export type TenantsDetailAction =
	| { kind: 'addMember' }
	| { kind: 'removeMember'; member: TenantMember };
