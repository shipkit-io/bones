import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload/payload";
import type { Config } from "@/payload-types";

type Collections = Config["collections"];
type CollectionKey = keyof Collections;

export async function getPayloadCollection<T extends CollectionKey>(
	collection: T,
	{
		sort,
		where,
		limit,
		page,
		depth = 0,
	}: {
		sort?: string;
		where?: Where;
		limit?: number;
		page?: number;
		depth?: number;
	} = {}
) {
	try {
		const payload = await getPayloadClient();
		if (!payload) {
			console.debug("Payload not available, returning empty array");
			return [];
		}

		const response = await payload.find({
			collection,
			sort,
			where,
			limit,
			page,
			depth,
		});

		return response?.docs as Collections[T][];
	} catch (error) {
		console.error(`Error fetching ${collection}:`, error);
		return [];
	}
}
