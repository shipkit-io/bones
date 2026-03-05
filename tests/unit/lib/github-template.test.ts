import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GitHubTemplateService } from "@/lib/github-template"

const mockCreateWorkflowDispatch = vi.fn()

vi.mock("@octokit/rest", () => ({
	Octokit: vi.fn(() => ({
		repos: {
			replaceAllTopics: vi.fn(),
		},
		actions: {
			createWorkflowDispatch: mockCreateWorkflowDispatch,
		},
	})),
}))

describe("GitHubTemplateService", () => {
	beforeEach(() => {
		mockCreateWorkflowDispatch.mockReset()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it("dispatches init-upstream workflow on provided ref", async () => {
		vi.useFakeTimers()
		mockCreateWorkflowDispatch.mockResolvedValue({})

		const service = new GitHubTemplateService({ accessToken: "token" })

		const result = service.initializeUpstreamHistory("ship-kit", "repo-name", "develop")
		await vi.advanceTimersByTimeAsync(3000)
		await result

		expect(mockCreateWorkflowDispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				owner: "ship-kit",
				repo: "repo-name",
				workflow_id: "init-upstream.yml",
				ref: "develop",
			}),
		)
	})

})
