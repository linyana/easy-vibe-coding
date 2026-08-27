import type { ReactNode } from 'react';
import { getIcon } from '@/libs/icons';
import { Form } from '@/components/form/Form';
import type { HeaderContentProps } from '@/components/data/Header';
import type { FormApi } from '@/hooks/useForm';

interface AuthCardProps<TValues extends object> extends HeaderContentProps {
	submitLabel?: string;
	form: FormApi<TValues>;
	footer?: ReactNode;
	children: ReactNode;
}

/** Optional hero photo: drop `hero.png` (or .jpg/.jpeg/.webp/.svg) into
 * `src/assets` and it's bundled and used automatically. Glob (not a static
 * import) so the photo is OPTIONAL — with no match the hero panel renders
 * without a background. */
const heroModules = import.meta.glob<string>(
	'/src/assets/hero.{png,jpg,jpeg,webp,svg}',
	{
		eager: true,
		query: '?url',
		import: 'default',
	},
);
const HERO_IMAGE = Object.values(heroModules)[0];
const HERO_LAYERS = HERO_IMAGE ? `url(${HERO_IMAGE})` : '';

export function AuthCard<TValues extends object>({
	icon,
	title,
	description,
	submitLabel = 'Submit',
	form,
	footer,
	children,
}: AuthCardProps<TValues>) {
	const Icon = icon ? getIcon(icon.name) : null;

	return (
		<div className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
			{/* Photo backdrop behind the card. Only lightly blurred — a heavy
			    blur blooms the image's bright areas into a white halo. */}
			<div
				aria-hidden
				className="fixed inset-0 -z-10 bg-cover bg-center blur-2xl brightness-90 dark:brightness-50"
				style={{ backgroundImage: HERO_LAYERS }}
			/>
			<div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-muted shadow-2xl md:grid-cols-2">
				<div className="hidden p-3 md:block">
					<div
						aria-hidden
						className="h-full min-h-[620px] rounded-2xl bg-cover bg-center"
						style={{ backgroundImage: HERO_LAYERS }}
					/>
				</div>
				<div className="flex flex-col justify-center p-6 sm:p-10 lg:px-12">
					{Icon && (
						<Icon className="mb-5 size-6" strokeWidth={2.25} />
					)}
					<div className="space-y-1.5">
						<h1 className="text-2xl font-bold tracking-tight">
							{title}
						</h1>
						{description && (
							<p className="text-sm text-muted-foreground">
								{description}
							</p>
						)}
					</div>
					<Form
						form={form}
						submitLabel={submitLabel}
						className="mt-6 space-y-4 [&_input]:h-10 [&_input]:bg-background [&_input]:shadow-sm"
						submitClassName="mt-2 h-10 text-sm"
					>
						{children}
					</Form>
					{footer && (
						<p className="mt-6 text-center text-sm text-muted-foreground">
							{footer}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
