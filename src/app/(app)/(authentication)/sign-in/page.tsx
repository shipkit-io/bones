import { AuthenticationCard } from "@/app/(app)/(authentication)/_components/authentication-card";
import { SignIn } from "@/app/(app)/(authentication)/sign-in/_components/sign-in";
import { Icon } from "@/components/assets/icon";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import Link from "next/link";

export default function SignInPage() {
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
        <SignIn />
      </AuthenticationCard>
    </div>
  );
}
