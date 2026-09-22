import { describe, expect, it } from "vitest";
import { isSignInEmailAllowed, parseSignInAllowlist } from "@/server/magic-link-allowlist";

describe("parseSignInAllowlist", () => {
	it("returns an empty list for unset or blank values", () => {
		expect(parseSignInAllowlist(undefined)).toEqual([]);
		expect(parseSignInAllowlist("")).toEqual([]);
		expect(parseSignInAllowlist("  ,  , ")).toEqual([]);
	});

	it("splits on commas, trims, and lowercases entries", () => {
		expect(parseSignInAllowlist(" Alice@Example.com , @Corp.io ,beta.dev ")).toEqual([
			"alice@example.com",
			"@corp.io",
			"beta.dev",
		]);
	});
});

describe("isSignInEmailAllowed", () => {
	it("allows everyone when no allowlist is configured", () => {
		expect(isSignInEmailAllowed("anyone@anywhere.com", undefined)).toBe(true);
		expect(isSignInEmailAllowed("anyone@anywhere.com", "")).toBe(true);
	});

	it("matches exact addresses case-insensitively", () => {
		const list = "alice@example.com";
		expect(isSignInEmailAllowed("alice@example.com", list)).toBe(true);
		expect(isSignInEmailAllowed("ALICE@Example.COM", list)).toBe(true);
		expect(isSignInEmailAllowed("bob@example.com", list)).toBe(false);
	});

	it("matches domains with or without a leading @", () => {
		expect(isSignInEmailAllowed("carol@corp.io", "@corp.io")).toBe(true);
		expect(isSignInEmailAllowed("carol@corp.io", "corp.io")).toBe(true);
		expect(isSignInEmailAllowed("carol@corp.io.evil.com", "@corp.io")).toBe(false);
		expect(isSignInEmailAllowed("carol@subcorp.io", "@corp.io")).toBe(false);
	});

	it("supports mixed address and domain entries", () => {
		const list = "alice@example.com, @corp.io";
		expect(isSignInEmailAllowed("alice@example.com", list)).toBe(true);
		expect(isSignInEmailAllowed("dave@corp.io", list)).toBe(true);
		expect(isSignInEmailAllowed("mallory@evil.com", list)).toBe(false);
	});
});
