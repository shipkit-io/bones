import { AppSidebar } from "@/components/blocks/app-sidebar";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { getTeamData } from "@/components/providers/team-data";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { routes } from "@/config/routes";
import { auth } from "@/server/auth";
import { SidebarCloseIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";

export default async function Layout({
	children,
}: {
	children: ReactNode;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect(routes.auth.signIn);
	}

	const teams = await getTeamData();

	return (
		<SidebarLayout initialTeams={teams}>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1">
							<SidebarCloseIcon />
						</SidebarTrigger>
						<Separator orientation="vertical" className="mr-2 h-4" />
						<BreadcrumbNav
							pathLabels={{
								[routes.app.dashboard]: "Dashboard",
								[routes.app.apiKeys]: "API Keys",
								[routes.app.settings]: "Settings",
								[routes.app.tools]: "Tools",
							}}
						/>
					</div>
				</header>
				<main className="flex-1">{children}</main>
			</SidebarInset>
		</SidebarLayout>
	);
}
