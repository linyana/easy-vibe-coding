import { eq } from 'drizzle-orm';
import type { WorkspaceCreate } from '@easy-vibe-coding/shared';
import { db } from '../../db/client';
import { workspaces, workspaceMembers } from '../../db/schema';
import { isUniqueViolation } from '../../libs/dbError';
import { Errors } from '../../libs/error';

// User-facing workspace service — membership-scoped list + creation. The
// platform-level operations live in modules/admin/workspaces.
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
	// never exists without its creator as a member. The slug is the unique
	// user-facing identity; a collision is a 409, never an unhandled 500.
	async create({
		accountId,
		data,
	}: {
		accountId: number;
		data: WorkspaceCreate;
	}) {
		try {
			const workspace = await db.transaction(async (tx) => {
				const [row] = await tx
					.insert(workspaces)
					.values({ name: data.name, slug: data.slug })
					.returning();
				await tx.insert(workspaceMembers).values({
					workspaceId: row!.id,
					accountId,
					role: 'owner',
				});
				return row!;
			});
			return workspace;
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw Errors.conflict('This workspace slug is already taken');
			}
			throw error;
		}
	},
};
