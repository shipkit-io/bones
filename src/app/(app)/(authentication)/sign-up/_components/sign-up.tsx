import { AuthForm } from "@/app/(app)/(authentication)/_components/auth-form";
import { env } from "@/env";
import { SignUpForm } from "./sign-up-form";

export const SignUp = () => {
	return (
		<>
			<AuthForm
				mode="sign-up"
				title="Create an account"
				description="Sign up to get started"
			>
				{env.NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED && <SignUpForm />}
			</AuthForm>
		</>
	);
};
