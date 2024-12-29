import { logger } from "@/lib/logger";
import { streamApiLogs } from "@/lib/stream-api-logs";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { apiKeys, projectMembers } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Handles the GET request for live logs using Server-Sent Events
 * @param req - The incoming request object
 */
export const GET = async (req: Request): Promise<NextResponse> => {
	const { searchParams } = new URL(req.url);
	const apiKeyId = searchParams.get("id");
	const apiKey = searchParams.get("key");

	logger.info("apiKeyId", { apiKeyId });
	logger.info("apiKey", { apiKey });

	if (!db) {
		return new NextResponse("Database is not initialized", { status: 500 });
	}

	if (typeof apiKeyId !== "string" && typeof apiKey !== "string") {
		return new NextResponse("API key ID or key is required", { status: 400 });
	}

	// Find the API key record
	const apiKeyRecord = await db.query.apiKeys.findFirst({
		where: apiKeyId
			? eq(apiKeys.id, apiKeyId)
			: eq(apiKeys.key, apiKey as string),
	});

	logger.info("apiKeyRecord", apiKeyRecord);

	if (!apiKeyRecord) {
		return new NextResponse("Invalid API key", { status: 401 });
	}

	if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
		return new NextResponse("API key expired", { status: 401 });
	}

	// Check if it's a personal API key
	const session = await auth();
	if (apiKeyRecord.userId) {
		// Get the authenticated user
		if (apiKeyRecord.userId !== session?.user?.id) {
			// Verify the API key belongs to the authenticated user
			return new NextResponse("Unauthorized access to API key", {
				status: 403,
			});
		}
	}

	if (apiKeyRecord.projectId && session?.user?.id) {
		const userProjectMember = await db?.query.projectMembers.findFirst({
			where: and(
				eq(projectMembers.projectId, apiKeyRecord.projectId),
				eq(projectMembers.userId, session?.user?.id), // user is a project member
			),
		});

		if (!userProjectMember) {
			return new NextResponse("Unauthorized access to project", {
				status: 403,
			});
		}
	}

	const logStream = streamApiLogs(apiKeyRecord.id);

	const responseStream = new TransformStream();
	const writer = responseStream.writable.getWriter();
	const encoder = new TextEncoder();

	// Set up SSE headers
	const headers = {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive",
	};

	// Start sending events
	const sendEvents = async () => {
		try {
			for await (const log of logStream) {
				const data = JSON.stringify(log);
				await writer.write(encoder.encode(`data: ${data}\n\n`));
			}
		} finally {
			if (writer) {
				await writer.close().catch(() => {
					logger.info("Writer already closed");
				});
			}
		}
	};

	void sendEvents();

	return new NextResponse(responseStream.readable, { headers });
};
