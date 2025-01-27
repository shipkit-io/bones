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
		label: "CLI",
		href: "/cli",
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
		<div className="bg-gray-900 min-h-screen relative">
			<div className="flex flex-row flex-wrap items-center justify-center py-4">
				<VercelNavigation navLinks={navLinks} className="flex-1" />
			</div>
			{children}
		</div>
	);
}
