import { SidebarProvider } from "@/components/ui/sidebar";

interface SidebarLayoutProps {
	children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
	return (
		<>
			<SidebarProvider>{children}</SidebarProvider>
		</>
	);
}
