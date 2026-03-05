"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignUp } from "@/app/(app)/(authentication)/sign-up/_components/sign-up";
import { Modal } from "@/components/primitives/modal";
import { routes } from "@/config/routes";

export default function Page() {
	const pathname = usePathname();
	const [shouldSkip, setShouldSkip] = useState(false);

	useEffect(() => {
		// Check if we should skip showing the modal (e.g., navigating from another auth page)
		const skip = sessionStorage.getItem("skipAuthModal") === "true";
		if (skip) {
			sessionStorage.removeItem("skipAuthModal");
			setShouldSkip(true);
		}
	}, []);

	// Don't show modal if navigating from another auth page
	if (shouldSkip) {
		return null;
	}

	// Only render the modal if we're actually on the sign-up route
	// This prevents the modal from persisting when navigating to other routes
	if (pathname !== routes.auth.signUp) {
		return null;
	}

	return (
		<Modal routeBack open>
			<SignUp />
		</Modal>
	);
}
