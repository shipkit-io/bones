/**
 * Deterministic Secret Derivation Utilities (Pure)
 *
 * Allows a single `APP_SECRET` to deterministically derive integration-specific
 * secrets (e.g., `AUTH_SECRET`, `PAYLOAD_SECRET`, `BETTER_AUTH_SECRET`).
 *
 * - No process.env mutation here. These helpers are pure and used by
 *   build-time configuration to inject values via Next.js `env`.
 */

import crypto from "crypto";
import { BASE_URL } from "./base-url";

export function getMasterAppSecret(): string {
	const provided = process.env.APP_SECRET;
	if (typeof provided === "string" && provided.trim().length > 0) {
		return provided;
	}

	const input = `${BASE_URL}|shipkit|app-secret|v1`;
	return crypto.createHash("sha256").update(input).digest("hex");
}

export function deriveSecret(name: string): string {
	const master = getMasterAppSecret();
	const material = `${BASE_URL}|${name}|v1`;
	return crypto.createHmac("sha256", master).update(material).digest("hex");
}

export function getDerivedSecrets(): Record<string, string> {
	return {
		APP_SECRET: getMasterAppSecret(),
		AUTH_SECRET: process.env.AUTH_SECRET ?? deriveSecret("auth"),
		PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ?? deriveSecret("payload"),
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? deriveSecret("better-auth"),
	};
}
