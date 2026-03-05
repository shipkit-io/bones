import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as deploymentActions from "@/server/actions/deployment-actions";
import { auth } from "@/server/auth";
import * as db from "@/server/db";
import { deployments } from "@/server/db/schema";

// Mock auth module
vi.mock("@/server/auth", () => ({
	auth: vi.fn(),
}));

// Mock database
vi.mock("@/server/db", () => ({
	db: {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		values: vi.fn().mockReturnThis(),
		returning: vi.fn().mockReturnThis(),
		update: vi.fn().mockReturnThis(),
		set: vi.fn().mockReturnThis(),
		delete: vi.fn().mockReturnThis(),
		eq: vi.fn((a, b) => ({ a, b })),
		and: vi.fn((...args) => args),
		desc: vi.fn((col) => col),
		execute: vi.fn(),
		then: vi.fn(),
	},
}));

describe.skip("Deployment Actions (DB gated)", () => {
	const mockUserId = "test-user-id";
	const mockSession = { user: { id: mockUserId } };

	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(auth).mockResolvedValue(mockSession as any);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("createDeployment", () => {
		it("should create a deployment when authenticated", async () => {
			const newDeployment = {
				projectName: "new-project",
				description: "Test deployment",
				status: "deploying" as const,
				deployUrl: "https://example.vercel.app",
				githubUrl: "https://github.com/user/repo",
			};

			const mockCreatedDeployment = {
				id: "new-id",
				userId: mockUserId,
				...newDeployment,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(db.db.returning).mockReturnValue({
				then: vi.fn().mockResolvedValue([mockCreatedDeployment]),
			} as any);

			const result = await deploymentActions.createDeployment(newDeployment);

			expect(result).toEqual(mockCreatedDeployment);
			expect(auth).toHaveBeenCalled();
			expect(db.db.insert).toHaveBeenCalledWith(deployments);
		});

		it("should throw error when not authenticated", async () => {
			vi.mocked(auth).mockResolvedValue(null);

			await expect(
				deploymentActions.createDeployment({
					projectName: "test",
					status: "deploying",
				})
			).rejects.toThrow("Unauthorized");
		});
	});

	describe("updateDeployment", () => {
		it("should update deployment when authenticated and owns deployment", async () => {
			const deploymentId = "test-deployment-id";
			const updates = {
				status: "completed" as const,
				deployUrl: "https://updated.vercel.app",
			};

			const mockUpdatedDeployment = {
				id: deploymentId,
				userId: mockUserId,
				...updates,
				updatedAt: new Date(),
			};

			vi.mocked(db.db.returning).mockReturnValue({
				then: vi.fn().mockResolvedValue([mockUpdatedDeployment]),
			} as any);

			const result = await deploymentActions.updateDeployment(deploymentId, updates);

			expect(result).toEqual(mockUpdatedDeployment);
			expect(auth).toHaveBeenCalled();
			expect(db.db.update).toHaveBeenCalledWith(deployments);
		});

		it("should throw error when not authenticated", async () => {
			vi.mocked(auth).mockResolvedValue(null);

			await expect(
				deploymentActions.updateDeployment("id", { status: "completed" })
			).rejects.toThrow("Unauthorized");
		});
	});

	describe("deleteDeployment", () => {
		it("should delete deployment when authenticated and owns deployment", async () => {
			const deploymentId = "test-deployment-id";

			vi.mocked(db.db.returning).mockReturnValue({
				then: vi.fn().mockResolvedValue([{ id: deploymentId }]),
			} as any);

			const result = await deploymentActions.deleteDeployment(deploymentId);

			expect(result).toBe(true);
			expect(auth).toHaveBeenCalled();
			expect(db.db.delete).toHaveBeenCalledWith(deployments);
		});

		it("should return false when deployment not found", async () => {
			vi.mocked(db.db.returning).mockReturnValue({
				then: vi.fn().mockResolvedValue([]),
			} as any);

			const result = await deploymentActions.deleteDeployment("non-existent");

			expect(result).toBe(false);
		});

		it("should throw error when not authenticated", async () => {
			vi.mocked(auth).mockResolvedValue(null);

			await expect(deploymentActions.deleteDeployment("id")).rejects.toThrow("Unauthorized");
		});
	});

});
