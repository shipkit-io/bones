export interface LocalProject {
	id: string;
	name: string;
	teamId: string;
	createdAt: Date;
	updatedAt: Date;
	members: LocalProjectMember[];
}

export interface LocalProjectMember {
	id: string;
	projectId: string;
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

export interface LocalTeam {
	id: string;
	name: string;
	type?: "personal" | "workspace";
	createdAt: Date;
	updatedAt: Date | null;
	deletedAt: Date | null;
}

const STORAGE_KEYS = {
	projects: "shipkit-projects",
	projectMembers: "shipkit-project-members",
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

export class LocalProjectStorage {
	/**
	 * Creates a new project in local storage
	 */
	static createProject(teamId: string, projectName: string, creatorUserId: string): LocalProject {
		const projectId = crypto.randomUUID();
		const now = new Date();

		// Create project
		const project: LocalProject = {
			id: projectId,
			name: projectName,
			teamId,
			createdAt: now,
			updatedAt: now,
			members: [],
		};

		// Create project member
		const member: LocalProjectMember = {
			id: crypto.randomUUID(),
			projectId,
			userId: creatorUserId,
			role: "owner",
			createdAt: now,
			updatedAt: now,
			user: LocalProjectStorage.getUserFromStorage(creatorUserId),
		};

		// Save to storage
		const projects = getFromStorage<LocalProject>(STORAGE_KEYS.projects);
		projects.push(project);
		saveToStorage(STORAGE_KEYS.projects, projects);

		const projectMembers = getFromStorage<LocalProjectMember>(STORAGE_KEYS.projectMembers);
		projectMembers.push(member);
		saveToStorage(STORAGE_KEYS.projectMembers, projectMembers);

		// Return project with members
		project.members = [member];
		return project;
	}

	/**
	 * Gets all projects for a team
	 */
	static getTeamProjects(teamId: string): LocalProject[] {
		const projects = getFromStorage<LocalProject>(STORAGE_KEYS.projects);
		const projectMembers = getFromStorage<LocalProjectMember>(STORAGE_KEYS.projectMembers);

		return projects
			.filter((p) => p.teamId === teamId)
			.map((project) => ({
				...project,
				members: projectMembers.filter((m) => m.projectId === project.id),
			}));
	}

	/**
	 * Updates a project
	 */
	static updateProject(projectId: string, projectName: string): LocalProject | null {
		const projects = getFromStorage<LocalProject>(STORAGE_KEYS.projects);
		const projectIndex = projects.findIndex((p) => p.id === projectId);

		if (projectIndex === -1) return null;

		const existingProject = projects[projectIndex];
		if (!existingProject) return null;

		projects[projectIndex] = {
			...existingProject,
			name: projectName,
			updatedAt: new Date(),
			id: existingProject.id || "",
			teamId: existingProject.teamId || "",
			createdAt: existingProject.createdAt || new Date(),
			members: existingProject.members || [],
		};

		saveToStorage(STORAGE_KEYS.projects, projects);

		// Return with members
		const projectMembers = getFromStorage<LocalProjectMember>(STORAGE_KEYS.projectMembers);
		const updatedProject = projects[projectIndex];
		return {
			...updatedProject,
			id: updatedProject.id || "",
			name: updatedProject.name || "",
			teamId: updatedProject.teamId || "",
			createdAt: updatedProject.createdAt || new Date(),
			updatedAt: updatedProject.updatedAt || new Date(),
			members: projectMembers.filter((m) => m.projectId === projectId),
		};
	}

	/**
	 * Deletes a project
	 */
	static deleteProject(projectId: string): boolean {
		const projects = getFromStorage<LocalProject>(STORAGE_KEYS.projects);
		const projectMembers = getFromStorage<LocalProjectMember>(STORAGE_KEYS.projectMembers);

		// Remove project
		const filteredProjects = projects.filter((p) => p.id !== projectId);
		saveToStorage(STORAGE_KEYS.projects, filteredProjects);

		// Remove project members
		const filteredMembers = projectMembers.filter((m) => m.projectId !== projectId);
		saveToStorage(STORAGE_KEYS.projectMembers, filteredMembers);

		return true;
	}

	/**
	 * Adds a member to a project
	 */
	static addProjectMember(projectId: string, userId: string, role: string): LocalProjectMember {
		const projectMembers = getFromStorage<LocalProjectMember>(STORAGE_KEYS.projectMembers);

		const member: LocalProjectMember = {
			id: crypto.randomUUID(),
			projectId,
			userId,
			role,
			createdAt: new Date(),
			updatedAt: new Date(),
			user: LocalProjectStorage.getUserFromStorage(userId),
		};

		projectMembers.push(member);
		saveToStorage(STORAGE_KEYS.projectMembers, projectMembers);

		return member;
	}

	/**
	 * Removes a member from a project
	 */
	static removeProjectMember(projectId: string, userId: string): boolean {
		const projectMembers = getFromStorage<LocalProjectMember>(STORAGE_KEYS.projectMembers);
		const filteredMembers = projectMembers.filter(
			(m) => !(m.projectId === projectId && m.userId === userId)
		);

		saveToStorage(STORAGE_KEYS.projectMembers, filteredMembers);
		return filteredMembers.length !== projectMembers.length;
	}

	/**
	 * Updates a project member's role
	 */
	static updateProjectMemberRole(
		projectId: string,
		userId: string,
		role: string
	): LocalProjectMember | null {
		const projectMembers = getFromStorage<LocalProjectMember>(STORAGE_KEYS.projectMembers);
		const memberIndex = projectMembers.findIndex(
			(m) => m.projectId === projectId && m.userId === userId
		);

		if (memberIndex === -1) return null;

		const existingMember = projectMembers[memberIndex];
		if (!existingMember) return null;

		projectMembers[memberIndex] = {
			...existingMember,
			role,
			updatedAt: new Date(),
			id: existingMember.id || "",
			projectId: existingMember.projectId || "",
			userId: existingMember.userId || "",
			createdAt: existingMember.createdAt || new Date(),
			user: existingMember.user || undefined,
		};

		saveToStorage(STORAGE_KEYS.projectMembers, projectMembers);
		return projectMembers[memberIndex];
	}

	/**
	 * Gets project members
	 */
	static getProjectMembers(projectId: string): LocalProjectMember[] {
		const projectMembers = getFromStorage<LocalProjectMember>(STORAGE_KEYS.projectMembers);
		return projectMembers.filter((m) => m.projectId === projectId);
	}

	/**
	 * Checks if user has access to project
	 */
	static userHasAccessToProject(userId: string, projectId: string): boolean {
		const projectMembers = getFromStorage<LocalProjectMember>(STORAGE_KEYS.projectMembers);
		return projectMembers.some((m) => m.userId === userId && m.projectId === projectId);
	}

	/**
	 * Helper to get user data from storage (fallback for demo purposes)
	 */
	private static getUserFromStorage(userId: string): {
		id: string;
		name: string | null;
		email: string;
	} {
		// In a real implementation, you'd store user data separately
		// For now, return a basic structure
		return {
			id: userId,
			name: `User ${userId.slice(0, 8)}`,
			email: `user-${userId.slice(0, 8)}@example.com`,
		};
	}

	/**
	 * Initialize with demo data if storage is empty
	 */
	static initializeDemoData(userId: string, teamId: string): void {
		const projects = getFromStorage<LocalProject>(STORAGE_KEYS.projects);

		if (projects.length === 0) {
			// Create a demo project
			LocalProjectStorage.createProject(teamId, "Demo Project", userId);
		}
	}

	/**
	 * Clear all project data from localStorage
	 */
	static clearAll(): void {
		if (!isClient) return;

		localStorage.removeItem(STORAGE_KEYS.projects);
		localStorage.removeItem(STORAGE_KEYS.projectMembers);
	}
}
