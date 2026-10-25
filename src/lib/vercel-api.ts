/**
 * Vercel API Integration Service
 * Handles automated project creation and deployment configuration
 */

import {
  getErrorMessage,
  getErrorResponseData,
  getErrorStatus,
} from "@/lib/utils/error-shape";

export interface VercelConfig {
  accessToken: string;
  teamId?: string;
}

export type VercelEnvTarget = "production" | "preview" | "development";

export interface VercelProjectConfig {
  name: string;
  gitRepository?: {
    type: "github" | "gitlab" | "bitbucket";
    repo: string; // e.g., "username/repo-name"
  };
  framework?: string;
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  devCommand?: string;
  environmentVariables?: {
    key: string;
    value: string;
    target: readonly VercelEnvTarget[];
  }[];
  domains?: string[];
}

/** Error thrown when the Vercel API answers with a non-2xx status. */
export class VercelApiError extends Error {
  readonly status: number;
  readonly response: { data: unknown };

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "VercelApiError";
    this.status = status;
    this.response = { data };
  }
}

/** Error body Vercel returns alongside a failed request. */
export interface VercelErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

/**
 * Deployment summary as it appears in project and deployment list responses.
 * Every field is optional: Vercel returns a different subset per endpoint.
 */
export interface VercelDeploymentSummary {
  id?: string;
  uid?: string;
  url?: string;
  /** Vercel returns `state` on some endpoints and `readyState` on others. */
  state?: string;
  readyState?: string;
  createdAt?: number;
}

export interface VercelProjectResponse {
  id: string;
  name: string;
  accountId?: string;
  framework?: string | null;
  createdAt?: number;
  updatedAt?: number;
  targets?: Record<string, VercelDeploymentSummary | null> | null;
  latestDeployments?: VercelDeploymentSummary[];
}

interface VercelProjectListResponse {
  projects: VercelProjectResponse[];
}

interface VercelDeploymentListResponse {
  deployments?: VercelDeploymentSummary[];
}

interface VercelDeploymentResponse {
  id: string;
  url: string;
  readyState?: string;
}

interface VercelEnvVarResponse {
  id: string;
}

interface VercelTeamResponse {
  slug?: string;
  name?: string;
}

interface VercelUserResponse {
  user?: { username?: string };
}

interface VercelCreateProjectPayload {
  name: string;
  framework?: string;
  gitRepository?: { type: "github" | "gitlab" | "bitbucket"; repo: string };
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  devCommand?: string;
  environmentVariables?: {
    key: string;
    value: string;
    type: "encrypted";
    target: readonly VercelEnvTarget[];
  }[];
}

interface VercelCreateDeploymentPayload {
  name: string;
  target: "production";
  gitSource?: { type: "github"; ref: string; repoId: number };
}

/** Vercel accepts a single target or a list; callers may pass either. */
const toEnvTargets = (
  target: VercelEnvTarget | readonly VercelEnvTarget[]
): readonly VercelEnvTarget[] => (typeof target === "string" ? [target] : target);

export interface VercelProjectResult {
  success: boolean;
  projectId?: string;
  projectUrl?: string;
  deploymentUrl?: string;
  error?: string;
  details?: unknown;
}

export interface VercelDeploymentResult {
  success: boolean;
  deploymentId?: string;
  deploymentUrl?: string;
  error?: string;
  details?: unknown;
}

export class VercelAPIService {
  private baseUrl = "https://api.vercel.com";
  private accessToken: string;
  private teamId?: string;

  constructor(config: VercelConfig) {
    this.accessToken = config.accessToken;
    this.teamId = config.teamId;
  }

  /**
   * Create a new Vercel project from a Git repository
   */
  async createProject(config: VercelProjectConfig): Promise<VercelProjectResult> {
    try {
      console.log(`Creating Vercel project: ${config.name}`);

      const projectData: VercelCreateProjectPayload = {
        name: config.name,
        framework: this.detectFramework(config.framework),
      };

      // Only add gitRepository if provided
      if (config.gitRepository) {
        projectData.gitRepository = {
          type: config.gitRepository.type,
          repo: config.gitRepository.repo,
        };
      }

      // Only add optional fields if they are provided
      if (config.buildCommand) projectData.buildCommand = config.buildCommand;
      if (config.outputDirectory) projectData.outputDirectory = config.outputDirectory;
      if (config.installCommand) projectData.installCommand = config.installCommand;
      if (config.devCommand) projectData.devCommand = config.devCommand;

      // Handle environment variables
      if (config.environmentVariables && config.environmentVariables.length > 0) {
        projectData.environmentVariables = config.environmentVariables.map((env) => ({
          key: env.key,
          value: env.value,
          type: "encrypted",
          target: toEnvTargets(env.target),
        }));
      }

      // Log the request payload for debugging
      console.log("Vercel API Request Payload:", JSON.stringify(projectData, null, 2));

      const response = await this.makeRequest<VercelProjectResponse>("/v10/projects", {
        method: "POST",
        body: JSON.stringify(projectData),
      });

      console.log(`Successfully created Vercel project: ${response.name}`);

      // If domains are specified, add them to the project
      if (config.domains && config.domains.length > 0) {
        await this.addDomains(response.id, config.domains);
      }

      const accountSlug = await this.resolveAccountSlug(response.accountId ?? this.teamId);
      const accountPath = accountSlug ?? response.accountId;

      return {
        success: true,
        projectId: response.id,
        // Vercel project URLs use account slug (team/user), not accountId.
        projectUrl: accountPath ? `https://vercel.com/${accountPath}/${response.name}` : undefined,
        details: response,
      };
    } catch (error) {
      console.error("Failed to create Vercel project:", error);
      // Log the full error details for debugging
      const errorData = getErrorResponseData(error);
      if (errorData) {
        console.error("Vercel API Error Details:", JSON.stringify(errorData, null, 2));
      }

      return {
        success: false,
        error: this.formatErrorMessage(error),
        details: getErrorResponseData(error),
      };
    }
  }

  /**
   * Trigger a new deployment for a project
   */
  async createDeployment(
    projectId: string,
    projectName?: string,
    gitRef?: string,
    repoId?: number
  ): Promise<VercelDeploymentResult> {
    try {
      console.log(`Creating deployment for project: ${projectId}`);

      // Try using project name instead of ID, as the API might expect that
      const deploymentData: VercelCreateDeploymentPayload = {
        name: projectName ?? projectId,
        target: "production" as const,
      };

      // Only add gitSource when repoId is available (required by Vercel)
      if (gitRef && repoId) {
        deploymentData.gitSource = {
          type: "github" as const,
          ref: gitRef,
          repoId,
        };
      } else if (gitRef && !repoId) {
        console.warn("Skipping gitSource because repoId is missing", { projectId, projectName });
      }

      // Log the deployment request for debugging
      console.log("Vercel Deployment Request:", JSON.stringify(deploymentData, null, 2));

      const response = await this.makeRequest<VercelDeploymentResponse>("/v13/deployments", {
        method: "POST",
        body: JSON.stringify(deploymentData),
      });

      console.log(`Successfully created deployment: ${response.url}`);

      return {
        success: true,
        deploymentId: response.id,
        deploymentUrl: response.url,
        details: response,
      };
    } catch (error) {
      console.error("Failed to create deployment:", error);
      // Log the full error details for debugging
      const errorData = getErrorResponseData(error);
      if (errorData) {
        console.error("Vercel Deployment Error Details:", JSON.stringify(errorData, null, 2));
      }

      return {
        success: false,
        error: this.formatErrorMessage(error),
        details: getErrorResponseData(error),
      };
    }
  }

  /**
   * Get project information
   */
  async getProject(projectId: string) {
    try {
      const response = await this.makeRequest<VercelProjectResponse>(
        `/v10/projects/${projectId}`
      );

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error),
      };
    }
  }

  /**
   * Update project configuration
   */
  async updateProject(projectId: string, updates: Partial<VercelProjectConfig>) {
    try {
      const updateData = {
        framework: updates.framework,
        buildCommand: updates.buildCommand,
        outputDirectory: updates.outputDirectory,
        installCommand: updates.installCommand,
        devCommand: updates.devCommand,
      };

      const response = await this.makeRequest<VercelProjectResponse>(`/v10/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error),
      };
    }
  }

  /**
   * Add environment variables to a project
   */
  async addEnvironmentVariables(
    projectId: string,
    variables: {
      key: string;
      value: string;
      target: ("production" | "preview" | "development")[];
    }[]
  ) {
    try {
      const results = [];

      for (const variable of variables) {
        try {
          const response = await this.makeRequest<VercelEnvVarResponse>(`/v10/projects/${projectId}/env`, {
            method: "POST",
            body: JSON.stringify({
              key: variable.key,
              value: variable.value,
              type: "encrypted",
              target: variable.target,
            }),
          });

          results.push({
            key: variable.key,
            success: true,
            id: response.id,
          });
        } catch (error) {
          results.push({
            key: variable.key,
            success: false,
            error: this.formatErrorMessage(error),
          });
        }
      }

      return {
        success: true,
        results,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error),
      };
    }
  }

  /**
   * Connect a Git repository to an existing project
   */
  async connectGitRepository(
    projectId: string,
    gitRepo: { type: "github" | "gitlab" | "bitbucket"; repo: string }
  ) {
    try {
      const response = await this.makeRequest<unknown>(`/v10/projects/${projectId}/git-repository`, {
        method: "POST",
        body: JSON.stringify(gitRepo),
      });

      return {
        success: true,
        details: response,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error),
        details: getErrorResponseData(error),
      };
    }
  }

  /**
   * Add domains to a project
   */
  async addDomains(projectId: string, domains: string[]) {
    try {
      const results = [];

      for (const domain of domains) {
        try {
          const response = await this.makeRequest<unknown>(`/v10/projects/${projectId}/domains`, {
            method: "POST",
            body: JSON.stringify({
              name: domain,
            }),
          });

          results.push({
            domain,
            success: true,
            details: response,
          });
        } catch (error) {
          results.push({
            domain,
            success: false,
            error: this.formatErrorMessage(error),
          });
        }
      }

      return {
        success: true,
        results,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error),
      };
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string) {
    try {
      const response = await this.makeRequest<VercelDeploymentResponse>(
        `/v13/deployments/${deploymentId}`
      );

      return {
        success: true,
        status: response.readyState,
        url: response.url,
        details: response,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error),
      };
    }
  }

  /**
   * List user's projects
   */
  async listProjects() {
    try {
      const response = await this.makeRequest<VercelProjectListResponse>("/v10/projects");

      return {
        success: true,
        projects: response.projects.map((project) => ({
          id: project.id,
          name: project.name,
          framework: project.framework,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          targets: project.targets,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error),
        projects: [],
      };
    }
  }

  /**
   * Check if project name is available
   */
  async isProjectNameAvailable(name: string): Promise<boolean> {
    try {
      const projects = await this.listProjects();
      if (!projects.success) return false;

      return !projects.projects.some(
        (project) => project.name.toLowerCase() === name.toLowerCase()
      );
    } catch (_error) {
      return false;
    }
  }

  /**
   * Get deployments for a project
   */
  async getDeployments(projectId: string, limit = 10) {
    try {
      const response = await this.makeRequest<VercelDeploymentListResponse>(
        `/v6/deployments?projectId=${projectId}&limit=${limit}`
      );

      return response.deployments ?? [];
    } catch (error) {
      console.error("Failed to get deployments:", error);
      return [];
    }
  }

  /**
   * Make authenticated request to Vercel API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    config?: { skipTeamId?: boolean }
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (this.teamId && !config?.skipTeamId) {
      url.searchParams.append("teamId", this.teamId);
    }

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData: unknown = await response.json().catch(() => ({}));
      throw new VercelApiError(
        `Vercel API error: ${response.status} ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return (await response.json()) as T;
  }

  private async resolveAccountSlug(accountId?: string) {
    if (!accountId) return undefined;

    try {
      const teamResponse = await this.makeRequest<VercelTeamResponse>(
        `/v2/teams/${accountId}`,
        {},
        { skipTeamId: true }
      );
      if (teamResponse?.slug) return teamResponse.slug;
      if (teamResponse?.name) return teamResponse.name;
    } catch {
      // Swallow errors to allow fallback to user slug.
    }

    try {
      const userResponse = await this.makeRequest<VercelUserResponse>(
        "/v2/user",
        {},
        { skipTeamId: true }
      );
      return userResponse?.user?.username;
    } catch {
      return undefined;
    }
  }

  /**
   * Detect framework based on repository structure or explicit configuration
   */
  private detectFramework(explicitFramework?: string): string | undefined {
    if (explicitFramework) {
      return explicitFramework;
    }

    // For Shipkit, we know it's Next.js
    return "nextjs";
  }

  /**
   * Format error messages for user-friendly display
   */
  private formatErrorMessage(error: unknown): string {
    const status = getErrorStatus(error);
    const errorData = getErrorResponseData(error) as VercelErrorPayload | undefined;

    if (status === 400) {
      // Handle specific 400 errors
      if (errorData?.error?.code === "missing_github_integration") {
        return "GitHub integration not connected to your Vercel account. Please connect GitHub in your Vercel dashboard first.";
      }
      if (errorData?.error?.code === "bad_request") {
        return `Vercel Error: ${errorData?.error?.message ?? "Invalid request"}`;
      }
      if (errorData?.error?.message) {
        return `Vercel API Error: ${errorData.error.message}`;
      }
      return "Invalid request to Vercel API. Please check your configuration.";
    }
    if (status === 401) {
      return "Vercel authentication failed. Please check your access token.";
    }
    if (status === 403) {
      return "Insufficient permissions for Vercel operation.";
    }
    if (status === 404) {
      return "Vercel project or resource not found.";
    }
    if (status === 409) {
      return "A project with this name already exists.";
    }
    if (status === 422) {
      return errorData?.error?.message ?? "Invalid project configuration.";
    }
    if (status === 429) {
      return "Vercel API rate limit exceeded. Please try again later.";
    }

    return getErrorMessage(error) ?? "An unexpected error occurred with Vercel API.";
  }
}

/**
 * Create a Vercel API service instance
 */
export function createVercelAPIService(accessToken: string, teamId?: string): VercelAPIService {
  return new VercelAPIService({ accessToken, teamId });
}

/**
 * Validate Vercel project name
 */
export function validateVercelProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || name.length === 0) {
    return { valid: false, error: "Project name cannot be empty" };
  }

  if (name.length > 52) {
    return { valid: false, error: "Project name cannot exceed 52 characters" };
  }

  // Must contain only lowercase letters, numbers, and hyphens
  if (!/^[a-z0-9-]+$/.test(name)) {
    return {
      valid: false,
      error: "Project name can only contain lowercase letters, numbers, and hyphens",
    };
  }

  // Cannot start or end with hyphens
  if (name.startsWith("-") || name.endsWith("-")) {
    return { valid: false, error: "Project name cannot start or end with hyphens" };
  }

  // Cannot contain consecutive hyphens
  if (name.includes("--")) {
    return { valid: false, error: "Project name cannot contain consecutive hyphens" };
  }

  return { valid: true };
}

/**
 * Common environment variables for Next.js projects
 */
export const COMMON_ENV_VARIABLES = {
  nextjs: [
    { key: "NODE_ENV", value: "production", target: ["production"] as const },
    { key: "NEXTAUTH_URL", value: "", target: ["production", "preview"] as const },
    { key: "NEXTAUTH_SECRET", value: "", target: ["production", "preview"] as const },
  ],
  shipkit: [
    { key: "DATABASE_URL", value: "", target: ["production", "preview"] as const },
    { key: "NEXTAUTH_URL", value: "", target: ["production", "preview"] as const },
    { key: "NEXTAUTH_SECRET", value: "", target: ["production", "preview"] as const },
    { key: "STRIPE_SECRET_KEY", value: "", target: ["production"] as const },
    { key: "STRIPE_WEBHOOK_SECRET", value: "", target: ["production"] as const },
  ],
} as const;
