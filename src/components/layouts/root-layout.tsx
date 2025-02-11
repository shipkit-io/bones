import "@/styles/globals.css";
import Head from "next/head";

import { Space_Grotesk as FontSans, Noto_Serif as FontSerif } from "next/font/google";

import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCReactProvider } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import HolyLoader from "holy-loader";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ViewTransitions } from "next-view-transitions";
import type { ReactNode } from "react";
import { PageTracker } from "react-page-tracker";
import { WebVitals } from "../primitives/web-vitals";

const fontSerif = FontSerif({
	weight: ["400", "500", "600", "700"],
	style: ["normal", "italic"],
	subsets: ["latin"],
	variable: "--font-serif",
});

const fontSans = FontSans({
	display: "swap",
	subsets: ["latin"],
	variable: "--font-sans",
});

export function RootLayout({ children }: { children: ReactNode }) {
	return (
		<ViewTransitions>
			<Head>
				{/* React Scan */}
				<script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
			</Head>
			<html lang="en" suppressHydrationWarning>
				<body
					className={cn(
						"min-h-screen antialiased",
						"font-sans font-normal leading-relaxed",
						fontSans.variable,
						fontSerif.variable
					)}
				>
					<HolyLoader
						showSpinner
						height={"3px"}
						color={"linear-gradient(90deg, #FF61D8, #8C52FF, #5CE1E6, #FF61D8)"}
					/>
					<PageTracker />
					<SessionProvider>
						<TRPCReactProvider>
							<ThemeProvider attribute="class" defaultTheme="dark">
								<TooltipProvider delayDuration={100}>
									{/* Web Vitals - Above children to avoid blocking */}
									<WebVitals />

									{children}

									{/* Toasts */}
									<Toaster />
									<SonnerToaster />
								</TooltipProvider>
							</ThemeProvider>
						</TRPCReactProvider>
					</SessionProvider>
				</body>
			</html>
		</ViewTransitions>
	);
}
