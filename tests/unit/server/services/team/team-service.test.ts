import { db } from "@/server/db";
import { teamMembers, teams } from "@/server/db/schema";
import { TeamService } from "@/server/services/team-service";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, test } from "vitest";

const TEST_USER = {
	id: "test-user-id",
	email: "test@shipkit.io",
};

describe("TeamService", () => {
	let teamService: TeamService;

	beforeAll(() => {
		teamService = new TeamService();
	});

	afterEach(async () => {
		// Clean up test data
		await db.delete(teamMembers);
		await db.delete(teams);
	});

	describe("createTeam", () => {
		test("should create a workspace team with owner", async () => {
			// Act
			const team = await teamService.createTeam(TEST_USER.id, "Test Team");

			// Assert
			expect(team).toBeDefined();
			expect(team?.name).toBe("Test Team");
			expect(team?.type).toBe("workspace");

			// Check team member was created
			const member = await db.query.teamMembers.findFirst({
				where: eq(teamMembers.teamId, team!.id),
			});
			expect(member).toBeDefined();
			expect(member?.userId).toBe(TEST_USER.id);
			expect(member?.role).toBe("owner");
		});

		test("should create teams with unique IDs", async () => {
			// Act
			const team1 = await teamService.createTeam(TEST_USER.id, "Team 1");
			const team2 = await teamService.createTeam(TEST_USER.id, "Team 2");

			// Assert
			expect(team1?.id).not.toBe(team2?.id);
		});
	});

	describe("deleteTeam", () => {
		test("should soft delete a workspace team", async () => {
			// Arrange
			const team = await teamService.createTeam(TEST_USER.id, "Team to Delete");

			// Act
			const result = await teamService.deleteTeam(team!.id);

			// Assert
			expect(result).toBe(true);

			// Verify soft delete
			const deletedTeam = await db.query.teams.findFirst({
				where: eq(teams.id, team!.id),
			});
			expect(deletedTeam?.deletedAt).toBeDefined();
		});

		test("should not allow deleting a personal team", async () => {
			// Arrange
			const personalTeam = await teamService.createPersonalTeam(TEST_USER.id);

			// Act & Assert
			await expect(teamService.deleteTeam(personalTeam!.id)).rejects.toThrow(
				"Cannot delete personal team",
			);

			// Verify team still exists
			const team = await db.query.teams.findFirst({
				where: eq(teams.id, personalTeam!.id),
			});
			expect(team?.deletedAt).toBeNull();
		});

		test("should throw error when team not found", async () => {
			// Act & Assert
			await expect(teamService.deleteTeam("non-existent-id")).rejects.toThrow(
				"Team not found",
			);
		});
	});

	describe("createPersonalTeam", () => {
		test("should create a personal team with owner", async () => {
			// Act
			const team = await teamService.createPersonalTeam(TEST_USER.id);

			// Assert
			expect(team).toBeDefined();
			expect(team?.name).toBe("Personal");
			expect(team?.type).toBe("personal");

			// Check team member was created
			const member = await db.query.teamMembers.findFirst({
				where: eq(teamMembers.teamId, team!.id),
			});
			expect(member).toBeDefined();
			expect(member?.userId).toBe(TEST_USER.id);
			expect(member?.role).toBe("owner");
		});
	});

	describe("ensureOnePersonalTeam", () => {
		test("should create personal team if none exists", async () => {
			// Act
			const team = await teamService.ensureOnePersonalTeam(TEST_USER.id);

			// Assert
			expect(team).toBeDefined();
			expect(team.type).toBe("personal");
		});

		test("should return existing personal team if one exists", async () => {
			// Arrange
			const existingTeam = await teamService.createPersonalTeam(TEST_USER.id);

			// Act
			const team = await teamService.ensureOnePersonalTeam(TEST_USER.id);

			// Assert
			expect(team.id).toBe(existingTeam!.id);
		});

		test("should keep oldest personal team and soft delete others", async () => {
			// Arrange - Create multiple personal teams
			const team1 = await teamService.createPersonalTeam(TEST_USER.id);
			const team2 = await teamService.createPersonalTeam(TEST_USER.id);
			const team3 = await teamService.createPersonalTeam(TEST_USER.id);

			// Act
			const result = await teamService.ensureOnePersonalTeam(TEST_USER.id);

			// Assert
			expect(result.id).toBe(team1!.id); // Should keep oldest team

			// Check other teams are soft deleted
			const deletedTeam2 = await db.query.teams.findFirst({
				where: eq(teams.id, team2!.id),
			});
			const deletedTeam3 = await db.query.teams.findFirst({
				where: eq(teams.id, team3!.id),
			});
			expect(deletedTeam2?.deletedAt).toBeDefined();
			expect(deletedTeam3?.deletedAt).toBeDefined();
		});
	});
});
