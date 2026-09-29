import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";

export function useSignInRedirectUrl() {
  const pathname = usePathname();
  const url = `${routes.auth.signIn}?${SEARCH_PARAM_KEYS.nextUrl}=${pathname}`;
  return url;
}
