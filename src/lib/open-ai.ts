import { env } from "@/env";
import OpenAI from "openai";

export const openai = env?.OPENAI_API_KEY
	? new OpenAI({
			apiKey: env?.OPENAI_API_KEY,
		})
	: null;
