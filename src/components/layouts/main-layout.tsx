import type React from "react";
import { Footer } from "@/components/footers/footer";
import { Header } from "@/components/headers/header";
import { cn } from "@/lib/utils";

export default function MainLayout({
	children,
	className,
	header = <Header />,
	footer = <Footer />,
}: {
	children: React.ReactNode;
	header?: React.ReactNode;
	footer?: React.ReactNode;
	className?: string;
}) {
	return (
		<>
			<div className={cn("", className)}>
				{header}
				{children}
				{footer}
			</div>
		</>
	);
}
