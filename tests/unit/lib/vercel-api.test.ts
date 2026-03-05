import { afterEach, describe, expect, test, vi } from "vitest";
import { VercelAPIService } from "@/lib/vercel-api";

const ORIGINAL_FETCH = globalThis.fetch;

interface DeploymentRequestBody {
	gitSource?: {
		type: "github";
		ref: string;
		repoId: number;
	};
}

function createJsonResponse(data: unknown, init?: ResponseInit) {
	return new Response(JSON.stringify(data), {
		status: init?.status ?? 200,
		statusText: init?.statusText,
		headers: {
			"Content-Type": "application/json",
			...(init?.headers ?? {}),
		},
	});
}

function mockFetch(handler: (url: URL, init?: RequestInit) => Response) {
	const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = new URL(typeof input === "string" ? input : input.toString());
		return handler(url, init);
	});

	globalThis.fetch = fetchMock as unknown as typeof fetch;
	return fetchMock;
}

afterEach(() => {
	globalThis.fetch = ORIGINAL_FETCH;
});

describe("VercelAPIService createProject", () => {
	test("uses team slug for project URLs", async () => {
		mockFetch((url) => {
			if (url.pathname === "/v10/projects") {
				return createJsonResponse({
					id: "proj_123",
					name: "delete-1211",
					accountId: "team_EBKOFxzHkAqno5qRIKT4JjUY",
				});
			}

			if (url.pathname === "/v2/teams/team_EBKOFxzHkAqno5qRIKT4JjUY") {
				return createJsonResponse({ slug: "shipkits-projects" });
			}

			throw new Error(`Unexpected request: ${url.toString()}`);
		});

		const service = new VercelAPIService({ accessToken: "token" });
		const result = await service.createProject({ name: "delete-1211" });

		expect(result.projectUrl).toBe(
			"https://vercel.com/shipkits-projects/delete-1211"
		);
	});

	test("falls back to user slug when team lookup fails", async () => {
		mockFetch((url) => {
			if (url.pathname === "/v10/projects") {
				return createJsonResponse({
					id: "proj_456",
					name: "delete-1211",
					accountId: "user_123",
				});
			}

			if (url.pathname === "/v2/teams/user_123") {
				return createJsonResponse({}, { status: 404, statusText: "Not Found" });
			}

			if (url.pathname === "/v2/user") {
				return createJsonResponse({
					user: {
						username: "shipkits-projects",
					},
				});
			}

			throw new Error(`Unexpected request: ${url.toString()}`);
		});

		const service = new VercelAPIService({ accessToken: "token" });
		const result = await service.createProject({ name: "delete-1211" });

		expect(result.projectUrl).toBe(
			"https://vercel.com/shipkits-projects/delete-1211"
		);
	});
});

describe("VercelAPIService createDeployment", () => {
	test("includes repoId when using gitSource", async () => {
		let deploymentBody: DeploymentRequestBody | undefined;

		mockFetch((url, init) => {
			if (url.pathname === "/v13/deployments") {
				deploymentBody = JSON.parse(String(init?.body ?? "{}")) as DeploymentRequestBody;
				return createJsonResponse({
					id: "dep_123",
					url: "delete-1211.vercel.app",
				});
			}

			throw new Error(`Unexpected request: ${url.toString()}`);
		});

		const service = new VercelAPIService({ accessToken: "token" });
		const result = await service.createDeployment("proj_123", "delete-1211", "main", 123456);

		expect(result.success).toBe(true);
		expect(deploymentBody?.gitSource).toEqual({
			type: "github",
			ref: "main",
			repoId: 123456,
		});
	});
});
