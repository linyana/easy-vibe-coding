import { Elysia } from 'elysia';
import { authGuard } from './auth';
import { workspaceGuard } from './workspace';
import { roleGuard } from './role';

export * from './auth';
export * from './workspace';
export * from './role';

// The composed guard — one entry carrying all four macros (auth, admin,
// workspace, role). Controllers `.use(guards)`; the split modules stay
// self-contained and composable (workspace builds on auth, role on workspace).
export const guards = new Elysia({ name: 'libs/guards' })
	.use(authGuard)
	.use(workspaceGuard)
	.use(roleGuard);
