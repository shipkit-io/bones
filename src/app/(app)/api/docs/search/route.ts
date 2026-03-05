import { NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@/lib/open-ai";
import { DocsSearchService } from "@/server/services/docs-search";
import { ErrorService } from "@/server/services/error-service";
import { rateLimitService, rateLimits } from "@/server/services/rate-limit-service";

// Sanitize input to prevent prompt injection
function sanitizeForPrompt(text: string): string {
	// Remove potential prompt injection patterns
	return (
		text
			// Remove instruction-like patterns that could manipulate the AI
			.replace(
				/\b(ignore|disregard|forget|override|bypass)\s+(previous|above|all|any)\s+(instructions?|prompts?|rules?)/gi,
				"[REDACTED]"
			)
			// Remove common prompt injection techniques
			.replace(/\b(system|assistant|user)\s*:/gi, "[ROLE]")
			// Remove potential command injections
			.replace(/```[^`]*```/g, "[CODE_BLOCK]")
			// Escape special characters that might be interpreted as markdown or special syntax
			.replace(/[<>]/g, "")
			// Limit consecutive newlines to prevent format manipulation
			.replace(/\n{3,}/g, "\n\n")
			// Trim excessive whitespace
			.trim()
	);
}

const searchRequestSchema = z.object({
	query: z.string().min(1, "Search query is required").max(500, "Search query is too long"),
	limit: z
		.number()
		.optional()
		.default(5)
		.refine((val) => val > 0 && val <= 20, {
			message: "Limit must be between 1 and 20",
		}),
});

export async function POST(req: Request) {
	if (!openai) {
		return NextResponse.json({ error: "OpenAI API key is not set." }, { status: 500 });
	}

	try {
		// Extract client IP for rate limiting
		// Try to get IP from various headers in order of reliability
		const forwardedFor = req.headers.get("x-forwarded-for");
		const realIp = req.headers.get("x-real-ip");
		const cfConnectingIp = req.headers.get("cf-connecting-ip");

		// Use the first available IP address, with fallback to a generic identifier
		const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || cfConnectingIp || "anonymous";

		// Apply rate limiting with custom limits for AI search
		// More restrictive than regular search due to OpenAI API costs
		const aiSearchRateLimit = {
			requests: 10, // 10 requests
			duration: 60, // per minute
		};

		try {
			await rateLimitService.checkLimit(clientIp, "ai-docs-search", aiSearchRateLimit);
		} catch (error) {
			// If it's a rate limit error, return appropriate response
			if (ErrorService.isAppError(error) && error.code === "RATE_LIMITED") {
				return NextResponse.json(
					{
						error: "Too many requests",
						message: "You have exceeded the rate limit for AI search. Please try again later.",
						retryAfter: error.metadata?.reset,
					},
					{
						status: 429,
						headers: {
							"X-RateLimit-Limit": String(error.metadata?.limit || aiSearchRateLimit.requests),
							"X-RateLimit-Remaining": String(error.metadata?.remaining || 0),
							"X-RateLimit-Reset": String(error.metadata?.reset || 0),
							"Retry-After": String(
								Math.ceil(((error.metadata?.reset as number) || 0) - Date.now() / 1000)
							),
						},
					}
				);
			}
			// Re-throw other errors
			throw error;
		}

		// Parse and validate the request body
		const body = await req.json().catch(() => ({}));
		const validationResult = searchRequestSchema.safeParse(body);

		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "Invalid request",
					details: validationResult.error.issues,
				},
				{ status: 400 }
			);
		}

		const { query, limit } = validationResult.data;

		// Get current rate limit status for response headers
		const rateLimitStatus = await rateLimitService.getStatus(clientIp, "ai-docs-search");
		const rateLimitHeaders = {
			"X-RateLimit-Limit": String(rateLimitStatus.limit),
			"X-RateLimit-Remaining": String(rateLimitStatus.remaining),
			"X-RateLimit-Reset": String(rateLimitStatus.reset),
		};

		// Check if client wants JSON response
		const acceptHeader = req.headers.get("accept");
		if (acceptHeader?.includes("application/json")) {
			// Search documentation
			const searchService = DocsSearchService.getInstance();
			const searchResults = await searchService.search(query, limit);
			return NextResponse.json({ results: searchResults }, { headers: rateLimitHeaders });
		}

		// Search documentation for streaming response
		const searchService = DocsSearchService.getInstance();
		const searchResults = await searchService.search(query, limit);

		// Generate streaming AI response
		const response = await openai.chat.completions.create({
			model: "gpt-4-turbo-preview",
			messages: [
				{
					role: "system",
					content: `You are a helpful documentation assistant for Shipkit.
          Your responses should be clear, concise, and focused on answering the user's question.
          Include relevant code examples when appropriate.
          Format your responses in markdown.

          Here are some relevant documentation snippets to help you answer:
          ${searchResults.map((result) => `### ${sanitizeForPrompt(result.title)}\n${sanitizeForPrompt(result.content)}`).join("\n\n")}`,
				},
				{
					role: "user",
					content: sanitizeForPrompt(query),
				},
			],
			temperature: 0.7,
			max_tokens: 500,
			stream: true,
		});

		// Create a text encoder
		const encoder = new TextEncoder();

		// Create a readable stream from the OpenAI response
		const stream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of response) {
						const text = chunk.choices[0]?.delta?.content ?? "";
						if (text) {
							controller.enqueue(encoder.encode(text));
						}
					}
					controller.close();
				} catch (error) {
					controller.error(error);
				}
			},
		});

		// Return the stream with appropriate headers including rate limit info
		const headers = new Headers({
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "no-cache",
			"Transfer-Encoding": "chunked",
			...rateLimitHeaders,
		});

		return new Response(stream, { headers });
	} catch (error) {
		// Handle rate limit errors that weren't caught earlier
		if (ErrorService.isAppError(error) && error.code === "RATE_LIMITED") {
			return NextResponse.json(
				{
					error: "Too many requests",
					message: "You have exceeded the rate limit for AI search. Please try again later.",
					retryAfter: error.metadata?.reset,
				},
				{
					status: 429,
					headers: {
						"X-RateLimit-Limit": String(error.metadata?.limit || 10),
						"X-RateLimit-Remaining": String(error.metadata?.remaining || 0),
						"X-RateLimit-Reset": String(error.metadata?.reset || 0),
						"Retry-After": String(
							Math.ceil(((error.metadata?.reset as number) || 0) - Date.now() / 1000)
						),
					},
				}
			);
		}

		console.error("Search error:", error);
		return NextResponse.json(
			{
				error: "Failed to process search request",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
