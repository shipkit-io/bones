import { describe, expect, it } from "vitest";
import { resolveDeploymentStatusFromVercelState } from "@/server/services/deployment-service";

describe("resolveDeploymentStatusFromVercelState", () => {
	it("returns completed for READY", () => {
		const result = resolveDeploymentStatusFromVercelState("READY");

		expect(result).toEqual({
			status: "completed",
			isTerminal: true,
		});
	});

	it("returns failed for ERROR", () => {
		const result = resolveDeploymentStatusFromVercelState("ERROR");

		expect(result).toEqual({
			status: "failed",
			isTerminal: true,
			error: "Vercel deployment failed",
		});
	});

	it("returns failed for CANCELED", () => {
		const result = resolveDeploymentStatusFromVercelState("CANCELED");

		expect(result).toEqual({
			status: "failed",
			isTerminal: true,
			error: "Vercel deployment was canceled",
		});
	});

	it("returns deploying for non-terminal states", () => {
		const result = resolveDeploymentStatusFromVercelState("BUILDING");

		expect(result).toEqual({
			status: "deploying",
			isTerminal: false,
		});
	});

	it("returns deploying when state is missing", () => {
		const result = resolveDeploymentStatusFromVercelState(undefined);

		expect(result).toEqual({
			status: "deploying",
			isTerminal: false,
		});
	});
});
