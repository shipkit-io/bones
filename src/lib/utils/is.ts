const isMac =
	typeof window !== "undefined" && navigator?.platform?.includes("Mac");
const isWindows =
	typeof window !== "undefined" && navigator?.platform?.includes("Win");

export const is = {
	mac: isMac,
	windows: isWindows,
};
