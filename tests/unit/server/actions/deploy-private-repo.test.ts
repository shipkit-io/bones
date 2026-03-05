import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	deployPrivateRepository,
	generateProjectNameSuggestions,
} from "@/server/actions/deploy-private-repo";
import { auth } from "@/server/auth";
import { getVercelAccessToken } from "@/server/services/vercel/vercel-service";

// Mock the dependencies
vi.mock("@/server/auth");
vi.mock("@/server/services/vercel/vercel-service");
vi.mock("@/lib/github-template");
vi.mock("@/lib/vercel-api");

const mockAuth = vi.mocked(auth);
const mockGetVercelAccessToken = vi.mocked(getVercelAccessToken);

describe.skip("deployPrivateRepository", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("should return error when user is not authenticated", async () => {
		mockAuth.mockResolvedValue(null);

		const result = await deployPrivateRepository({
			templateRepo: "owner/repo",
			newRepoName: "test-repo",
			projectName: "test-project",
			description: "Test project",
			githubToken: "github_token",
			environmentVariables: [],
		});

		expect(result).toEqual({
			success: false,
			error: "Authentication required",
		});
	});

	it("should return error when Vercel account is not connected", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user123", email: "test@example.com" },
		} as any);
		mockGetVercelAccessToken.mockResolvedValue(null);

		const result = await deployPrivateRepository({
			templateRepo: "owner/repo",
			newRepoName: "test-repo",
			projectName: "test-project",
			description: "Test project",
			githubToken: "github_token",
			environmentVariables: [],
		});

		expect(result).toEqual({
			success: false,
			error: "Vercel account not connected. Please connect your Vercel account in Settings first.",
		});
	});

	it("should validate required parameters", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user123", email: "test@example.com" },
		} as any);
		mockGetVercelAccessToken.mockResolvedValue("vercel_token");

		const result = await deployPrivateRepository({
			templateRepo: "",
			newRepoName: "test-repo",
			projectName: "test-project",
			description: "Test project",
			githubToken: "github_token",
			environmentVariables: [],
		});

		expect(result).toEqual({
			success: false,
			error: "Template repository is required",
		});
	});

	it("should validate project name format", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user123", email: "test@example.com" },
		} as any);
		mockGetVercelAccessToken.mockResolvedValue("vercel_token");

		const result = await deployPrivateRepository({
			templateRepo: "owner/repo",
			newRepoName: "test-repo",
			projectName: "Invalid Project Name!",
			description: "Test project",
			githubToken: "github_token",
			environmentVariables: [],
		});

		expect(result).toEqual({
			success: false,
			error: "Project name must be lowercase letters, numbers, and hyphens only",
		});
	});

	it("should validate GitHub token format", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user123", email: "test@example.com" },
		} as any);
		mockGetVercelAccessToken.mockResolvedValue("vercel_token");

		const result = await deployPrivateRepository({
			templateRepo: "owner/repo",
			newRepoName: "test-repo",
			projectName: "test-project",
			description: "Test project",
			githubToken: "invalid_token",
			environmentVariables: [],
		});

		expect(result).toEqual({
			success: false,
			error: "Invalid GitHub token format",
		});
	});
});

describe("generateProjectNameSuggestions", () => {
	it("should generate valid project name suggestions", async () => {
		const suggestions = await generateProjectNameSuggestions("My Awesome Project");

		expect(suggestions).toHaveLength(5);
		expect(suggestions[0]).toBe("my-awesome-project");
		expect(suggestions).toContain("my-awesome-project-app");
		expect(suggestions).toContain("my-awesome-project-web");

		// All suggestions should be valid project names
		suggestions.forEach((suggestion) => {
			expect(suggestion).toMatch(/^[a-z0-9-]+$/);
			expect(suggestion).not.toMatch(/^-|-$/); // Should not start or end with hyphen
		});
	});

	it("should handle repository names with special characters", async () => {
		const suggestions = await generateProjectNameSuggestions("user/repo-name_v2.0");

		expect(suggestions[0]).toBe("user-repo-name-v2-0");
		suggestions.forEach((suggestion) => {
			expect(suggestion).toMatch(/^[a-z0-9-]+$/);
		});
	});
});
