import { AuthForm } from "@/app/(app)/(authentication)/_components/auth-form";
import { Divider } from "@/components/primitives/divider";
import { env } from "@/env";

export const SignIn = async () => {
  return (
    <AuthForm mode="sign-in" withFooter={false}>
      {env.NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED && (
        <>
          <Divider text="Or continue with email" />
          {/* <CredentialsForm /> */}
        </>
      )}
    </AuthForm>
  );
};
