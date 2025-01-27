import { headers } from "next/headers";

/**
 * Check if we're in server-side rendering (SSR) context
 * @returns {boolean} true if in SSR, false if in runtime context
 */
export const isSSR = () => {
	try {
		headers();
		return false; // If headers() doesn't throw, we're in a runtime context
	} catch {
		return true; // If headers() throws, we're in SSR
	}
};
