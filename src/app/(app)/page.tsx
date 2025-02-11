import { DeployToVercelButton } from "@/components/buttons/vercel-deploy-button-2";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderHeading,
} from "@/components/primitives/page-header";
import { Attribution } from "@/components/ui/attribution";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import { IconBrandGithub } from "@tabler/icons-react";
import { Barrio, Stick } from "next/font/google";
import Link from "next/link";

const fontStick = Stick({
	weight: ["400"],
	style: ["normal"],
	subsets: ["latin"],
	variable: "--font-stick",
});

const fontBarrio = Barrio({
	weight: ["400"],
	style: ["normal"],
	subsets: ["latin"],
	variable: "--font-barrio",
});

export default function Page() {
	return (
		<>
			<div className="container flex flex-col items-center justify-start gap-2xl p-16 text-center">
				<PageHeader className="flex flex-col items-center justify-center">
					<PageHeaderHeading
						className={cn(
							"font-bold md:text-[8rem]",
							Math.random() > 0.5 ? fontBarrio.className : fontStick.className
						)}
					>
						Bones
					</PageHeaderHeading>
					<PageHeaderDescription className="text-xl">
						The Next.js stack for Shadcn/UI.
					</PageHeaderDescription>
					<PageHeaderDescription className="text-lg text-muted-foreground">
						Next.js v15, Tailwind CSS v4, Auth.JS v5, and a built-in interface for installing UI
						components.
					</PageHeaderDescription>
				</PageHeader>

				<div className="mb-10 flex flex-col gap-md md:flex-row">
					<Link
						href={"https://github.com/shipkit-io/bones"}
						className={buttonVariants({ variant: "outline", size: "lg" })}
					>
						<IconBrandGithub className="mr-2 h-5 w-5" /> View on GitHub
					</Link>
					<DeployToVercelButton href={routes.external.vercelDeployBones} />
				</div>

				<div className="mt-auto flex flex-col items-center gap-md text-sm md:flex-row">
					<Link
						href={"https://log.bones.sh"}
						className={buttonVariants({ variant: "link", size: "sm" })}
					>
						See user errors in real-time with Bones Log
					</Link>
				</div>
			</div>
			<Attribution
				variant="popover"
				title="Built with Shipkit"
				description="The best way to build with Shadcn/UI."
				href="https://shipkit.io"
			/>
		</>
	);
}
