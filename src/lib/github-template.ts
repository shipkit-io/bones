import { Octokit } from "@octokit/rest";
import { getErrorMessage, getErrorResponseData, getErrorStatus } from "@/lib/utils/error-shape";

/**
 * GitHub Template Repository Service
 * Handles creation of repositories from private templates
 */

export interface GitHubConfig {
  accessToken: string;
  userAgent?: string;
}

export interface TemplateRepoConfig {
  templateOwner: string;
  templateRepo: string;
  newRepoName: string;
  newRepoOwner: string;
  description?: string;
  private?: boolean;
  includeAllBranches?: boolean;
}

/**
 * Thrown when the template repository is unreachable only because the user has
 * not accepted their invitation yet. Carries the invitation URL so the caller
 * can point the user at it.
 */
export class PendingInvitationError extends Error {
  readonly isPendingInvitation = true;
  readonly invitationUrl: string;

  constructor(message: string, invitationUrl: string) {
    super(message);
    this.name = "PendingInvitationError";
    this.invitationUrl = invitationUrl;
  }
}

/** Repository facts returned alongside a successful creation. */
export interface RepoCreationDetails {
  cloneUrl: string;
  sshUrl: string;
  fullName: string;
  defaultBranch: string;
}

export interface RepoCreationResult {
  success: boolean;
  repoUrl?: string;
  repoId?: number;
  error?: string;
  details?: unknown;
  isPendingInvitation?: boolean;
  invitationUrl?: string;
}

export class GitHubTemplateService {
  private octokit: Octokit;

  constructor(config: GitHubConfig) {
    this.octokit = new Octokit({
      auth: config.accessToken,
      userAgent: config.userAgent ?? "Shipkit-Deploy/1.0.0",
    });
  }

  /**
   * Create a new repository from a template repository
   */
  async createFromTemplate(config: TemplateRepoConfig): Promise<RepoCreationResult> {
    try {
      console.log(
        `Creating repository from template: ${config.templateOwner}/${config.templateRepo}`
      );

      // First, verify the template repository exists and is accessible
      await this.verifyTemplateAccess(config.templateOwner, config.templateRepo);

      // Create repository from template
      const response = await this.octokit.repos.createUsingTemplate({
        template_owner: config.templateOwner,
        template_repo: config.templateRepo,
        owner: config.newRepoOwner,
        name: config.newRepoName,
        description: config.description ?? `Deployed from ${config.templateRepo} template`,
        private: config.private ?? true,
        include_all_branches: config.includeAllBranches ?? false,
      });

      console.log(`Successfully created repository: ${response.data.html_url}`);

      return {
        success: true,
        repoUrl: response.data.html_url,
        repoId: response.data.id,
        details: {
          cloneUrl: response.data.clone_url,
          sshUrl: response.data.ssh_url,
          fullName: response.data.full_name,
          defaultBranch: response.data.default_branch,
        },
      };
    } catch (error) {
      console.error("Failed to create repository from template:", error);

      const result: RepoCreationResult = {
        success: false,
        error: this.formatErrorMessage(error),
        details: getErrorResponseData(error),
      };

      // Include pending invitation info if available
      if (error instanceof PendingInvitationError) {
        result.isPendingInvitation = true;
        result.invitationUrl = error.invitationUrl;
      }

      return result;
    }
  }

  /**
   * Verify that the template repository exists and is accessible
   */
  private async verifyTemplateAccess(owner: string, repo: string): Promise<void> {
    try {
      const response = await this.octokit.repos.get({
        owner,
        repo,
      });

      if (!response.data.is_template) {
        throw new Error(`Repository ${owner}/${repo} is not configured as a template repository`);
      }
    } catch (error) {
      if (getErrorStatus(error) === 404) {
        // Check if the user has a pending invitation to this repository
        const invitationCheck = await this.checkPendingInvitation(owner, repo);

        if (invitationCheck.hasPendingInvitation) {
          throw new PendingInvitationError(
            `You have a pending invitation to ${owner}/${repo}. Please accept the invitation to continue.`,
            invitationCheck.invitationUrl ?? `https://github.com/${owner}/${repo}/invitations`
          );
        }

        throw new Error(
          `Template repository ${owner}/${repo} not found or not accessible. If you've been invited, please check your GitHub notifications and accept the invitation.`
        );
      }
      throw error;
    }
  }

  /**
   * Get information about a repository
   */
  async getRepositoryInfo(owner: string, repo: string) {
    try {
      const response = await this.octokit.repos.get({
        owner,
        repo,
      });

      return {
        success: true,
        data: {
          id: response.data.id,
          name: response.data.name,
          fullName: response.data.full_name,
          description: response.data.description,
          htmlUrl: response.data.html_url,
          cloneUrl: response.data.clone_url,
          sshUrl: response.data.ssh_url,
          defaultBranch: response.data.default_branch,
          isTemplate: response.data.is_template,
          isPrivate: response.data.private,
          topics: response.data.topics,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error),
      };
    }
  }

  /**
   * List available template repositories that the user has access to
   */
  async listTemplateRepositories(org?: string) {
    try {
      const searchQuery = org
        ? `org:${org} is:template`
        : `user:${await this.getCurrentUser()} is:template`;

      const response = await this.octokit.search.repos({
        q: searchQuery,
        sort: "updated",
        order: "desc",
        per_page: 50,
      });

      return {
        success: true,
        repositories: response.data.items.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          htmlUrl: repo.html_url,
          isPrivate: repo.private,
          updatedAt: repo.updated_at,
          topics: repo.topics,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error),
        repositories: [],
      };
    }
  }

  /**
   * Get the current authenticated user
   */
  private async getCurrentUser(): Promise<string> {
    const response = await this.octokit.users.getAuthenticated();
    return response.data.login;
  }

  /**
   * Check if the user has a pending invitation to a specific repository
   * Returns the invitation details if found, null otherwise
   */
  async checkPendingInvitation(
    owner: string,
    repo: string
  ): Promise<{
    hasPendingInvitation: boolean;
    invitationUrl?: string;
    invitationId?: number;
  }> {
    try {
      const response = await this.octokit.repos.listInvitationsForAuthenticatedUser();
      const invitation = response.data.find(
        (inv) =>
          inv.repository?.owner?.login?.toLowerCase() === owner.toLowerCase() &&
          inv.repository?.name?.toLowerCase() === repo.toLowerCase()
      );

      if (invitation) {
        return {
          hasPendingInvitation: true,
          invitationUrl: invitation.html_url,
          invitationId: invitation.id,
        };
      }

      return { hasPendingInvitation: false };
    } catch (error) {
      // 401 means the token is expired/revoked — not an unexpected failure
      if (getErrorStatus(error) !== 401) {
        console.warn("Failed to check pending invitations:", error);
      }
      return { hasPendingInvitation: false };
    }
  }

  /**
   * Get the current authenticated user info
   */
  async getCurrentUserInfo(): Promise<{
    success: boolean;
    username?: string;
    error?: string;
  }> {
    try {
      const username = await this.getCurrentUser();
      return {
        success: true,
        username,
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error),
      };
    }
  }

  /**
   * Check if a repository name is available for the user
   */
  async isRepositoryNameAvailable(owner: string, repoName: string): Promise<boolean> {
    try {
      await this.octokit.repos.get({
        owner,
        repo: repoName,
      });
      return false; // Repository exists
    } catch (error) {
      if (getErrorStatus(error) === 404) {
        return true; // Repository does not exist, name is available
      }
      throw error; // Some other error occurred
    }
  }

  /**
   * Set up repository with initial configuration
   */
  async configureRepository(
    owner: string,
    repo: string,
    config: {
      description?: string;
      topics?: string[];
      hasIssues?: boolean;
      hasProjects?: boolean;
      hasWiki?: boolean;
    }
  ) {
    try {
      await this.octokit.repos.update({
        owner,
        repo,
        description: config.description,
        topics: config.topics,
        has_issues: config.hasIssues ?? true,
        has_projects: config.hasProjects ?? false,
        has_wiki: config.hasWiki ?? false,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.formatErrorMessage(error),
      };
    }
  }

  /**
   * Add environment variables as repository secrets
   */
  async addRepositorySecrets(owner: string, repo: string, secrets: Record<string, string>) {
    try {
      // Get the repository public key for encryption
      const { data: publicKey } = await this.octokit.actions.getRepoPublicKey({
        owner,
        repo,
      });

      const results = [];

      for (const [name, value] of Object.entries(secrets)) {
        try {
          // Note: In a real implementation, you'd need to encrypt the secret value
          // using the public key before sending it to GitHub
          await this.octokit.actions.createOrUpdateRepoSecret({
            owner,
            repo,
            secret_name: name,
            encrypted_value: value, // This should be encrypted
            key_id: publicKey.key_id,
          });

          results.push({ name, success: true });
        } catch (error) {
          results.push({
            name,
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
   * Trigger a GitHub Actions workflow dispatch event
   * Used to programmatically run workflows like init-upstream.yml
   */
  async triggerWorkflow(
    owner: string,
    repo: string,
    workflowId: string,
    ref = "main",
    inputs?: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowId,
        ref,
        inputs,
      });

      console.log(`Successfully triggered workflow ${workflowId} on ${owner}/${repo}`);
      return { success: true };
    } catch (error) {
      console.error(`Failed to trigger workflow ${workflowId}:`, error);

      // 404 means the workflow file doesn't exist yet (repo might still be initializing)
      if (getErrorStatus(error) === 404) {
        return {
          success: false,
          error: `Workflow ${workflowId} not found. The repository may still be initializing.`,
        };
      }

      return {
        success: false,
        error: this.formatErrorMessage(error),
      };
    }
  }

  /**
   * Initialize upstream history by triggering the init-upstream workflow
   * This grafts the upstream template history to enable clean future merges
   */
  async initializeUpstreamHistory(
    owner: string,
    repo: string,
    ref = "main"
  ): Promise<{ success: boolean; error?: string }> {
    // Wait a bit for the repository to be fully initialized
    // GitHub needs time to set up the repo after creation from template
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Retry a few times since the workflow file might not be available immediately
    const maxRetries = 3;
    const retryDelay = 5000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.triggerWorkflow(owner, repo, "init-upstream.yml", ref);

      if (result.success) {
        console.log(`Successfully triggered init-upstream workflow on ${owner}/${repo}`);
        return { success: true };
      }

      if (attempt < maxRetries) {
        console.log(
          `Attempt ${attempt} failed, retrying in ${retryDelay / 1000}s... (${result.error})`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        console.warn(
          `Failed to trigger init-upstream workflow after ${maxRetries} attempts:`,
          result.error
        );
        // Don't fail the whole deployment - the user can manually trigger later
        return {
          success: false,
          error: result.error,
        };
      }
    }

    return { success: false, error: "Max retries exceeded" };
  }

  /**
   * Format error messages for user-friendly display
   */
  private formatErrorMessage(error: unknown): string {
    const status = getErrorStatus(error);

    if (status === 401) {
      return "GitHub authentication failed. Please check your access token.";
    }
    if (status === 403) {
      return "GitHub API rate limit exceeded or insufficient permissions.";
    }
    if (status === 404) {
      return "Repository not found or not accessible.";
    }
    if (status === 422) {
      const responseData = getErrorResponseData(error) as { message?: string } | undefined;
      const message = responseData?.message ?? getErrorMessage(error) ?? "";
      // Check for "already exists" error specifically
      if (
        message.toLowerCase().includes("already exists") ||
        message.toLowerCase().includes("name already exists")
      ) {
        return "A repository with this name already exists on your GitHub account. Please choose a different project name.";
      }
      return message ?? "Invalid repository configuration.";
    }

    return getErrorMessage(error) ?? "An unexpected error occurred.";
  }
}

/**
 * Create a GitHub template service instance
 */
export function createGitHubTemplateService(accessToken: string): GitHubTemplateService {
  return new GitHubTemplateService({ accessToken });
}

/**
 * Utility function to validate repository name
 */
export function validateRepositoryName(name: string): {
  valid: boolean;
  error?: string;
} {
  // GitHub repository name validation rules
  if (!name || name.length === 0) {
    return { valid: false, error: "Repository name cannot be empty" };
  }

  if (name.length > 100) {
    return {
      valid: false,
      error: "Repository name cannot exceed 100 characters",
    };
  }

  // Must contain only alphanumeric characters, hyphens, underscores, and periods
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return {
      valid: false,
      error: "Repository name can only contain letters, numbers, hyphens, underscores, and periods",
    };
  }

  // Cannot start or end with special characters
  if (/^[._-]|[._-]$/.test(name)) {
    return {
      valid: false,
      error: "Repository name cannot start or end with special characters",
    };
  }

  return { valid: true };
}
