import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type React from "react";

export const VercelDeployButton = (props: Omit<React.ComponentProps<typeof Link>, 'href'> & { href?: string }) => {
	return (
		<Link {...props} href={props.href ?? routes.external.vercelDeployShipkit} className={cn("inline-block hover:opacity-80 transition-opacity duration-200", props.className)}>
			<img src="https://vercel.com/button" alt="Deploy to Vercel" width={103} height={32} />
		</Link>
	)
}
