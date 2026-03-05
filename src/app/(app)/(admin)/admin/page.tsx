import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

/**
 * Admin page
 */
export default async function AdminPage() {
	redirect(routes.admin.users);
}
