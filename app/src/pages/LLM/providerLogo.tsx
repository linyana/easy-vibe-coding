import type { LlmPresetId } from '@easy-vibe-coding/shared';
import {
	siAnthropic,
	siDeepseek,
	siMistralai,
	siMinimax,
	siMoonshotai,
	siOpenrouter,
	siQwen,
} from 'simple-icons';
import { OPENAI_MARK } from './openaiMark';

// Supplier marks. simple-icons ships most built-in presets; OpenAI was removed
// from recent simple-icons releases, so its CC0 mark is vendored locally
// (openaiMark.ts). Presets without a mark (or any custom provider) render as
// a brand-colored initial instead — adding an icon = one entry here.
const PRESET_MARKS: Partial<
	Record<LlmPresetId, { path: string; hex: string }>
> = {
	anthropic: { path: siAnthropic.path, hex: siAnthropic.hex },
	openai: { path: OPENAI_MARK, hex: '#10a37f' },
	deepseek: { path: siDeepseek.path, hex: siDeepseek.hex },
	openrouter: { path: siOpenrouter.path, hex: siOpenrouter.hex },
	mistral: { path: siMistralai.path, hex: siMistralai.hex },
	moonshotai: { path: siMoonshotai.path, hex: siMoonshotai.hex },
	minimax: { path: siMinimax.path, hex: siMinimax.hex },
	qwen: { path: siQwen.path, hex: siQwen.hex },
};

// Brand-ish fallback colors for presets simple-icons doesn't cover.
const PRESET_COLORS: Record<LlmPresetId, string> = {
	anthropic: '#d97757',
	openai: '#10a37f',
	deepseek: '#4d6bfe',
	openrouter: '#e34b19',
	groq: '#f55036',
	xai: '#000000',
	mistral: '#ff7000',
	moonshotai: '#10a37f',
	together: '#7b3fe4',
	cerebras: '#1d64b2',
	zai: '#3859ff',
	minimax: '#4c46f6',
	qwen: '#6a5bff',
};

export function ProviderLogo({
	preset,
	name,
	className,
}: {
	preset?: LlmPresetId | null;
	name?: string;
	className?: string;
}) {
	const mark = preset ? PRESET_MARKS[preset] : undefined;
	if (mark) {
		return (
			<svg
				viewBox="0 0 24 24"
				role="img"
				aria-label={name ?? preset ?? 'provider'}
				className={className ?? 'size-4 shrink-0'}
			>
				<path d={mark.path} fill={mark.hex} />
			</svg>
		);
	}
	const label = (name ?? preset ?? '?').charAt(0).toUpperCase() || '?';
	const color = preset ? PRESET_COLORS[preset] : '#64748b';
	return (
		<span
			aria-hidden
			className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className ?? 'size-4'}`}
			style={{ backgroundColor: color, fontSize: 9 }}
		>
			{label}
		</span>
	);
}
