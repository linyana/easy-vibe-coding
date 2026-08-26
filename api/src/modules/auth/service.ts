import { eq } from 'drizzle-orm';
import type {
	AuthLogin,
	AuthRegister,
	AuthResponse,
	UserResponse,
} from '@easy-vibe-coding/shared';
import { db } from '../../db/client';
import { users, type User } from '../../db/schema';
import { signAuthToken } from '../../libs/auth';
import { isUniqueViolation } from '../../libs/dbError';
import { normalizeEmail } from '../../libs/email';
import { Errors } from '../../libs/error';

// Explicitly picked so passwordHash never crosses the wire (matches userResponseSchema).
const pickUser = (user: User): UserResponse => ({
	id: user.id,
	name: user.name,
	email: user.email,
	createdAt: user.createdAt,
	updatedAt: user.updatedAt,
});

// citext makes eq case-insensitive (same semantics as the unique constraint);
// the catch below guards races. normalizeEmail (libs/email) keeps stored data uniform.
export const authService = {
	async register(data: AuthRegister): Promise<AuthResponse> {
		const email = normalizeEmail(data.email);

		const existing = await db.query.users.findFirst({
			where: eq(users.email, email),
			columns: { id: true },
		});
		if (existing) throw Errors.conflict('This email is already registered');

		// argon2id via Bun's built-in hashing — zero-dep, and the hash embeds its parameters.
		const passwordHash = await Bun.password.hash(data.password);

		try {
			const [row] = await db
				.insert(users)
				.values({ name: data.name, email, passwordHash })
				.returning();
			const user = pickUser(row!);
			return { token: await signAuthToken(user), user };
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw Errors.conflict('This email is already registered');
			}
			throw error;
		}
	},

	async login(data: AuthLogin): Promise<AuthResponse> {
		const email = normalizeEmail(data.email);
		const user = await db.query.users.findFirst({
			where: eq(users.email, email),
		});

		// One message for every failure — never reveal whether the email exists.
		// Users without a password hash fail the same way.
		const invalid = () => Errors.unauthorized('Invalid email or password');

		if (!user || !user.passwordHash) throw invalid();
		const matches = await Bun.password.verify(
			data.password,
			user.passwordHash,
		);
		if (!matches) throw invalid();

		const publicUser = pickUser(user);
		return { token: await signAuthToken(publicUser), user: publicUser };
	},

	// Guard already verified the token; re-read the row so renames apply immediately.
	async me(userId: number): Promise<UserResponse> {
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});
		if (!user) {
			throw Errors.unauthorized('This account no longer exists');
		}
		return pickUser(user);
	},
};
