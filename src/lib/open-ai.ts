import OpenAI from "openai";
import { env } from "@/env";

// Initialize OpenAI client only if the feature is enabled and the API key is present
export const openai =
	env.NEXT_PUBLIC_FEATURE_OPENAI_ENABLED && env?.OPENAI_API_KEY
		? new OpenAI({
				apiKey: env?.OPENAI_API_KEY,
			})
		: null; // Set to null if disabled or key is missing
