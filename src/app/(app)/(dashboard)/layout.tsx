import { type ReactNode, Suspense } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { routes } from "@/config/routes";
import { auth } from "@/server/auth";

export default async function Layout({ children }: { children: ReactNode }) {
	return (
		<DashboardLayout>
			<Suspense fallback={<SuspenseFallback />}>{children}</Suspense>
		</DashboardLayout>
	);
}
