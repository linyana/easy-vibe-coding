import { Avatar, AvatarImage } from '@/components/ui/avatar';
import logo from '@/assets/logo/logo.png';

export const Banner = () => {
	return (
		<div className="flex items-center justify-center">
			<div className="flex items-center gap-2">
				<Avatar className="w-7 h-7">
					<AvatarImage src={logo} alt="@logo" />
				</Avatar>
				<span className="text-base font-semibold">
					Easy Vibe Coding
				</span>
			</div>
		</div>
	);
};
