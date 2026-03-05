"use client";

import { ResetIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { OnboardingWizard } from "@/components/modules/onboarding/onboarding-wizard";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { User } from "@/types/user";

interface OnboardingCheckProps {
	user?: User | null;
	hasGitHubConnection?: boolean;
	hasVercelConnection?: boolean;
	hasPurchased?: boolean;
	githubUsername?: string | null;
	/**
	 * Force enable the onboarding wizard even if feature flags are disabled.
	 * Useful for administrators or internal testing.
	 */
	forceEnabled?: boolean;
}

export function OnboardingCheck({
	user,
	hasGitHubConnection = false,
	hasVercelConnection = false,
	hasPurchased = false,
	githubUsername,
	forceEnabled = false,
}: OnboardingCheckProps) {
	const userId = user?.id ?? "";
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [onboardingState, _setOnboardingState] = useLocalStorage<{
		completed: boolean;
		currentStep: number;
		steps: Record<string, boolean>;
	} | null>(`onboarding-${userId}`, null);

	useEffect(() => {
		// Only show onboarding if:
		// 1. User has purchased the starter kit (or is admin via forceEnabled)
		// 2. Onboarding hasn't been completed yet
		// 3. We have a valid userId
		if ((hasPurchased || forceEnabled) && userId && !onboardingState?.completed) {
			setShowOnboarding(true);
		} else {
			setShowOnboarding(false);
		}
	}, [hasPurchased, forceEnabled, userId, onboardingState]);

	// Allow admins (or forced contexts) to bypass feature-flag gating so they can run onboarding.
	if (
		!forceEnabled &&
		(!env.NEXT_PUBLIC_FEATURE_VERCEL_INTEGRATION_ENABLED || !env.NEXT_PUBLIC_FEATURE_GITHUB_API_ENABLED)
	) {
		return null;
	}

	if (!showOnboarding || !user) {
		return null;
	}

	const handleOnboardingComplete = () => {
		setShowOnboarding(false);
	};

	return (
		<OnboardingWizard
			user={user}
			hasGitHubConnection={hasGitHubConnection}
			hasVercelConnection={hasVercelConnection}
			githubUsername={githubUsername}
			onComplete={handleOnboardingComplete}
		/>
	);
}

// Separate component for the restart button
export function RestartOnboardingButton({
	user,
	hasGitHubConnection = false,
	hasVercelConnection = false,
	className = "",
	/**
	 * When true, always render the button (e.g., for admins), even if onboarding was not completed.
	 */
	forceVisible = false,
}: OnboardingCheckProps & { className?: string; forceVisible?: boolean }) {
	const [onboardingState, setOnboardingState] = useLocalStorage<{
		completed: boolean;
		currentStep: number;
		steps: Record<string, boolean>;
	} | null>(`onboarding-${user?.id}`, null);

	const restartOnboarding = () => {
		// Ensure IntroDisclosure (feature tour) is reset as well
		// Matches key used in `IntroDisclosure` via useFeatureVisibility: `feature_${featureId}`
		// We pass `featureId` as `onboarding-${user?.id}` in the wizard, so full key becomes `feature_onboarding-${user?.id}`
		if (user?.id) {
			try {
				localStorage.removeItem(`feature_onboarding-${user.id}`);
			} catch (e) { console.error("Failed to remove onboarding state from localStorage:", e); }
		}

		// Reset the onboarding state to initial values
		setOnboardingState({
			completed: false,
			currentStep: 0,
			steps: {
				github: hasGitHubConnection, // Keep GitHub connection status
				vercel: hasVercelConnection, // Keep Vercel connection status
				deploy: false,
			},
		});
		window?.location?.reload();
	};

	// Only show the button if onboarding has been completed before,
	// unless forceVisible is enabled (e.g., for admins to start onboarding).
	if (!forceVisible && !onboardingState?.completed) {
		return null;
	}

	return (
		<Button type="button" variant="ghost" onClick={restartOnboarding} className={className}>
			<ResetIcon className="mr-2 size-4" />
			{onboardingState?.completed ? "Restart Onboarding" : "Start Onboarding"}
		</Button>
	);
}
