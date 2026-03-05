import Link from "next/link";
import { CardFooter } from "@/components/ui/card";
import { routes } from "@/config/routes";

export function AuthFooter() {
	return (
		<CardFooter>
			<div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
				By signing up, you agree to our <Link href={routes.terms}>Terms of Service</Link> and{" "}
				<Link href={routes.privacy}>Privacy Policy</Link>.
			</div>
		</CardFooter>
	);
}
