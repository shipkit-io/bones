import { Suspense, type ReactNode } from "react";
import { DashboardHeader } from "@/components/blocks/dashboard-header";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { AppSidebar } from "@/components/modules/sidebar/app-sidebar";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { SidebarInset } from "@/components/ui/sidebar";

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
	return (
		<SidebarLayout>
			<div
				className="flex min-h-svh w-full flex-col"
				style={{ "--sidebar-top": "var(--header-height)" } as React.CSSProperties}
			>
				<Suspense fallback={<SuspenseFallback />}>
					<DashboardHeader />
				</Suspense>

				<div className="flex flex-1">
					<AppSidebar />
					<SidebarInset>
						<main className="flex flex-1 flex-col">{children}</main>
					</SidebarInset>
				</div>
			</div>
		</SidebarLayout>
	);
};
