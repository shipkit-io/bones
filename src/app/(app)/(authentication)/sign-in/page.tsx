import { Logo } from "@/components/images/logo";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { AuthForm } from "../_components/login-form";
import { SignInForm } from "./_components/sign-in-form";

export default function SignInPage() {
	return (
		<div className="flex w-full max-w-sm flex-col gap-6">
			<Link href={routes.home} className="flex items-center gap-2 self-center font-medium">
				<div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
					<Logo />
				</div>
				{siteConfig.name}
			</Link>
			<AuthForm mode="sign-in">
				<SignInForm />
			</AuthForm>
		</div>
	);
}
