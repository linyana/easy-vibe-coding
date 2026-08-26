import * as React from 'react';

// The dots-ring loading indicator. Pure CSS (keyframes in main.css);
// `role="status"` + visually hidden label announce to screen readers; color
// follows currentColor (adapts to themes); the box is its own size
// container, so dots scale via container-query units.
type DotsRingProps = React.ComponentProps<'span'> & {
	/** Number of dots around the ring (min 4). */
	dots?: number;
	/** Dot diameter as a fraction of the box. */
	dotScale?: number;
	/** Ring radius (dot centers) as a fraction of the box. */
	radiusScale?: number;
	size?: number;
};

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function DotsRingLoading({
	className,
	style,
	dots = 8,
	dotScale = 0.16,
	radiusScale = 0.34,
	size = 32,
	...props
}: DotsRingProps) {
	const dotCount = Math.max(4, Math.floor(dots));
	const safeDotScale = clamp(dotScale, 0.2, 0.4);
	const safeRadiusScale = clamp(radiusScale, 0, 0.5 - safeDotScale / 2);

	return (
		<span
			role="status"
			className={className}
			style={{
				containerType: 'size',
				position: 'relative',
				display: 'inline-flex',
				width: size,
				height: size,
				alignItems: 'center',
				justifyContent: 'center',
				...style,
			}}
			{...props}
		>
			<span
				aria-hidden="true"
				style={{
					position: 'relative',
					display: 'block',
					width: '100%',
					height: '100%',
				}}
			>
				{Array.from({ length: dotCount }, (_, index) => {
					const angle = (index / dotCount) * Math.PI * 2;
					const x = `${(Math.sin(angle) * safeRadiusScale * 100).toFixed(2)}cqmin`;
					const y = `${(-Math.cos(angle) * safeRadiusScale * 100).toFixed(2)}cqmin`;
					return (
						<span
							key={index}
							style={{
								position: 'absolute',
								top: '50%',
								left: '50%',
								width: `calc(${safeDotScale} * 100cqmin)`,
								height: `calc(${safeDotScale} * 100cqmin)`,
								transform: `translate(-50%, -50%) translate(${x}, ${y})`,
							}}
						>
							<span
								style={{
									display: 'block',
									width: '100%',
									height: '100%',
									borderRadius: '9999px',
									backgroundColor: 'currentColor',
									animation:
										'spinner-dot-pulse var(--duration, 1s) linear infinite',
									animationDelay: `calc(var(--duration, 1s) / ${dotCount} * ${index - dotCount})`,
								}}
							/>
						</span>
					);
				})}
			</span>
			<span
				style={{
					position: 'absolute',
					width: '1px',
					height: '1px',
					padding: 0,
					margin: '-1px',
					overflow: 'hidden',
					clip: 'rect(0, 0, 0, 0)',
					whiteSpace: 'nowrap',
					borderWidth: 0,
				}}
			>
				Loading
			</span>
		</span>
	);
}
