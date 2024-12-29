import { db } from "@/server/db";
import { apiKeys, logs } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Handles POST requests to send a test log using a test API key.
 */
export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json();

    // Validate the API key
    const apiKeyRecord = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.key, apiKey),
    });

    if (!apiKeyRecord) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Create a test log
    const testLog = {
      level: "info",
      message: "This is a test log",
      timestamp: new Date(),
      metadata: JSON.stringify({ test: true, randomValue: Math.random() }),
      apiKeyId: apiKeyRecord.id,
    };

    await db.insert(logs).values(testLog);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending test log:", error);
    return NextResponse.json(
      { error: "Failed to send test log" },
      { status: 500 },
    );
  }
}
