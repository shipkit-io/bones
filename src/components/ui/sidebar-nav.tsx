"use client";

import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Link } from "@/components/primitives/link";
import { cn } from "@/lib/utils";

interface NavItem {
	href: string;
	title: string;
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
	items: NavItem[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
	const pathname = usePathname();
	return (
		<nav
			className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)}
			{...props}
		>
			{items.map((item) => (
				<Link
					key={item.href}
					href={item.href}
					className={cn(
						"justify-start rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
						pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
					)}
				>
					{item.title}
					{/* Todo: Add link status dot */}
					{/* <LinkStatusDot /> */}
				</Link>
			))}
		</nav>
	);
}

function LinkStatusDot() {
	const { pending } = useLinkStatus();

	if (pending) {
		return <div className="w-2 h-2 bg-green-500 rounded-full" />;
	}

	return null;
}
