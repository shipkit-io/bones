/**
 * Platform detection using modern methods
 * navigator.platform is deprecated so we use a combination of
 * userAgent and platform-specific feature detection
 */
export const isMac = (): boolean => {
	try {
		return (
			typeof window !== "undefined" &&
			typeof navigator !== "undefined" &&
			(navigator.userAgent?.toLowerCase().includes("mac") ||
				(navigator.platform?.includes("Mac") && "ontouchend" in document === false))
		);
	} catch (error) {
		return false;
	}
};

export const isIOS = (): boolean => {
	try {
		return (
			typeof window !== "undefined" &&
			typeof navigator !== "undefined" &&
			(/iPad|iPhone|iPod/.test(navigator.userAgent || "") ||
				(navigator.platform === "MacIntel" && "ontouchend" in document))
		);
	} catch (error) {
		return false;
	}
};

export const isWindows = (): boolean => {
	try {
		return (
			typeof window !== "undefined" &&
			typeof navigator !== "undefined" &&
			(navigator.userAgent?.toLowerCase().includes("win") || navigator.platform?.includes("Win"))
		);
	} catch (error) {
		return false;
	}
};

export const isLinux = (): boolean => {
	try {
		return (
			typeof window !== "undefined" &&
			typeof navigator !== "undefined" &&
			((navigator.userAgent?.toLowerCase().includes("linux") &&
				!navigator.userAgent?.toLowerCase().includes("android")) ||
				navigator.platform?.includes("Linux"))
		);
	} catch (error) {
		return false;
	}
};

export const isAndroid = (): boolean => {
	try {
		return (
			typeof window !== "undefined" &&
			typeof navigator !== "undefined" &&
			/android/i.test(navigator.userAgent || "")
		);
	} catch (error) {
		return false;
	}
};

export const isMobile = (): boolean => {
	try {
		return (
			typeof window !== "undefined" &&
			typeof navigator !== "undefined" &&
			(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent || ""
			) ||
				(typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 2))
		);
	} catch (error) {
		return false;
	}
};

// Lazy-loaded values to avoid execution at import time
export const is = {
	get mac() {
		return isMac();
	},
	get windows() {
		return isWindows();
	},
	get linux() {
		return isLinux();
	},
	get android() {
		return isAndroid();
	},
	get mobile() {
		return isMobile();
	},
};
