import type { API, UseAPIItem } from '@/libs/api';

// Entity type flows from Eden (derived off the shared list schema) — never
// hand-mirrored. One LlmProvider = one saved credential row.
export type LlmProvider = UseAPIItem<typeof API.llm.get>;

// The LLM section's action vocabulary — a new behavior = a new union member,
// never a new prop.
export type LlmProvidersAction =
	| { kind: 'create' }
	| { kind: 'edit'; provider: LlmProvider }
	| { kind: 'delete'; provider: LlmProvider };
