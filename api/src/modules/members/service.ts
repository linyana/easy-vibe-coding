import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { accounts, workspaceMembers, workspaces } from '../../db/schema';
import { Errors } from '../../libs/error';

export const memberService = {
	// Roster of the token's workspace. The workspaceSlug claim is the only
	// scope — there is no "members of another workspace" surface.
	async list(workspaceSlug: string | undefined) {
		if (workspaceSlug === undefined) {
			throw Errors.forbidden('This session is not scoped to a workspace');
		}
		const items = await db
			.select({
				id: accounts.id,
				name: accounts.name,
				email: accounts.email,
				role: workspaceMembers.role,
				joinedAt: workspaceMembers.createdAt,
			})
			.from(workspaceMembers)
			.innerJoin(
				workspaces,
				eq(workspaceMembers.workspaceId, workspaces.id),
			)
			.innerJoin(accounts, eq(workspaceMembers.accountId, accounts.id))
			.where(eq(workspaces.slug, workspaceSlug))
			.orderBy(accounts.id);
		return { items, total: items.length };
	},
};
