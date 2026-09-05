import type { LlmProviderIdParams } from '../shared';

// DELETE /llm/:id — params come from the shared base; the success response is
// the canonical accounts one (re-exported by the package root). This folder
// keeps the "one folder per endpoint" structure consistent.
export type DeleteLlmProviderParams = LlmProviderIdParams;
