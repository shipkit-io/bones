import AvatarCircles from "@/components/ui/avatar-circles";
import { Star } from "lucide-react";
const avatarUrls = [
	"https://avatars.githubusercontent.com/u/7819639", // @jhenly
	"https://avatars.githubusercontent.com/u/1311301", // @lacymorrow
	"https://avatars.githubusercontent.com/u/5619728", // @tedtoy
	"https://avatars.githubusercontent.com/u/124599", // @shadcn
	"https://avatars.githubusercontent.com/u/20110627", // @lacymorrow
];

export const CustomerAvatars = () => {
	return (
		<div className="flex flex-col items-center justify-around gap-2 md:flex-row">
			<AvatarCircles numPeople={99} avatarUrls={avatarUrls} />
			<div className="flex flex-col items-center justify-between gap-1.5">
				<div className="flex text-yellow-400">
					<Star className="h-4 w-4 fill-current" />
					<Star className="h-4 w-4 fill-current" />
					<Star className="h-4 w-4 fill-current" />
					<Star className="h-4 w-4 fill-current" />
					<Star className="h-4 w-4 fill-current" />
				</div>
				<div className="flex flex-col">
					<span className="text-xs font-medium text-muted-foreground">
						4.8/5
					</span>
				</div>
			</div>
		</div>
	);
};
