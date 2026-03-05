"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { routes } from "@/config/routes";

interface BreadcrumbNavProps {
	homeLabel?: string;
	/**
	 * Custom labels for specific paths
	 * e.g. { [routes.app.projects]: "All Projects" }
	 */
	pathLabels?: Record<string, string>;
	items?: { title: string; href: string }[];
}

export const BreadcrumbNav = ({ homeLabel = "Home", items = [] }: BreadcrumbNavProps) => {
	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink href={routes.app.dashboard}>{homeLabel}</BreadcrumbLink>
				</BreadcrumbItem>
				{items.map((item, index) => {
					const isLastItem = index === items.length - 1;
					return (
						<BreadcrumbItem key={item.title}>
							<BreadcrumbSeparator />
							{isLastItem ? (
								<span className="font-medium text-foreground">{item.title}</span>
							) : (
								<BreadcrumbLink href={item.href}>{item.title}</BreadcrumbLink>
							)}
						</BreadcrumbItem>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
};
