// Workspaces — SaaS multi-tenancy: the isolation unit (every business table
// carries a workspace_id column), N:M membership via workspace_members. The
// public identifier is the URL slug — the internal numeric id never leaves
// the API boundary. Every endpoint folder is one REST interface.
export * from './shared';
export * from './create';
export * from './get';
export * from './list';
export * from './update';
export * from './members/list';
export * from './members/create';
export * from './members/delete';
