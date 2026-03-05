"use server";

/**
 * @fileoverview Server actions for temporary link operations (mutations only)
 * NOTE: For read operations, use the service directly:
 * import { getTemporaryLinkData } from "@/server/services/temporary-links"
 */

import { createTemporaryLink } from "@/server/services/temporary-links";

/**
 * Generates a temporary download link for a user
 */
export const generateTemporaryLink = async ({
	data = "hello",
	userId,
}: {
	data?: string;
	userId: string;
}) => {
	const link = await createTemporaryLink({ data, userId, type: "download" });
	if (!link || link.length === 0 || !link[0]) {
		throw new Error("Failed to create temporary link");
	}
	return link[0].id;
};
