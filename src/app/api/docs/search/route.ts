import { openai } from "@/lib/open-ai";
import { DocsSearchService } from "@/server/services/docs-search";
import { NextResponse } from "next/server";
import { z } from "zod";

const searchRequestSchema = z.object({
	query: z.string().min(1, "Search query is required"),
	limit: z.number().optional().default(5),
});

export async function POST(req: Request) {
	if (!openai) {
		return NextResponse.json(
			{ error: "OpenAI API key is not set." },
			{ status: 500 },
		);
	}

	try {
		// Parse and validate the request body
		const body = await req.json().catch(() => ({}));
		const validationResult = searchRequestSchema.safeParse(body);

		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "Invalid request",
					details: validationResult.error.issues,
				},
				{ status: 400 },
			);
		}

		const { query, limit } = validationResult.data;

		// Check if client wants JSON response
		const acceptHeader = req.headers.get("accept");
		if (acceptHeader?.includes("application/json")) {
			// Search documentation
			const searchService = DocsSearchService.getInstance();
			const searchResults = await searchService.search(query, limit);
			return NextResponse.json({ results: searchResults });
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
					content: `You are a helpful documentation assistant for ShipKit.
          Your responses should be clear, concise, and focused on answering the user's question.
          Include relevant code examples when appropriate.
          Format your responses in markdown.

          Here are some relevant documentation snippets to help you answer:
          ${searchResults
						.map((result) => `### ${result.title}\n${result.content}`)
						.join("\n\n")}`,
				},
				{
					role: "user",
					content: query,
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

		// Return the stream with appropriate headers and search results
		const headers = new Headers({
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "no-cache",
			"Transfer-Encoding": "chunked",
			"X-Search-Results": JSON.stringify(searchResults),
		});

		return new Response(stream, { headers });
	} catch (error) {
		console.error("Search error:", error);
		return NextResponse.json(
			{
				error: "Failed to process search request",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
