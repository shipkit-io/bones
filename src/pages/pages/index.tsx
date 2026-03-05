import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { routes } from "@/config/routes";

export default function PagesRouterDemo() {
	return (
		<>
			<div className="container py-10">
				<h1 className="mb-8 text-3xl font-bold">Pages Router Examples</h1>
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Static Page Example</CardTitle>
							<CardDescription>Shows how static pages work in the Pages Router</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href={routes.pages.static} passHref>
								<Button variant="outline" className="w-full">
									View Static Page
								</Button>
							</Link>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Dynamic Page Example</CardTitle>
							<CardDescription>Shows how dynamic routes work in the Pages Router</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href={routes.pages.dynamic} passHref>
								<Button variant="outline" className="w-full">
									View Dynamic Page
								</Button>
							</Link>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>API Route Example</CardTitle>
							<CardDescription>Demonstrates API routes in the Pages Router</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href={routes.pages.apiExample} passHref>
								<Button variant="outline" className="w-full">
									View API Example
								</Button>
							</Link>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Pages vs App Router</CardTitle>
							<CardDescription>
								Compare the differences between Pages and App Router
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href={routes.home} passHref>
								<Button variant="outline" className="w-full">
									Back to App Router
								</Button>
							</Link>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
