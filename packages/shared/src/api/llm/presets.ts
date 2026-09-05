import { z } from 'zod';

// The wire-protocol families (pi's `api` vocabulary): a provider row stores
// which family its baseUrl speaks, so a future pi-agent mapping knows exactly
// which adapter to use (anthropic-messages / openai-responses /
// openai-completions).
export const llmApiKinds = [
	'anthropic-messages',
	'openai-completions',
	'openai-responses',
] as const;
export const llmApiKindSchema = z.enum(llmApiKinds);
export type LlmApiKind = z.infer<typeof llmApiKindSchema>;

// Built-in supplier presets — pi's provider ids + official base urls (read
// from pi's provider factories). "Add a provider" here = one entry (name/api/
// baseUrl) + an icon map entry on the app side; anything else is a custom
// provider row (preset: null).
export const llmPresetIds = [
	'anthropic',
	'openai',
	'deepseek',
	'openrouter',
	'groq',
	'xai',
	'mistral',
	'moonshotai',
	'together',
	'cerebras',
	'zai',
	'minimax',
	'qwen',
] as const;
export const llmPresetIdSchema = z.enum(llmPresetIds);
export type LlmPresetId = z.infer<typeof llmPresetIdSchema>;

export interface LlmPreset {
	id: LlmPresetId;
	name: string;
	api: LlmApiKind;
	baseUrl: string;
}

// Official endpoints, matching pi's provider registry. openai-responses /
// openai-completions both expose GET {baseUrl}/models (live model fetch);
// anthropic-messages does not (models are typed manually).
export const LLM_PRESETS: LlmPreset[] = [
	{
		id: 'anthropic',
		name: 'Anthropic',
		api: 'anthropic-messages',
		baseUrl: 'https://api.anthropic.com',
	},
	{
		id: 'openai',
		name: 'OpenAI',
		api: 'openai-responses',
		baseUrl: 'https://api.openai.com/v1',
	},
	{
		id: 'deepseek',
		name: 'DeepSeek',
		api: 'openai-completions',
		baseUrl: 'https://api.deepseek.com',
	},
	{
		id: 'openrouter',
		name: 'OpenRouter',
		api: 'openai-completions',
		baseUrl: 'https://openrouter.ai/api/v1',
	},
	{
		id: 'groq',
		name: 'Groq',
		api: 'openai-completions',
		baseUrl: 'https://api.groq.com/openai/v1',
	},
	{
		id: 'xai',
		name: 'xAI',
		api: 'openai-responses',
		baseUrl: 'https://api.x.ai/v1',
	},
	{
		id: 'mistral',
		name: 'Mistral',
		api: 'openai-completions',
		baseUrl: 'https://api.mistral.ai/v1',
	},
	{
		id: 'moonshotai',
		name: 'Moonshot AI',
		api: 'openai-completions',
		baseUrl: 'https://api.moonshot.ai/v1',
	},
	{
		id: 'together',
		name: 'Together',
		api: 'openai-completions',
		baseUrl: 'https://api.together.ai/v1',
	},
	{
		id: 'cerebras',
		name: 'Cerebras',
		api: 'openai-completions',
		baseUrl: 'https://api.cerebras.ai/v1',
	},
	{
		id: 'zai',
		name: 'Zhipu AI',
		api: 'openai-completions',
		baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
	},
	{
		id: 'minimax',
		name: 'MiniMax',
		api: 'openai-completions',
		baseUrl: 'https://api.minimax.io/v1',
	},
	{
		id: 'qwen',
		name: 'Qwen',
		api: 'openai-completions',
		baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
	},
];

export const llmPresetByBaseUrl = (baseUrl: string) =>
	LLM_PRESETS.find((p) => p.baseUrl === baseUrl);

export const llmPresetById = (id: LlmPresetId) =>
	LLM_PRESETS.find((p) => p.id === id);
