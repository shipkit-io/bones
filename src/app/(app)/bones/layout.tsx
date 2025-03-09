import { VercelNavigation } from "@/components/ui/vercel-navigation";
import { BoneIcon } from "lucide-react";
import type React from "react";
const navLinks = [
	{
		label: (
			<>
				<BoneIcon className="h-4 w-4" />
			</>
		),
		href: "/",
	},
	{
		label: "UI",
		href: "https://uibrary.com",
	},
	{
		label: "CLI",
		href: "https://bones.sh/cli",
	},
	{
		label: "Log",
		href: "https://log.bones.sh",
	},
	{
		label: "Shipkit",
		href: "https://shipkit.io",
	},
];

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-screen dark:bg-gray-900">
			<div className="flex flex-row flex-wrap items-center justify-center py-4">
				<VercelNavigation navLinks={navLinks} className="" />
			</div>
			{children}
		</div>
	);
}
