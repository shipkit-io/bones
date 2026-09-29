import { siteConfig } from "@/config/site-config";

/**
 * Contact-form health check (LAC-3572, part of LAC-3570).
 *
 * Verifies the configuration that historically takes the contact form down —
 * a missing/revoked RESEND_API_KEY or a missing from/to address — WITHOUT
 * sending a real email. A daily CI job (see
 * .github/workflows/contact-form-healthcheck.yml) hits this endpoint so the
 * form can't silently break again.
 *
 * The contact form submits via the `submitContactForm` server action, which
 * has no stable REST surface to probe, so this endpoint is the primary
 * monitoring layer: it validates the same inputs the action depends on
 * (Resend credentials + siteConfig.email addresses).
 *
 * Optionally gated by HEALTHCHECK_TOKEN: if set, callers must pass ?token=...
 * or an "x-healthcheck-token" header. If unset, the endpoint is open (so
 * monitoring keeps working even before the token exists).
 */

export const dynamic = "force-dynamic";

const RESEND_DOMAINS_URL = "https://api.resend.com/domains";

interface HealthCheck {
  name: string;
  ok: boolean;
  detail: string;
}

const isAuthorized = (request: Request): boolean => {
  const expected = process.env.HEALTHCHECK_TOKEN;
  if (!expected) return true; // no token configured -> open
  const provided =
    request.headers.get("x-healthcheck-token") ?? new URL(request.url).searchParams.get("token");
  return provided === expected;
};

/**
 * Confirms the Resend API key is present AND actually valid, by making a
 * lightweight authenticated read (listing domains). No email is sent.
 */
const checkResend = async (): Promise<HealthCheck> => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { name: "resend_api_key", ok: false, detail: "RESEND_API_KEY not set" };
  }

  try {
    const response = await fetch(RESEND_DOMAINS_URL, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!response.ok) {
      // Sending-only keys can't list domains, but the rejection proves the
      // key authenticated — Resend names it "restricted_api_key". That key
      // still sends mail, so the form is healthy.
      const body = (await response.json().catch(() => null)) as {
        name?: string;
        message?: string;
      } | null;
      if (body?.name === "restricted_api_key" || body?.message?.includes("restricted")) {
        return { name: "resend_api_key", ok: true, detail: "valid (sending-only key)" };
      }
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        return {
          name: "resend_api_key",
          ok: false,
          detail: `Resend rejected key (HTTP ${response.status}): ${body?.message ?? "unknown"}`,
        };
      }
      return {
        name: "resend_api_key",
        ok: false,
        detail: `Resend API unhealthy (HTTP ${response.status})`,
      };
    }
    return { name: "resend_api_key", ok: true, detail: "valid" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { name: "resend_api_key", ok: false, detail: `Resend request failed: ${message}` };
  }
};

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const checks: HealthCheck[] = [
    // The server action sends to siteConfig.email.support from .noreply —
    // both must be non-empty for delivery to work.
    {
      name: "support_email",
      ok: Boolean(siteConfig.email?.support),
      detail: siteConfig.email?.support ? "set" : "siteConfig.email.support not set",
    },
    {
      name: "noreply_email",
      ok: Boolean(siteConfig.email?.noreply),
      detail: siteConfig.email?.noreply ? "set" : "siteConfig.email.noreply not set",
    },
    await checkResend(),
  ];

  const ok = checks.every((check) => check.ok);
  return Response.json(
    { ok, checks },
    {
      status: ok ? 200 : 503,
      // Disable caching so monitors always see live state.
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
