import type { ComponentProps } from "react";
import { Link } from "@/components/primitives/link";
import { cn } from "@/lib/utils";

interface NavLinkProps extends ComponentProps<typeof Link> {
	active?: boolean;
	icon?: React.ReactNode;
	children: React.ReactNode;
}

export const NavLink = ({ active = false, className, icon, children, ...props }: NavLinkProps) => {
	return (
		<Link
			className={cn(
				"flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
				"hover:bg-accent hover:text-accent-foreground",
				active && "bg-accent text-accent-foreground",
				className
			)}
			{...props}
		>
			{icon && <span className="h-4 w-4">{icon}</span>}
			{children}
		</Link>
	);
};
