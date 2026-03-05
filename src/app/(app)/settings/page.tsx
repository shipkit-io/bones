import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

export default function SettingsPage() {
	redirect(routes.settings.profile);
}
