import { z } from 'zod';

/**
 * ═══ SETTINGS MODULE REGISTRY — day-to-day edits live here ═══
 *
 * One settings module = one zod schema + one defaults entry.
 * - Add a FIELD to a module: edit its schema and its defaults — done.
 * - Add a MODULE: declare the schema, register it in SETTING_MODULES, add its
 *   defaults, then add one union member in settingsPayloadSchema (plumbing).
 *
 * Configs are schemaless JSON in the DB; reads merge stored values over these
 * defaults (service-side), so schema evolution needs no migration.
 */

export const platformSettingsSchema = z.object({
	// When off, the user-facing workspace creation endpoint (POST /workspaces)
	// rejects — the same value the settings page shows is the one enforced.
	allowWorkspaceCreation: z.boolean(),
});
export type PlatformSettingsConfig = z.infer<typeof platformSettingsSchema>;

/** Registry of all settings modules — the single list of what exists. */
export const SETTING_MODULES = {
	platform: platformSettingsSchema,
} as const;

export type SettingsModule = keyof typeof SETTING_MODULES;

// Query-level module enum, derived from the registry (not a second list to
// keep in sync). Unknown module values fail validation with a 422.
export const settingsModuleSchema = z.enum(
	Object.keys(SETTING_MODULES) as [SettingsModule, ...SettingsModule[]],
);

export type SettingsConfig<M extends SettingsModule> = z.infer<
	(typeof SETTING_MODULES)[M]
>;

/** Init data — what the platform sees before this module is ever saved. */
export const DEFAULT_SETTINGS: {
	[M in SettingsModule]: SettingsConfig<M>;
} = {
	platform: { allowWorkspaceCreation: true },
};

/** The wire shape for both GET responses and PUT bodies — a union
 * discriminated by `module`, so Eden hands the frontend one union it can
 * narrow per module. */
export const settingsPayloadSchema = z.discriminatedUnion('module', [
	z.object({
		module: z.literal('platform'),
		config: platformSettingsSchema,
	}),
]);
export type SettingsPayload = z.infer<typeof settingsPayloadSchema>;
