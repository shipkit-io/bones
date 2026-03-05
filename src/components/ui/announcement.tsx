import { ArrowRight, PieChart } from "lucide-react";
import { Link } from "@/components/primitives/link";
import { Separator } from "@/components/ui/separator";
import { routes } from "@/config/routes";

export function Announcement() {
	return (
		<Link
			href={routes.external.bones}
			className="group inline-flex items-center px-0.5 text-sm font-medium"
		>
			<PieChart className="h-4 w-4" /> <Separator className="mx-2 h-4" orientation="vertical" />{" "}
			<span className="underline-offset-4 group-hover:underline">Announcing Shipkit Bones</span>
			<ArrowRight className="ml-1 h-4 w-4" />
		</Link>
	);
}
