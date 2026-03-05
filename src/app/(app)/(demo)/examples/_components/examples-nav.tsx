"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

const examples = [
	{
		name: "Mail",
		href: routes.examples.mail,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/mail",
		hidden: false,
	},
	{
		name: "Dashboard",
		href: routes.examples.dashboard,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/dashboard",
		hidden: false,
	},
	{
		name: "Tasks",
		href: routes.examples.tasks,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/tasks",
		hidden: false,
	},
	{
		name: "Playground",
		href: routes.examples.playground,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/playground",
		hidden: false,
	},
	{
		name: "Forms",
		href: routes.examples.forms,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/forms",
		hidden: false,
	},
	{
		name: "Music",
		href: routes.examples.music,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/music",
		hidden: false,
	},
	{
		name: "Authentication",
		href: routes.examples.authentication,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/authentication",
		hidden: false,
	},
];

interface ExamplesNavProps extends React.HTMLAttributes<HTMLDivElement> {
	current?: string;
}

export function ExamplesNav({ current, className, ...props }: ExamplesNavProps) {
	const pathname = usePathname();
	const isHome = pathname === routes.home;

	return (
		<div className="relative w-full">
			<ScrollArea className="max-w-[600px] lg:max-w-none mx-auto px-md [mask-image:linear-gradient(to_right,transparent,white_7%,white_93%,transparent)]">
				<div className={cn("flex items-center justify-center", className)} {...props}>
					{!isHome && (
						<ExampleLink
							href={routes.examples.index}
							example={{ name: "Examples", href: routes.examples.index, code: "", hidden: false }}
							isActive={pathname === routes.examples.index}
						/>
					)}
					{examples.map((example) => (
						<ExampleLink
							href={isHome ? `?example=${example.name}` : example?.href}
							key={example.href}
							example={example}
							isActive={pathname?.startsWith(example.href) || example.name === current}
						/>
					))}
				</div>
				<ScrollBar orientation="horizontal" className="invisible" />
			</ScrollArea>
		</div>
	);
}

function ExampleLink({
	example,
	isActive,
	href,
}: {
	example: (typeof examples)[number];
	isActive: boolean;
	href: string;
}) {
	if (example.hidden) {
		return null;
	}

	return (
		<Link
			replace
			scroll={false}
			suppressHydrationWarning
			href={href}
			key={example.href}
			className="flex h-7 items-center justify-center rounded-full px-4 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary data-[active=true]:bg-muted data-[active=true]:text-primary"
			data-active={isActive}
		>
			{example.name}
		</Link>
	);
}
