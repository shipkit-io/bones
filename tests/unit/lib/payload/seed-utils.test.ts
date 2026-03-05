import { describe, expect, it } from "vitest";
import { createRichText } from "@/lib/payload/seed-utils"; // Adjust import path if necessary

describe("seed-utils", () => {
	describe("createRichText", () => {
		it("should create a valid Payload rich text structure for a simple paragraph", () => {
			const text = "This is a test paragraph.";
			const expectedStructure = {
				root: {
					type: "root",
					children: [
						{
							type: "paragraph",
							children: [
								{
									text: text,
									type: "text",
								},
							],
							version: 1,
						},
					],
					direction: "ltr",
					format: "left",
					indent: 0,
					version: 1,
				},
			};
			expect(createRichText(text)).toEqual(expectedStructure);
		});

		it("should handle empty strings", () => {
			const text = "";
			const expectedStructure = {
				root: {
					type: "root",
					children: [
						{
							type: "paragraph",
							children: [
								{
									text: "",
									type: "text",
								},
							],
							version: 1,
						},
					],
					direction: "ltr",
					format: "left",
					indent: 0,
					version: 1,
				},
			};
			expect(createRichText(text)).toEqual(expectedStructure);
		});

		it("should handle strings with special characters", () => {
			const text = "Special chars: <> & \" ' ";
			const expectedStructure = {
				root: {
					type: "root",
					children: [
						{
							type: "paragraph",
							children: [
								{
									text: text,
									type: "text",
								},
							],
							version: 1,
						},
					],
					direction: "ltr",
					format: "left",
					indent: 0,
					version: 1,
				},
			};
			expect(createRichText(text)).toEqual(expectedStructure);
		});
	});

	// Add tests for other seed functions later if mocking is allowed
});
