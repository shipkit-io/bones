export const BASE_URL =
	process.env.NODE_ENV === "production"
		? (process.env.URL ?? `https://${process.env.VERCEL_URL}`)
		: typeof window !== "undefined"
			? window.location.origin
			: `http://localhost:${process.env.PORT}`;
