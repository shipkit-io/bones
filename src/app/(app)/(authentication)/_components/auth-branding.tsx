import { ArrowLeft } from "lucide-react";
import { Icon } from "@/components/assets/icon";
import { Link } from "@/components/primitives/link";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";

export const AuthBranding = () => {
	return (
		<div className="flex w-full items-center justify-between">
			<Link
				href={routes.home}
				className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
				aria-label="Go back home"
			>
				<ArrowLeft className="h-4 w-4" />
			</Link>
			<Link href={routes.home} className="flex items-center gap-2 font-medium">
				<div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
					<Icon />
				</div>
				{siteConfig.title}
			</Link>
			{/* Empty div to balance the layout */}
			<div className="w-8" />
		</div>
	);
};
