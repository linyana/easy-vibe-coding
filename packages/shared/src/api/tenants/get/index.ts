import type { TenantIdParams, TenantWithRole } from '../shared';

// GET /tenants/:tenantId — reuses the shared contract (params + tenant+role
// response); this folder keeps the "one folder per endpoint" structure.
export type GetTenantParams = TenantIdParams;
export type GetTenantResponse = TenantWithRole;
