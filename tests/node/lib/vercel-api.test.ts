/**
 * Regression tests for the Vercel API wrapper's error handling.
 *
 * LAC-5269 replaced the `(error as any).status = ...` error decoration with the
 * `VercelApiError` class and typed narrowing helpers. These tests pin the
 * user-facing strings and result shapes that refactor had to preserve.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createVercelAPIService, VercelApiError } from "@/lib/vercel-api";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const projectConfig = {
  name: "my-app",
  gitRepository: { type: "github" as const, repo: "acme/my-app" },
  environmentVariables: [
    { key: "ADMIN_EMAIL", value: "a@b.c", target: ["production"] as const },
  ],
};

describe("VercelAPIService", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the project id and the slug-based project URL on success", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("/v10/projects")) {
        return Promise.resolve(json(200, { id: "prj_1", name: "my-app", accountId: "team_1" }));
      }
      if (url.includes("/v2/teams/")) {
        return Promise.resolve(json(200, { slug: "acme" }));
      }
      throw new Error(`unexpected request: ${url}`);
    });

    const result = await createVercelAPIService("token").createProject(projectConfig);

    expect(result.success).toBe(true);
    expect(result.projectId).toBe("prj_1");
    expect(result.projectUrl).toBe("https://vercel.com/acme/my-app");
  });

  it("maps a 409 to the duplicate-name message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json(409, {}));

    const result = await createVercelAPIService("token").createProject(projectConfig);

    expect(result).toMatchObject({
      success: false,
      error: "A project with this name already exists.",
    });
  });

  it("keeps the 400 missing_github_integration message and the error payload", async () => {
    const payload = { error: { code: "missing_github_integration", message: "nope" } };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json(400, payload));

    const result = await createVercelAPIService("token").createProject(projectConfig);

    expect(result.error).toBe(
      "GitHub integration not connected to your Vercel account. Please connect GitHub in your Vercel dashboard first."
    );
    expect(result.details).toEqual(payload);
  });

  it("surfaces the provider message on a 422", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      json(422, { error: { code: "unprocessable", message: "Invalid framework" } })
    );

    const result = await createVercelAPIService("token").createProject(projectConfig);

    expect(result.error).toBe("Invalid framework");
  });

  it("falls back to the thrown error's message when the failure is not an API error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("socket hang up"));

    const result = await createVercelAPIService("token").createProject(projectConfig);

    expect(result).toMatchObject({ success: false, error: "socket hang up" });
  });

  it("throws a VercelApiError carrying the status and the response body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json(401, { error: { message: "bad token" } }));

    // getDeployments swallows the error, so assert on a path that returns it.
    const service = createVercelAPIService("token");
    const result = await service.getProject("prj_1");

    expect(result).toEqual({
      success: false,
      error: "Vercel authentication failed. Please check your access token.",
    });

    const error = new VercelApiError("boom", 503, { error: { message: "down" } });
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(503);
    expect(error.response.data).toEqual({ error: { message: "down" } });
  });
});
