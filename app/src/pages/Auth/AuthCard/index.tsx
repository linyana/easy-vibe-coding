import type { ReactNode } from 'react';
import type { HeaderContentProps } from '@/components/data/Header';

interface AuthCardProps extends Pick<
	HeaderContentProps,
	'title' | 'description'
> {
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

export function AuthCard({
	title,
	description,
	footer,
	children,
}: AuthCardProps) {
	return (
		<div className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
			{/* Photo backdrop behind the card. Only lightly blurred — a heavy
			    blur blooms the image's bright areas into a white halo. */}
			<div
				aria-hidden
				className="fixed inset-0 -z-10 bg-cover bg-center blur-2xl brightness-80 dark:brightness-50"
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
					{children}
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
