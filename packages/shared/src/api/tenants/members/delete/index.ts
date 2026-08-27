import type { TenantMemberParams, TenantMemberResponse } from '../../shared';

// DELETE /tenants/:tenantId/members/:userId — the removed membership row is
// the response (mirrors the shared contract; no success-wrapper schema here).
export type DeleteTenantMemberParams = TenantMemberParams;
export type DeleteTenantMemberResponse = TenantMemberResponse;
