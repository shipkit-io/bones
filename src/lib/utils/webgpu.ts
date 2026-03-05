import * as React from "react";

declare global {
	interface Navigator {
		gpu?: {
			requestAdapter?: () => Promise<any>;
		};
	}
}

export function isWebGPUAvailable(): boolean {
	if (typeof window === "undefined") return false;
	return !!window.navigator?.gpu?.requestAdapter;
}

export function useWebGPUAvailability(): boolean {
	const [isAvailable, setIsAvailable] = React.useState<boolean>(false);
	const [hasChecked, setHasChecked] = React.useState<boolean>(false);

	React.useEffect(() => {
		if (!hasChecked) {
			setIsAvailable(isWebGPUAvailable());
			setHasChecked(true);
		}
	}, [hasChecked]);

	return isAvailable;
}
