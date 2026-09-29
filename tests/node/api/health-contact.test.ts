import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/(app)/api/health/contact/route";

const HEALTH_URL = "https://example.com/api/health/contact";

const makeRequest = (init?: { token?: string; query?: string }) =>
  new Request(`${HEALTH_URL}${init?.query ?? ""}`, {
    headers: init?.token ? { "x-healthcheck-token": init.token } : undefined,
  });

const mockResendResponse = (status: number) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status }));

describe("GET /api/health/contact", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.HEALTHCHECK_TOKEN;
    process.env.RESEND_API_KEY = "re_test_key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("returns 200 with all checks passing when Resend accepts the key", async () => {
    const fetchSpy = mockResendResponse(200);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.checks.every((c: { ok: boolean }) => c.ok)).toBe(true);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.resend.com/domains",
      expect.objectContaining({
        headers: { Authorization: "Bearer re_test_key" },
      })
    );
  });

  it("returns 503 when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.ok).toBe(false);
    const keyCheck = body.checks.find((c: { name: string }) => c.name === "resend_api_key");
    expect(keyCheck.ok).toBe(false);
  });

  it("returns 503 when Resend rejects the key", async () => {
    mockResendResponse(401);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.ok).toBe(false);
  });

  it("returns 200 for a valid sending-only (restricted) key", async () => {
    // Resend rejects /domains for send-only keys with name "restricted_api_key",
    // but such a key is valid for sending — the form is healthy.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 401,
          message: "This API key is restricted to only send emails",
          name: "restricted_api_key",
        }),
        { status: 401 }
      )
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("returns 503 for an invalid key (Resend HTTP 400)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 400,
          message: "API key is invalid",
          name: "validation_error",
        }),
        { status: 400 }
      )
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.ok).toBe(false);
  });

  it("returns 503 when the Resend request throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    const res = await GET(makeRequest());

    expect(res.status).toBe(503);
  });

  it("verifies siteConfig support and noreply emails are configured", async () => {
    mockResendResponse(200);

    const res = await GET(makeRequest());
    const body = await res.json();

    const names = body.checks.map((c: { name: string }) => c.name);
    expect(names).toContain("support_email");
    expect(names).toContain("noreply_email");
  });

  describe("HEALTHCHECK_TOKEN gate", () => {
    beforeEach(() => {
      process.env.HEALTHCHECK_TOKEN = "s3cret";
    });

    it("rejects requests without the token", async () => {
      const res = await GET(makeRequest());
      expect(res.status).toBe(401);
    });

    it("accepts the token via header", async () => {
      mockResendResponse(200);
      const res = await GET(makeRequest({ token: "s3cret" }));
      expect(res.status).toBe(200);
    });

    it("accepts the token via query param", async () => {
      mockResendResponse(200);
      const res = await GET(makeRequest({ query: "?token=s3cret" }));
      expect(res.status).toBe(200);
    });

    it("rejects a wrong token", async () => {
      const res = await GET(makeRequest({ token: "wrong" }));
      expect(res.status).toBe(401);
    });
  });
});
