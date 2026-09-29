import Link from "next/link";
import { CardFooter } from "@/components/ui/card";
import { routes } from "@/config/routes";

export function AuthFooter() {
  return (
    <CardFooter>
      <div className="text-center text-xs text-balance text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By signing up, you agree to our <Link href={routes.terms}>Terms of Service</Link> and{" "}
        <Link href={routes.privacy}>Privacy Policy</Link>.
      </div>
    </CardFooter>
  );
}
