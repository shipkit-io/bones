import { buildTimeFeatures } from "@/config/features-config";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
	success: boolean;
	"error-codes"?: string[];
}

/**
 * Check if Cloudflare Turnstile is fully configured.
 * Only returns true if both site key and secret key are set.
 * Call this from Server Components only.
 */
export function isTurnstileConfigured(): boolean {
	return buildTimeFeatures.TURNSTILE_ENABLED === true;
}

/**
 * Verify a Turnstile token with Cloudflare's API.
 * @param token - The token from the Turnstile widget
 * @returns Promise<boolean> - Whether the token is valid
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
	const secretKey = process.env.TURNSTILE_SECRET_KEY;

	if (!secretKey) {
		console.error("Turnstile secret key not configured");
		return false;
	}

	try {
		const response = await fetch(TURNSTILE_VERIFY_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				secret: secretKey,
				response: token,
			}),
		});

		if (!response.ok) {
			console.error(
				`Turnstile verification request failed: ${response.status} ${response.statusText}`,
			);
			return false;
		}

		const data = (await response.json()) as TurnstileResponse;

		if (!data.success) {
			console.warn("Turnstile verification failed with error codes:", data["error-codes"]);
		}

		return data.success === true;
	} catch (error) {
		console.error("Error verifying Turnstile token:", error);
		return false;
	}
}
