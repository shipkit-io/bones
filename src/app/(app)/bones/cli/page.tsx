import { Link } from "@/components/primitives/link-with-transition";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import { InstallSection } from "./_components/install-section";

export default function Home() {
	return (
		<div className="flex min-h-screen flex-col">
			<main className="container grow">
				<div className="mx-auto max-w-screen-sm">
					<InstallSection />

					<div className="mt-10 space-y-10">
						<p className="text-muted-foreground [&>a]:font-medium [&>a]:text-blue-400 [&>a]:underline">
							Run this command in your Next.js project after setting up{" "}
							<Link href={"https://ui.shadcn.com/docs/"}>ShadCN UI</Link>.
							<br />
							Want a Next.js starter with good bones? Get{" "}
							<Link href={routes.external.bones}>Bones Starter</Link>.
						</p>
						<Link
							href={routes.external.shipkit}
							className={cn(buttonVariants({ variant: "link" }), "px-0")}
						>
							Get more components and ship even faster with Shipkit.
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
