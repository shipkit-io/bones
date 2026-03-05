import type { User } from "@/types/user";
import "next-auth";

declare module "next-auth" {
	interface Session {
		user: User;
	}

	// JWT is persisted as JSON, so Date objects are serialized to strings
	// Override date fields to be ISO strings (or null) in the JWT shape
	interface JWT
		extends Omit<
			User,
			"email" | "emailVerified" | "createdAt" | "updatedAt" | "vercelConnectionAttemptedAt"
		> {
		email?: string | null;
		emailVerified?: string | null;
		createdAt?: string;
		updatedAt?: string;
		vercelConnectionAttemptedAt?: string | null;
		githubAccessToken?: string;
	}
}
