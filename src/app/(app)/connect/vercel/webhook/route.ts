import { headers } from "next/headers";
import type { NextRequest } from "next/server";

/*
 * Vercel Webhook Handler
 * @see https://vercel.com/docs/observability/webhooks-overview
 *
 * This endpoint receives and logs all webhook events from Vercel.
 * It's useful for debugging and understanding the webhook payload structure.
 */

export const dynamic = "force-dynamic"; // Disable caching for webhook endpoint

export async function POST(request: NextRequest) {
	// console.log({
	// 	message: "Vercel webhook received",
	// 	url: request.url,
	// 	method: request.method,
	// 	headers: Object.fromEntries(request.headers.entries()),
	// });

	try {
		// Get headers including Vercel's signature
		const headersList = await headers();
		const signature = headersList.get("x-vercel-signature");
		const timestamp = headersList.get("x-vercel-timestamp");

		// Parse the request body
		const body = await request.json();

		// Log all the information we received
		console.log({
			event: "Vercel Webhook Received",
			timestamp: new Date().toISOString(),
			headers: {
				signature,
				timestamp,
				// Log other relevant headers
				type: headersList.get("x-vercel-event"),
				id: headersList.get("x-vercel-id"),
			},
			body, // Log the entire webhook payload
		});

		// Return a success response
		return new Response(JSON.stringify({ received: true }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		// Log any errors that occur
		console.error("Error processing Vercel webhook:", error);

		// Return an error response
		return new Response(JSON.stringify({ error: "Failed to process webhook" }), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}
}
