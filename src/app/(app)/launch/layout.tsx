import { Header } from "@/components/headers/header";
import MainLayout from "@/components/layouts/main-layout";
import type React from "react";

export default function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <MainLayout header={<Header variant="sticky" />}>{children}</MainLayout>;
}
