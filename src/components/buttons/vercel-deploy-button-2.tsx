import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { FC } from "react";

interface DeployToVercelButtonProps {
	href: string;
	className?: string;
}

export const DeployToVercelButton: FC<DeployToVercelButtonProps> = ({ href, className }) => {
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
				Deploy to Vercel
			</span>
			{/* <span className="absolute inset-0 z-0 bg-gradient-to-r from-black to-gray-800 transition-all duration-300 ease-out group-hover:scale-105" /> */}
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
