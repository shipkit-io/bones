/**
 * Compatibility shim for legacy imports
 * Re-exports from the updated location at `auth-js/auth-providers-utils`.
 * This preserves older test and code imports of `@/server/auth-providers`.
 */
export {
	availableProviderDetails,
	availableProviderIds,
	EXCLUDED_PROVIDERS_UI,
	enabledAuthProviders,
	isGuestOnlyMode,
} from "@/server/auth-js/auth-providers-utils";
