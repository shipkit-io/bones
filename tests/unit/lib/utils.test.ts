import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
	it("should merge tailwind classes", () => {
		const result = cn("p-4", "p-2");
		expect(result).toBe("p-2");
	});

	it("should handle conditional classes", () => {
		const isActive = true;
		const hasError = false;
		const result = cn("base", { active: isActive, error: hasError });
		expect(result).toBe("base active");
	});

	it("should handle mixed arrays and objects", () => {
		const result = cn("p-4", ["m-2", { "text-red": true }], "bg-blue");
		expect(result).toBe("p-4 m-2 text-red bg-blue");
	});

	it("should handle empty inputs", () => {
		const result = cn();
		expect(result).toBe("");
	});

	it("should handle null and undefined inputs", () => {
		const result = cn("p-4", null, "m-2", undefined, "bg-blue");
		expect(result).toBe("p-4 m-2 bg-blue");
	});

	it("should merge conflicting classes correctly (last one wins)", () => {
		const result = cn("text-red-500", "text-blue-500");
		expect(result).toBe("text-blue-500");
	});

	it("should handle complex conditional logic", () => {
		const result = cn("flex", {
			"items-center": true,
			"justify-center": false,
		});
		expect(result).toBe("flex items-center");
	});
});
