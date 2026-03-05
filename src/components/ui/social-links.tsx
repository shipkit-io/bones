import {
	Dribbble,
	Facebook,
	Github,
	Globe,
	Instagram,
	Linkedin,
	MessageCircle,
	Twitter,
	Youtube,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Link } from "@/components/primitives/link";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";

export type SocialPlatform =
	| "github"
	| "twitter"
	| "x"
	| "linkedin"
	| "instagram"
	| "facebook"
	| "youtube"
	| "tiktok"
	| "discord"
	| "dribbble"
	| "threads";

interface SocialLinksProps {
	platforms?: SocialPlatform[];
	className?: string;
	iconClassName?: string;
	labelled?: boolean;
}

const platformIcon: Record<SocialPlatform, ComponentType<SVGProps<SVGSVGElement>>> = {
	github: Github,
	twitter: Twitter,
	x: Twitter,
	linkedin: Linkedin,
	instagram: Instagram,
	facebook: Facebook,
	youtube: Youtube,
	tiktok: Globe,
	discord: MessageCircle,
	dribbble: Dribbble,
	threads: Globe,
};

function getEnabled(
	platforms?: SocialPlatform[]
): Array<{ platform: SocialPlatform; url: string }> {
	const entries = Object.entries(siteConfig.social ?? {}) as Array<
		[SocialPlatform, string | undefined]
	>;
	const filtered = entries
		.filter(([, url]) => typeof url === "string" && url.trim().length > 0)
		.map(([platform, url]) => ({ platform, url: url as string }));
	if (!platforms || platforms.length === 0) return filtered;
	const allowed = new Set(platforms);
	return filtered.filter(({ platform }) => allowed.has(platform));
}

export const SocialLinks = ({
	platforms,
	className,
	iconClassName,
	labelled = false,
}: SocialLinksProps) => {
	const items = getEnabled(platforms);
	if (items.length === 0) return null;

	return (
		<nav
			aria-label="Social links"
			className={cn(
				"flex items-center",
				labelled ? "flex-col items-start gap-2" : "flex-wrap gap-4",
				className
			)}
		>
			{items.map(({ platform, url }) => {
				const Icon = platformIcon[platform] ?? Globe;
				const label = platform.charAt(0).toUpperCase() + platform.slice(1);
				return (
					<Link
						key={platform}
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={labelled ? undefined : label}
						className={cn(
							"inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
						)}
					>
						<Icon className={cn("h-5 w-5", iconClassName)} />
						{labelled && <span>{label}</span>}
					</Link>
				);
			})}
		</nav>
	);
};
