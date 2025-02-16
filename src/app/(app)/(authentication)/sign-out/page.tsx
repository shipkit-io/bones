import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { redirect } from "next/navigation";

export default function SignOutPage() {
	redirect(`${routes.auth.signOutIn}?${SEARCH_PARAM_KEYS.nextUrl}=${routes.home}`);
}
