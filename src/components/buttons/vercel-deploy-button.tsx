import Link from "next/link";
import type { FC } from "react";
import { Icons } from "@/components/assets/icons";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";

interface VercelDeployButtonProps {
	href?: string;
	className?: string;
}

export const VercelDeployButton: FC<VercelDeployButtonProps> = ({ href, className }) => {
	const deployUrl =
		href ||
		(routes.external as any)?.vercelDeploy?.({
			repositoryUrl: `https://github.com/${siteConfig.repo.owner}/${siteConfig.repo.name}`,
			projectName: siteConfig.branding.vercelProjectName,
			repositoryName: siteConfig.branding.vercelProjectName,
			env: ["ADMIN_EMAIL"],
		});
	return (
		<Link
			target="_blank"
			href={deployUrl}
			className={cn(
				buttonVariants({ variant: "default", size: "lg" }),
				"group relative overflow-hidden transition-all duration-300 ease-out hover:bg-primary-foreground hover:text-primary",
				className
			)}
		>
			<span className="relative z-10 flex items-center justify-center gap-2">
				<Icons.vercel className="h-5 w-5" />
				Deploy Now
			</span>
		</Link>
	);
};
