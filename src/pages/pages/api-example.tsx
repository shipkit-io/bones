import { useState } from "react";
import { PagesRouterLayout } from "@/components/layouts/pages-router-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ApiResponse {
	message: string;
	timestamp: string;
	method: string;
	query: Record<string, string | string[] | undefined>;
}

export default function ApiExample() {
	const [response, setResponse] = useState<ApiResponse | null>(null);
	const [loading, setLoading] = useState(false);

	const fetchApi = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/demo?example=true");
			const data = await res.json();
			setResponse(data);
		} catch (error) {
			console.error("Error fetching API:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<PagesRouterLayout>
			<div className="max-w-4xl mx-auto">
				<h1 className="text-4xl font-bold mb-8">API Route Example</h1>
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>API Routes in Pages Router</CardTitle>
							<CardDescription>
								This example demonstrates how API routes work in the Pages Router
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button onClick={fetchApi} disabled={loading}>
								{loading ? "Loading..." : "Test API Route"}
							</Button>

							{response && (
								<div className="mt-4 p-4 bg-muted rounded-lg">
									<pre className="whitespace-pre-wrap">
										<code>{JSON.stringify(response, null, 2)}</code>
									</pre>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>API Route Code</CardTitle>
							<CardDescription>Here&apos;s how the API route is implemented</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="p-4 bg-muted rounded-lg">
								<pre className="whitespace-pre-wrap">
									<code>
										{`
// pages/api/demo.ts
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({
    message: 'Hello from the Pages Router API!',
    timestamp: new Date().toISOString(),
    method: req.method ?? 'unknown',
    query: req.query
  })
}`}
									</code>
								</pre>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</PagesRouterLayout>
	);
}
