import type React from "react";
import { Header } from "@/components/headers/header";
import MainLayout from "@/components/layouts/main-layout";
import { auth } from "@/server/auth";

export default async function Layout({ children }: { children: React.ReactNode }) {
	const session = await auth();

	return (
		<MainLayout
			header={
				<Header
					user={session?.user}
					variant="floating"
					opaqueOnScroll={100}
					animatedCTAOnScroll={700}
					searchVariant="ai"
				/>
			}
		>
			{children}
		</MainLayout>
	);
}
