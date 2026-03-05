import type { ReactNode } from "react";
import { Header } from "@/components/headers/header";
import { routes } from "@/config/routes";

const navLinks = [
	{ href: routes.home, label: "Home" },
	{ href: routes.privacy, label: "Privacy" },
	{ href: routes.terms, label: "Terms" },
	{ href: routes.eula, label: "EULA" },
	{ href: routes.legal, label: "Legal" },
];

interface DocsLayoutProps {
	children: ReactNode;
}

export default async function DocsLayout({ children }: DocsLayoutProps) {
	return (
		<>
			<Header navLinks={navLinks} />

			{/* Content */}
			{children}
		</>
	);
}
