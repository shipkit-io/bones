import {
	createFeedback,
	updateFeedbackStatus,
} from "@/server/services/feedback-service";
import { describe, expect, it } from "vitest";

const options = {
	skipEmail: true,
};

describe("Feedback Service", () => {
	describe("createFeedback", () => {
		it("creates feedback with required fields", async () => {
			const feedback = await createFeedback(
				{
					content: "Test feedback",
					source: "dialog",
				},
				options,
			);

			expect(feedback).toBeDefined();
			if (!feedback) throw new Error("Feedback should be defined");
			expect(feedback.content).toBe("Test feedback");
			expect(feedback.source).toBe("dialog");
			expect(feedback.status).toBe("new");
			expect(feedback.metadata).toBe("{}");
			expect(feedback.createdAt).toBeInstanceOf(Date);
		});

		it("creates feedback with metadata", async () => {
			const metadata = { key: "value" };
			const feedback = await createFeedback(
				{
					content: "Test feedback with metadata",
					source: "dialog",
					metadata,
				},
				options,
			);

			expect(feedback).toBeDefined();
			if (!feedback) throw new Error("Feedback should be defined");
			expect(feedback.content).toBe("Test feedback with metadata");
			expect(feedback.source).toBe("dialog");
			expect(feedback.status).toBe("new");
			expect(feedback.metadata).toBe(JSON.stringify(metadata));
			expect(feedback.createdAt).toBeInstanceOf(Date);
		});

		it("handles empty metadata", async () => {
			const feedback = await createFeedback(
				{
					content: "Test feedback with empty metadata",
					source: "dialog",
					metadata: {},
				},
				options,
			);

			expect(feedback).toBeDefined();
			if (!feedback) throw new Error("Feedback should be defined");
			expect(feedback.content).toBe("Test feedback with empty metadata");
			expect(feedback.source).toBe("dialog");
			expect(feedback.status).toBe("new");
			expect(feedback.metadata).toBe("{}");
			expect(feedback.createdAt).toBeInstanceOf(Date);
		});

		it("handles long content", async () => {
			const longContent = "a".repeat(1000);
			const feedback = await createFeedback(
				{
					content: longContent,
					source: "dialog",
				},
				options,
			);

			expect(feedback).toBeDefined();
			if (!feedback) throw new Error("Feedback should be defined");
			expect(feedback.content).toBe(longContent);
			expect(feedback.source).toBe("dialog");
			expect(feedback.status).toBe("new");
			expect(feedback.metadata).toBe("{}");
			expect(feedback.createdAt).toBeInstanceOf(Date);
		});

		it("handles special characters in content", async () => {
			const specialContent = "Test 🚀 with special chars: @#$%^&*()";
			const feedback = await createFeedback(
				{
					content: specialContent,
					source: "dialog",
				},
				options,
			);

			expect(feedback).toBeDefined();
			if (!feedback) throw new Error("Feedback should be defined");
			expect(feedback.content).toBe(specialContent);
			expect(feedback.source).toBe("dialog");
			expect(feedback.status).toBe("new");
			expect(feedback.metadata).toBe("{}");
			expect(feedback.createdAt).toBeInstanceOf(Date);
		});

		it("rejects empty content", async () => {
			await expect(
				createFeedback(
					{
						content: "",
						source: "dialog",
					},
					options,
				),
			).rejects.toThrow();
		});

		it("rejects invalid source", async () => {
			await expect(
				createFeedback(
					{
						content: "Test feedback",
						source: "invalid" as any,
					},
					options,
				),
			).rejects.toThrow();
		});
	});

	describe("updateFeedbackStatus", () => {
		it("updates feedback status", async () => {
			const feedback = await createFeedback(
				{
					content: "Test feedback",
					source: "dialog",
				},
				options,
			);

			expect(feedback).toBeDefined();
			if (!feedback) throw new Error("Feedback should be defined");

			const updatedFeedback = await updateFeedbackStatus(
				feedback.id,
				"reviewed",
			);

			expect(updatedFeedback).toBeDefined();
			if (!updatedFeedback)
				throw new Error("Updated feedback should be defined");
			expect(updatedFeedback.status).toBe("reviewed");
			expect(updatedFeedback.updatedAt).toBeInstanceOf(Date);
		});

		it("returns undefined for non-existent feedback", async () => {
			const result = await updateFeedbackStatus("non-existent-id", "reviewed");
			expect(result).toBeUndefined();
		});

		it("rejects invalid status", async () => {
			const feedback = await createFeedback(
				{
					content: "Test feedback",
					source: "dialog",
				},
				options,
			);

			expect(feedback).toBeDefined();
			if (!feedback) throw new Error("Feedback should be defined");

			await expect(
				updateFeedbackStatus(feedback.id, "invalid" as any),
			).rejects.toThrow();
		});
	});
});
