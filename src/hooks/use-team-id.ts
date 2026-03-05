"use client";

import { useTeam } from "@/components/providers/team-provider";

export const useTeamId = () => {
	const { selectedTeamId } = useTeam();
	return selectedTeamId;
};
