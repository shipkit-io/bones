import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

export default function NotFound() {
    // Use a temporary redirect (307) to send all docs 404s to the docs home
    // This preserves method and is appropriate for dynamic content that may change
    redirect(routes.docs);
}


