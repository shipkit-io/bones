import { SignUpForm } from "@/app/(app)/(authentication)/sign-up/_components/sign-up-form";
import { Link } from "@/components/primitives/link";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import { routes } from "@/config/routes";
import { AuthenticationCard } from "../../_components/authentication-card";

export function SignUpCard() {
	return (
		<>
			<AuthenticationCard>
				<CardHeader>
					<CardTitle className="text-xl">Sign Up</CardTitle>
					<CardDescription>
						Enter your information to create an account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4">
						<SignUpForm />
						{/* <OAuthButtons /> */}
					</div>
					<div className="mt-4 text-center text-sm">
						Already have an account?{" "}
						<Link href={routes.auth.signIn} className="underline">
							Sign in
						</Link>
					</div>
				</CardContent>
			</AuthenticationCard>
		</>
	);
}
