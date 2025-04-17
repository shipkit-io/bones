import { AuthForm } from "@/app/(app)/(authentication)/_components/auth-form";
import { Icon } from "@/components/assets/icon";
import { Divider } from "@/components/primitives/divider";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { env } from "@/env";
import Link from "next/link";
import { AuthenticationCard } from "../_components/authentication-card";
import { SignUpForm } from "./_components/sign-up-form";

export default async function SignUpPage() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Link
        href={routes.home}
        className="flex items-center gap-2 self-center font-medium"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Icon />
        </div>
        {siteConfig.name}
      </Link>
      <AuthenticationCard>
        <AuthForm mode="sign-up">
          {env.NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED && (
            <>
              <Divider text="Or continue with email" />
              <SignUpForm />
            </>
          )}
        </AuthForm>
      </AuthenticationCard>
    </div>
  );
}
