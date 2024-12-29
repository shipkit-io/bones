import type { Config } from "@/payload-types";
import type { Where } from "payload";

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
	} = {},
) {
	try {
    const { payload } = import("@/lib/payload/payload").catch(()=>{})
		const response = await payload?.find({
			collection,
			sort,
			where,
			limit,
			page,
			depth,
		});

		return response?.docs as Collections[T][];
	} catch (error) {
	   // Eat error
		return [];
	}
}
