import { eq } from 'drizzle-orm';
import type { WorkspaceCreate } from '@easy-vibe-coding/shared';
import { db } from '../../db/client';
import { workspaces, workspaceMembers } from '../../db/schema';

export const workspaceService = {
	// The account's workspaces — via membership join, never a global list.
	// Membership is the only scope; there is no "all workspaces" surface.
	async list(accountId: number) {
		const rows = await db
			.select({ workspace: workspaces })
			.from(workspaceMembers)
			.innerJoin(
				workspaces,
				eq(workspaceMembers.workspaceId, workspaces.id),
			)
			.where(eq(workspaceMembers.accountId, accountId))
			.orderBy(workspaces.id);
		return { items: rows.map((row) => row.workspace), total: rows.length };
	},

	// Workspace + owner membership commit in one transaction — a workspace
	// never exists without its creator as a member.
	async create({
		accountId,
		data,
	}: {
		accountId: number;
		data: WorkspaceCreate;
	}) {
		const workspace = await db.transaction(async (tx) => {
			const [row] = await tx
				.insert(workspaces)
				.values({ name: data.name })
				.returning();
			await tx.insert(workspaceMembers).values({
				workspaceId: row!.id,
				accountId,
				role: 'owner',
			});
			return row!;
		});
		return workspace;
	},
};
