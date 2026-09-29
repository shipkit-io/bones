import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import { useEffect } from "react";
import { routes } from "@/config/routes";
import { createRedirectUrl } from "@/lib/utils/redirect";

export function useRequireAuth(redirectTo: string = routes.auth.signIn) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      const url = createRedirectUrl(redirectTo, { nextUrl: pathname ?? "/" });
      router.push(url);
    }
  }, [session, status, router, pathname, redirectTo]);

  return { session, isLoading: status === "loading" };
}

/**
 * Hook to get sign-in redirect URL for the current pathname
 * Only use this in Client Components
 */
export function useSignInRedirectUrl(): string {
  const pathname = usePathname();
  return createRedirectUrl(routes.auth.signIn, { nextUrl: pathname ?? "/" });
}

/**
 * Hook to get sign-out redirect URL for the current pathname
 * Only use this in Client Components
 */
export function useSignOutRedirectUrl(): string {
  const pathname = usePathname();
  return createRedirectUrl(routes.auth.signOut, { nextUrl: pathname ?? "/" });
}
