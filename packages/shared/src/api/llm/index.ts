// Every REST endpoint gets a folder; the resource index re-exports them all.
// Vocab/registry (presets, api kinds) lives in ./presets — shared by both
// sides so "add a provider" is one entry, never a mirrored rule.
export * from './presets';
export * from './shared';
export * from './list';
export * from './create';
export * from './edit';
export * from './delete';
export * from './selection';
export * from './models';
