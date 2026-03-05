import type { ReactNode } from "react";
import { ThemeProvider as ShipkitThemeProvider } from "@/components/ui/shipkit/theme";

/**
 * Simple layout wrapper for Pages Router pages
 */
export const PagesRouterLayout = ({
	children,
}: {
	children: ReactNode;
	hideHeader?: boolean;
	hideFooter?: boolean;
}) => {
	return (
		<>
			<ShipkitThemeProvider>
				<div className="flex min-h-screen flex-col py-10">
					<main className="flex-1">{children}</main>
				</div>
			</ShipkitThemeProvider>
		</>
	);
};
