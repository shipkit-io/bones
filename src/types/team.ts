import type { TeamData } from "@/components/providers/team-provider";

export type TeamType = "personal" | "workspace";

export interface Team {
	team: TeamData & {
		type: TeamType;
		createdAt?: Date;
		updatedAt?: Date | null;
	};
	role: string;
}
