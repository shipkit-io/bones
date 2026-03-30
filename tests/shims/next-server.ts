// Minimal Next.js server stubs for unit tests
// This avoids import errors from next-auth/env importing "next/server" in Vitest

export class NextRequest {}

export const NextResponse = {
	json: (body?: unknown, init?: unknown) => ({ body, init }),
	redirect: (url: string) => ({ url }),
};

export function headers(): Headers {
	return new Headers();
}

export function cookies(): { get: (name: string) => undefined } {
	return { get: () => undefined };
}

// Also provide CommonJS compatibility for require() from next-auth/env
// @ts-expect-error
module.exports = { NextRequest, NextResponse, headers, cookies };

export default {} as any;
