import { OAuthButtons } from "@/app/(app)/(authentication)/_components/oauth-buttons";
import { SignInEmailForm } from "@/app/(app)/(authentication)/sign-in/_components/sign-in-email-form";
import { Link } from "@/components/primitives/link";
import { Separator } from "@/components/ui/separator";
import { routes } from "@/config/routes";
import { providerMap } from "@/server/auth.providers";

export const SignInForm = () => {
	const providers = Object.keys(providerMap);
	const hasCredentials = providers.includes("credentials");
	const hasOtherProviders =
		providers.length > 1 || (providers.length === 1 && !hasCredentials);
	const isSignUpActive = false; // TODO: Implement sign up
	return (
		<main className="flex items-center justify-center p-md">
			<div className="mx-auto grid w-[350px] gap-lg">
				<div className="grid gap-sm text-center">
					<h1 className="text-2xl font-bold">Sign In</h1>
					<p className="text-sm text-muted-foreground">
						Sign up or sign in to your account to continue.
					</p>
				</div>
				<div className="grid gap-md">
					{hasCredentials && <SignInEmailForm />}
					{hasCredentials && hasOtherProviders && <Separator />}
					{hasOtherProviders && (
						<>
							<OAuthButtons />
						</>
					)}
				</div>
				{isSignUpActive && (
					<div className="mt-4 text-center text-sm">
						Don&apos;t have an account?{" "}
						<Link href={routes.auth.signUp} className="underline">
							Sign up
						</Link>
					</div>
				)}
			</div>
		</main>
	);
};
