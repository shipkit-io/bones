import { routes } from "@/config/routes";
import Link from "next/link";

export const VercelDeployButton = () => {
	return (
		<Link href={routes.external.vercel} className="inline-block hover:opacity-80 transition-opacity duration-200">
			<img src="https://vercel.com/button" alt="Deploy to Vercel" width={103} height={32} />
		</Link>
	)
}
