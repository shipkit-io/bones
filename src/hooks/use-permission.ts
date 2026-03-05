import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

interface PermissionContext {
	teamId?: string;
	projectId?: string;
}

interface UsePermissionOptions {
	resource: string;
	action: string;
	context?: PermissionContext;
}

/**
 * React hook for checking permissions on the client side
 *
 * Usage:
 * ```tsx
 * const { hasPermission, isLoading } = usePermission({
 *   resource: "team",
 *   action: "create",
 *   context: { teamId: "123" }
 * });
 *
 * if (isLoading) {
 *   return <div>Loading...</div>;
 * }
 *
 * return hasPermission ? (
 *   <button>Create Team</button>
 * ) : null;
 * ```
 */
export const usePermission = ({ resource, action, context }: UsePermissionOptions) => {
	const { data: session, status } = useSession();
	const [hasPermission, setHasPermission] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const checkPermission = useCallback(async () => {
		if (!session?.user?.id) {
			setHasPermission(false);
			setIsLoading(false);
			return;
		}

		try {
			setError(null);
			const params = new URLSearchParams();
			params.append("resource", resource);
			params.append("action", action);

			if (context?.teamId) {
				params.append("teamId", context.teamId);
			}

			if (context?.projectId) {
				params.append("projectId", context.projectId);
			}

			const response = await fetch(`/api/permissions/check?${params.toString()}`);

			setHasPermission(response.ok);
		} catch (error) {
			console.error("Error checking permission:", error);
			setError(error instanceof Error ? error : new Error(String(error)));
			setHasPermission(false);
		} finally {
			setIsLoading(false);
		}
	}, [session?.user?.id, resource, action, context]);

	useEffect(() => {
		if (status === "loading") {
			return;
		}

		void checkPermission();
	}, [status, checkPermission]);

	return {
		hasPermission,
		isLoading,
		error,
		refresh: checkPermission,
	};
};
