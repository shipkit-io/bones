import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env" });

// Mock environment variables
process.env = {
	...process.env,
	NODE_ENV: "test",
	SKIP_ENV_VALIDATION: "1",
};
