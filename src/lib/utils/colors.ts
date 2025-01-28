export const generateRainbowColor = (offset: number): string => {
	const r = Math.sin(0.3 * offset) * 127 + 128;
	const g = Math.sin(0.3 * offset + 2) * 127 + 128;
	const b = Math.sin(0.3 * offset + 4) * 127 + 128;
	return `rgb(${r},${g},${b})`;
};
