import type { NextApiRequest, NextApiResponse } from "next";

interface DemoResponse {
	message: string;
	timestamp: string;
	method: string;
	query: Record<string, string | string[] | undefined>;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<DemoResponse>) {
	res.status(200).json({
		message: "Hello from the Pages Router API!",
		timestamp: new Date().toISOString(),
		method: req.method ?? "unknown",
		query: req.query,
	});
}
