import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import type { NewCreditTransaction } from "@/server/db/schema";
import { creditTransactions, userCredits, users } from "@/server/db/schema";

/**
 * Retrieves the credit balance for a specific user.
 * Creates a credit record if one doesn't exist.
 * @param userId - The ID of the user.
 * @returns The user's credit balance, or 0 if not found/created.
 */
export async function getUserCredits(userId: string): Promise<number> {
	const credits = await db?.query.userCredits.findFirst({
		where: eq(userCredits.userId, userId),
	});

	// If user has no credit record, create one with 0 balance
	if (!credits) {
		await db?.insert(userCredits).values({ userId, balance: 0 });
		return 0;
	}

	return credits.balance;
}

interface UpdateCreditsParams {
	userId: string;
	amount: number; // Positive for adding, negative for spending
	type: NewCreditTransaction["type"];
	description?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Updates a user's credit balance and logs the transaction atomically.
 * @param params - The parameters for updating credits.
 * @throws Error if the user is not found or has insufficient credits for spending.
 */
export async function updateUserCredits({
	userId,
	amount,
	type,
	description,
	metadata,
}: UpdateCreditsParams): Promise<void> {
	await db?.transaction(async (tx) => {
		// Ensure the user exists
		const user = await tx.query.users.findFirst({
			where: eq(users.id, userId),
			columns: { id: true },
		});
		if (!user) {
			throw new Error(`User with ID ${userId} not found.`);
		}

		// Get or create the user's credit record
		let currentCredits = await tx.query.userCredits.findFirst({
			where: eq(userCredits.userId, userId),
		});

		if (!currentCredits) {
			[currentCredits] = await tx.insert(userCredits).values({ userId, balance: 0 }).returning();
			if (!currentCredits) {
				// This should ideally not happen if the insert succeeded
				tx.rollback();
				throw new Error(`Failed to create credit record for user ${userId}`);
			}
		}

		const currentBalance = currentCredits.balance;
		const newBalance = currentBalance + amount;

		// Check for sufficient funds if spending credits
		if (amount < 0 && newBalance < 0) {
			tx.rollback();
			throw new Error(
				`Insufficient credits. Current balance: ${currentBalance}, trying to spend: ${-amount}`
			);
		}

		// Update user's credit balance
		await tx.update(userCredits).set({ balance: newBalance }).where(eq(userCredits.userId, userId));

		// Log the credit transaction
		await tx.insert(creditTransactions).values({
			userId,
			amount,
			type,
			description,
			metadata: metadata ? JSON.stringify(metadata) : undefined,
		});
	});
}
