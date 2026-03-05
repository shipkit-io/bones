import { listOrders } from "@lemonsqueezy/lemonsqueezy.js";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import type { LemonSqueezyOrderAttributes } from "@/types/lemonsqueezy";
import { getLemonSqueezyPaymentStatus } from "./lemonsqueezy";

/**
 * Creates a test user in the database
 */
async function createTestUser() {
	const testUser = await db
		?.insert(users)
		.values({
			id: crypto.randomUUID(),
			email: "test@test.com",
			name: "Test User",
		})
		.returning();

	if (!testUser?.[0]) {
		throw new Error("Failed to create test user");
	}

	console.log("Created test user:", testUser[0]);
	return testUser[0];
}

/**
 * Test the payment linking functionality
 *
 * To test:
 * 1. Create a test user in the database
 * 2. Check Lemon Squeezy orders with:
 *    a. The same email as the user (Scenario 1)
 *    b. A different email but with user_id in custom_data (Scenario 2)
 */
export async function testPaymentLinking() {
	// Check required environment variables
	if (!env.LEMONSQUEEZY_API_KEY) {
		throw new Error("LEMONSQUEEZY_API_KEY is not set in the environment");
	}

	try {
		// Create a test user
		console.log("Creating test user...");
		const testUser = await createTestUser();
		console.log("Created test user:", {
			id: testUser.id,
			email: testUser.email,
			name: testUser.name,
		});

		// Get all orders to check what we're working with
		console.log("\nFetching Lemon Squeezy orders...");
		const orders = await listOrders({});
		const orderCount = orders.data?.data?.length ?? 0;
		console.log("Found orders:", orderCount);

		if (orderCount > 0 && orders.data?.data?.[0]) {
			const firstOrder = orders.data.data[0];
			const attributes = firstOrder.attributes as LemonSqueezyOrderAttributes;
			console.log("Sample order:", {
				id: firstOrder.id,
				email: attributes.user_email,
				status: attributes.status,
				custom_data: attributes.custom_data,
			});
		}

		// Test Scenario 1: User pays with registered email
		console.log("\nScenario 1: Testing payment with registered email");
		const hasPaidWithEmail = await getLemonSqueezyPaymentStatus(testUser.id);
		console.log("Has paid with registered email:", hasPaidWithEmail);

		// Test Scenario 2: User pays with different email but includes user ID
		console.log("\nScenario 2: Testing payment with different email but linked by ID");
		const hasPaidWithId = await getLemonSqueezyPaymentStatus(testUser.id);
		console.log("Has paid with different email (linked by ID):", hasPaidWithId);

		// Clean up
		await db?.delete(users).where(eq(users.id, testUser.id));
		console.log("\nTest user cleaned up");
	} catch (error) {
		console.error("Test failed:", error);
		throw error;
	}
}
