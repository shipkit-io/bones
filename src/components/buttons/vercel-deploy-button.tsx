import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type React from "react";
import Image from "next/image";

export const VercelDeployButton = (
	props: Omit<React.ComponentProps<typeof Link>, "href"> & { href?: string }
) => {
	return (
		<Link
			{...props}
			href={props.href ?? routes.external.vercelDeployShipkit}
			className={cn(
				"inline-block hover:opacity-80 transition-opacity duration-200",
				props.className
			)}
		>
			<Image
				src="https://vercel.com/button"
				alt="Deploy with Vercel"
				width={92}
				height={32}
			/>
		</Link>
	);
};
