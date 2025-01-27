import { Logo } from "@/components/images/logo";
import { Link } from "@/components/primitives/link-with-transition";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { AuthForm } from "../_components/login-form";
import { SignUpForm } from "./_components/sign-up-form";

export default function SignUpPage() {
	return (
		<div className="flex w-full max-w-sm flex-col gap-6">
			<Link
				href={routes.home}
				className="flex items-center gap-2 self-center font-medium"
			>
				<div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
					<Logo />
				</div>
				{siteConfig.name}
			</Link>
			<AuthForm mode="sign-up">
				<SignUpForm />
			</AuthForm>
		</div>
	);
}
