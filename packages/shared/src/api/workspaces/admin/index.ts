// Admin-only workspace management: platform-level list/stats/edit/delete +
// a get-by-slug for the admin's entered-workspace surface (the URL slug is
// the address). The user-facing list/create live in the parent module; the
// admin's entered-workspace member management lives in members/admin.
export * from './list';
export * from './stats';
export * from './edit';
export * from './delete';
export * from './disable';
export * from './enable';
