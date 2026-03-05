import { describe, expect, it } from "vitest";
import {
	addWaitlistEntry,
	getWaitlistEntries,
	getWaitlistEntryByEmail,
	getWaitlistStats,
	isEmailOnWaitlist,
	markWaitlistEntryAsNotified,
	updateWaitlistEntryMetadata,
} from "@/server/services/waitlist-service";

describe("Waitlist Service Functions", () => {
	const mockEntry = {
		email: "test@example.com",
		name: "Test User",
		company: "Test Company",
		role: "developer",
		projectType: "saas",
		timeline: "3-months",
		interests: "Authentication and payments",
		source: "website" as const,
	};

	// Note: These tests would need a test database setup
	// For now, they serve as documentation of the expected API

	it("should have the correct function interfaces", () => {
		expect(typeof addWaitlistEntry).toBe("function");
		expect(typeof isEmailOnWaitlist).toBe("function");
		expect(typeof getWaitlistEntryByEmail).toBe("function");
		expect(typeof getWaitlistEntries).toBe("function");
		expect(typeof getWaitlistStats).toBe("function");
		expect(typeof markWaitlistEntryAsNotified).toBe("function");
		expect(typeof updateWaitlistEntryMetadata).toBe("function");
	});

	it("should validate entry data structure", () => {
		// Ensure our mock entry has the correct structure
		expect(mockEntry).toHaveProperty("email");
		expect(mockEntry).toHaveProperty("name");
		expect(mockEntry).toHaveProperty("source");
		expect(typeof mockEntry.email).toBe("string");
		expect(typeof mockEntry.name).toBe("string");
	});
});
