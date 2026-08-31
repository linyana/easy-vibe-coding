import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { accounts, workspaceMembers } from '../../db/schema';

export const memberService = {
	// Roster of the token's workspace — the controller's role guard
	// (`role: ['owner', 'member']`) resolved slug → workspaceId and re-checked
	// membership, so this service only filters by id; there is no "members of
	// another workspace" surface.
	async list(workspaceId: number) {
		const items = await db
			.select({
				id: accounts.id,
				name: accounts.name,
				email: accounts.email,
				role: workspaceMembers.role,
				joinedAt: workspaceMembers.createdAt,
			})
			.from(workspaceMembers)
			.innerJoin(accounts, eq(workspaceMembers.accountId, accounts.id))
			.where(eq(workspaceMembers.workspaceId, workspaceId))
			.orderBy(accounts.id);
		return { items, total: items.length };
	},
};
