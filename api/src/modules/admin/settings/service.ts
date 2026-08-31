import { eq } from 'drizzle-orm';
import {
	DEFAULT_SETTINGS,
	type SettingsConfig,
	type SettingsModule,
	type SettingsPayload,
} from '@easy-vibe-coding/shared';
import { db } from '../../../db/client';
import { platformSettings } from '../../../db/schema';

/**
 * Overlay stored values onto the defaults, keeping only keys that exist in
 * the defaults with a matching type. Unknown/stale keys in the DB are
 * dropped; missing keys fall back to their default — so callers always
 * receive a complete, well-typed config even as the schema evolves.
 */
const mergeSettings = <T extends Record<string, unknown>>(
	defaults: T,
	stored: unknown,
): T => {
	if (typeof stored !== 'object' || stored === null) return defaults;
	const out = { ...defaults };
	for (const key of Object.keys(defaults) as (keyof T)[]) {
		const value = (stored as Record<string, unknown>)[key as string];
		if (value === undefined) continue;
		if (typeof value === typeof defaults[key]) {
			out[key] = value as T[keyof T];
		}
	}
	return out;
};

export const adminSettingsService = {
	/**
	 * THE single way to read a settings module — used by both the GET
	 * endpoint and any backend business logic, so the frontend always sees
	 * exactly what the backend acts on. Defaults are merged in, so a never-
	 * saved module still resolves to a complete config.
	 */
	async get<M extends SettingsModule>(module: M): Promise<SettingsPayload> {
		const rows = await db
			.select()
			.from(platformSettings)
			.where(eq(platformSettings.key, module))
			.limit(1);
		const config = mergeSettings(
			DEFAULT_SETTINGS[module] as Record<string, unknown>,
			rows[0]?.value,
		) as SettingsConfig<M>;
		return { module, config } as SettingsPayload;
	},

	async update(payload: SettingsPayload): Promise<SettingsPayload> {
		const { module, config } = payload;
		await db
			.insert(platformSettings)
			.values({ key: module, value: config })
			.onConflictDoUpdate({
				target: platformSettings.key,
				set: { value: config },
			});
		return this.get(module);
	},
};
