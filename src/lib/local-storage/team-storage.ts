export interface LocalTeam {
	id: string;
	name: string;
	type: "personal" | "workspace";
	createdAt: Date;
	updatedAt: Date | null;
	deletedAt: Date | null;
}

export interface LocalTeamMember {
	id: string;
	teamId: string;
	userId: string;
	role: string;
	createdAt: Date;
	updatedAt: Date;
	user: {
		id: string;
		name: string | null;
		email: string;
	};
}

export interface LocalUser {
	id: string;
	name: string | null;
	email: string;
	createdAt: Date;
	updatedAt: Date;
}

const STORAGE_KEYS = {
	teams: "shipkit-teams",
	teamMembers: "shipkit-team-members",
	users: "shipkit-users",
} as const;

// Local storage utility functions
const isClient = typeof window !== "undefined";

function getFromStorage<T>(key: string): T[] {
	if (!isClient) return [];
	try {
		const data = localStorage.getItem(key);
		if (!data) return [];
		const parsed = JSON.parse(data);
		// Convert date strings back to Date objects
		return parsed.map((item: any) => ({
			...item,
			createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
			updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
			deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
		}));
	} catch (error) {
		console.warn(`Error parsing localStorage key "${key}":`, error);
		return [];
	}
}

function saveToStorage<T>(key: string, data: T[]): void {
	if (!isClient) return;
	try {
		localStorage.setItem(key, JSON.stringify(data));
	} catch (error) {
		console.warn(`Error saving to localStorage key "${key}":`, error);
	}
}

export class LocalTeamStorage {
	/**
	 * Creates a personal team for a user
	 */
	static createPersonalTeam(userId: string): LocalTeam {
		const teamId = crypto.randomUUID();
		const now = new Date();

		// Create team
		const team: LocalTeam = {
			id: teamId,
			name: "Personal",
			type: "personal",
			createdAt: now,
			updatedAt: now,
			deletedAt: null,
		};

		// Create team member
		const member: LocalTeamMember = {
			id: crypto.randomUUID(),
			teamId,
			userId,
			role: "owner",
			createdAt: now,
			updatedAt: now,
			user: LocalTeamStorage.getUserFromStorage(userId),
		};

		// Save to storage
		const teams = getFromStorage<LocalTeam>(STORAGE_KEYS.teams);
		teams.push(team);
		saveToStorage(STORAGE_KEYS.teams, teams);

		const teamMembers = getFromStorage<LocalTeamMember>(STORAGE_KEYS.teamMembers);
		teamMembers.push(member);
		saveToStorage(STORAGE_KEYS.teamMembers, teamMembers);

		return team;
	}

	/**
	 * Creates a workspace team
	 */
	static createTeam(userId: string, teamName: string): LocalTeam {
		const teamId = crypto.randomUUID();
		const now = new Date();

		// Create team
		const team: LocalTeam = {
			id: teamId,
			name: teamName,
			type: "workspace",
			createdAt: now,
			updatedAt: now,
			deletedAt: null,
		};

		// Create team member
		const member: LocalTeamMember = {
			id: crypto.randomUUID(),
			teamId,
			userId,
			role: "owner",
			createdAt: now,
			updatedAt: now,
			user: LocalTeamStorage.getUserFromStorage(userId),
		};

		// Save to storage
		const teams = getFromStorage<LocalTeam>(STORAGE_KEYS.teams);
		teams.push(team);
		saveToStorage(STORAGE_KEYS.teams, teams);

		const teamMembers = getFromStorage<LocalTeamMember>(STORAGE_KEYS.teamMembers);
		teamMembers.push(member);
		saveToStorage(STORAGE_KEYS.teamMembers, teamMembers);

		return team;
	}

	/**
	 * Gets all teams for a user
	 */
	static getUserTeams(userId: string): { team: LocalTeam; role: string }[] {
		const teams = getFromStorage<LocalTeam>(STORAGE_KEYS.teams);
		const teamMembers = getFromStorage<LocalTeamMember>(STORAGE_KEYS.teamMembers);

		// Ensure user has a personal team
		LocalTeamStorage.ensurePersonalTeam(userId);

		const userTeamMembers = teamMembers.filter((tm) => tm.userId === userId);

		return userTeamMembers
			.map((tm) => {
				const team = teams.find((t) => t.id === tm.teamId && !t.deletedAt);
				if (!team) return null;
				return { team, role: tm.role };
			})
			.filter((ut): ut is { team: LocalTeam; role: string } => ut !== null)
			.sort((a, b) => {
				// Personal team first
				if (a.team.type === "personal") return -1;
				if (b.team.type === "personal") return 1;
				// Then by creation date
				return a.team.createdAt.getTime() - b.team.createdAt.getTime();
			});
	}

	/**
	 * Gets a user's personal team
	 */
	static getPersonalTeam(userId: string): LocalTeam | null {
		const teams = getFromStorage<LocalTeam>(STORAGE_KEYS.teams);
		const teamMembers = getFromStorage<LocalTeamMember>(STORAGE_KEYS.teamMembers);

		const personalTeamMember = teamMembers.find((tm) => tm.userId === userId);

		if (!personalTeamMember) return null;

		const personalTeam = teams.find(
			(t) => t.id === personalTeamMember.teamId && t.type === "personal" && !t.deletedAt
		);

		return personalTeam || null;
	}

	/**
	 * Ensures user has exactly one personal team
	 */
	static ensurePersonalTeam(userId: string): LocalTeam {
		const teams = getFromStorage<LocalTeam>(STORAGE_KEYS.teams);
		const teamMembers = getFromStorage<LocalTeamMember>(STORAGE_KEYS.teamMembers);

		// Find all personal teams for user
		const userPersonalTeamIds = teamMembers
			.filter((tm) => tm.userId === userId)
			.map((tm) => tm.teamId);

		const personalTeams = teams.filter(
			(t) => userPersonalTeamIds.includes(t.id) && t.type === "personal" && !t.deletedAt
		);

		if (personalTeams.length === 0) {
			// Create personal team
			return LocalTeamStorage.createPersonalTeam(userId);
		}

		if (personalTeams.length === 1) {
			// Already has exactly one
			const team = personalTeams[0];
			if (!team) {
				throw new Error("Personal team not found");
			}
			return team;
		}

		// Multiple personal teams - keep oldest, soft delete rest
		const sortedTeams = personalTeams.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
		const keepTeam = sortedTeams[0];
		if (!keepTeam) {
			throw new Error("No personal team to keep");
		}
		const teamsToDelete = sortedTeams.slice(1);

		// Soft delete extra teams
		const updatedTeams = teams.map((t) => {
			if (teamsToDelete.some((td) => td.id === t.id)) {
				return { ...t, deletedAt: new Date() };
			}
			return t;
		});

		saveToStorage(STORAGE_KEYS.teams, updatedTeams);
		return keepTeam;
	}

	/**
	 * Updates a team
	 */
	static updateTeam(teamId: string, data: { name?: string }): LocalTeam | null {
		const teams = getFromStorage<LocalTeam>(STORAGE_KEYS.teams);
		const teamIndex = teams.findIndex((t) => t.id === teamId && !t.deletedAt);

		if (teamIndex === -1) return null;

		const existingTeam = teams[teamIndex];
		if (!existingTeam) return null;

		teams[teamIndex] = {
			...existingTeam,
			...data,
			updatedAt: new Date(),
		};

		saveToStorage(STORAGE_KEYS.teams, teams);
		return teams[teamIndex];
	}

	/**
	 * Soft deletes a team
	 */
	static deleteTeam(teamId: string): boolean {
		const teams = getFromStorage<LocalTeam>(STORAGE_KEYS.teams);
		const team = teams.find((t) => t.id === teamId);

		if (!team || team.type === "personal") {
			return false; // Cannot delete personal team
		}

		const teamIndex = teams.findIndex((t) => t.id === teamId);
		if (teamIndex === -1) return false;

		const existingTeam = teams[teamIndex];
		if (!existingTeam) return false;

		teams[teamIndex] = {
			...existingTeam,
			deletedAt: new Date(),
		};

		saveToStorage(STORAGE_KEYS.teams, teams);
		return true;
	}

	/**
	 * Adds a member to a team
	 */
	static addTeamMember(teamId: string, userId: string, role: string): LocalTeamMember {
		const teamMembers = getFromStorage<LocalTeamMember>(STORAGE_KEYS.teamMembers);

		const member: LocalTeamMember = {
			id: crypto.randomUUID(),
			teamId,
			userId,
			role,
			createdAt: new Date(),
			updatedAt: new Date(),
			user: LocalTeamStorage.getUserFromStorage(userId),
		};

		teamMembers.push(member);
		saveToStorage(STORAGE_KEYS.teamMembers, teamMembers);

		return member;
	}

	/**
	 * Removes a member from a team
	 */
	static removeTeamMember(teamId: string, userId: string): boolean {
		const teamMembers = getFromStorage<LocalTeamMember>(STORAGE_KEYS.teamMembers);
		const filteredMembers = teamMembers.filter(
			(m) => !(m.teamId === teamId && m.userId === userId)
		);

		saveToStorage(STORAGE_KEYS.teamMembers, filteredMembers);
		return filteredMembers.length !== teamMembers.length;
	}

	/**
	 * Updates a team member's role
	 */
	static updateTeamMemberRole(
		teamId: string,
		userId: string,
		role: string
	): LocalTeamMember | null {
		const teamMembers = getFromStorage<LocalTeamMember>(STORAGE_KEYS.teamMembers);
		const memberIndex = teamMembers.findIndex((m) => m.teamId === teamId && m.userId === userId);

		if (memberIndex === -1) return null;

		const existingMember = teamMembers[memberIndex];
		if (!existingMember) return null;

		teamMembers[memberIndex] = {
			...existingMember,
			role,
			updatedAt: new Date(),
		};

		saveToStorage(STORAGE_KEYS.teamMembers, teamMembers);
		return teamMembers[memberIndex];
	}

	/**
	 * Gets team members
	 */
	static getTeamMembers(teamId: string): LocalTeamMember[] {
		const teamMembers = getFromStorage<LocalTeamMember>(STORAGE_KEYS.teamMembers);
		return teamMembers.filter((m) => m.teamId === teamId);
	}

	/**
	 * Stores user data
	 */
	static storeUser(user: LocalUser): void {
		const users = getFromStorage<LocalUser>(STORAGE_KEYS.users);
		const existingIndex = users.findIndex((u) => u.id === user.id);

		if (existingIndex !== -1) {
			users[existingIndex] = user;
		} else {
			users.push(user);
		}

		saveToStorage(STORAGE_KEYS.users, users);
	}

	/**
	 * Helper to get user data from storage
	 */
	private static getUserFromStorage(userId: string): {
		id: string;
		name: string | null;
		email: string;
	} {
		const users = getFromStorage<LocalUser>(STORAGE_KEYS.users);
		const user = users.find((u) => u.id === userId);

		if (user) {
			return {
				id: user.id,
				name: user.name,
				email: user.email,
			};
		}

		// Return a fallback user
		return {
			id: userId,
			name: `User ${userId.slice(0, 8)}`,
			email: `user-${userId.slice(0, 8)}@example.com`,
		};
	}

	/**
	 * Initialize demo data for a user
	 */
	static initializeDemoData(userId: string, userName?: string, userEmail?: string): LocalTeam {
		// Store user data
		const user: LocalUser = {
			id: userId,
			name: userName || `User ${userId.slice(0, 8)}`,
			email: userEmail || `user-${userId.slice(0, 8)}@example.com`,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		LocalTeamStorage.storeUser(user);

		// Ensure personal team exists
		return LocalTeamStorage.ensurePersonalTeam(userId);
	}

	/**
	 * Clear all team data from localStorage
	 */
	static clearAll(): void {
		if (!isClient) return;

		localStorage.removeItem(STORAGE_KEYS.teams);
		localStorage.removeItem(STORAGE_KEYS.teamMembers);
		localStorage.removeItem(STORAGE_KEYS.users);
	}
}
