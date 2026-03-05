import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DashboardVercelDeploy } from "@/components/modules/deploy/dashboard-vercel-deploy"

vi.mock("next-auth/react", () => ({
	useSession: () => ({ data: null }),
}))

vi.mock("@/server/actions/deployment-actions", () => ({
	initiateDeployment: vi.fn(),
}))

interface AvailabilityResponse {
	available: boolean
	checked: boolean
	error?: string
}

interface MockResponse {
	ok: boolean
	json: () => Promise<AvailabilityResponse>
}

type FetchArgs = [RequestInfo | URL, RequestInit | undefined]
type FetchMock = ReturnType<typeof vi.fn<Promise<MockResponse>, FetchArgs>>

function createResponse(data: AvailabilityResponse): MockResponse {
	return {
		ok: true,
		json: async () => data,
	}
}

describe("DashboardVercelDeploy", () => {
	let fetchMock: FetchMock
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		vi.useFakeTimers()
		originalFetch = global.fetch
		fetchMock = vi.fn<Promise<MockResponse>, FetchArgs>()
		global.fetch = fetchMock as unknown as typeof fetch
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.clearAllMocks()
		global.fetch = originalFetch
	})

	it("ignores stale availability responses when typing continues", async () => {
		fetchMock.mockImplementation((input) => {
			const url =
				typeof input === "string"
					? input
					: input instanceof URL
						? input.toString()
						: input.url
			const name = new URL(url, "http://localhost").searchParams.get("name") ?? ""
			const isUnavailable = name === "bad-repo"
			const delayMs = isUnavailable ? 100 : 10
			const payload: AvailabilityResponse = isUnavailable
				? {
						available: false,
						checked: true,
						error: "Repository name not available",
					}
				: {
						available: true,
						checked: true,
					}

			return new Promise((resolve) => {
				setTimeout(() => resolve(createResponse(payload)), delayMs)
			})
		})

		const queryClient = new QueryClient()
		render(
			<QueryClientProvider client={queryClient}>
				<DashboardVercelDeploy />
			</QueryClientProvider>,
		)

		fireEvent.click(screen.getByRole("button", { name: /deploy to vercel/i }))
		const input = await screen.findByLabelText("Project Name")

		fireEvent.change(input, { target: { value: "bad-repo" } })
		await vi.advanceTimersByTimeAsync(300)

		fireEvent.change(input, { target: { value: "good-repo" } })
		await vi.advanceTimersByTimeAsync(300)
		await vi.advanceTimersByTimeAsync(10)

		await waitFor(() => {
			expect(screen.getByText("✓ Name available")).toBeInTheDocument()
		})

		await vi.advanceTimersByTimeAsync(100)

		expect(
			screen.queryByText(/repository name not available/i),
		).not.toBeInTheDocument()
	})
})
