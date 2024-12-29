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
	header?: React.ReactNode;
	footer?: React.ReactNode;
	className?: string;
}) {
	return (
		<>
			<div className={cn("flex min-h-screen flex-col", className)}>
				{header || <Header />}
				<main className="grid grow">{children}</main>
				{footer || <Footer />}
			</div>
		</>
	);
}
