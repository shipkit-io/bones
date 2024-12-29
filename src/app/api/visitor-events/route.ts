import {
	subscribeToVisitors,
	type VisitorLocation,
} from "@/server/actions/visitor-location";
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	try {
		const stream = new TransformStream();
		const writer = stream.writable.getWriter();
		const encoder = new TextEncoder();

		// Subscribe to visitor events
		const unsubscribe = await subscribeToVisitors(
			async (location: VisitorLocation) => {
				try {
					const data = `data: ${JSON.stringify(location)}\n\n`;
					await writer.write(encoder.encode(data));
				} catch (error) {
					console.error("Error writing to stream:", error);
				}
			},
		);

		// Clean up on close
		req.signal.addEventListener("abort", () => {
			try {
				unsubscribe();
				void writer.close();
			} catch (error) {
				console.error("Error cleaning up SSE connection:", error);
			}
		});

		return new Response(stream.readable, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("Error setting up SSE connection:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
}
