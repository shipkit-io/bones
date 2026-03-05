import type { GetServerSideProps } from "next";
import Link from "next/link";
import { PagesRouterLayout } from "@/components/layouts/pages-router-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createRoute, routes } from "@/config/routes";

interface DynamicPageProps {
	id: string;
	requestTime: string;
}

export default function DynamicPage(props: DynamicPageProps) {
	const { id, requestTime } = props;

	// Generate a random example ID
	const exampleId = `example-${Math.floor(Math.random() * 1000)}`;

	// Create a dynamic route using the routes configuration
	const dynamicExampleRoute = createRoute(`${routes.pages.dynamic}/${exampleId}`);

	return (
		<PagesRouterLayout>
			<div className="max-w-4xl mx-auto">
				<h1 className="text-4xl font-bold mb-8">Dynamic Page Example</h1>
				<Card>
					<CardHeader>
						<CardTitle>Server-Side Rendering (SSR)</CardTitle>
						<CardDescription>
							This page is server-side rendered using getServerSideProps
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<p className="text-muted-foreground">
								Current dynamic ID: <span className="font-mono">{id ?? "(empty path)"}</span>
							</p>
							<p className="text-muted-foreground">Request time: {requestTime}</p>
							<div className="p-4 bg-muted rounded-lg">
								<pre className="whitespace-pre-wrap">
									<code>
										{`
// This function runs on every request
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  return {
    props: {
      id: params?.id,
      requestTime: new Date().toISOString()
    }
  }
}`}
									</code>
								</pre>
							</div>
							<p className="text-sm text-muted-foreground">
								Try changing the ID in the URL to see how the page updates dynamically! For example,
								try visiting{" "}
								<Link
									suppressHydrationWarning
									href={dynamicExampleRoute.path}
									className="text-primary hover:underline"
								>
									{dynamicExampleRoute.path}
								</Link>
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</PagesRouterLayout>
	);
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
	return {
		props: {
			id: params?.id ?? null,
			requestTime: new Date().toISOString(),
		},
	};
};
