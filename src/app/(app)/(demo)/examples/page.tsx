import Image from "next/image";
import Link from "next/link";

import {
	PageActions,
	PageHeader,
	PageHeaderDescription,
	PageHeaderHeading,
} from "@/components/primitives/page-header";
import { Announcement } from "@/components/ui/announcement";
import { Button } from "@/components/ui/button";
import { CardsDemo } from "./_components/cards";

export default function IndexPage() {
	return (
		<>
			<div className="container-wrapper">
				<div className="container">
					<PageHeader>
						<Announcement />
						<PageHeaderHeading>Examples</PageHeaderHeading>
						<PageHeaderDescription>
							Beautifully designed components that you can copy and paste into your apps. Made with
							Tailwind CSS. Open source.
						</PageHeaderDescription>
						<PageActions>
							<Button asChild size="sm">
								<Link href="/">Get Started</Link>
							</Button>
							<Button asChild size="sm" variant="ghost">
								<Link href="/blocks">Browse Docs</Link>
							</Button>
						</PageActions>
					</PageHeader>
					<section className="overflow-hidden rounded-lg border bg-background shadow-md md:hidden md:shadow-xl">
						<Image
							src="/examples/cards-light.png"
							width={1280}
							height={1214}
							alt="Cards"
							className="block dark:hidden"
						/>
						<Image
							src="/examples/cards-dark.png"
							width={1280}
							height={1214}
							alt="Cards"
							className="hidden dark:block"
						/>
					</section>
					<section className="hidden md:block [&>div]:p-0">
						<CardsDemo />
					</section>
				</div>
			</div>
		</>
	);
}
