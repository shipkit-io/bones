// Minimal CommonJS shim for next/server to satisfy next-auth/env during unit tests
class NextRequest {}
const NextResponse = {
	json: (body, init) => ({ body, init }),
	redirect: (url) => ({ url }),
};
function headers() {
	return new Headers();
}
function cookies() {
	return { get: () => undefined };
}
module.exports = { NextRequest, NextResponse, headers, cookies };
