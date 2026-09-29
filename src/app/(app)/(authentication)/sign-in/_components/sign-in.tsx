import { AuthForm } from "@/app/(app)/(authentication)/_components/auth-form";
import { CredentialsForm } from "@/app/(app)/(authentication)/_components/credentials-form";
import { GuestForm } from "@/app/(app)/(authentication)/_components/guest-form";
import { Divider } from "@/components/primitives/divider";
import { env } from "@/env";

export const SignIn = () => {
  const isGuestEnabled = !!env.NEXT_PUBLIC_FEATURE_AUTH_GUEST_ENABLED;

  /**
   * Guest-only mode: guest is the sole way in, so it gets the whole screen.
   * Otherwise guest sits under the other methods — a demo needs a door that
   * works even when OAuth is configured, so this is not a fallback.
   */
  const isGuestOnlyMode = isGuestEnabled && !env.NEXT_PUBLIC_FEATURE_AUTH_METHODS_ENABLED;

  if (isGuestOnlyMode) {
    return (
      <AuthForm
        mode="sign-in"
        withFooter={false}
        title="Welcome"
        description="Enter your name to get started"
      >
        <GuestForm />
      </AuthForm>
    );
  }

  return (
    <AuthForm mode="sign-in" withFooter={false}>
      {env.NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED && (
        <>
          <Divider text="Or continue with email" />
          <CredentialsForm />
        </>
      )}

      {isGuestEnabled && (
        <>
          <Divider text="Or try it as a guest" />
          <GuestForm />
        </>
      )}
    </AuthForm>
  );
};
