import { Footer } from "@/components/footers/extended-footer";
import { Header } from "@/components/headers/extended-header";
import MainLayout from "@/components/layouts/main-layout";
import type React from "react";

export default function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <MainLayout header={<Header variant="floating" />} footer={<Footer />}>{children}</MainLayout>;
}
