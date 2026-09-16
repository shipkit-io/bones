import { Footer } from "@/components/footers/footer";
import { Header } from "@/components/headers/header";
import { cn } from "@/lib/utils";
import type React from "react";

export default function MainLayout({
	children,
	className,
	header,
	footer,
}: {
	children: React.ReactNode;
	header?: React.ReactNode | null;
	footer?: React.ReactNode | null;
	className?: string;
}) {
	return (
		<>
			<div className={cn("", className)}>
				{header === undefined ? <Header /> : header}
				{children}
				{footer === undefined ? <Footer /> : footer}
			</div>
		</>
	);
}
