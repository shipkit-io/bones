import { BoneIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-screen">
			<header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container flex h-16 items-center justify-between">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-2 transition-colors hover:opacity-80">
						<div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
							<BoneIcon className="h-4 w-4" />
						</div>
						<span className="font-semibold">Bones</span>
					</Link>
				</div>
			</header>
			<main className="container py-6">{children}</main>
		</div>
	);
}
