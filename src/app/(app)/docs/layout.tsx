import type { ReactNode } from "react";
import { Header } from "@/components/headers/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getDocsNavigation } from "@/lib/docs";
import { DocsSidebar } from "./_components/docs-sidebar";
import "./styles.css";
import { routes } from "@/config/routes";

interface DocsLayoutProps {
	children: ReactNode;
}

export default async function DocsLayout({ children }: DocsLayoutProps) {
	const navigation = await getDocsNavigation();
	const navLinks = [
		{ href: routes.docs, label: "Docs" },
		{ href: routes.features, label: "Features" },
		{ href: routes.pricing, label: "Pricing" },
	];

	return (
		<>
			<Header navLinks={navLinks} variant="sticky" />
			<div className="flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)_220px] lg:grid-cols-[256px_minmax(0,1fr)_256px]">
				{/* Sidebar */}
				<aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
					<ScrollArea className="h-full py-6">
						<div className="pl-8 pr-6 lg:pl-10">
							<DocsSidebar navigation={navigation} />
						</div>
					</ScrollArea>
				</aside>

				{/* Main content */}
				<main className="relative py-6 lg:py-8 container mx-auto w-full min-w-0">
					{/* Content */}
					{children}
				</main>
			</div>
		</>
	);
}
