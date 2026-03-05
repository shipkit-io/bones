import { Icon } from "@/components/assets/icon";
import { siteConfig } from "@/config/site-config";
export const Logo = (props: React.ComponentProps<typeof Icon>) => {
	return (
		<div className="flex items-center gap-2 text-2xl font-bold">
			<Icon {...props} /> {siteConfig.title}
		</div>
	);
};
