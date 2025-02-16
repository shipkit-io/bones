import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { FC } from "react";

interface VercelDeployButtonProps {
	href?: string;
	className?: string;
}

export const VercelDeployButton: FC<VercelDeployButtonProps> = ({ href = routes.external.vercelDeployBones, className }) => {
	return (
		<Link
			href={href}
			className={cn(
				buttonVariants({ variant: "default", size: "lg" }),
				"group relative overflow-hidden transition-all duration-300 ease-out hover:bg-primary-foreground hover:text-primary",
				className
			)}
		>
			<span className="relative z-10 flex items-center justify-center gap-2">
				<VercelIcon className="h-5 w-5" />
				Deploy Now
			</span>
		</Link>
	);
};

const VercelIcon: FC<{ className?: string }> = ({ className }) => (
	<svg
		className={className}
		viewBox="0 0 76 65"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-label="Vercel Logo"
		role="img"
	>
		<path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor" />
	</svg>
);
