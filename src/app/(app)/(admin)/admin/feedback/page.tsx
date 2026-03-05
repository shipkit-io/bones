import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";
import { getFeedback } from "@/server/services/feedback-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = constructMetadata({
	title: "Feedback Management",
	description: "Review and manage user feedback submissions.",
	noIndex: true,
});

export default async function FeedbackPage() {
	const feedbackItems = await getFeedback();

	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-8 text-3xl font-bold">Feedback</h1>
			<div className="grid gap-4">
				{feedbackItems?.map((item) => (
					<div
						key={item.id}
						className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
					>
						<div className="mb-2 flex items-center justify-between">
							<span className="text-sm text-muted-foreground">
								{new Date(item.createdAt).toLocaleString()}
							</span>
							<span
								className={`rounded-full px-2 py-1 text-xs ${
									item.status === "new"
										? "bg-blue-100 text-blue-800"
										: item.status === "reviewed"
											? "bg-green-100 text-green-800"
											: "bg-gray-100 text-gray-800"
								}`}
							>
								{item.status}
							</span>
						</div>
						<p className="mb-2 whitespace-pre-wrap">{item.content}</p>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<span>Source: {item.source}</span>
							{item?.metadata && Object.keys(item.metadata).length > 0 && (
								<span>Metadata: {JSON.stringify(item.metadata, null, 2)}</span>
							)}
						</div>
					</div>
				)) || []}
				{(!feedbackItems || feedbackItems.length === 0) && (
					<p className="text-center text-muted-foreground">No feedback received yet.</p>
				)}
			</div>
		</div>
	);
}
