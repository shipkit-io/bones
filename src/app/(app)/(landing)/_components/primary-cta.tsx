import { RainbowButton } from "@/components/ui/rainbow-button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { BoxesIcon } from "lucide-react";

export default function PrimaryCta() {
	return (
		<RainbowButton className="flex items-center gap-2" href={routes.launch}>
			<BoxesIcon className="size-5" /> Get {siteConfig.name}
		</RainbowButton>
	);
}
